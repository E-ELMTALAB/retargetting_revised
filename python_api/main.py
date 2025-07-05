from flask import Flask, request, jsonify
from telethon import TelegramClient, errors
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError
import asyncio
import os
import json
from datetime import datetime

app = Flask(__name__)

# Global variables
TELEGRAM_API_ID = os.environ.get('TELEGRAM_API_ID')
TELEGRAM_API_HASH = os.environ.get('TELEGRAM_API_HASH')
SESSION_FILE = 'me.session'

# Enhanced campaign logging with timestamps and detailed information
CAMPAIGN_LOGS = {}
CAMPAIGN_STATUS = {}  # Track campaign status

@app.after_request
def add_cors_headers(response):
    """Add permissive CORS headers to all responses."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response


@app.errorhandler(Exception)
def handle_exception(e):
    """Return JSON for uncaught exceptions."""
    print('Unhandled error:', repr(e))
    return jsonify({'error': str(e)}), 500

print(f"TELEGRAM_API_ID: {TELEGRAM_API_ID}, TELEGRAM_API_HASH: {TELEGRAM_API_HASH}")
print(f"Session file exists: {os.path.exists(SESSION_FILE)} at {SESSION_FILE}")

def get_telegram_client(session_str=None):
    if session_str:
        print("[DEBUG] Using provided session string.")
        return TelegramClient(StringSession(session_str), TELEGRAM_API_ID, TELEGRAM_API_HASH)
    else:
        print("[DEBUG] Creating new StringSession.")
        return TelegramClient(StringSession(), TELEGRAM_API_ID, TELEGRAM_API_HASH)

def log_campaign_event(campaign_id, event_type, details):
    """Enhanced logging function with timestamps and structured data."""
    timestamp = datetime.now().isoformat()
    log_entry = {
        'timestamp': timestamp,
        'type': event_type,
        'details': details
    }
    
    if campaign_id not in CAMPAIGN_LOGS:
        CAMPAIGN_LOGS[campaign_id] = []
    
    CAMPAIGN_LOGS[campaign_id].append(log_entry)
    print(f"[CAMPAIGN {campaign_id}] {timestamp} - {event_type}: {details}")

@app.route('/health', methods=['GET'])
def health():
    """Simple health check endpoint."""
    return jsonify(status='ok')

@app.route('/execute_campaign', methods=['POST'])
def execute_campaign():
    """Send a text message to a list of recipient phones sequentially with enhanced logging."""
    payload = request.get_json(force=True)
    session_str = payload.get('session')
    message = payload.get('message')
    recipients = payload.get('recipients', [])
    account_id = payload.get('account_id')
    campaign_id = payload.get('campaign_id')

    if not session_str or not message or not recipients:
        return jsonify({'error': 'missing parameters'}), 400
    if campaign_id is None:
        return jsonify({'error': 'campaign_id required'}), 400

    # Initialize campaign logging
    log_campaign_event(campaign_id, 'campaign_started', {
        'account_id': account_id,
        'total_recipients': len(recipients),
        'message_preview': message[:100] + '...' if len(message) > 100 else message,
        'session_preview': session_str[:20] + '...' if session_str else 'None'
    })
    
    CAMPAIGN_STATUS[campaign_id] = {
        'status': 'running',
        'started_at': datetime.now().isoformat(),
        'total_recipients': len(recipients),
        'sent_count': 0,
        'failed_count': 0,
        'current_recipient': None
    }

    async def _send():
        client = get_telegram_client(session_str)
        
        try:
            log_campaign_event(campaign_id, 'client_connecting', {'session_preview': session_str[:20] + '...'})
            await client.connect()
            log_campaign_event(campaign_id, 'client_connected', {'connected': True})
            
            # Get sender info for logging
            try:
                me = await client.get_me()
                sender_info = f"{me.first_name or ''} {me.last_name or ''} (@{me.username or 'no_username'})"
                log_campaign_event(campaign_id, 'sender_info', {'sender': sender_info, 'phone': me.phone})
            except Exception as e:
                log_campaign_event(campaign_id, 'sender_info_error', {'error': str(e)})
                sender_info = "Unknown"
            
        except Exception as e:
            log_campaign_event(campaign_id, 'client_connection_failed', {'error': str(e)})
            CAMPAIGN_STATUS[campaign_id]['status'] = 'failed'
            CAMPAIGN_STATUS[campaign_id]['error'] = str(e)
            return []
        
        results = []
        for i, phone in enumerate(recipients):
            try:
                CAMPAIGN_STATUS[campaign_id]['current_recipient'] = phone
                CAMPAIGN_STATUS[campaign_id]['progress'] = f"{i+1}/{len(recipients)}"
                
                log_campaign_event(campaign_id, 'sending_message', {
                    'recipient': phone,
                    'progress': f"{i+1}/{len(recipients)}",
                    'message_preview': message[:50] + '...' if len(message) > 50 else message
                })
                
                # Try to get recipient info if possible
                try:
                    entity = await client.get_entity(phone)
                    recipient_info = f"{getattr(entity, 'first_name', '')} {getattr(entity, 'last_name', '')}"
                    log_campaign_event(campaign_id, 'recipient_info', {
                        'phone': phone,
                        'name': recipient_info.strip() or 'Unknown'
                    })
                except:
                    log_campaign_event(campaign_id, 'recipient_info', {
                        'phone': phone,
                        'name': 'Unknown (not in contacts)'
                    })
                
                await client.send_message(phone, message)
                
                CAMPAIGN_STATUS[campaign_id]['sent_count'] += 1
                log_campaign_event(campaign_id, 'message_sent', {
                    'recipient': phone,
                    'success': True
                })
                
                results.append({'phone': phone, 'status': 'sent', 'timestamp': datetime.now().isoformat()})
                
                # Rate limiting
                await asyncio.sleep(1)
                
            except errors.FloodWaitError as e:
                log_campaign_event(campaign_id, 'flood_wait', {
                    'recipient': phone,
                    'wait_seconds': e.seconds,
                    'error': str(e)
                })
                
                await asyncio.sleep(e.seconds + 1)
                
                try:
                    await client.send_message(phone, message)
                    CAMPAIGN_STATUS[campaign_id]['sent_count'] += 1
                    log_campaign_event(campaign_id, 'message_sent_after_flood_wait', {
                        'recipient': phone,
                        'success': True
                    })
                    results.append({'phone': phone, 'status': 'sent', 'timestamp': datetime.now().isoformat()})
                except Exception as err:
                    CAMPAIGN_STATUS[campaign_id]['failed_count'] += 1
                    log_campaign_event(campaign_id, 'message_failed_after_flood_wait', {
                        'recipient': phone,
                        'error': str(err)
                    })
                    results.append({'phone': phone, 'status': 'failed', 'error': str(err), 'timestamp': datetime.now().isoformat()})
                    
            except errors.UserPrivacyRestrictedError as e:
                CAMPAIGN_STATUS[campaign_id]['failed_count'] += 1
                log_campaign_event(campaign_id, 'privacy_restricted', {
                    'recipient': phone,
                    'error': 'User privacy settings prevent sending messages'
                })
                results.append({'phone': phone, 'status': 'failed', 'error': 'Privacy restricted', 'timestamp': datetime.now().isoformat()})
                
            except errors.UserNotParticipantError as e:
                CAMPAIGN_STATUS[campaign_id]['failed_count'] += 1
                log_campaign_event(campaign_id, 'user_not_participant', {
                    'recipient': phone,
                    'error': 'User is not a participant in the chat'
                })
                results.append({'phone': phone, 'status': 'failed', 'error': 'Not participant', 'timestamp': datetime.now().isoformat()})
                
            except errors.UserDeactivatedBanError as e:
                CAMPAIGN_STATUS[campaign_id]['failed_count'] += 1
                log_campaign_event(campaign_id, 'user_deactivated', {
                    'recipient': phone,
                    'error': 'User account is deactivated'
                })
                results.append({'phone': phone, 'status': 'failed', 'error': 'User deactivated', 'timestamp': datetime.now().isoformat()})
                
            except Exception as err:
                CAMPAIGN_STATUS[campaign_id]['failed_count'] += 1
                log_campaign_event(campaign_id, 'message_failed', {
                    'recipient': phone,
                    'error': str(err),
                    'error_type': type(err).__name__
                })
                results.append({'phone': phone, 'status': 'failed', 'error': str(err), 'timestamp': datetime.now().isoformat()})
        
        try:
            await client.disconnect()
            log_campaign_event(campaign_id, 'client_disconnected', {'disconnected': True})
        except Exception as e:
            log_campaign_event(campaign_id, 'client_disconnect_error', {'error': str(e)})
        
        # Update final status
        CAMPAIGN_STATUS[campaign_id]['status'] = 'completed'
        CAMPAIGN_STATUS[campaign_id]['completed_at'] = datetime.now().isoformat()
        CAMPAIGN_STATUS[campaign_id]['current_recipient'] = None
        
        log_campaign_event(campaign_id, 'campaign_completed', {
            'total_sent': CAMPAIGN_STATUS[campaign_id]['sent_count'],
            'total_failed': CAMPAIGN_STATUS[campaign_id]['failed_count'],
            'success_rate': f"{(CAMPAIGN_STATUS[campaign_id]['sent_count'] / len(recipients) * 100):.1f}%"
        })
        
        return results

    try:
        results = asyncio.run(_send())
    except Exception as e:
        log_campaign_event(campaign_id, 'campaign_error', {'error': str(e)})
        CAMPAIGN_STATUS[campaign_id]['status'] = 'failed'
        CAMPAIGN_STATUS[campaign_id]['error'] = str(e)
        print('[ERROR] execute_campaign', e)
        return jsonify({'error': str(e)}), 500

    return jsonify({'status': 'completed', 'results': results})


@app.route('/session/connect', methods=['POST'])
def session_connect():
    print("[DEBUG] /session/connect called")
    try:
        data = request.get_json(force=True)
        print(f"[DEBUG] Data: {data}")
        phone = data.get('phone')
        if not phone:
            print("[ERROR] Phone not provided")
            return jsonify({'error': 'phone required'}), 400
        async def _send_code():
            try:
                client = get_telegram_client()
                await client.connect()
                print(f"[DEBUG] Connected to Telegram for phone: {phone}")
                result = await client.send_code_request(phone)
                print(f"[DEBUG] Code sent, phone_code_hash: {result.phone_code_hash}")
                session_str = client.session.save()
                await client.disconnect()
                print(f"[DEBUG] Disconnected after sending code.")
                return session_str, result.phone_code_hash, None
            except Exception as e:
                print(f"[ERROR] _send_code: {e}")
                return None, None, str(e)
        session_str, phone_code_hash, err = None, None, None
        try:
            session_str, phone_code_hash, err = asyncio.run(_send_code())
        except Exception as e:
            print(f"[ERROR] asyncio.run(_send_code): {e}")
            err = str(e)
        if not session_str or not phone_code_hash:
            print(f"[ERROR] Failed to send code: {err}")
            return jsonify({'error': 'Failed to send code', 'details': err}), 500
        return jsonify({'session': session_str, 'phone_code_hash': phone_code_hash})
    except Exception as e:
        print(f"[ERROR] /session/connect: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/session/verify', methods=['POST'])
def session_verify():
    print("[DEBUG] /session/verify called")
    try:
        data = request.get_json(force=True)
        print(f"[DEBUG] Data: {data}")
        phone = data.get('phone')
        code = data.get('code')
        session_str = data.get('session')
        phone_code_hash = data.get('phone_code_hash')
        if not all([phone, code, session_str, phone_code_hash]):
            print("[ERROR] Missing parameters")
            return jsonify({'error': 'missing parameters'}), 400
        async def _sign_in():
            try:
                client = get_telegram_client(session_str)
                await client.connect()
                print(f"[DEBUG] Connected to Telegram for phone: {phone}")
                try:
                    await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
                    print("[DEBUG] Sign in successful")
                except SessionPasswordNeededError:
                    print("[ERROR] Session password needed")
                    await client.disconnect()
                    return None, 'PASSWORD_NEEDED', None
                session_final = client.session.save()
                await client.disconnect()
                print("[DEBUG] Disconnected after sign in")
                return session_final, None, None
            except Exception as e:
                print(f"[ERROR] _sign_in: {e}")
                return None, str(e), str(e)
        session_final, err, details = None, None, None
        try:
            session_final, err, details = asyncio.run(_sign_in())
        except Exception as e:
            print(f"[ERROR] asyncio.run(_sign_in): {e}")
            err = str(e)
            details = str(e)
        if err:
            print(f"[ERROR] /session/verify: {err}")
            return jsonify({'error': err, 'details': details}), 400
        print(f"[DEBUG] Session verified: {session_final[:10] if session_final else None}")
        return jsonify({'session': session_final})
    except Exception as e:
        print(f"[ERROR] /session/verify: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/classify', methods=['POST'])
def classify_text():
    """Classify text based on provided categories and keywords."""
    data = request.get_json(force=True)
    text = data.get('text', '')
    categories = data.get('categories', [])
    text_lower = text.lower()
    matched = []
    for cat in categories:
        name = cat.get('name')
        kws = cat.get('keywords', [])
        examples = cat.get('examples', [])
        found = False
        for kw in kws:
            if kw.lower() in text_lower:
                matched.append(name)
                found = True
                break
        if not found:
            for ex in examples:
                if ex.lower() in text_lower:
                    matched.append(name)
                    break
    return jsonify({'matches': matched})


@app.route('/campaign_logs/<int:campaign_id>', methods=['GET'])
def get_campaign_logs(campaign_id):
    """Return stored logs for a campaign with enhanced structure."""
    logs = CAMPAIGN_LOGS.get(campaign_id, [])
    status = CAMPAIGN_STATUS.get(campaign_id, {})
    
    # Convert logs to the format expected by the frontend
    formatted_logs = []
    for log in logs:
        if log['type'] in ['message_sent', 'message_failed', 'message_sent_after_flood_wait', 'message_failed_after_flood_wait']:
            formatted_logs.append({
                'phone': log['details'].get('recipient', 'Unknown'),
                'status': 'sent' if 'sent' in log['type'] else 'failed',
                'error': log['details'].get('error'),
                'timestamp': log['timestamp']
            })
    
    return jsonify({
        'logs': formatted_logs,
        'status': status,
        'total_logs': len(logs),
        'formatted_logs': len(formatted_logs)
    })

@app.route('/campaign_status/<int:campaign_id>', methods=['GET'])
def get_campaign_status(campaign_id):
    """Return detailed campaign status and progress."""
    status = CAMPAIGN_STATUS.get(campaign_id, {})
    logs = CAMPAIGN_LOGS.get(campaign_id, [])
    
    # Calculate progress
    total_recipients = status.get('total_recipients', 0)
    sent_count = status.get('sent_count', 0)
    failed_count = status.get('failed_count', 0)
    
    if total_recipients > 0:
        progress_percent = ((sent_count + failed_count) / total_recipients) * 100
    else:
        progress_percent = 0
    
    # Get recent activity
    recent_logs = logs[-10:] if logs else []
    
    return jsonify({
        'campaign_id': campaign_id,
        'status': status.get('status', 'unknown'),
        'progress_percent': round(progress_percent, 1),
        'total_recipients': total_recipients,
        'sent_count': sent_count,
        'failed_count': failed_count,
        'current_recipient': status.get('current_recipient'),
        'started_at': status.get('started_at'),
        'completed_at': status.get('completed_at'),
        'error': status.get('error'),
        'recent_activity': recent_logs
    })

@app.route('/stop_campaign/<int:campaign_id>', methods=['POST'])
def stop_campaign(campaign_id):
    print(f"[DEBUG] Stopping campaign {campaign_id}")
    
    if campaign_id in CAMPAIGN_STATUS:
        CAMPAIGN_STATUS[campaign_id]['status'] = 'stopped'
        CAMPAIGN_STATUS[campaign_id]['stopped_at'] = datetime.now().isoformat()
        log_campaign_event(campaign_id, 'campaign_stopped', {
            'stopped_by': 'user_request',
            'final_sent': CAMPAIGN_STATUS[campaign_id].get('sent_count', 0),
            'final_failed': CAMPAIGN_STATUS[campaign_id].get('failed_count', 0)
        })
    
    return jsonify({"status": "stopped", "campaign_id": campaign_id})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

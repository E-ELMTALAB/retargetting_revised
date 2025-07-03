from flask import Flask, request, jsonify
from telethon import TelegramClient, errors
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError
import asyncio
import os

app = Flask(__name__)
TELEGRAM_API_ID = 27418503
TELEGRAM_API_HASH = "911f278e674b5aaa7a4ecf14a49ea4d7"
SESSION_FILE = os.path.join(os.path.dirname(__file__), "me.session")

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

@app.route('/health', methods=['GET'])
def health():
    """Simple health check endpoint."""
    return jsonify(status='ok')

@app.route('/execute_campaign', methods=['POST'])
def execute_campaign():
    """Send a text message to a list of recipient phones sequentially."""
    payload = request.get_json(force=True)
    session_str = payload.get('session')
    message = payload.get('message')
    recipients = payload.get('recipients', [])

    if not session_str or not message or not recipients:
        return jsonify({'error': 'missing parameters'}), 400

    async def _send():
        client = get_telegram_client(session_str)
        await client.connect()
        results = []
        for phone in recipients:
            try:
                await client.send_message(phone, message)
                results.append({'phone': phone, 'status': 'sent'})
                await asyncio.sleep(1)
            except errors.FloodWaitError as e:
                await asyncio.sleep(e.seconds + 1)
                try:
                    await client.send_message(phone, message)
                    results.append({'phone': phone, 'status': 'sent'})
                except Exception as err:
                    results.append({'phone': phone, 'status': 'failed', 'error': str(err)})
            except Exception as err:
                results.append({'phone': phone, 'status': 'failed', 'error': str(err)})
        await client.disconnect()
        return results

    try:
        results = asyncio.run(_send())
    except Exception as e:
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

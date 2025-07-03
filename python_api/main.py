from flask import Flask, request, jsonify
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError
import asyncio
import os

app = Flask(__name__)
TELEGRAM_API_ID = 27418503
TELEGRAM_API_HASH = "911f278e674b5aaa7a4ecf14a49ea4d7"
SESSION_FILE = os.path.join(os.path.dirname(__file__), "me.session")

print(f"TELEGRAM_API_ID: {TELEGRAM_API_ID}, TELEGRAM_API_HASH: {TELEGRAM_API_HASH}")
print(f"Session file exists: {os.path.exists(SESSION_FILE)} at {SESSION_FILE}")

def get_telegram_client(session_str=None):
    if session_str:
        print("[DEBUG] Using provided session string.")
        return TelegramClient(StringSession(session_str), TELEGRAM_API_ID, TELEGRAM_API_HASH)
    elif os.path.exists(SESSION_FILE):
        print(f"[DEBUG] Using session file: {SESSION_FILE}")
        return TelegramClient(SESSION_FILE, TELEGRAM_API_ID, TELEGRAM_API_HASH)
    else:
        print("[DEBUG] Creating new session.")
        return TelegramClient(StringSession(), TELEGRAM_API_ID, TELEGRAM_API_HASH)

@app.route('/health', methods=['GET'])
def health():
    """Simple health check endpoint."""
    return jsonify(status='ok')

@app.route('/execute_campaign', methods=['POST'])
def execute_campaign():
    print("[DEBUG] /execute_campaign called")
    try:
        payload = request.get_json(force=True)
        print(f"[DEBUG] Payload: {payload}")
        account_id = payload.get('account_id')
        campaign_id = payload.get('campaign_id')
        # TODO: Implement message sending logic, retries and error handling
        return jsonify({
            'status': 'accepted',
            'account_id': account_id,
            'campaign_id': campaign_id
        })
    except Exception as e:
        print(f"[ERROR] /execute_campaign: {e}")
        return jsonify({'error': str(e)}), 500


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
                return session_str, result.phone_code_hash
            except Exception as e:
                print(f"[ERROR] _send_code: {e}")
                return None, None
        session_str, phone_code_hash = asyncio.run(_send_code())
        if not session_str or not phone_code_hash:
            return jsonify({'error': 'Failed to send code'}), 500
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
                    return None, 'PASSWORD_NEEDED'
                session_final = client.session.save()
                await client.disconnect()
                print("[DEBUG] Disconnected after sign in")
                return session_final, None
            except Exception as e:
                print(f"[ERROR] _sign_in: {e}")
                return None, str(e)
        session_final, err = asyncio.run(_sign_in())
        if err:
            print(f"[ERROR] /session/verify: {err}")
            return jsonify({'error': err}), 400
        print(f"[DEBUG] Session verified: {session_final[:10] if session_final else None}")
        return jsonify({'session': session_final})
    except Exception as e:
        print(f"[ERROR] /session/verify: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

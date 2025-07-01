from flask import Flask, request, jsonify
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError
import asyncio
import os

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    """Add permissive CORS headers to all responses."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response


@app.errorhandler(Exception)
def handle_exception(e):
    """Return JSON for any uncaught exceptions and log them."""
    print('Unhandled error:', repr(e))
    return jsonify({'error': str(e)}), 500

# Telegram API credentials. In production these should be provided via
# environment variables. We default to dummy values so the service does not
# crash when the variables are missing.
API_ID = int(os.environ.get('API_ID', '123456'))  # <-- Replace with your API ID
API_HASH = os.environ.get(
    'API_HASH', '0123456789abcdef0123456789abcdef'
)  # <-- Replace with your API Hash

print('Starting Python API with API_ID', API_ID)

@app.route('/health', methods=['GET'])
def health():
    """Simple health check endpoint."""
    return jsonify(status='ok')

@app.route('/execute_campaign', methods=['POST'])
def execute_campaign():
    """Receive a campaign job from the Cloudflare Worker.

    Expects JSON payload with account_id and campaign_id. All Telegram
    operations will be implemented here using Telethon.
    """
    payload = request.get_json(force=True)
    account_id = payload.get('account_id')
    campaign_id = payload.get('campaign_id')

    # TODO: Implement message sending logic, retries and error handling
    # based on retargetting_old.py. This endpoint should remain stateless
    # and expect all required data from the worker.

    return jsonify({
        'status': 'accepted',
        'account_id': account_id,
        'campaign_id': campaign_id
    })


@app.route('/session/connect', methods=['POST'])
def session_connect():
    data = request.get_json(force=True)
    phone = data.get('phone')
    print('API /session/connect phone', phone)
    if not phone:
        return jsonify({'error': 'phone required'}), 400

    async def _send_code():
        client = TelegramClient(StringSession(), API_ID, API_HASH)
        await client.connect()
        try:
            result = await client.send_code_request(phone)
            session_str = client.session.save()
        except Exception as e:
            print('API send_code error', e)
            await client.disconnect()
            raise
        await client.disconnect()
        return session_str, result.phone_code_hash

    try:
        session_str, phone_code_hash = asyncio.run(_send_code())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    print('API send_code result', session_str[:10], phone_code_hash)
    return jsonify({'session': session_str, 'phone_code_hash': phone_code_hash})


@app.route('/session/verify', methods=['POST'])
def session_verify():
    data = request.get_json(force=True)
    phone = data.get('phone')
    code = data.get('code')
    session_str = data.get('session')
    phone_code_hash = data.get('phone_code_hash')
    print('API /session/verify phone', phone, 'code', code)
    if not all([phone, code, session_str, phone_code_hash]):
        return jsonify({'error': 'missing parameters'}), 400

    async def _sign_in():
        client = TelegramClient(StringSession(session_str), API_ID, API_HASH)
        await client.connect()
        try:
            await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
        except SessionPasswordNeededError:
            await client.disconnect()
            return None, 'PASSWORD_NEEDED'
        except Exception as e:
            print('API sign_in error', e)
            await client.disconnect()
            raise
        session_final = client.session.save()
        await client.disconnect()
        return session_final, None

    try:
        session_final, err = asyncio.run(_sign_in())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    if err:
        print('API verify error', err)
        return jsonify({'error': err}), 400
    print('API verify success', session_final[:10])
    return jsonify({'session': session_final})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

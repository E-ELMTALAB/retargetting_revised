from flask import Flask, request, jsonify
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError
import asyncio
import os

app = Flask(__name__)

API_ID = int(os.environ.get('API_ID', '0'))
API_HASH = os.environ.get('API_HASH', '')

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
    if not phone:
        return jsonify({'error': 'phone required'}), 400

    async def _send_code():
        client = TelegramClient(StringSession(), API_ID, API_HASH)
        await client.connect()
        result = await client.send_code_request(phone)
        session_str = client.session.save()
        await client.disconnect()
        return session_str, result.phone_code_hash

    session_str, phone_code_hash = asyncio.run(_send_code())
    return jsonify({'session': session_str, 'phone_code_hash': phone_code_hash})


@app.route('/session/verify', methods=['POST'])
def session_verify():
    data = request.get_json(force=True)
    phone = data.get('phone')
    code = data.get('code')
    session_str = data.get('session')
    phone_code_hash = data.get('phone_code_hash')
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
        session_final = client.session.save()
        await client.disconnect()
        return session_final, None

    session_final, err = asyncio.run(_sign_in())
    if err:
        return jsonify({'error': err}), 400
    return jsonify({'session': session_final})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

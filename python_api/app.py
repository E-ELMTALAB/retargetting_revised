from flask import Flask, request, jsonify
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError
import asyncio
import os
import logging
from typing import Dict, List

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
API_ID = 27418503
API_HASH = "911f278e674b5aaa7a4ecf14a49ea4d7"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
print('Starting Python API with API_ID', API_ID)

# simple in-memory stores for logs and stop flags
CAMPAIGN_LOGS: Dict[int, List[dict]] = {}
STOP_FLAGS: Dict[int, bool] = {}


def get_telegram_client(session_str: str):
    """Return a connected Telethon client from a StringSession."""
    return TelegramClient(StringSession(session_str), API_ID, API_HASH)


@app.route('/health', methods=['GET'])
def health():
    """Simple health check endpoint."""
    return jsonify(status='ok')

@app.route('/execute_campaign', methods=['POST'])
def execute_campaign():
    """Execute a campaign job sent from the Cloudflare Worker.

    Expected JSON payload:
    {
        "session": "<telegram string session>",
        "message": "<text message>",
        "recipients": ["+10000000001", "+10000000002"],
        "account_id": 1,
        "campaign_id": 10
    }
    """
    payload = request.get_json(force=True)
    session_str = payload.get('session')
    message = payload.get('message')
    recipients = payload.get('recipients', [])
    campaign_id = payload.get('campaign_id')
    account_id = payload.get('account_id')
    logger.info('execute_campaign payload %s', payload)
    print('== Python API executing campaign', campaign_id, '==')
    print('session snippet', session_str[:10] if session_str else None)
    print('recipients count', len(recipients))

    if not session_str or not message or not recipients:
        return jsonify({'error': 'missing parameters'}), 400

    CAMPAIGN_LOGS[campaign_id] = []
    STOP_FLAGS[campaign_id] = False
    print('STOP_FLAGS set to False for', campaign_id)

    async def _send():
        client = get_telegram_client(session_str)
        await client.connect()
        results = []
        for phone in recipients:
            if STOP_FLAGS.get(campaign_id):
                logger.info('Campaign %s stop requested', campaign_id)
                print('Stop flag detected for', campaign_id)
                CAMPAIGN_LOGS[campaign_id].append({'status': 'stopped'})
                break
            try:
                await client.send_message(phone, message)
                logger.info('sent to %s', phone)
                print('message sent to', phone)
                entry = {'phone': phone, 'status': 'sent'}
                results.append(entry)
                CAMPAIGN_LOGS[campaign_id].append(entry)
                await asyncio.sleep(1)
            except Exception as e:
                logger.error('send error %s %s', phone, e)
                print('send error', phone, e)
                entry = {'phone': phone, 'status': 'failed', 'error': str(e)}
                results.append(entry)
                CAMPAIGN_LOGS[campaign_id].append(entry)
        await client.disconnect()
        return results

    try:
        results = asyncio.run(_send())
    except Exception as e:
        logger.error('execute_campaign error %s', e)
        print('execute_campaign failed', e)
        return jsonify({'error': str(e)}), 500

    logger.info('campaign %s completed with %d results', campaign_id, len(results))
    print('campaign', campaign_id, 'completed, results', len(results))
    return jsonify({'status': 'completed', 'results': results})


@app.route('/stop_campaign/<int:cid>', methods=['POST'])
def stop_campaign(cid: int):
    """Request stopping an active campaign."""
    logger.info('stop_campaign %s', cid)
    print('== Python API stop campaign', cid, '==')
    STOP_FLAGS[cid] = True
    print('STOP_FLAGS set to True for', cid)
    CAMPAIGN_LOGS.setdefault(cid, []).append({'status': 'stop_requested'})
    return jsonify({'status': 'stopping'})


@app.route('/campaign_logs/<int:cid>', methods=['GET'])
def campaign_logs(cid: int):
    """Return in-memory logs for a campaign."""
    logger.info('campaign_logs %s', cid)
    return jsonify({'logs': CAMPAIGN_LOGS.get(cid, [])})


@app.route('/session/connect', methods=['POST'])
def session_connect():
    data = request.get_json(force=True)
    phone = data.get('phone')
    logger.info('API /session/connect phone %s', phone)
    if not phone:
        return jsonify({'error': 'phone required'}), 400

    async def _send_code():
        client = TelegramClient(StringSession(), API_ID, API_HASH)
        await client.connect()
        try:
            result = await client.send_code_request(phone)
            session_str = client.session.save()
        except Exception as e:
            logger.error('API send_code error %s', e)
            await client.disconnect()
            raise
        await client.disconnect()
        return session_str, result.phone_code_hash


    try:
        session_str, phone_code_hash = asyncio.run(_send_code())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


    logger.info('API send_code result %s %s', session_str[:10], phone_code_hash)
    return jsonify({'session': session_str, 'phone_code_hash': phone_code_hash})


@app.route('/session/verify', methods=['POST'])
def session_verify():
    data = request.get_json(force=True)
    phone = data.get('phone')
    code = data.get('code')
    session_str = data.get('session')
    phone_code_hash = data.get('phone_code_hash')
    logger.info('API /session/verify phone %s code %s', phone, code)
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
            logger.error('API sign_in error %s', e)
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
        logger.error('API verify error %s', err)
        return jsonify({'error': err}), 400
    logger.info('API verify success %s', session_final[:10])
    return jsonify({'session': session_final})


@app.route('/classify', methods=['POST'])
def classify_text():

    """Classify text based on provided categories and keywords or examples."""

    data = request.get_json(force=True)
    text = data.get('text', '')
    categories = data.get('categories', [])
    logger.info('classify_text len=%d categories=%d', len(text), len(categories))
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

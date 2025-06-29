from flask import Flask, request, jsonify

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

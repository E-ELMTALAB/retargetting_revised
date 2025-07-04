import os
import requests

API = os.environ.get('PYTHON_API_BASE', 'https://retargetting-slave-api-production.up.railway.app')

if __name__ == '__main__':
    payload = {
        'session': 'invalid',
        'message': 'hi',
        'recipients': ['+10000000000'],
        'account_id': 1,
        'campaign_id': 999
    }
    r = requests.post(f"{API}/execute_campaign", json=payload, timeout=10)
    print('execute_campaign', r.status_code, r.text[:200])

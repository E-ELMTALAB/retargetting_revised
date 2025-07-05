import os
import time
import requests

API = os.environ.get('WORKER_BASE', 'https://retargetting-worker.elmtalabx.workers.dev')

if __name__ == '__main__':
    # create a new campaign using seeded account and session
    payload = {
        'account_id': 1,
        'telegram_session_id': 1,
        'message_text': 'test message'
    }
    r = requests.post(f"{API}/campaigns", json=payload, timeout=10)
    print('create campaign', r.status_code, r.text[:200])
    cid = None
    try:
        data = r.json()
        cid = data.get('id')
    except Exception as e:
        print('json error', e)

    # verify campaign listed in GET /campaigns
    if cid:
        r = requests.get(f"{API}/campaigns?account_id=1", timeout=10)
        print('list campaigns', r.status_code, r.text[:200])

    # start the campaign
    if cid:
        r = requests.post(f"{API}/campaigns/{cid}/start", timeout=10)
        print('start campaign', r.status_code, r.text[:200])
        time.sleep(1)
        r = requests.get(f"{API}/campaigns/{cid}/logs", timeout=10)
        print('campaign logs', r.status_code, r.text[:200])

        requests.post(f"{API}/campaigns/{cid}/stop")


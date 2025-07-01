import os
import requests

FRONTEND_BASE = os.environ.get('FRONTEND_BASE', 'https://retargetting-revised.pages.dev')
WORKER_BASE = os.environ.get('WORKER_BASE', 'https://retargetting-worker.elmtalabx.workers.dev')
PYTHON_API_BASE = os.environ.get('PYTHON_API_BASE', 'https://retargetting-slave-api-production.up.railway.app')


def check(url: str, method='get', **kwargs):
    print(f"Testing {url}")
    try:
        resp = requests.request(method, url, timeout=10, **kwargs)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text[:200]}")
        return resp.status_code
    except Exception as e:
        print(f"  Error: {e}")
        return None


if __name__ == '__main__':
    # Python API health
    check(f"{PYTHON_API_BASE}/health")

    # Worker session connect with fake phone (expect failure but endpoint reachable)
    check(
        f"{WORKER_BASE}/session/connect",
        method='post',
        json={'phone': '+989033338607'}
    )

    # Frontend main page
    check(FRONTEND_BASE)

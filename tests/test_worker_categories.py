import os, requests

API=os.environ.get('WORKER_BASE','https://retargetting-worker.elmtalabx.workers.dev')


if __name__=='__main__':
    r=requests.get(f"{API}/categories", timeout=10)
    print('list', r.status_code, r.text[:200])
    r=requests.post(f"{API}/categories", json={'name':'test','keywords':['a'], 'description':'d','examples':['e']}, timeout=10)
    print('create', r.status_code, r.text[:200])

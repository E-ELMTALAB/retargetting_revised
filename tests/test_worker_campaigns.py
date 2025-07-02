import os, requests
API=os.environ.get('WORKER_BASE','https://retargetting-worker.elmtalabx.workers.dev/')

if __name__=='__main__':
    r=requests.post(f"{API}/campaigns", json={'name':'t'}, timeout=10)
    print('create campaign', r.status_code, r.text[:200])
    r=requests.post(f"{API}/campaigns/1/start", timeout=10)
    print('start campaign', r.status_code, r.text[:200])

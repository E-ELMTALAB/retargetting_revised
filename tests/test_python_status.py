import os, requests
API=os.environ.get('PYTHON_API_BASE','https://retargetting-slave-api-production.up.railway.app')

if __name__=='__main__':
    cid=999
    r=requests.get(f"{API}/campaign_status/{cid}", timeout=10)
    print('campaign_status', r.status_code, r.text[:200])

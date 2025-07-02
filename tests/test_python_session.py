import os, requests
API=os.environ.get('PYTHON_API_BASE','https://retargetting-slave-api-production.up.railway.app')

if __name__=='__main__':
    resp=requests.post(f"{API}/session/connect", json={'phone':'+10000000000'}, timeout=10)
    print('connect', resp.status_code, resp.text[:200])
    resp=requests.post(f"{API}/session/verify", json={'phone':'+10000000000','code':'00000','session':'x','phone_code_hash':'y'}, timeout=10)
    print('verify', resp.status_code, resp.text[:200])

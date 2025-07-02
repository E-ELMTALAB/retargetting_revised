import os, requests
API=os.environ.get('PYTHON_API_BASE','https://retargetting-slave-api-production.up.railway.app')

if __name__ == '__main__':
    r=requests.get(f"{API}/health", timeout=10)
    print('health status', r.status_code, r.text[:200])

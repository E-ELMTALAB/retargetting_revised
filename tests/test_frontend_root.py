import os, requests
API=os.environ.get('FRONTEND_BASE','https://retargetting-revised.pages.dev')

if __name__=='__main__':
    r=requests.get(API, timeout=10)
    print('frontend', r.status_code, r.text[:200])

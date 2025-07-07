import os, requests
API=os.environ.get('PYTHON_API_BASE','https://retargetting-slave-api-production.up.railway.app')

if __name__=='__main__':
    payload={
        'text':'I want a refund',
        'categories':[{'name':'refund','keywords':['refund'], 'regex':'refund', 'description':'asking for refund','examples':['money back']}]
    }
    resp=requests.post(f"{API}/classify", json=payload, timeout=10)
    print('classify', resp.status_code, resp.text)

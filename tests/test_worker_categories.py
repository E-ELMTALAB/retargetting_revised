import os, requests

API=os.environ.get('WORKER_BASE','https://retargetting-worker.elmtalabx.workers.dev')


if __name__=='__main__':
    r=requests.get(f"{API}/categories", timeout=10)
    print('list', r.status_code, r.text[:200])
    r=requests.post(
        f"{API}/categories",
        json={
            'name': 'test',
            'keywords': ['a'],
            'description': 'd',
            'regex': 'a+',
            'examples': ['e'],
        },
        timeout=10,
    )
    print('create', r.status_code, r.text[:200])
    cid=r.json().get('id')
    r=requests.put(
        f"{API}/categories/{cid}",
        json={
            'name': 'test2',
            'keywords': ['b'],
            'description': 'e',
            'regex': 'b+',
            'examples': ['f'],
        },
        timeout=10,
    )
    print('update', r.status_code, r.text[:200])
    r=requests.delete(f"{API}/categories/{cid}", timeout=10)
    print('delete', r.status_code, r.text[:200])

import urllib.request, json
req = urllib.request.Request('http://127.0.0.1:8000/api/import/orders/1', method='PUT', data=b'{}', headers={'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e.read().decode('utf-8'))

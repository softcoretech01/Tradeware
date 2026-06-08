import urllib.request, json
payload = {
    "id": None,
    "po_date": "2026-06-08",
    "supplierName": "SUPP-2",
    "currency": "USD",
    "exchangeRate": 83.5,
    "items": [{"itemCode": "ITM05313", "qty": 50, "fcyUnitPrice": 150}],
    "totalFCY": 7500,
    "totalLCY": 626250,
    "status": "Ordered",
    "paymentTerms": "Cash"
}
req = urllib.request.Request('http://127.0.0.1:8000/api/import/orders/1', method='PUT', data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e.read().decode('utf-8'))

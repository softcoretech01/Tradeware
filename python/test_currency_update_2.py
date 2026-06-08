import urllib.request, json
payload = {
    "supplierName": "SUPP-2",
    "po_date": "2026-06-08",
    "currency_id": 1,
    "exchangeRate": 62.0,
    "items": [{"itemCode": "ITM05313", "qty": 10, "fcyUnitPrice": 100, "currency_id": 1}],
    "totalFCY": 1000,
    "totalLCY": 62000,
    "status": "Ordered",
    "paymentTerms": "Cash"
}
req = urllib.request.Request('http://127.0.0.1:8000/api/import/orders/5', method='PUT', data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    response = urllib.request.urlopen(req)
    print("Success:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e.read().decode('utf-8') if hasattr(e, 'read') else str(e))

from app.database import engine
from sqlalchemy import text
with engine.connect() as c:
    print("DB value:", c.execute(text("SELECT currency_id FROM Purchase_Masters.import_purchase_orders_Header WHERE import_po_id = 5")).fetchall())

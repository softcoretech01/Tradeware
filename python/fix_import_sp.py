import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

sp = """
CREATE OR REPLACE PROCEDURE SP_GetImportPOs()
BEGIN
    SELECT 
        h.import_po_id,
        h.import_po_number,
        h.supplier_id,
        s.name as supplier_name,
        h.po_date,
        h.currency,
        h.exchange_rate,
        h.payment_terms,
        h.total_fcy,
        h.total_lcy,
        h.status,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'detail_id', d.detail_id,
                'item_id', d.item_id,
                'item_name', i.name,
                'qty', d.qty,
                'fcy_unit_price', d.fcy_unit_price,
                'total_fcy', d.total_fcy
            )
        ) as items
    FROM Purchase_Masters.import_purchase_orders_Header h
    LEFT JOIN masters.suppliers s ON h.supplier_id COLLATE utf8mb4_unicode_ci = s.id COLLATE utf8mb4_unicode_ci
    LEFT JOIN Purchase_Masters.import_purchase_orders_Details d ON h.import_po_id = d.import_po_id
    LEFT JOIN masters.items i ON d.item_id COLLATE utf8mb4_unicode_ci = i.id COLLATE utf8mb4_unicode_ci
    GROUP BY h.import_po_id;
END;
"""

with engine.connect() as conn:
    try:
        conn.execute(text(sp))
        conn.commit()
        print("SP Fixed.")
    except Exception as e:
        print(f"Error: {e}")

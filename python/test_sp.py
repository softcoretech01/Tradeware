import os
import sys

# Ensure app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

sp = """
    DROP PROCEDURE IF EXISTS SP_GetDropdownPOs;
"""
sp2 = """
    CREATE PROCEDURE SP_GetDropdownPOs()
    BEGIN
        SELECT h.po_id, h.po_number, h.supplier_id, s.name as supplier_name,
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'item_id', d.item_id, 
                        'item_name', i.name,
                        'quantity', d.quantity
                    )
                ) FROM purchase_order_Details d 
                  LEFT JOIN masters.items i ON d.item_id COLLATE utf8mb4_0900_ai_ci = i.id COLLATE utf8mb4_0900_ai_ci
                  WHERE d.po_id = h.po_id),
                '[]'
            ) AS items_json
        FROM purchase_orders_Header h
        LEFT JOIN masters.suppliers s ON h.supplier_id COLLATE utf8mb4_0900_ai_ci = s.id COLLATE utf8mb4_0900_ai_ci;
    END;
"""

with engine.connect() as conn:
    try:
        conn.execute(text(sp))
        conn.execute(text(sp2))
        conn.commit()
        result = conn.execute(text("CALL SP_GetDropdownPOs()")).fetchall()
        print("Success:")
        for r in result:
            print(dict(r._mapping))
    except Exception as e:
        print("Error:", e)

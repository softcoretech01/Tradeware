import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

sps = [
    """
    DROP PROCEDURE IF EXISTS SP_GetImportPOs;
    """,
    """
    CREATE PROCEDURE SP_GetImportPOs()
    BEGIN
        SELECT 
            h.import_po_id,
            h.import_po_number,
            h.supplier_id,
            s.name as supplier_name,
            h.po_date,
            h.currency_id,
            c.code as currency,
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
                    'total_fcy', d.total_fcy,
                    'currency_id', d.currency_id
                )
            ) as items
        FROM Purchase_Masters.import_purchase_orders_Header h
        LEFT JOIN masters.suppliers s ON h.supplier_id COLLATE utf8mb4_unicode_ci = s.id COLLATE utf8mb4_unicode_ci
        LEFT JOIN masters.currencies c ON h.currency_id = c.id
        LEFT JOIN Purchase_Masters.import_purchase_orders_Details d ON h.import_po_id = d.import_po_id
        LEFT JOIN masters.items i ON d.item_id COLLATE utf8mb4_unicode_ci = i.id COLLATE utf8mb4_unicode_ci
        GROUP BY h.import_po_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_CreateImportPO;
    """,
    """
    CREATE PROCEDURE SP_CreateImportPO(
        IN p_import_po_number VARCHAR(50),
        IN p_supplier_id VARCHAR(50),
        IN p_po_date DATE,
        IN p_currency_id INT,
        IN p_exchange_rate DECIMAL(10,4),
        IN p_payment_terms VARCHAR(100),
        IN p_total_fcy DECIMAL(15,2),
        IN p_total_lcy DECIMAL(15,2),
        IN p_status VARCHAR(50),
        IN p_items_json JSON
    )
    BEGIN
        DECLARE new_po_id INT;
        
        INSERT INTO Purchase_Masters.import_purchase_orders_Header (
            import_po_number, supplier_id, po_date, currency_id, exchange_rate, 
            payment_terms, total_fcy, total_lcy, status
        ) VALUES (
            p_import_po_number, p_supplier_id, p_po_date, p_currency_id, p_exchange_rate, 
            p_payment_terms, p_total_fcy, p_total_lcy, p_status
        );
        
        SET new_po_id = LAST_INSERT_ID();
        
        INSERT INTO Purchase_Masters.import_purchase_orders_Details (
            import_po_id, item_id, currency_id, qty, fcy_unit_price, total_fcy
        )
        SELECT 
            new_po_id,
            jt.itemCode,
            jt.currency_id,
            jt.qty,
            jt.fcyUnitPrice,
            (jt.qty * jt.fcyUnitPrice)
        FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
            itemCode VARCHAR(50) PATH '$.itemCode',
            currency_id INT PATH '$.currency_id',
            qty DECIMAL(15,4) PATH '$.qty',
            fcyUnitPrice DECIMAL(15,4) PATH '$.fcyUnitPrice'
        )) AS jt;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_UpdateImportPO;
    """,
    """
    CREATE PROCEDURE SP_UpdateImportPO(
        IN p_import_po_id INT,
        IN p_supplier_id VARCHAR(50),
        IN p_po_date DATE,
        IN p_currency_id INT,
        IN p_exchange_rate DECIMAL(10,4),
        IN p_payment_terms VARCHAR(100),
        IN p_total_fcy DECIMAL(15,2),
        IN p_total_lcy DECIMAL(15,2),
        IN p_status VARCHAR(50),
        IN p_items_json JSON
    )
    BEGIN
        UPDATE Purchase_Masters.import_purchase_orders_Header
        SET 
            supplier_id = p_supplier_id,
            po_date = p_po_date,
            currency_id = p_currency_id,
            exchange_rate = p_exchange_rate,
            payment_terms = p_payment_terms,
            total_fcy = p_total_fcy,
            total_lcy = p_total_lcy,
            status = p_status
        WHERE import_po_id = p_import_po_id;
        
        DELETE FROM Purchase_Masters.import_purchase_orders_Details WHERE import_po_id = p_import_po_id;
        
        INSERT INTO Purchase_Masters.import_purchase_orders_Details (
            import_po_id, item_id, currency_id, qty, fcy_unit_price, total_fcy
        )
        SELECT 
            p_import_po_id,
            jt.itemCode,
            jt.currency_id,
            jt.qty,
            jt.fcyUnitPrice,
            (jt.qty * jt.fcyUnitPrice)
        FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
            itemCode VARCHAR(50) PATH '$.itemCode',
            currency_id INT PATH '$.currency_id',
            qty DECIMAL(15,4) PATH '$.qty',
            fcyUnitPrice DECIMAL(15,4) PATH '$.fcyUnitPrice'
        )) AS jt;
    END;
    """
]

with engine.connect() as conn:
    try:
        for sp in sps:
            conn.execute(text(sp))
        conn.commit()
        print("Stored Procedures updated successfully.")
    except Exception as e:
        print(f"Error: {e}")

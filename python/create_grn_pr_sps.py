import os
import json
from sqlalchemy import text
import sys

# Ensure app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

sps = [
    """
    DROP PROCEDURE IF EXISTS SP_GetDropdownGRNs;
    """,
    """
    CREATE PROCEDURE SP_GetDropdownGRNs()
    BEGIN
        SELECT h.grn_id, h.grn_number, h.supplier_id, s.name as supplier_name, p.po_number,
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'item_id', d.item_id, 
                        'item_name', i.name,
                        'received_qty', d.received_qty,
                        'unit_price', IFNULL(pod.unit_price, 0.00)
                    )
                ) FROM grn_Details d 
                  LEFT JOIN masters.items i ON d.item_id COLLATE utf8mb4_0900_ai_ci = i.id COLLATE utf8mb4_0900_ai_ci
                  LEFT JOIN purchase_order_Details pod ON pod.po_id = h.po_id AND pod.item_id COLLATE utf8mb4_0900_ai_ci = d.item_id COLLATE utf8mb4_0900_ai_ci
                  WHERE d.grn_id = h.grn_id),
                '[]'
            ) AS items_json
        FROM grn_Header h
        LEFT JOIN masters.suppliers s ON h.supplier_id COLLATE utf8mb4_0900_ai_ci = s.id COLLATE utf8mb4_0900_ai_ci
        LEFT JOIN purchase_orders_Header p ON h.po_id = p.po_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_GetGRNs;
    """,
    """
    CREATE PROCEDURE SP_GetGRNs()
    BEGIN
        SELECT h.grn_id, h.grn_number, h.po_id, h.supplier_id, h.grn_date,
               s.name as supplier_name, p.po_number,
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'grn_item_id', d.grn_item_id,
                        'grn_id', d.grn_id,
                        'item_id', d.item_id,
                        'item_name', i.name,
                        'po_qty', d.po_qty,
                        'received_qty', d.received_qty,
                        'batch_lot_number', d.batch_lot_number,
                        'mfg_date', d.mfg_date,
                        'expiry_date', d.expiry_date
                    )
                ) FROM grn_Details d 
                  LEFT JOIN masters.items i ON d.item_id COLLATE utf8mb4_0900_ai_ci = i.id COLLATE utf8mb4_0900_ai_ci
                  WHERE d.grn_id = h.grn_id),
                '[]'
            ) AS items_json
        FROM grn_Header h
        LEFT JOIN masters.suppliers s ON h.supplier_id COLLATE utf8mb4_0900_ai_ci = s.id COLLATE utf8mb4_0900_ai_ci
        LEFT JOIN purchase_orders_Header p ON h.po_id = p.po_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_CreateGRN;
    """,
    """
    CREATE PROCEDURE SP_CreateGRN(
        IN p_grn_number VARCHAR(50),
        IN p_po_id INT,
        IN p_supplier_id VARCHAR(50),
        IN p_grn_date DATE,
        IN p_items_json JSON
    )
    BEGIN
        DECLARE v_grn_id INT;

        INSERT INTO grn_Header (
            grn_number, po_id, supplier_id, grn_date
        ) VALUES (
            p_grn_number, p_po_id, p_supplier_id, p_grn_date
        );

        SET v_grn_id = LAST_INSERT_ID();

        IF p_items_json IS NOT NULL AND JSON_LENGTH(p_items_json) > 0 THEN
            INSERT INTO grn_Details (
                grn_id, item_id, po_qty, received_qty, batch_lot_number, mfg_date, expiry_date
            )
            SELECT v_grn_id, item_id, po_qty, received_qty, batch_lot_number, mfg_date, expiry_date
            FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
                item_id VARCHAR(50) PATH '$.item_id',
                po_qty DECIMAL(15,4) PATH '$.po_qty',
                received_qty DECIMAL(15,4) PATH '$.received_qty',
                batch_lot_number VARCHAR(100) PATH '$.batch_lot_number',
                mfg_date DATE PATH '$.mfg_date',
                expiry_date DATE PATH '$.expiry_date'
            )) as jt;
        END IF;

        SELECT v_grn_id AS grn_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_UpdateGRN;
    """,
    """
    CREATE PROCEDURE SP_UpdateGRN(
        IN p_grn_id INT,
        IN p_grn_number VARCHAR(50),
        IN p_po_id INT,
        IN p_supplier_id VARCHAR(50),
        IN p_grn_date DATE,
        IN p_items_json JSON
    )
    BEGIN
        UPDATE grn_Header
        SET
            grn_number = COALESCE(p_grn_number, grn_number),
            po_id = COALESCE(p_po_id, po_id),
            supplier_id = COALESCE(p_supplier_id, supplier_id),
            grn_date = COALESCE(p_grn_date, grn_date)
        WHERE grn_id = p_grn_id;

        IF p_items_json IS NOT NULL THEN
            DELETE FROM grn_Details WHERE grn_id = p_grn_id;
            
            IF JSON_LENGTH(p_items_json) > 0 THEN
                INSERT INTO grn_Details (
                    grn_id, item_id, po_qty, received_qty, batch_lot_number, mfg_date, expiry_date
                )
                SELECT p_grn_id, item_id, po_qty, received_qty, batch_lot_number, mfg_date, expiry_date
                FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
                    item_id VARCHAR(50) PATH '$.item_id',
                    po_qty DECIMAL(15,4) PATH '$.po_qty',
                    received_qty DECIMAL(15,4) PATH '$.received_qty',
                    batch_lot_number VARCHAR(100) PATH '$.batch_lot_number',
                    mfg_date DATE PATH '$.mfg_date',
                    expiry_date DATE PATH '$.expiry_date'
                )) as jt;
            END IF;
        END IF;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_DeleteGRN;
    """,
    """
    CREATE PROCEDURE SP_DeleteGRN(IN p_grn_id INT)
    BEGIN
        DELETE FROM grn_Details WHERE grn_id = p_grn_id;
        DELETE FROM grn_Header WHERE grn_id = p_grn_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_GetPurchaseReturns;
    """,
    """
    CREATE PROCEDURE SP_GetPurchaseReturns()
    BEGIN
        SELECT h.return_id, h.return_number, h.grn_id, h.supplier_id, h.return_date,
               h.debit_note_status, h.refund_total, s.name as supplier_name, g.grn_number,
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'return_item_id', d.return_item_id,
                        'return_id', d.return_id,
                        'item_id', d.item_id,
                        'item_name', i.name,
                        'inwarded_qty', d.inwarded_qty,
                        'return_qty', d.return_qty,
                        'return_reason', d.return_reason
                    )
                ) FROM purchase_return_Details d 
                  LEFT JOIN masters.items i ON d.item_id COLLATE utf8mb4_0900_ai_ci = i.id COLLATE utf8mb4_0900_ai_ci
                  WHERE d.return_id = h.return_id),
                '[]'
            ) AS items_json
        FROM purchase_return_Header h
        LEFT JOIN masters.suppliers s ON h.supplier_id COLLATE utf8mb4_0900_ai_ci = s.id COLLATE utf8mb4_0900_ai_ci
        LEFT JOIN grn_Header g ON h.grn_id = g.grn_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_CreatePurchaseReturn;
    """,
    """
    CREATE PROCEDURE SP_CreatePurchaseReturn(
        IN p_return_number VARCHAR(50),
        IN p_grn_id INT,
        IN p_supplier_id VARCHAR(50),
        IN p_return_date DATE,
        IN p_debit_note_status VARCHAR(50),
        IN p_refund_total DECIMAL(15,2),
        IN p_items_json JSON
    )
    BEGIN
        DECLARE v_return_id INT;

        INSERT INTO purchase_return_Header (
            return_number, grn_id, supplier_id, return_date, debit_note_status, refund_total
        ) VALUES (
            p_return_number, p_grn_id, p_supplier_id, p_return_date, p_debit_note_status, p_refund_total
        );

        SET v_return_id = LAST_INSERT_ID();

        IF p_items_json IS NOT NULL AND JSON_LENGTH(p_items_json) > 0 THEN
            INSERT INTO purchase_return_Details (
                return_id, item_id, inwarded_qty, return_qty, return_reason
            )
            SELECT v_return_id, item_id, inwarded_qty, return_qty, return_reason
            FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
                item_id VARCHAR(50) PATH '$.item_id',
                inwarded_qty DECIMAL(15,4) PATH '$.inwarded_qty',
                return_qty DECIMAL(15,4) PATH '$.return_qty',
                return_reason VARCHAR(255) PATH '$.return_reason'
            )) as jt;
        END IF;

        SELECT v_return_id AS return_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_UpdatePurchaseReturn;
    """,
    """
    CREATE PROCEDURE SP_UpdatePurchaseReturn(
        IN p_return_id INT,
        IN p_return_number VARCHAR(50),
        IN p_grn_id INT,
        IN p_supplier_id VARCHAR(50),
        IN p_return_date DATE,
        IN p_debit_note_status VARCHAR(50),
        IN p_refund_total DECIMAL(15,2),
        IN p_items_json JSON
    )
    BEGIN
        UPDATE purchase_return_Header
        SET
            return_number = COALESCE(p_return_number, return_number),
            grn_id = COALESCE(p_grn_id, grn_id),
            supplier_id = COALESCE(p_supplier_id, supplier_id),
            return_date = COALESCE(p_return_date, return_date),
            debit_note_status = COALESCE(p_debit_note_status, debit_note_status),
            refund_total = COALESCE(p_refund_total, refund_total)
        WHERE return_id = p_return_id;

        IF p_items_json IS NOT NULL THEN
            DELETE FROM purchase_return_Details WHERE return_id = p_return_id;
            
            IF JSON_LENGTH(p_items_json) > 0 THEN
                INSERT INTO purchase_return_Details (
                    return_id, item_id, inwarded_qty, return_qty, return_reason
                )
                SELECT p_return_id, item_id, inwarded_qty, return_qty, return_reason
                FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
                    item_id VARCHAR(50) PATH '$.item_id',
                    inwarded_qty DECIMAL(15,4) PATH '$.inwarded_qty',
                    return_qty DECIMAL(15,4) PATH '$.return_qty',
                    return_reason VARCHAR(255) PATH '$.return_reason'
                )) as jt;
            END IF;
        END IF;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_DeletePurchaseReturn;
    """,
    """
    CREATE PROCEDURE SP_DeletePurchaseReturn(IN p_return_id INT)
    BEGIN
        DELETE FROM purchase_return_Details WHERE return_id = p_return_id;
        DELETE FROM purchase_return_Header WHERE return_id = p_return_id;
    END;
    """
]

def run_migration():
    with engine.connect() as conn:
        for sp in sps:
            conn.execute(text(sp))
        conn.commit()
        print("Successfully created all GRN and Purchase Return Stored Procedures!")

if __name__ == "__main__":
    run_migration()

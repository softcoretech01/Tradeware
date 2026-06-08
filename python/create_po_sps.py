import os
import json
from sqlalchemy import text
import sys

# Ensure app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

sps = [
    """
    DROP PROCEDURE IF EXISTS SP_GetDropdownSuppliers;
    """,
    """
    CREATE PROCEDURE SP_GetDropdownSuppliers()
    BEGIN
        SELECT id, name FROM masters.suppliers WHERE active = 1;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_GetDropdownRequisitions;
    """,
    """
    CREATE PROCEDURE SP_GetDropdownRequisitions()
    BEGIN
        SELECT h.pr_id, h.pr_number, h.pr_date, h.required_by_date, h.department, h.requested_by, h.priority, h.notes,
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'item_id', d.item_id, 
                        'requested_quantity', d.requested_quantity, 
                        'unit_price', d.unit_price,
                        'total_price', d.total_price,
                        'uom', d.uom,
                        'reason_for_request', d.reason_for_request,
                        'pr_id', d.pr_id
                    )
                ) FROM purchase_requisition_Details d WHERE d.pr_id = h.pr_id),
                '[]'
            ) AS items_json
        FROM purchase_requisitions_Header h;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_GetDropdownPOs;
    """,
    """
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
    """,
    """
    DROP PROCEDURE IF EXISTS SP_GetPurchaseOrders;
    """,
    """
    CREATE PROCEDURE SP_GetPurchaseOrders(IN p_search VARCHAR(255))
    BEGIN
        SELECT h.po_id, h.po_number, h.pr_id, h.supplier_id, h.po_date, h.payment_terms, 
               h.sub_total, h.tax_total, h.grand_total,
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'po_item_id', d.po_item_id,
                        'po_id', d.po_id,
                        'item_id', d.item_id,
                        'quantity', d.quantity,
                        'uom', d.uom,
                        'unit_price', d.unit_price,
                        'tax_rate', d.tax_rate,
                        'line_total', d.line_total
                    )
                ) FROM purchase_order_Details d WHERE d.po_id = h.po_id),
                '[]'
            ) AS items_json,
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'schedule_id', sched.schedule_id,
                        'po_id', sched.po_id,
                        'expected_delivery_date', sched.expected_delivery_date,
                        'target_quantity', sched.target_quantity
                    )
                ) FROM purchase_order_delivery_schedules sched WHERE sched.po_id = h.po_id),
                '[]'
            ) AS schedules_json
        FROM purchase_orders_Header h
        LEFT JOIN masters.suppliers s ON h.supplier_id COLLATE utf8mb4_0900_ai_ci = s.id COLLATE utf8mb4_0900_ai_ci
        WHERE p_search IS NULL OR p_search = '' 
           OR h.po_number COLLATE utf8mb4_0900_ai_ci LIKE CONCAT('%', p_search, '%')
           OR s.name COLLATE utf8mb4_0900_ai_ci LIKE CONCAT('%', p_search, '%');
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_CreatePurchaseOrder;
    """,
    """
    CREATE PROCEDURE SP_CreatePurchaseOrder(
        IN p_po_number VARCHAR(50),
        IN p_pr_id INT,
        IN p_supplier_id VARCHAR(50),
        IN p_po_date DATE,
        IN p_payment_terms VARCHAR(100),
        IN p_sub_total DECIMAL(15,2),
        IN p_tax_total DECIMAL(15,2),
        IN p_grand_total DECIMAL(15,2),
        IN p_items_json JSON,
        IN p_schedules_json JSON
    )
    BEGIN
        DECLARE v_po_id INT;

        INSERT INTO purchase_orders_Header (
            po_number, pr_id, supplier_id, po_date, payment_terms, sub_total, tax_total, grand_total
        ) VALUES (
            p_po_number, p_pr_id, p_supplier_id, p_po_date, p_payment_terms, p_sub_total, p_tax_total, p_grand_total
        );

        SET v_po_id = LAST_INSERT_ID();

        IF p_items_json IS NOT NULL AND JSON_LENGTH(p_items_json) > 0 THEN
            INSERT INTO purchase_order_Details (
                po_id, item_id, quantity, uom, unit_price, tax_rate, line_total
            )
            SELECT v_po_id, item_id, quantity, uom, unit_price, tax_rate, line_total
            FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
                item_id VARCHAR(50) PATH '$.item_id',
                quantity DECIMAL(15,4) PATH '$.quantity',
                uom VARCHAR(20) PATH '$.uom',
                unit_price DECIMAL(15,2) PATH '$.unit_price',
                tax_rate DECIMAL(5,2) PATH '$.tax_rate',
                line_total DECIMAL(15,2) PATH '$.line_total'
            )) as jt;
        END IF;

        IF p_schedules_json IS NOT NULL AND JSON_LENGTH(p_schedules_json) > 0 THEN
            INSERT INTO purchase_order_delivery_schedules (
                po_id, expected_delivery_date, target_quantity
            )
            SELECT v_po_id, expected_delivery_date, target_quantity
            FROM JSON_TABLE(p_schedules_json, '$[*]' COLUMNS (
                expected_delivery_date DATE PATH '$.expected_delivery_date',
                target_quantity DECIMAL(15,4) PATH '$.target_quantity'
            )) as st;
        END IF;

        SELECT v_po_id AS po_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_UpdatePurchaseOrder;
    """,
    """
    CREATE PROCEDURE SP_UpdatePurchaseOrder(
        IN p_po_id INT,
        IN p_po_number VARCHAR(50),
        IN p_pr_id INT,
        IN p_supplier_id VARCHAR(50),
        IN p_po_date DATE,
        IN p_payment_terms VARCHAR(100),
        IN p_sub_total DECIMAL(15,2),
        IN p_tax_total DECIMAL(15,2),
        IN p_grand_total DECIMAL(15,2),
        IN p_items_json JSON,
        IN p_schedules_json JSON
    )
    BEGIN
        UPDATE purchase_orders_Header
        SET
            po_number = COALESCE(p_po_number, po_number),
            pr_id = p_pr_id,
            supplier_id = COALESCE(p_supplier_id, supplier_id),
            po_date = COALESCE(p_po_date, po_date),
            payment_terms = COALESCE(p_payment_terms, payment_terms),
            sub_total = COALESCE(p_sub_total, sub_total),
            tax_total = COALESCE(p_tax_total, tax_total),
            grand_total = COALESCE(p_grand_total, grand_total)
        WHERE po_id = p_po_id;

        IF p_items_json IS NOT NULL THEN
            DELETE FROM purchase_order_Details WHERE po_id = p_po_id;
            
            IF JSON_LENGTH(p_items_json) > 0 THEN
                INSERT INTO purchase_order_Details (
                    po_id, item_id, quantity, uom, unit_price, tax_rate, line_total
                )
                SELECT p_po_id, item_id, quantity, uom, unit_price, tax_rate, line_total
                FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
                    item_id VARCHAR(50) PATH '$.item_id',
                    quantity DECIMAL(15,4) PATH '$.quantity',
                    uom VARCHAR(20) PATH '$.uom',
                    unit_price DECIMAL(15,2) PATH '$.unit_price',
                    tax_rate DECIMAL(5,2) PATH '$.tax_rate',
                    line_total DECIMAL(15,2) PATH '$.line_total'
                )) as jt;
            END IF;
        END IF;

        IF p_schedules_json IS NOT NULL THEN
            DELETE FROM purchase_order_delivery_schedules WHERE po_id = p_po_id;
            
            IF JSON_LENGTH(p_schedules_json) > 0 THEN
                INSERT INTO purchase_order_delivery_schedules (
                    po_id, expected_delivery_date, target_quantity
                )
                SELECT p_po_id, expected_delivery_date, target_quantity
                FROM JSON_TABLE(p_schedules_json, '$[*]' COLUMNS (
                    expected_delivery_date DATE PATH '$.expected_delivery_date',
                    target_quantity DECIMAL(15,4) PATH '$.target_quantity'
                )) as st;
            END IF;
        END IF;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_DeletePurchaseOrder;
    """,
    """
    CREATE PROCEDURE SP_DeletePurchaseOrder(IN p_po_id INT)
    BEGIN
        DELETE FROM purchase_order_Details WHERE po_id = p_po_id;
        DELETE FROM purchase_order_delivery_schedules WHERE po_id = p_po_id;
        DELETE FROM purchase_orders_Header WHERE po_id = p_po_id;
    END;
    """
]

def run_migration():
    with engine.connect() as conn:
        for sp in sps:
            conn.execute(text(sp))
        conn.commit()
        print("Successfully created all PO Stored Procedures!")

if __name__ == "__main__":
    run_migration()

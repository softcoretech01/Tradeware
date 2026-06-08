import os
import json
from sqlalchemy import text
import sys

# Ensure app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

sps = [
    """
    DROP PROCEDURE IF EXISTS SP_GetDropdownUsers;
    """,
    """
    CREATE PROCEDURE SP_GetDropdownUsers()
    BEGIN
        SELECT id, name, email, role, department, status FROM masters.users;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_GetDropdownItems;
    """,
    """
    CREATE PROCEDURE SP_GetDropdownItems()
    BEGIN
        SELECT id, name, uom_id, standardPrice FROM masters.items WHERE active = 1;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_CreatePurchaseRequisition;
    """,
    """
    CREATE PROCEDURE SP_CreatePurchaseRequisition(
        IN p_pr_number VARCHAR(50),
        IN p_pr_date DATE,
        IN p_required_by_date DATE,
        IN p_department VARCHAR(100),
        IN p_requested_by INT,
        IN p_priority VARCHAR(50),
        IN p_notes TEXT,
        IN p_items_json JSON
    )
    BEGIN
        DECLARE v_pr_id INT;

        INSERT INTO purchase_requisitions_Header (
            pr_number, pr_date, required_by_date, department, requested_by, priority, notes
        ) VALUES (
            p_pr_number, p_pr_date, p_required_by_date, p_department, p_requested_by, p_priority, p_notes
        );

        SET v_pr_id = LAST_INSERT_ID();

        IF p_items_json IS NOT NULL AND JSON_LENGTH(p_items_json) > 0 THEN
            INSERT INTO purchase_requisition_Details (
                pr_id, item_id, requested_quantity, unit_price, total_price, uom, reason_for_request
            )
            SELECT v_pr_id, item_id, requested_quantity, unit_price, total_price, uom, reason_for_request
            FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
                item_id VARCHAR(50) PATH '$.item_id',
                requested_quantity DECIMAL(15,4) PATH '$.requested_quantity',
                unit_price DECIMAL(15,2) PATH '$.unit_price',
                total_price DECIMAL(15,2) PATH '$.total_price',
                uom VARCHAR(20) PATH '$.uom',
                reason_for_request TEXT PATH '$.reason_for_request'
            )) as jt;
        END IF;

        SELECT v_pr_id AS pr_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_GetPurchaseRequisitions;
    """,
    """
    CREATE PROCEDURE SP_GetPurchaseRequisitions(
        IN p_skip INT,
        IN p_limit INT
    )
    BEGIN
        SELECT pr_id, pr_number, pr_date, required_by_date, department, requested_by, priority, notes
        FROM purchase_requisitions_Header
        LIMIT p_limit OFFSET p_skip;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_GetPurchaseRequisitionHeaderById;
    """,
    """
    CREATE PROCEDURE SP_GetPurchaseRequisitionHeaderById(IN p_pr_id INT)
    BEGIN
        SELECT pr_id, pr_number, pr_date, required_by_date, department, requested_by, priority, notes
        FROM purchase_requisitions_Header
        WHERE pr_id = p_pr_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_GetPurchaseRequisitionDetailsById;
    """,
    """
    CREATE PROCEDURE SP_GetPurchaseRequisitionDetailsById(IN p_pr_id INT)
    BEGIN
        SELECT pr_id, item_id, requested_quantity, unit_price, total_price, uom, reason_for_request
        FROM purchase_requisition_Details
        WHERE pr_id = p_pr_id;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_UpdatePurchaseRequisition;
    """,
    """
    CREATE PROCEDURE SP_UpdatePurchaseRequisition(
        IN p_pr_id INT,
        IN p_pr_number VARCHAR(50),
        IN p_pr_date DATE,
        IN p_required_by_date DATE,
        IN p_department VARCHAR(100),
        IN p_requested_by INT,
        IN p_priority VARCHAR(50),
        IN p_notes TEXT,
        IN p_items_json JSON
    )
    BEGIN
        UPDATE purchase_requisitions_Header
        SET
            pr_number = COALESCE(p_pr_number, pr_number),
            pr_date = COALESCE(p_pr_date, pr_date),
            required_by_date = COALESCE(p_required_by_date, required_by_date),
            department = COALESCE(p_department, department),
            requested_by = COALESCE(p_requested_by, requested_by),
            priority = COALESCE(p_priority, priority),
            notes = COALESCE(p_notes, notes)
        WHERE pr_id = p_pr_id;

        IF p_items_json IS NOT NULL THEN
            DELETE FROM purchase_requisition_Details WHERE pr_id = p_pr_id;
            
            IF JSON_LENGTH(p_items_json) > 0 THEN
                INSERT INTO purchase_requisition_Details (
                    pr_id, item_id, requested_quantity, unit_price, total_price, uom, reason_for_request
                )
                SELECT p_pr_id, item_id, requested_quantity, unit_price, total_price, uom, reason_for_request
                FROM JSON_TABLE(p_items_json, '$[*]' COLUMNS (
                    item_id VARCHAR(50) PATH '$.item_id',
                    requested_quantity DECIMAL(15,4) PATH '$.requested_quantity',
                    unit_price DECIMAL(15,2) PATH '$.unit_price',
                    total_price DECIMAL(15,2) PATH '$.total_price',
                    uom VARCHAR(20) PATH '$.uom',
                    reason_for_request TEXT PATH '$.reason_for_request'
                )) as jt;
            END IF;
        END IF;
    END;
    """,
    """
    DROP PROCEDURE IF EXISTS SP_DeletePurchaseRequisition;
    """,
    """
    CREATE PROCEDURE SP_DeletePurchaseRequisition(IN p_pr_id INT)
    BEGIN
        DELETE FROM purchase_requisition_Details WHERE pr_id = p_pr_id;
        DELETE FROM purchase_requisitions_Header WHERE pr_id = p_pr_id;
    END;
    """
]

def run_migration():
    with engine.connect() as conn:
        for sp in sps:
            conn.execute(text(sp))
        conn.commit()
        print("Successfully created all Stored Procedures!")

if __name__ == "__main__":
    run_migration()

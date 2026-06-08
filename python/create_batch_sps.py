import os
from sqlalchemy import text
import sys

# Ensure app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

sps = [
    """
    DROP PROCEDURE IF EXISTS SP_GetBatches;
    """,
    """
    CREATE PROCEDURE SP_GetBatches()
    BEGIN
        SELECT 
            ib.batch_no as batchNo,
            ib.item_id as itemCode,
            i.name as itemName,
            ib.current_qty as qty,
            ib.current_qty as initialQty,
            ib.mfg_date as mfgDate,
            ib.expiry_date as expiryDate,
            IFNULL(ib.landed_unit_cost, 0.00) as landedUnitCost,
            IFNULL(ib.final_selling_price, 0.00) as finalSellingPrice,
            ib.status as status,
            'Main Warehouse' as warehouse,
            ib.po_reference as poReference,
            ib.grn_reference as shipmentRef,
            1 as sequence
        FROM Purchase_Masters.inventory_batches ib
        LEFT JOIN masters.items i ON ib.item_id COLLATE utf8mb4_0900_ai_ci = i.id COLLATE utf8mb4_0900_ai_ci;
    END;
    """
]

def run_migration():
    with engine.connect() as conn:
        for sp in sps:
            conn.execute(text(sp))
        conn.commit()
        print("Successfully created SP_GetBatches!")

if __name__ == "__main__":
    run_migration()

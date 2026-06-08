import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

sps = [
    """
    DROP PROCEDURE IF EXISTS SP_GetBatchAgingAnalysis;
    """,
    """
    CREATE PROCEDURE SP_GetBatchAgingAnalysis()
    BEGIN
        SELECT 
            ib.batch_no as batchNo,
            ib.item_id as itemCode,
            i.name as itemName,
            ib.current_qty as qty,
            ib.mfg_date as mfgDate,
            ib.expiry_date as expiryDate,
            ib.status as status,
            'Main Warehouse' as warehouse,
            IFNULL(DATEDIFF(CURRENT_DATE(), ib.mfg_date), 0) as ageDays,
            IFNULL(DATEDIFF(ib.expiry_date, CURRENT_DATE()), 0) as daysToExpiry,
            CASE 
                WHEN DATEDIFF(CURRENT_DATE(), ib.mfg_date) <= 30 THEN '0-30 Days'
                WHEN DATEDIFF(CURRENT_DATE(), ib.mfg_date) <= 60 THEN '31-60 Days'
                WHEN DATEDIFF(CURRENT_DATE(), ib.mfg_date) <= 90 THEN '61-90 Days'
                ELSE '91+ Days'
            END as ageBucket
        FROM Purchase_Masters.inventory_batches ib
        LEFT JOIN masters.items i ON ib.item_id COLLATE utf8mb4_0900_ai_ci = i.id COLLATE utf8mb4_0900_ai_ci
        WHERE ib.current_qty > 0;
    END;
    """
]

def run_migration():
    with engine.connect() as conn:
        for sp in sps:
            conn.execute(text(sp))
        conn.commit()
        print("Successfully created SP_GetBatchAgingAnalysis!")

if __name__ == "__main__":
    run_migration()

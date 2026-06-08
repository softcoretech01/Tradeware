import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

sps = [
    """
    DROP PROCEDURE IF EXISTS SP_DeleteImportPO;
    """,
    """
    CREATE PROCEDURE SP_DeleteImportPO(
        IN p_import_po_id INT
    )
    BEGIN
        DELETE FROM Purchase_Masters.import_purchase_orders_Details WHERE import_po_id = p_import_po_id;
        DELETE FROM Purchase_Masters.import_purchase_orders_Header WHERE import_po_id = p_import_po_id;
    END;
    """
]

with engine.connect() as conn:
    try:
        for sp in sps:
            conn.execute(text(sp))
        conn.commit()
        print("Stored Procedure updated successfully.")
    except Exception as e:
        print(f"Error: {e}")

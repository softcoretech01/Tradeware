import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

alters = [
    """
    UPDATE Purchase_Masters.import_purchase_orders_Header h
    JOIN masters.currencies c ON h.currency COLLATE utf8mb4_unicode_ci = c.code COLLATE utf8mb4_unicode_ci
    SET h.currency = c.id;
    """,
    "ALTER TABLE Purchase_Masters.import_purchase_orders_Header CHANGE currency currency_id INT;",
    "ALTER TABLE Purchase_Masters.import_purchase_orders_Details ADD COLUMN currency_id INT AFTER item_id;"
]

with engine.connect() as conn:
    try:
        for sql in alters:
            conn.execute(text(sql))
        conn.commit()
        print("Schema altered successfully.")
    except Exception as e:
        print(f"Error: {e}")

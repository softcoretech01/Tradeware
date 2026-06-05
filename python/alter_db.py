from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE purchase_requisition_Details ADD COLUMN total_price DECIMAL(15, 2) DEFAULT 0.00 AFTER unit_price"))
        conn.commit()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

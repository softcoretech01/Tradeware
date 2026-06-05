from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        conn.execute(text("TRUNCATE TABLE purchase_order_delivery_schedules;"))
        conn.execute(text("TRUNCATE TABLE purchase_order_Details;"))
        conn.execute(text("TRUNCATE TABLE purchase_orders_Header;"))
        conn.execute(text("TRUNCATE TABLE purchase_requisition_Details;"))
        conn.execute(text("TRUNCATE TABLE purchase_requisitions_Header;"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        conn.commit()
        print("Successfully wiped PR and PO test data and reset auto-increments.")
    except Exception as e:
        print(f"Error: {e}")

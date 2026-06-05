import mysql.connector
import os

try:
    # Assuming standard credentials used in the app, or we can use SQLAlchemy
    from app.database import engine
    from sqlalchemy import text
    
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE grn_Details ADD COLUMN grn_item_id INT AUTO_INCREMENT PRIMARY KEY FIRST;"))
        print("Successfully added grn_item_id to grn_Details table.")

except Exception as e:
    print("Error:", e)

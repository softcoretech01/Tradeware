import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        print("--- masters.suppliers ---")
        result = conn.execute(text("DESCRIBE masters.suppliers")).fetchall()
        for row in result:
            print(dict(row._mapping))
            
        print("--- masters.supplier_type ---")
        result = conn.execute(text("DESCRIBE masters.supplier_type")).fetchall()
        for row in result:
            print(dict(row._mapping))

        print("--- masters.payment_terms ---")
        result = conn.execute(text("DESCRIBE masters.payment_terms")).fetchall()
        for row in result:
            print(dict(row._mapping))
            
    except Exception as e:
        print(f"Error: {e}")

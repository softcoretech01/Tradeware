import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        result = conn.execute(text("SELECT * FROM masters.supplier_types")).fetchall()
        for row in result:
            print(dict(row._mapping))
    except Exception as e:
        print(f"Error: {e}")

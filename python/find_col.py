import os
import sys

# Ensure app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        result = conn.execute(text("SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE column_name = 'final_selling_price'")).fetchall()
        for row in result:
            print(dict(row._mapping))
    except Exception as e:
        print(f"Error: {e}")

import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

create_header_query = """
CREATE TABLE IF NOT EXISTS Purchase_Masters.import_purchase_orders_Header (
    import_po_id INT AUTO_INCREMENT PRIMARY KEY,
    import_po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id VARCHAR(50) NOT NULL,
    po_date DATE NOT NULL,
    currency VARCHAR(10) NOT NULL,
    exchange_rate DECIMAL(10, 4) NOT NULL,
    payment_terms VARCHAR(100),
    total_fcy DECIMAL(15, 2) DEFAULT 0.00,
    total_lcy DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Ordered',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
"""

create_details_query = """
CREATE TABLE IF NOT EXISTS Purchase_Masters.import_purchase_orders_Details (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    import_po_id INT NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    qty DECIMAL(15, 4) NOT NULL,
    fcy_unit_price DECIMAL(15, 4) NOT NULL,
    total_fcy DECIMAL(15, 2) DEFAULT 0.00,
    FOREIGN KEY (import_po_id) REFERENCES import_purchase_orders_Header(import_po_id) ON DELETE CASCADE
);
"""

with engine.connect() as conn:
    try:
        conn.execute(text(create_header_query))
        conn.execute(text(create_details_query))
        conn.commit()
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error: {e}")

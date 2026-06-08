from app.database import engine
from sqlalchemy import text

def init_sales_orders():
    with engine.connect() as con:
        try:
            # Create Tables
            con.execute(text("""
            CREATE SCHEMA IF NOT EXISTS Sales_Masters;
            """))
            
            con.execute(text("""
            CREATE TABLE IF NOT EXISTS Sales_Masters.SalesOrder_Header (
                id VARCHAR(50) PRIMARY KEY,
                So_number VARCHAR(50) DEFAULT NULL,
                customer_name VARCHAR(150) NOT NULL,
                date DATE NOT NULL,
                delivery_schedule DATE NOT NULL,
                invoice_generated TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
            """))

            con.execute(text("""
            CREATE TABLE IF NOT EXISTS Sales_Masters.SalesOrder_Details (
                so_details_id INT AUTO_INCREMENT PRIMARY KEY,
                So_number VARCHAR(50) NOT NULL,
                item_id VARCHAR(50) NOT NULL,
                name VARCHAR(150) NOT NULL,
                ordered_qty DECIMAL(10,2) NOT NULL DEFAULT 1.00,
                supplied_qty DECIMAL(10,2) NOT NULL DEFAULT 1.00,
                pending_qty DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                FOREIGN KEY (So_number) REFERENCES Sales_Masters.SalesOrder_Header(id) ON DELETE CASCADE
            );
            """))

            # Create SPs
            con.execute(text("DROP PROCEDURE IF EXISTS SP_GetSalesOrders"))
            con.execute(text("""
            CREATE PROCEDURE SP_GetSalesOrders()
            BEGIN
                SELECT * FROM Sales_Masters.SalesOrder_Header ORDER BY created_at DESC;
            END
            """))

            con.execute(text("DROP PROCEDURE IF EXISTS SP_GetSalesOrderDetails"))
            con.execute(text("""
            CREATE PROCEDURE SP_GetSalesOrderDetails(IN p_so_id VARCHAR(50))
            BEGIN
                SELECT * FROM Sales_Masters.SalesOrder_Details WHERE So_number = p_so_id;
            END
            """))

            con.execute(text("DROP PROCEDURE IF EXISTS SP_SaveSalesOrderHeader"))
            con.execute(text("""
            CREATE PROCEDURE SP_SaveSalesOrderHeader(
                IN p_id VARCHAR(50),
                IN p_so_number VARCHAR(50),
                IN p_customer_name VARCHAR(150),
                IN p_date DATE,
                IN p_delivery_schedule DATE,
                IN p_invoice_generated TINYINT(1)
            )
            BEGIN
                INSERT INTO Sales_Masters.SalesOrder_Header (
                    id, So_number, customer_name, date, delivery_schedule, invoice_generated
                ) VALUES (
                    p_id, p_so_number, p_customer_name, p_date, p_delivery_schedule, p_invoice_generated
                ) ON DUPLICATE KEY UPDATE
                    So_number = VALUES(So_number),
                    customer_name = VALUES(customer_name),
                    date = VALUES(date),
                    delivery_schedule = VALUES(delivery_schedule),
                    invoice_generated = VALUES(invoice_generated);
            END
            """))

            con.execute(text("DROP PROCEDURE IF EXISTS SP_SaveSalesOrderDetail"))
            con.execute(text("""
            CREATE PROCEDURE SP_SaveSalesOrderDetail(
                IN p_so_number VARCHAR(50),
                IN p_item_id VARCHAR(50),
                IN p_name VARCHAR(150),
                IN p_ordered_qty DECIMAL(10,2),
                IN p_supplied_qty DECIMAL(10,2),
                IN p_pending_qty DECIMAL(10,2),
                IN p_unit_price DECIMAL(15,2)
            )
            BEGIN
                INSERT INTO Sales_Masters.SalesOrder_Details (
                    So_number, item_id, name, ordered_qty, supplied_qty, pending_qty, unit_price
                ) VALUES (
                    p_so_number, p_item_id, p_name, p_ordered_qty, p_supplied_qty, p_pending_qty, p_unit_price
                );
            END
            """))

            con.execute(text("DROP PROCEDURE IF EXISTS SP_DeleteSalesOrder"))
            con.execute(text("""
            CREATE PROCEDURE SP_DeleteSalesOrder(IN p_so_id VARCHAR(50))
            BEGIN
                DELETE FROM Sales_Masters.SalesOrder_Header WHERE id = p_so_id;
            END
            """))

            con.commit()
            print("Successfully created Sales Order schema and stored procedures.")

        except Exception as e:
            con.rollback()
            print("Error:", e)

if __name__ == '__main__':
    init_sales_orders()

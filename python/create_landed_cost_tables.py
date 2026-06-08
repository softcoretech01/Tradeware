import mysql.connector

try:
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="Purchase_Masters"
    )

    if connection.is_connected():
        cursor = connection.cursor()

        sql_header = """
        CREATE TABLE IF NOT EXISTS Purchase_Masters.import_landed_costs_Header (
            import_landed_cost_id INT AUTO_INCREMENT PRIMARY KEY,
            import_po_id INT NOT NULL UNIQUE,
            duty_percent DECIMAL(5, 2) DEFAULT 0.00,
            cess_percent DECIMAL(5, 2) DEFAULT 0.00,
            gst_percent DECIMAL(5, 2) DEFAULT 0.00,
            include_gst BOOLEAN DEFAULT FALSE,
            sea_freight DECIMAL(15, 2) DEFAULT 0.00,
            road_freight DECIMAL(15, 2) DEFAULT 0.00,
            local_transport DECIMAL(15, 2) DEFAULT 0.00,
            liner_charges DECIMAL(15, 2) DEFAULT 0.00,
            insurance_cost DECIMAL(15, 2) DEFAULT 0.00,
            handling_charges DECIMAL(15, 2) DEFAULT 0.00,
            packing_charges DECIMAL(15, 2) DEFAULT 0.00,
            aging_charges DECIMAL(15, 2) DEFAULT 0.00,
            total_customs_duty DECIMAL(15, 2) DEFAULT 0.00,
            total_freight DECIMAL(15, 2) DEFAULT 0.00,
            total_port_charges DECIMAL(15, 2) DEFAULT 0.00,
            total_overhead DECIMAL(15, 2) DEFAULT 0.00,
            total_landed_cost DECIMAL(15, 2) DEFAULT 0.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        """
        cursor.execute(sql_header)

        sql_details = """
        CREATE TABLE IF NOT EXISTS Purchase_Masters.import_landed_costs_Details (
            detail_id INT AUTO_INCREMENT PRIMARY KEY,
            import_landed_cost_id INT NOT NULL,
            item_id VARCHAR(50) NOT NULL,
            qty DECIMAL(15, 4) NOT NULL,
            fob_val_lcy DECIMAL(15, 2) DEFAULT 0.00,
            allocated_overhead DECIMAL(15, 2) DEFAULT 0.00,
            total_landed_cost DECIMAL(15, 2) DEFAULT 0.00,
            landed_unit_cost DECIMAL(15, 2) DEFAULT 0.00
        );
        """
        cursor.execute(sql_details)

        connection.commit()
        print("Tables created successfully")

except mysql.connector.Error as e:
    print("Error while connecting to MySQL", e)
finally:
    if connection.is_connected():
        cursor.close()
        connection.close()

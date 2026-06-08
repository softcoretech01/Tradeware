from app.database import engine
from sqlalchemy import text

try:
    with engine.connect() as con:
        con.execute(text("DROP PROCEDURE IF EXISTS SP_SaveImportLandedCostHeader"))
        sp_save_header = text("""
        CREATE PROCEDURE SP_SaveImportLandedCostHeader(
            IN p_import_po_id INT,
            IN p_duty_percent DECIMAL(5,2),
            IN p_cess_percent DECIMAL(5,2),
            IN p_gst_percent DECIMAL(5,2),
            IN p_include_gst BOOLEAN,
            IN p_sea_freight DECIMAL(15,2),
            IN p_road_freight DECIMAL(15,2),
            IN p_local_transport DECIMAL(15,2),
            IN p_liner_charges DECIMAL(15,2),
            IN p_insurance_cost DECIMAL(15,2),
            IN p_handling_charges DECIMAL(15,2),
            IN p_packing_charges DECIMAL(15,2),
            IN p_aging_charges DECIMAL(15,2),
            IN p_total_customs_duty DECIMAL(15,2),
            IN p_total_freight DECIMAL(15,2),
            IN p_total_port_charges DECIMAL(15,2),
            IN p_total_overhead DECIMAL(15,2),
            IN p_total_landed_cost DECIMAL(15,2),
            IN p_is_posted TINYINT(1),
            OUT p_landed_cost_id INT
        )
        BEGIN
            DECLARE v_existing_id INT DEFAULT NULL;

            SELECT import_landed_cost_id INTO v_existing_id 
            FROM Purchase_Masters.import_landed_costs_Header 
            WHERE import_po_id = p_import_po_id;

            IF v_existing_id IS NOT NULL THEN
                UPDATE Purchase_Masters.import_landed_costs_Header SET
                    duty_percent = p_duty_percent,
                    cess_percent = p_cess_percent,
                    gst_percent = p_gst_percent,
                    include_gst = p_include_gst,
                    sea_freight = p_sea_freight,
                    road_freight = p_road_freight,
                    local_transport = p_local_transport,
                    liner_charges = p_liner_charges,
                    insurance_cost = p_insurance_cost,
                    handling_charges = p_handling_charges,
                    packing_charges = p_packing_charges,
                    aging_charges = p_aging_charges,
                    total_customs_duty = p_total_customs_duty,
                    total_freight = p_total_freight,
                    total_port_charges = p_total_port_charges,
                    total_overhead = p_total_overhead,
                    total_landed_cost = p_total_landed_cost,
                    is_posted = p_is_posted
                WHERE import_landed_cost_id = v_existing_id;
                
                DELETE FROM Purchase_Masters.import_landed_costs_Details WHERE import_landed_cost_id = v_existing_id;
                SET p_landed_cost_id = v_existing_id;
            ELSE
                INSERT INTO Purchase_Masters.import_landed_costs_Header (
                    import_po_id, duty_percent, cess_percent, gst_percent, include_gst,
                    sea_freight, road_freight, local_transport, liner_charges,
                    insurance_cost, handling_charges, packing_charges, aging_charges,
                    total_customs_duty, total_freight, total_port_charges, total_overhead, total_landed_cost, is_posted
                ) VALUES (
                    p_import_po_id, p_duty_percent, p_cess_percent, p_gst_percent, p_include_gst,
                    p_sea_freight, p_road_freight, p_local_transport, p_liner_charges,
                    p_insurance_cost, p_handling_charges, p_packing_charges, p_aging_charges,
                    p_total_customs_duty, p_total_freight, p_total_port_charges, p_total_overhead, p_total_landed_cost, p_is_posted
                );
                SET p_landed_cost_id = LAST_INSERT_ID();
            END IF;
        END
        """)
        con.execute(sp_save_header)
        con.commit()
    print("SP updated successfully.")
except Exception as e:
    print("Error:", e)

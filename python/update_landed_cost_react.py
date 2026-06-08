import re
import os

file_path = 'd:/Trade Wave/react/src/pages/ImportManagement/LandedCost.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add missing imports
if "useEffect" not in content[:200]:
    content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo, useEffect } from 'react';")

# 2. Add API_BASE_URL
if "const API_BASE_URL =" not in content:
    content = content.replace("const LandedCost = () => {", "const API_BASE_URL = 'http://127.0.0.1:8000/api/import';\n\nconst LandedCost = () => {")

# 3. Add states for POs and selected PO
states_to_add = """
  const [importPOs, setImportPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(false);
"""
if "setImportPOs" not in content:
    content = content.replace("const [selectedShipmentId, setSelectedShipmentId] = useState", states_to_add + "  const [selectedShipmentId, setSelectedShipmentId] = useState")

# 4. Replace mock `shipments` with actual `importPOs` logic, but keep variable names simple.
# Let's add useEffect to fetch POs
fetch_effect = """
  useEffect(() => {
    const fetchPOs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders`);
        if (res.ok) {
          const data = await res.json();
          setImportPOs(data);
        }
      } catch (e) {
        console.error('Failed to fetch POs', e);
      }
    };
    fetchPOs();
  }, []);
"""
if "useEffect(() => {" not in content:
    content = content.replace("const [postModalOpen, setPostModalOpen] = useState(false);", "const [postModalOpen, setPostModalOpen] = useState(false);\n" + fetch_effect)

# 5. Handle PO selection
handle_po_selection = """
  const handlePOChange = async (poId) => {
    setSelectedShipmentId(poId);
    const po = importPOs.find(p => p.import_po_id === poId || p.id === poId || p.import_po_number === poId);
    setSelectedPO(po);
    
    // Reset fields first
    setDutyPercent(0);
    setCessPercent(0);
    setGstPercent(0);
    setIncludeGST(false);
    setSeaFreight(0);
    setRoadFreight(0);
    setLocalTransport(0);
    setLinerCharges(0);
    setInsuranceCost(0);
    setHandlingCharges(0);
    setPackingCharges(0);
    setAgingCharges(0);
    
    if (po && po.db_id) {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/landed-cost/${po.db_id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.import_landed_cost_id) {
            setDutyPercent(data.duty_percent);
            setCessPercent(data.cess_percent);
            setGstPercent(data.gst_percent);
            setIncludeGST(data.include_gst);
            setSeaFreight(data.sea_freight);
            setRoadFreight(data.road_freight);
            setLocalTransport(data.local_transport);
            setLinerCharges(data.liner_charges);
            setInsuranceCost(data.insurance_cost);
            setHandlingCharges(data.handling_charges);
            setPackingCharges(data.packing_charges);
            setAgingCharges(data.aging_charges);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };
"""
if "const handlePOChange" not in content:
    content = content.replace("const handleShipmentChange = (e) => {", handle_po_selection + "\n  const handleShipmentChange = (e) => {")

# Modify Select to use importPOs
old_select = """            <Select
              value={selectedShipmentId}
              onChange={handleShipmentChange}
              displayEmpty
              fullWidth
            >
              <MenuItem value="" disabled>Select a Shipment / PO</MenuItem>
              {shipments.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.id} - {s.supplier}</MenuItem>
              ))}
            </Select>"""
new_select = """            <Select
              value={selectedShipmentId}
              onChange={(e) => handlePOChange(e.target.value)}
              displayEmpty
              fullWidth
            >
              <MenuItem value="" disabled>Select a Shipment / PO</MenuItem>
              {importPOs.map(s => (
                <MenuItem key={s.id || s.import_po_number} value={s.id || s.import_po_number}>{s.id || s.import_po_number} - {s.supplierName}</MenuItem>
              ))}
            </Select>"""
content = content.replace(old_select, new_select)

# Replace items extraction
old_items = "const itemsWithFobVal = selectedShipmentId ? shipments.find(s => s.id === selectedShipmentId)?.items.map"
new_items = "const itemsWithFobVal = selectedPO ? selectedPO.items.map(i => ({ ...i, fobValLCY: Number(i.totalFCY) * Number(selectedPO.exchangeRate || 1), id: i.itemCode, name: i.itemName, qty: Number(i.qty) })) : [];\n  // "
content = content.replace(old_items, new_items)

# Update Save logic
old_save = """    // Dispatch landed costs
    dispatch(addLandedCosts({
      shipmentId: selectedShipmentId,
      items: calculations.allocatedItems
    }));"""
new_save = """    // Dispatch landed costs
    dispatch(addLandedCosts({
      shipmentId: selectedShipmentId,
      items: calculations.allocatedItems
    }));
    
    // Save to Database
    if (selectedPO) {
      const payload = {
        import_po_id: selectedPO.db_id,
        duty_percent: Number(dutyPercent),
        cess_percent: Number(cessPercent),
        gst_percent: Number(gstPercent),
        include_gst: includeGST,
        sea_freight: Number(seaFreight),
        road_freight: Number(roadFreight),
        local_transport: Number(localTransport),
        liner_charges: Number(linerCharges),
        insurance_cost: Number(insuranceCost),
        handling_charges: Number(handlingCharges),
        packing_charges: Number(packingCharges),
        aging_charges: Number(agingCharges),
        total_customs_duty: calculations.totalCustomsDuty,
        total_freight: calculations.totalFreight,
        total_port_charges: calculations.totalPortCharges,
        total_overhead: calculations.totalOverhead,
        total_landed_cost: calculations.totalOverhead + calculations.totalFobLCY,
        details: calculations.allocatedItems.map(item => ({
          item_id: item.itemCode,
          qty: item.qty,
          fob_val_lcy: item.fobValLCY,
          allocated_overhead: item.allocatedOverhead,
          total_landed_cost: item.totalLandedCost,
          landed_unit_cost: item.landedUnitCost
        }))
      };
      
      fetch(`${API_BASE_URL}/landed-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json()).then(res => {
        console.log('Saved landed cost to DB:', res);
      }).catch(err => console.error('Failed to save to db:', err));
    }
"""
content = content.replace(old_save, new_save)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("LandedCost.jsx patched")

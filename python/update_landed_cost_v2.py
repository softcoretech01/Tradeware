import re

file_path = 'd:/Trade Wave/react/src/pages/ImportManagement/LandedCost.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject useEffect for fetching POs
fetch_effect = """
  React.useEffect(() => {
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
if "fetchPOs" not in content:
    content = content.replace("const [postModalOpen, setPostModalOpen] = useState(false);", "const [postModalOpen, setPostModalOpen] = useState(false);\n" + fetch_effect)

# 2. Fix the Select dropdown map
old_select = """                  {shipments.filter(s => s.status === 'Customs Clearance' || s.status === 'Cleared').map(sh => (
                    <MenuItem key={sh.id} value={sh.id}>
                      {sh.id} - Container: {sh.containerNo} (PO: {sh.poNo}, Supplier: {sh.supplierName})
                    </MenuItem>
                  ))}"""
new_select = """                  {importPOs.map(sh => (
                    <MenuItem key={sh.id} value={sh.id}>
                      {sh.id} - Supplier: {sh.supplierName} (Total FOB: {sh.totalFCY} {sh.currency})
                    </MenuItem>
                  ))}"""
content = content.replace(old_select, new_select)

# 3. Fix selectedShipment to be from importPOs instead of shipments
old_selected_shipment = """  const selectedShipment = useMemo(() => {
    return shipments.find(s => s.id === selectedShipmentId) || null;
  }, [shipments, selectedShipmentId]);"""
new_selected_shipment = """  const selectedShipment = useMemo(() => {
    return importPOs.find(s => s.id === selectedShipmentId || s.db_id === selectedShipmentId) || null;
  }, [importPOs, selectedShipmentId]);"""
content = content.replace(old_selected_shipment, new_selected_shipment)

# 4. In `selectedShipment` useEffect, add logic to fetch landed cost API and populate
old_use_effect = """  React.useEffect(() => {
    if (selectedShipment) {
      setSeaFreight(String(selectedShipment.seaFreight || selectedShipment.freightCharges || 0));
      setRoadFreight(String(selectedShipment.roadFreight || 0));
      setLocalTransport(String(selectedShipment.localTransport || 0));
      setLinerCharges(String(selectedShipment.linerCharges || selectedShipment.handlingCharges || 0));
      setInsuranceCost(String(selectedShipment.insuranceCost || 0));
      setHandlingCharges(String(selectedShipment.additionalHandlingCharges || 0));
      setPackingCharges(String(selectedShipment.packingCharges || 0));
      setAgingCharges(String(selectedShipment.agingCharges || 0));
      
      setDutyPercent(String(selectedShipment.dutyPercent || 15));
      setCessPercent(String(selectedShipment.cessPercent || 10));
      setGstPercent(String(selectedShipment.gstPercent || 18));
      setIncludeGST(!!selectedShipment.includeGST);
    }
  }, [selectedShipment]);"""
new_use_effect = """  React.useEffect(() => {
    if (selectedShipment && selectedShipment.db_id) {
      // First reset all values to default 0
      setSeaFreight('0'); setRoadFreight('0'); setLocalTransport('0'); setLinerCharges('0');
      setInsuranceCost('0'); setHandlingCharges('0'); setPackingCharges('0'); setAgingCharges('0');
      setDutyPercent('0'); setCessPercent('0'); setGstPercent('0'); setIncludeGST(false);
      
      fetch(`${API_BASE_URL}/landed-cost/${selectedShipment.db_id}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.import_landed_cost_id) {
            setDutyPercent(String(data.duty_percent));
            setCessPercent(String(data.cess_percent));
            setGstPercent(String(data.gst_percent));
            setIncludeGST(data.include_gst);
            setSeaFreight(String(data.sea_freight));
            setRoadFreight(String(data.road_freight));
            setLocalTransport(String(data.local_transport));
            setLinerCharges(String(data.liner_charges));
            setInsuranceCost(String(data.insurance_cost));
            setHandlingCharges(String(data.handling_charges));
            setPackingCharges(String(data.packing_charges));
            setAgingCharges(String(data.aging_charges));
          }
        }).catch(err => console.error(err));
    }
  }, [selectedShipment]);"""
content = content.replace(old_use_effect, new_use_effect)

# 5. Fix items mapping for calculation
# item.qty * item.fcyUnitPrice * exchangeRate
old_items = """    const itemsWithFobVal = selectedShipment.items.map(item => {
      const fobValLCY = item.qty * item.fcyUnitPrice * exchangeRate;
      return {
        ...item,
        fobValLCY
      };
    });"""
new_items = """    const itemsWithFobVal = selectedShipment.items.map(item => {
      // If items come from Import PO API, their keys are itemCode, fcyUnitPrice, totalFCY
      const fcyUnit = Number(item.fcyUnitPrice || item.unitPrice || 0);
      const qty = Number(item.qty || 0);
      const fobValLCY = qty * fcyUnit * Number(exchangeRate || 1);
      return {
        ...item,
        fobValLCY
      };
    });"""
content = content.replace(old_items, new_items)

# 6. Save payload
old_save = """    dispatch(addBatches(newBatches));
    setPostModalOpen(false);
    alert(`Success! Generated and posted ${newBatches.length} batch(es) to Main Warehouse stock registry with custom allocated unit landed costs.`);
    
    // Clear selection
    setSelectedShipmentId('');"""
new_save = """    dispatch(addBatches(newBatches));
    setPostModalOpen(false);
    
    // Save to DB
    if (selectedShipment) {
      const payload = {
        import_po_id: selectedShipment.db_id,
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
        details: calculations.items.map(item => ({
          item_id: item.itemCode || item.id,
          qty: item.qty,
          fob_val_lcy: item.fobValLCY,
          allocated_overhead: item.allocatedOverhead || 0,
          total_landed_cost: item.totalLandedCost || 0,
          landed_unit_cost: item.landedUnitCost || 0
        }))
      };
      
      fetch(`${API_BASE_URL}/landed-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json()).then(res => {
        alert(`Success! Saved landed cost allocations to DB and generated ${newBatches.length} batch(es) to Main Warehouse stock registry.`);
        setSelectedShipmentId('');
      }).catch(err => {
        console.error('Failed to save to db:', err);
        alert('Failed to save landed cost to database');
      });
    } else {
      setSelectedShipmentId('');
    }"""
content = content.replace(old_save, new_save)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated LandedCost.jsx")

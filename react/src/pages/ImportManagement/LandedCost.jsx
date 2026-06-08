import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button, TextField, Card, CardContent, Grid, Typography, Box,
  Chip, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, Select, MenuItem, InputLabel, Paper, FormControlLabel, Checkbox
} from '@mui/material';
import {
  Calculator, CheckCircle, HelpCircle, FileSpreadsheet, FileText,
  DollarSign, ArrowRight, Layers
} from 'lucide-react';
import { addLandedCosts, addBatches } from '../../store/batchImportSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const GREEN = { main: '#15803D', light: '#22C55E', bg: '#DCFCE7' };
const RED = { main: '#B91C1C', light: '#EF4444', bg: '#FEE2E2' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

const API_BASE_URL = 'http://127.0.0.1:8000/api/import';

const LandedCost = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const shipments = useSelector(state => state.batchImport.shipments);
  const batches = useSelector(state => state.batchImport.batches);

  // States
  
  const [importPOs, setImportPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [isPosted, setIsPosted] = useState(false);
  
  // Advanced India Customs & Freight Costing Inputs
  const [dutyPercent, setDutyPercent] = useState('15');
  const [cessPercent, setCessPercent] = useState('10');
  const [gstPercent, setGstPercent] = useState('18');
  const [includeGST, setIncludeGST] = useState(false);
  const [seaFreight, setSeaFreight] = useState('0');
  const [roadFreight, setRoadFreight] = useState('0');
  const [localTransport, setLocalTransport] = useState('0');
  const [linerCharges, setLinerCharges] = useState('0');
  const [insuranceCost, setInsuranceCost] = useState('0');
  const [handlingCharges, setHandlingCharges] = useState('0');
  const [packingCharges, setPackingCharges] = useState('0');
  const [agingCharges, setAgingCharges] = useState('0');

  // Expiry date setting state for posting batches
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 2 years default
  const [postModalOpen, setPostModalOpen] = useState(false);

  React.useEffect(() => {
    const fetchPOs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders`);
        if (res.ok) {
          const data = await res.json();
          const mappedPOs = data.map(po => ({
            id: po.import_po_number,
            db_id: po.import_po_id,
            date: po.po_date,
            supplierId: po.supplier_id,
            supplierName: po.supplier_name,
            currency: po.currency,
            currency_id: po.currency_id,
            exchangeRate: Number(po.exchange_rate),
            paymentTerms: po.payment_terms,
            totalFCY: Number(po.total_fcy),
            totalLCY: Number(po.total_lcy),
            status: po.status,
            items: po.items.map(it => ({
              itemCode: it.item_id,
              itemName: it.item_name,
              qty: Number(it.qty),
              fcyUnitPrice: Number(it.fcy_unit_price),
              totalFCY: Number(it.total_fcy)
            }))
          }));
          setImportPOs(mappedPOs);
        }
      } catch (e) {
        console.error('Failed to fetch POs', e);
      }
    };
    fetchPOs();
  }, []);


  // Find selected shipment details
  const selectedShipment = useMemo(() => {
    return importPOs.find(s => s.id === selectedShipmentId || s.db_id === selectedShipmentId) || null;
  }, [importPOs, selectedShipmentId]);

  // Set default costs when shipment changes
  React.useEffect(() => {
    if (selectedShipment && selectedShipment.db_id) {
      setIsPosted(false);
      // First reset all values to default 0
      setSeaFreight('0'); setRoadFreight('0'); setLocalTransport('0'); setLinerCharges('0');
      setInsuranceCost('0'); setHandlingCharges('0'); setPackingCharges('0'); setAgingCharges('0');
      setDutyPercent('0'); setCessPercent('0'); setGstPercent('0'); setIncludeGST(false);
      
      fetch(`${API_BASE_URL}/landed-cost/${selectedShipment.db_id}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.import_landed_cost_id) {
            setIsPosted(data.is_posted === 1);
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
  }, [selectedShipment]);

  // Landed Cost Allocations calculation
  const calculations = useMemo(() => {
    if (!selectedShipment) return null;

    const exchangeRate = selectedShipment.exchangeRate;

    // Calculate FOB value for each item in local currency (LCY/₹)
    const itemsWithFobVal = selectedShipment.items.map(item => {
      const fcyUnit = Number(item.fcyUnitPrice || item.fcy_unit_price || 0);
      const qty = Number(item.qty || 0);
      const fobValLCY = qty * fcyUnit * Number(exchangeRate || 1);
      return {
        ...item,
        fobValLCY
      };
    });

    const totalFobLCY = itemsWithFobVal.reduce((acc, item) => acc + item.fobValLCY, 0);

    const seaFr = Number(seaFreight) || 0;
    const insCost = Number(insuranceCost) || 0;

    // Assessable Value = FOB + Sea Freight + Insurance
    const assessableValue = totalFobLCY + seaFr + insCost;

    // Basic Customs Duty (BCD)
    const bcdRate = Number(dutyPercent) || 0;
    const calculatedBCD = assessableValue * (bcdRate / 100);

    // Cess = 10% of BCD (or custom)
    const cessRate = Number(cessPercent) || 0;
    const calculatedCess = calculatedBCD * (cessRate / 100);

    // IGST = (Assessable Value + BCD + Cess) * GST%
    const gstRate = Number(gstPercent) || 0;
    const calculatedGST = (assessableValue + calculatedBCD + calculatedCess) * (gstRate / 100);

    // Total Customs Charges
    const totalCustomsDuty = calculatedBCD + calculatedCess + (includeGST ? calculatedGST : 0);

    // Other overheads
    const roadFr = Number(roadFreight) || 0;
    const localTr = Number(localTransport) || 0;
    const linerCh = Number(linerCharges) || 0;
    const handCh = Number(handlingCharges) || 0;
    const packCh = Number(packingCharges) || 0;
    const ageCh = Number(agingCharges) || 0;
    const otherOverheads = roadFr + localTr + linerCh + handCh + packCh + ageCh;

    // Total Overhead = Sea Freight + Insurance + Total Customs Charges + Other Overheads
    const totalOverhead = seaFr + insCost + totalCustomsDuty + otherOverheads;

    // Allocate overheads based on FOB value ratio
    const allocatedItems = itemsWithFobVal.map(item => {
      const ratio = totalFobLCY > 0 ? item.fobValLCY / totalFobLCY : 0;
      const allocatedOverhead = ratio * totalOverhead;
      const totalLandedCost = item.fobValLCY + allocatedOverhead;
      const landedUnitCost = item.qty > 0 ? totalLandedCost / item.qty : 0;

      return {
        ...item,
        allocatedOverhead,
        totalLandedCost,
        landedUnitCost
      };
    });

    return {
      totalFobLCY,
      assessableValue,
      calculatedBCD,
      calculatedCess,
      calculatedGST,
      totalCustomsDuty,
      totalOverhead,
      totalLandedCostINR: totalFobLCY + totalOverhead,
      items: allocatedItems
    };
  }, [
    selectedShipment,
    dutyPercent,
    cessPercent,
    gstPercent,
    includeGST,
    seaFreight,
    roadFreight,
    localTransport,
    linerCharges,
    insuranceCost,
    handlingCharges,
    packingCharges,
    agingCharges
  ]);

  // Handle Generate & Post Batches
  const handlePostBatches = () => {
    if (!selectedShipment || !calculations) return;

    // Save Landed costs to shipment
    dispatch(addLandedCosts({
      id: selectedShipment.id,
      customsDuty: calculations.totalCustomsDuty,
      freightCharges: (Number(seaFreight) || 0) + (Number(roadFreight) || 0),
      handlingCharges: (Number(localTransport) || 0) + (Number(linerCharges) || 0),
      insuranceCost: Number(insuranceCost) || 0,
      dutyPercent: Number(dutyPercent),
      cessPercent: Number(cessPercent),
      gstPercent: Number(gstPercent),
      includeGST: includeGST,
      seaFreight: Number(seaFreight),
      roadFreight: Number(roadFreight),
      localTransport: Number(localTransport),
      linerCharges: Number(linerCharges),
      additionalHandlingCharges: Number(handlingCharges),
      packingCharges: Number(packingCharges),
      agingCharges: Number(agingCharges)
    }));

    // Create Batches
    const newBatches = calculations.items.map((item, idx) => {
      const nextBatchNo = `B2026-${String(batches.length + idx + 1).padStart(3, '0')}`;
      
      // Default selling price is set at a 25% margin over Landed Unit Cost
      const finalPrice = item.landedUnitCost * 1.25;

      return {
        batchNo: nextBatchNo,
        itemCode: item.itemCode,
        itemName: item.itemName,
        qty: item.qty,
        initialQty: item.qty,
        mfgDate: mfgDate,
        expiryDate: expiryDate,
        landedUnitCost: item.landedUnitCost,
        finalSellingPrice: finalPrice,
        marginPercent: 20.0, // (25% markup equals 20% margin: 1 - cost/price = 1 - 1/1.25 = 20%)
        status: 'Available',
        warehouse: 'Main Warehouse',
        sequence: batches.length + idx + 1,
        poReference: selectedShipment.id || selectedShipment.poNo,
        shipmentRef: selectedShipment.id
      };
    });

    dispatch(addBatches(newBatches));
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
        total_customs_duty: calculations.totalCustomsDuty || 0,
        total_freight: (Number(seaFreight) || 0) + (Number(roadFreight) || 0),
        total_port_charges: (Number(localTransport) || 0) + (Number(linerCharges) || 0) + (Number(handlingCharges) || 0) + (Number(packingCharges) || 0) + (Number(agingCharges) || 0),
        total_overhead: calculations.totalOverhead || 0,
        total_landed_cost: (calculations.totalOverhead || 0) + (calculations.totalFobLCY || 0),
        details: calculations.items.map(item => ({
          item_id: item.itemCode || item.id,
          qty: item.qty,
          fob_val_lcy: item.fobValLCY,
          allocated_overhead: item.allocatedOverhead || 0,
          total_landed_cost: item.totalLandedCost || 0,
          landed_unit_cost: item.landedUnitCost || 0
        }))
      };
      
      // Set is_posted to 1 when posting and generating batches
      payload.is_posted = 1;

      fetch(`${API_BASE_URL}/landed-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json()).then(res => {
        
        const dbBatches = newBatches.map(b => ({
          batch_no: b.batchNo,
          item_id: b.itemCode,
          current_qty: b.qty,
          mfg_date: b.mfgDate,
          expiry_date: b.expiryDate,
          landed_unit_cost: b.landedUnitCost,
          final_selling_price: b.finalSellingPrice,
          margin_percent: b.marginPercent,
          status: b.status,
          source_type: 'Import Purchase',
          po_reference: null,
          grn_reference: null,
          IPO_reference: b.poReference
        }));

        return fetch('http://127.0.0.1:8000/api/purchase/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbBatches)
        });
      }).then(r => r.json()).then(bRes => {
        setIsPosted(true);
        alert(`Success! Saved landed cost allocations to DB and generated ${newBatches.length} batch(es) to Main Warehouse stock registry.`);
      }).catch(err => {
        console.error('Failed to save to db:', err);
        alert('Failed to save landed cost to database');
      });
    } else {
      setSelectedShipmentId('');
    }
  };

  // Export spreadsheet of worksheet
  const handleExportExcel = () => {
    if (!calculations || !selectedShipment) return;
    const formatted = calculations.items.map(it => ({
      'Item Code': it.itemCode,
      'Item Name': it.itemName,
      'Qty': it.qty,
      'FCY Unit FOB': it.fcyUnitPrice,
      'Total FOB (₹)': it.fobValLCY,
      'Allocated Overhead (₹)': it.allocatedOverhead,
      'Total Landed Cost (₹)': it.totalLandedCost,
      'Landed Unit Cost (₹)': it.landedUnitCost
    }));
    exportToExcel(formatted, `Landed_Cost_Allocation_${selectedShipment.id}`, 'Worksheet');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Landed Cost Calculation
          </Typography>
        </Box>
        {selectedShipment && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleExportExcel}
              startIcon={<FileSpreadsheet size={18} />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Export excel
            </Button>
            {selectedShipment && (
              <Box>
                {isPosted ? (
                  <Button
                    variant="contained"
                    disabled
                    startIcon={<CheckCircle size={18} />}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Already Posted
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setPostModalOpen(true)}
                    startIcon={<CheckCircle size={18} />}
                    sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: BLUE.main }}
                  >
                    Post & Generate Batches
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* SELECT SHIPMENT CARD */}
      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="shipment-select-label">Select Cleared Shipment for Landed Costing</InputLabel>
                <Select
                  labelId="shipment-select-label"
                  value={selectedShipmentId}
                  label="Select Cleared Shipment for Landed Costing"
                  onChange={(e) => setSelectedShipmentId(e.target.value)}
                >
                  <MenuItem value="" disabled>Select Shipment</MenuItem>
                  {importPOs.map(sh => (
                    <MenuItem key={sh.id} value={sh.id}>
                      {sh.id} - Supplier: {sh.supplierName} (Total FOB: {sh.totalFCY} {sh.currency})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {!selectedShipmentId && (
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <HelpCircle size={20} />
                  <Typography variant="body2">
                    Please choose a cleared container from the list to display its dynamic costing worksheets.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {selectedShipment && calculations && (
        <Grid container spacing={3}>
          {/* OVERHEAD EXPENSES FORM */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1, backgroundColor: BLUE.bg }}>
                <Calculator size={18} style={{ color: BLUE.main }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main }}>
                  India Customs & Import Expenses (₹)
                </Typography>
              </Box>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Configure Indian customs duties (BCD + Cess + IGST) and domestic inland transport expenses below.
                </Typography>

                {/* Customs Duties Section */}
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1, backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '13px' }}>
                    Customs Duty & Cess
                  </Typography>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Basic Duty (BCD %)"
                        type="number"
                        value={dutyPercent}
                        onChange={(e) => setDutyPercent(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Cess (%) on BCD"
                        type="number"
                        value={cessPercent}
                        onChange={(e) => setCessPercent(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="IGST / GST (%)"
                        type="number"
                        value={gstPercent}
                        onChange={(e) => setGstPercent(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={includeGST}
                            onChange={(e) => setIncludeGST(e.target.checked)}
                            disabled={isPosted}
                          />
                        }
                        label={<span style={{ fontSize: '11px' }}>Add GST to Landed Cost (Non-Creditable)</span>}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#f8fafc', borderRadius: 1, fontSize: '11px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                      <span>Basic Customs Duty :</span>
                      <strong>₹{calculations.calculatedBCD?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                      <span>Social Welfare Cess :</span>
                      <strong>₹{calculations.calculatedCess?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div> 
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span>IGST (GST Amount) :</span>
                      <span style={{ color: includeGST ? 'inherit' : '#94a3b8' }}>
                        ₹{calculations.calculatedGST?.toLocaleString(undefined, { maximumFractionDigits: 0 })} {!includeGST && '(ITC Claimed)'}
                      </span>
                    </div>
                  </Box>
                </Box>

                {/* Freight Section */}
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1, backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '13px' }}>
                    Freight & Transportation
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Sea Freight (₹)"
                        type="number"
                        value={seaFreight}
                        onChange={(e) => setSeaFreight(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Road Freight (₹)"
                        type="number"
                        value={roadFreight}
                        onChange={(e) => setRoadFreight(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Local Transport / Cartage (₹)"
                        type="number"
                        value={localTransport}
                        onChange={(e) => setLocalTransport(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Port & Liner Charges */}
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1, backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '13px' }}>
                    Port & Other Charges
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6} md>
                      <TextField
                        fullWidth
                        size="small"
                        label="Liner Charges (₹)"
                        type="number"
                        value={linerCharges}
                        onChange={(e) => setLinerCharges(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md>
                      <TextField
                        fullWidth
                        size="small"
                        label="Insurance (₹)"
                        type="number"
                        value={insuranceCost}
                        onChange={(e) => setInsuranceCost(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} md>
                      <TextField
                        fullWidth
                        size="small"
                        label="Handling Charges (₹)"
                        type="number"
                        value={handlingCharges}
                        onChange={(e) => setHandlingCharges(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} md>
                      <TextField
                        fullWidth
                        size="small"
                        label="Packing Charges (₹)"
                        type="number"
                        value={packingCharges}
                        onChange={(e) => setPackingCharges(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} md>
                      <TextField
                        fullWidth
                        size="small"
                        label="Aging Charges (₹)"
                        type="number"
                        value={agingCharges}
                        onChange={(e) => setAgingCharges(e.target.value)}
                        disabled={isPosted}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, px: 0.5 }}>
                  <Typography variant="body2">Total Overhead Expenses:</Typography>
                  <Typography variant="body2" color="primary.main">₹{calculations.totalOverhead?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* DYNAMIC COST ALLOCATION WORKSHEET */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Landed Cost Allocation Worksheet (₹)
                </Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ overflowX: 'auto' }}>
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Item Details</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Value (₹)</th>
                        <th className="text-right">Allocated Overhead</th>
                        <th className="text-right">Total Landed Cost</th>
                        <th className="text-right">Landed Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculations.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.itemName}</Typography>
                            <Typography variant="caption" color="text.secondary">{it.itemCode}</Typography>
                          </td>
                          <td className="text-right">{it.qty}</td>
                          <td className="text-right">{it.fcyUnitPrice?.toFixed(2)} {selectedShipment.currency}</td>
                          <td className="text-right">{it.fobValLCY?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="text-right" style={{ color: AMBER.main, fontWeight: 500 }}>
                            {it.allocatedOverhead?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="bold-cell text-right">
                            {it.totalLandedCost?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="bold-cell text-right" style={{ color: BLUE.main }}>
                            {it.landedUnitCost?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
                
                {/* Costing Summary Footprint */}
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
                  <Box sx={{ width: '360px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <Typography color="text.secondary">Total Goods Value:</Typography>
                      <Typography sx={{ fontWeight: 600 }}>₹{calculations.totalFobLCY?.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <Typography color="text.secondary">Total Customs & Freight Overheads:</Typography>
                      <Typography sx={{ fontWeight: 600, color: AMBER.main }}>+ ₹{calculations.totalOverhead?.toLocaleString()}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800 }}>
                      <Typography>Capital Landed Investment:</Typography>
                      <Typography color="primary.main">₹{calculations.totalLandedCostINR?.toLocaleString()}</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* POST BATCHES DIALOG */}
      <Dialog open={postModalOpen} onClose={() => setPostModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          Post Cleared Items to Warehouse Inventory
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Generating active inventory tracking batches for items clears the shipment from customs worksheet, posting available units to Main Warehouse bins.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Manufacturing Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Batch Expiry Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </Grid>
            </Grid>

            {calculations && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Verification of Batches to Generate:
                </Typography>
                {calculations.items.map((it, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 1, mb: 1, backgroundColor: SLATE.bg }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {it.itemName} ({it.itemCode})
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Qty: <strong>{it.qty}</strong> units | Landed Unit Cost: <strong>₹{it.landedUnitCost?.toFixed(2)}</strong>
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handlePostBatches} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Approve & Post Stocks
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LandedCost;

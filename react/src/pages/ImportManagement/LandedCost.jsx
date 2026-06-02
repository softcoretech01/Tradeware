import React, { useState, useMemo } from 'react';
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

const LandedCost = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const shipments = useSelector(state => state.batchImport.shipments);
  const batches = useSelector(state => state.batchImport.batches);

  // States
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  
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

  // Find selected shipment details
  const selectedShipment = useMemo(() => {
    return shipments.find(s => s.id === selectedShipmentId) || null;
  }, [shipments, selectedShipmentId]);

  // Set default costs when shipment changes
  React.useEffect(() => {
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
  }, [selectedShipment]);

  // Landed Cost Allocations calculation
  const calculations = useMemo(() => {
    if (!selectedShipment) return null;

    const exchangeRate = selectedShipment.exchangeRate;

    // Calculate FOB value for each item in local currency (LCY/INR)
    const itemsWithFobVal = selectedShipment.items.map(item => {
      const fobValLCY = item.qty * item.fcyUnitPrice * exchangeRate;
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
        poReference: selectedShipment.poNo,
        shipmentRef: selectedShipment.id
      };
    });

    dispatch(addBatches(newBatches));
    setPostModalOpen(false);
    alert(`Success! Generated and posted ${newBatches.length} batch(es) to Main Warehouse stock registry with custom allocated unit landed costs.`);
    
    // Clear selection
    setSelectedShipmentId('');
  };

  // Export spreadsheet of worksheet
  const handleExportExcel = () => {
    if (!calculations || !selectedShipment) return;
    const formatted = calculations.items.map(it => ({
      'Item Code': it.itemCode,
      'Item Name': it.itemName,
      'Qty': it.qty,
      'FCY Unit FOB': it.fcyUnitPrice,
      'Total FOB (INR)': it.fobValLCY,
      'Allocated Overhead (INR)': it.allocatedOverhead,
      'Total Landed Cost (INR)': it.totalLandedCost,
      'Landed Unit Cost (INR)': it.landedUnitCost
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
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Allocate duty, freight, handling, and insurance overheads to container items proportionally based on FOB value ratio.
          </Typography>
        </Box>
        {selectedShipment && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={handleExportExcel}
              startIcon={<FileSpreadsheet size={18} />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Export Worksheet
            </Button>
            <Button
              variant="contained"
              onClick={() => setPostModalOpen(true)}
              startIcon={<CheckCircle size={18} />}
              sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: BLUE.main }}
            >
              Post & Generate Batches
            </Button>
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
                  {shipments.filter(s => s.status === 'Customs Clearance' || s.status === 'Cleared').map(sh => (
                    <MenuItem key={sh.id} value={sh.id}>
                      {sh.id} - Container: {sh.containerNo} (PO: {sh.poNo}, Supplier: {sh.supplierName})
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
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1, backgroundColor: BLUE.bg }}>
                <Calculator size={18} style={{ color: BLUE.main }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main }}>
                  India Customs & Import Expenses (INR)
                </Typography>
              </Box>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Configure Indian customs duties (BCD + Cess + IGST) and domestic inland transport expenses below.
                </Typography>

                {/* Customs Duties Section */}
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1.5, backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '13px' }}>
                    1. Customs Duty & Cess
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Basic Duty (BCD %)"
                        type="number"
                        value={dutyPercent}
                        onChange={(e) => setDutyPercent(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Cess (%) on BCD"
                        type="number"
                        value={cessPercent}
                        onChange={(e) => setCessPercent(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="IGST / GST (%)"
                        type="number"
                        value={gstPercent}
                        onChange={(e) => setGstPercent(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ py: 0 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={includeGST}
                            onChange={(e) => setIncludeGST(e.target.checked)}
                          />
                        }
                        label={<span style={{ fontSize: '11px' }}>Add GST to Landed Cost (Non-Creditable)</span>}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#f8fafc', borderRadius: 1, fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span>Basic Customs Duty:</span>
                      <strong>₹{calculations.calculatedBCD?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span>Social Welfare Cess:</span>
                      <strong>₹{calculations.calculatedCess?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>IGST (GST Amount):</span>
                      <span style={{ color: includeGST ? 'inherit' : '#94a3b8' }}>
                        ₹{calculations.calculatedGST?.toLocaleString(undefined, { maximumFractionDigits: 0 })} {!includeGST && '(ITC Claimed)'}
                      </span>
                    </div>
                  </Box>
                </Box>

                {/* Freight Section */}
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1.5, backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '13px' }}>
                    2. Freight & Transportation
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Sea Freight (INR)"
                        type="number"
                        value={seaFreight}
                        onChange={(e) => setSeaFreight(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Road Freight (INR)"
                        type="number"
                        value={roadFreight}
                        onChange={(e) => setRoadFreight(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Local Transport / Cartage (INR)"
                        type="number"
                        value={localTransport}
                        onChange={(e) => setLocalTransport(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Port & Liner Charges */}
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1.5, backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '13px' }}>
                    3. Port & Other Charges
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Liner Charges (INR)"
                        type="number"
                        value={linerCharges}
                        onChange={(e) => setLinerCharges(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Insurance (INR)"
                        type="number"
                        value={insuranceCost}
                        onChange={(e) => setInsuranceCost(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Handling Charges (INR)"
                        type="number"
                        value={handlingCharges}
                        onChange={(e) => setHandlingCharges(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Packing Charges (INR)"
                        type="number"
                        value={packingCharges}
                        onChange={(e) => setPackingCharges(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Aging Charges (INR)"
                        type="number"
                        value={agingCharges}
                        onChange={(e) => setAgingCharges(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, px: 0.5 }}>
                  <Typography variant="body2">Total Overhead Expenses:</Typography>
                  <Typography variant="body2" color="primary.main">₹{calculations.totalOverhead?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* DYNAMIC COST ALLOCATION WORKSHEET */}
          <Grid item xs={12} md={7}>
            <Card variant="outlined">
              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Landed Cost Allocation Worksheet (INR)
                </Typography>
                <Chip
                  label={`PO Rate: USD/INR = ₹${selectedShipment.exchangeRate}`}
                  size="small"
                  style={{ backgroundColor: SLATE.bg, color: SLATE.main, fontWeight: 600 }}
                />
              </Box>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ overflowX: 'auto' }}>
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Item Details</th>
                        <th>Qty</th>
                        <th>FOB Price (FCY)</th>
                        <th>FOB Value (INR)</th>
                        <th>Allocated Overhead</th>
                        <th>Total Landed Cost</th>
                        <th>Landed Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculations.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.itemName}</Typography>
                            <Typography variant="caption" color="text.secondary">{it.itemCode}</Typography>
                          </td>
                          <td>{it.qty}</td>
                          <td>{it.fcyUnitPrice?.toFixed(2)} {selectedShipment.currency}</td>
                          <td>₹{it.fobValLCY?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td style={{ color: AMBER.main, fontWeight: 500 }}>
                            ₹{it.allocatedOverhead?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="bold-cell">
                            ₹{it.totalLandedCost?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="bold-cell" style={{ color: BLUE.main }}>
                            ₹{it.landedUnitCost?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
                
                {/* Costing Summary Footprint */}
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
                  <Box sx={{ width: '360px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <Typography color="text.secondary">Total FOB Goods Value:</Typography>
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
                  <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1, backgroundColor: SLATE.bg }}>
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

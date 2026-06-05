import React, { useState, useMemo, useEffect } from 'react';
import {
  Button, TextField, Card, CardContent, Grid, Typography, Box,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, Select, MenuItem, InputLabel, Paper
} from '@mui/material';
import {
  Calculator, CheckCircle, HelpCircle, FileSpreadsheet
} from 'lucide-react';
import { exportToExcel } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

const GRN_API_URL = 'http://127.0.0.1:8000/api/purchase/grns/dropdown/grns';
const POST_API_URL = 'http://127.0.0.1:8000/api/purchase/local-landed-cost/';

const LandedCostCalculation = () => {
  // Data States
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);

  // States
  const [selectedGrnId, setSelectedGrnId] = useState('');
  
  const [insuranceCost, setInsuranceCost] = useState('0');
  const [handlingCharges, setHandlingCharges] = useState('0');
  const [packingCharges, setPackingCharges] = useState('0');
  const [agingCharges, setAgingCharges] = useState('0');

  // Expiry date setting state for posting batches
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 2 years default
  const [postModalOpen, setPostModalOpen] = useState(false);

  useEffect(() => {
    fetchGRNs();
  }, []);

  const fetchGRNs = async () => {
    try {
      const res = await fetch(GRN_API_URL);
      if(res.ok) {
        const data = await res.json();
        setGrns(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Find selected GRN details
  const selectedGrn = useMemo(() => {
    return grns.find(g => g.grn_id === selectedGrnId) || null;
  }, [grns, selectedGrnId]);

  // Set default costs when GRN changes
  useEffect(() => {
    if (selectedGrn) {
      setInsuranceCost('0');
      setHandlingCharges('0');
      setPackingCharges('0');
      setAgingCharges('0');
    }
  }, [selectedGrn]);

  // Landed Cost Allocations calculation
  const calculations = useMemo(() => {
    if (!selectedGrn) return null;

    const exchangeRate = 1; // Assuming INR base currency

    // Calculate FOB value for each item in local currency (LCY/INR)
    const itemsWithFobVal = selectedGrn.items.map(item => {
      const fcyUnitPrice = Number(item.unit_price) || 0;
      const qty = Number(item.received_qty) || 0;
      const fobValLCY = qty * fcyUnitPrice * exchangeRate;

      return {
        ...item,
        qty,
        fcyUnitPrice,
        fobValLCY
      };
    }).filter(item => item.qty > 0); // Only process items with quantity > 0

    const totalFobLCY = itemsWithFobVal.reduce((acc, item) => acc + item.fobValLCY, 0);

    const insCost = Number(insuranceCost) || 0;

    // Other overheads
    const handCh = Number(handlingCharges) || 0;
    const packCh = Number(packingCharges) || 0;
    const ageCh = Number(agingCharges) || 0;
    const otherOverheads = handCh + packCh + ageCh;

    // Total Overhead = Insurance + Other Overheads
    const totalOverhead = insCost + otherOverheads;

    // Allocate overheads based on FOB value ratio
    const allocatedItems = itemsWithFobVal.map(item => {
      const ratio = totalFobLCY > 0 ? item.fobValLCY / totalFobLCY : 0;
      const allocatedOverhead = ratio * totalOverhead;
      const totalLandedCost = item.fobValLCY + allocatedOverhead;
      const landedUnitCost = item.qty > 0 ? totalLandedCost / item.qty : 0;

      return {
        ...item,
        itemCode: item.item_id, 
        itemName: item.item_name,   
        allocatedOverhead,
        totalLandedCost,
        landedUnitCost
      };
    });

    return {
      totalFobLCY,
      totalOverhead,
      totalLandedCostINR: totalFobLCY + totalOverhead,
      items: allocatedItems
    };
  }, [
    selectedGrn,
    insuranceCost,
    handlingCharges,
    packingCharges,
    agingCharges
  ]);

  // Handle Generate & Post Batches
  const handlePostBatches = async () => {
    if (!selectedGrn || !calculations) return;

    // Create Batches Payload
    const newBatches = calculations.items.map((item, idx) => {
      const nextBatchNo = `B2026-${Math.floor(1000 + Math.random() * 9000)}-${idx}`;
      
      // Default selling price is set at a 25% margin over Landed Unit Cost
      const finalPrice = item.landedUnitCost * 1.25;

      return {
        batch_no: nextBatchNo,
        item_id: item.itemCode,
        current_qty: item.qty,
        mfg_date: mfgDate,
        expiry_date: expiryDate,
        landed_unit_cost: item.landedUnitCost,
        final_selling_price: finalPrice,
        margin_percent: 20.0, // (25% markup equals 20% margin)
        source_type: 'Local Purchase',
        po_reference: selectedGrn.po_number || '', 
        grn_reference: selectedGrn.grn_number
      };
    });

    const payload = {
      grn_id: selectedGrn.grn_id,
      insurance_charges: Number(insuranceCost) || 0,
      handling_charges: Number(handlingCharges) || 0,
      packing_charges: Number(packingCharges) || 0,
      aging_charges: Number(agingCharges) || 0,
      total_lcy: calculations.totalFobLCY,
      total_overhead: calculations.totalOverhead,
      total_landed_cost: calculations.totalLandedCostINR,
      items: calculations.items.map(it => ({
        item_id: it.itemCode,
        qty: it.qty,
        unit_price: it.fcyUnitPrice,
        val_lcy: it.fobValLCY,
        allocated_overhead: it.allocatedOverhead,
        total_landed_cost: it.totalLandedCost,
        landed_unit_cost: it.landedUnitCost
      })),
      batches: newBatches
    };

    try {
      const res = await fetch(POST_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPostModalOpen(false);
        alert(`Success! Generated and posted ${newBatches.length} batch(es) to Inventory Batches with allocated local landed costs.`);
        setSelectedGrnId('');
      } else {
        const err = await res.json();
        alert(`Failed to post: ${err.detail}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error occurred.');
    }
  };

  // Export spreadsheet of worksheet
  const handleExportExcel = () => {
    if (!calculations || !selectedGrn) return;
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
    exportToExcel(formatted, `Landed_Cost_Allocation_${selectedGrn.grn_number}`, 'Worksheet');
  };

  if(loading) return <div style={{padding: 20}}>Loading GRNs...</div>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Local Landed Cost Calculation
          </Typography>
        </Box>
        {selectedGrn && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={handleExportExcel}
              startIcon={<FileSpreadsheet size={18} />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Export excel
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

      {/* SELECT GRN CARD */}
      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="grn-select-label">Select GRN for Landed Costing</InputLabel>
                <Select
                  labelId="grn-select-label"
                  value={selectedGrnId}
                  label="Select GRN for Landed Costing"
                  onChange={(e) => setSelectedGrnId(e.target.value)}
                >
                  <MenuItem value="" disabled>Select GRN</MenuItem>
                  {grns.map(g => (
                    <MenuItem key={g.grn_id} value={g.grn_id}>
                      {g.grn_number} - Supplier: {g.supplier_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {!selectedGrnId && (
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <HelpCircle size={20} />
                  <Typography variant="body2">
                    Please choose a GRN from the list to display its dynamic costing worksheets.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {selectedGrn && calculations && (
        <Grid container spacing={3}>
          {/* OVERHEAD EXPENSES FORM */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1, backgroundColor: BLUE.bg }}>
                <Calculator size={18} style={{ color: BLUE.main }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main }}>
                  Overhead Expenses (₹)
                </Typography>
              </Box>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Configure the relevant charges and expenses below.
                </Typography>

                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1.5, backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '13px' }}>
                    Charges
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Insurance (₹)"
                        type="number"
                        value={insuranceCost}
                        onChange={(e) => setInsuranceCost(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Handling Charges (₹)"
                        type="number"
                        value={handlingCharges}
                        onChange={(e) => setHandlingCharges(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Packing Charges (₹)"
                        type="number"
                        value={packingCharges}
                        onChange={(e) => setPackingCharges(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Aging Charges (₹)"
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
                          <td className="text-right">{it.fcyUnitPrice?.toFixed(2)}</td>
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
                  <Box sx={{ width: '360px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <Typography color="text.secondary">Total Goods Value:</Typography>
                      <Typography sx={{ fontWeight: 600 }}>₹{calculations.totalFobLCY?.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <Typography color="text.secondary">Total Overheads:</Typography>
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
          Post Items to Warehouse Inventory
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Generating active inventory tracking batches for items clears the GRN from customs worksheet, posting available units to Main Warehouse bins.
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

export default LandedCostCalculation;

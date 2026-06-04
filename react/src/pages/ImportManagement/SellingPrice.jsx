import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Chip, Paper, Box, Grid, Typography, Card, CardContent,
  Alert, AlertTitle
} from '@mui/material';
import {
  Search, FileSpreadsheet, FileText, CheckCircle, XCircle, AlertTriangle,
  Lock, Edit, ClipboardCheck, ArrowUpRight, DollarSign, Percent, Info,
  TrendingUp, Users
} from 'lucide-react';
import {
  updateBatchPricing, addMarginApprovalRequest,
  approveMarginRequest, rejectMarginRequest
} from '../../store/batchImportSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const GREEN = { main: '#15803D', light: '#22C55E', bg: '#DCFCE7' };
const RED = { main: '#B91C1C', light: '#EF4444', bg: '#FEE2E2' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

const MIN_MARGIN_THRESHOLD = 15.0; // 15% minimum margin constraint

const SellingPrice = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const batches = useSelector(state => state.batchImport.batches);
  const marginApprovals = useSelector(state => state.batchImport.marginApprovals);
  const customers = useSelector(state => state.customers.customers);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [marginFilter, setMarginFilter] = useState('All'); // All, Low, Normal
  const [costFilter, setCostFilter] = useState('All'); // All, Local landing cost, Import Landing Cost
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [editPriceModalOpen, setEditPriceModalOpen] = useState(false);
  const [approvalRequestModalOpen, setApprovalRequestModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Form Fields
  const [inputPrice, setInputPrice] = useState('');
  const [inputMargin, setInputMargin] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [salesRep, setSalesRep] = useState('Sarah Connor');
  const [remarks, setRemarks] = useState('');

  const inputMarginNumeric = useMemo(() => {
    const m = Number(inputMargin);
    return isNaN(m) ? 0 : m;
  }, [inputMargin]);

  const handlePriceChange = (val) => {
    setInputPrice(val);
    const price = Number(val);
    const cost = selectedBatch?.landedUnitCost || 0;
    if (price > 0 && !isNaN(price)) {
      const margin = ((price - cost) / price) * 100;
      setInputMargin(margin.toFixed(2));
    } else {
      setInputMargin('');
    }
  };

  const handleMarginChange = (val) => {
    setInputMargin(val);
    const margin = Number(val);
    const cost = selectedBatch?.landedUnitCost || 0;
    if (!isNaN(margin) && margin < 100) {
      const price = cost / (1 - margin / 100);
      setInputPrice(price > 0 && isFinite(price) ? price.toFixed(2) : '');
    } else {
      setInputPrice('');
    }
  };

  // Dashboard calculations
  const stats = useMemo(() => {
    let totalBatches = batches.length;
    let lowMarginCount = 0;
    let totalMarginSum = 0;
    let activeApprovals = 0;

    batches.forEach(b => {
      totalMarginSum += b.marginPercent;
      if (b.marginPercent < MIN_MARGIN_THRESHOLD) {
        lowMarginCount++;
      }
    });

    marginApprovals.forEach(req => {
      if (req.status === 'Pending') activeApprovals++;
    });

    return {
      avgMargin: totalBatches ? totalMarginSum / totalBatches : 0,
      lowMarginCount,
      activeApprovals
    };
  }, [batches, marginApprovals]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchSearch =
        b.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isLow = b.marginPercent < MIN_MARGIN_THRESHOLD;
      const matchMargin =
        marginFilter === 'All' ||
        (marginFilter === 'Low' && isLow) ||
        (marginFilter === 'Normal' && !isLow);

      const isLocal = !!b.grnReference;
      const isImport = !isLocal;
      const matchCost =
        costFilter === 'All' ||
        (costFilter === 'Local landing cost' && isLocal) ||
        (costFilter === 'Import Landing Cost' && isImport);

      return matchSearch && matchMargin && matchCost;
    });
  }, [batches, searchTerm, marginFilter, costFilter]);

  // Pagination
  const paginatedBatches = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBatches.slice(startIndex, startIndex + pageSize);
  }, [filteredBatches, currentPage]);

  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1;

  // Handlers
  const handleOpenEditPrice = (batch) => {
    setSelectedBatch(batch);
    setInputPrice(String(batch.finalSellingPrice));
    const cost = batch.landedUnitCost;
    const price = batch.finalSellingPrice;
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    setInputMargin(margin.toFixed(2));
    setEditPriceModalOpen(true);
  };

  const handleSavePriceDirectly = () => {
    if (!selectedBatch || !inputPrice) return;
    const price = Number(inputPrice);
    
    // Save to Redux
    dispatch(updateBatchPricing({
      batchNo: selectedBatch.batchNo,
      finalSellingPrice: price,
      marginPercent: inputMarginNumeric
    }));
    
    setEditPriceModalOpen(false);
    setSelectedBatch(null);
  };

  const handleOpenApprovalDialog = () => {
    setEditPriceModalOpen(false);
    setSelectedCustomerId('');
    setRemarks('');
    setApprovalRequestModalOpen(true);
  };

  const handleSaveApprovalRequest = () => {
    if (!selectedBatch || !inputPrice) return;
    if (!selectedCustomerId) {
      alert('Please select a customer for this negotiated request.');
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId);
    const customerName = customerObj ? customerObj.name : 'Unknown Customer';

    const reqPayload = {
      id: `LMA-2026-${String(marginApprovals.length + 1).padStart(3, '0')}`,
      batchNo: selectedBatch.batchNo,
      itemCode: selectedBatch.itemCode,
      itemName: selectedBatch.itemName,
      requestedPrice: Number(inputPrice),
      costPrice: selectedBatch.landedUnitCost,
      marginPercent: inputMarginNumeric,
      customerName,
      salesRepresentative: salesRep,
      status: 'Pending',
      remarks
    };

    dispatch(addMarginApprovalRequest(reqPayload));
    setApprovalRequestModalOpen(false);
    setSelectedBatch(null);
    alert('Margin approval request successfully submitted to pricing managers.');
  };

  // Manager approval actions
  const handleApproveRequest = (id) => {
    dispatch(approveMarginRequest({ id }));
    alert('Request Approved. Selling price has been finalized in batch logs.');
  };

  const handleRejectRequest = (id) => {
    dispatch(rejectMarginRequest({ id }));
    alert('Request Rejected.');
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredBatches.map(b => ({
      'Batch No': b.batchNo,
      'Item Code': b.itemCode,
      'Item Name': b.itemName,
      'Landed Unit Cost (INR)': b.landedUnitCost,
      'Final Selling Price (INR)': b.finalSellingPrice,
      'Margin Percent (%)': b.marginPercent,
      'Status': b.marginPercent < MIN_MARGIN_THRESHOLD ? 'LOW MARGIN' : 'OK'
    }));
    exportToExcel(data, `Selling_Prices_${new Date().toISOString().split('T')[0]}`, 'Price Sheet');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'batchNo', headerName: 'Batch No' },
      { field: 'itemCode', headerName: 'Item Code' },
      { field: 'itemName', headerName: 'Item Name' },
      { field: 'landedUnitCost', headerName: 'Landed Cost' },
      { field: 'finalSellingPrice', headerName: 'Selling Price' },
      { field: 'marginPercent', headerName: 'Margin %' }
    ];
    exportToPDF(cols, filteredBatches, `Selling_Prices_${new Date().toISOString().split('T')[0]}`, 'Selling Price Finalization List');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Selling Price Finalization
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            startIcon={<FileSpreadsheet size={16} />} 
            onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#E8F5E9' }, borderRadius: 2 }}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* FILTER PANEL */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search By"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-selects" style={{ display: 'flex', gap: '10px' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={costFilter}
              onChange={(e) => { setCostFilter(e.target.value); setCurrentPage(1); }}
              displayEmpty
            >
              <MenuItem value="All">All Costs</MenuItem>
              <MenuItem value="Local landing cost">Local Landing Cost</MenuItem>
              <MenuItem value="Import Landing Cost">Import Landing Cost</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={marginFilter}
              onChange={(e) => { setMarginFilter(e.target.value); setCurrentPage(1); }}
              displayEmpty
            >
              <MenuItem value="All">All Margin Ranges</MenuItem>
              <MenuItem value="Low">Low Margin (&lt;15%)</MenuItem>
              <MenuItem value="Normal">Healthy Margin (&ge;15%)</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {/* BATCH PRICING BOARD */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Batch No</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th style={{ textAlign: 'right' }}>Landed Cost (₹)</th>
              <th style={{ textAlign: 'right' }}>Final Selling Price (₹)</th>
              <th style={{ textAlign: 'right' }}>Gross Margin (%)</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBatches.length > 0 ? (
              paginatedBatches.map(b => {
                const isLow = b.marginPercent < MIN_MARGIN_THRESHOLD;
                return (
                  <tr key={b.batchNo} style={{ backgroundColor: isLow ? 'rgba(239, 68, 68, 0.01)' : 'inherit' }}>
                    <td className="bold-cell ">{b.batchNo}</td>
                    <td >{b.itemCode}</td>
                    <td >{b.itemName}</td>
                    <td style={{ textAlign: 'right' }}>
                      {b.landedUnitCost?.toFixed(2)}
                      {b.grnReference && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '10px' }}>
                          Local
                        </Typography>
                      )}
                    </td>
                    <td className="bold-cell" style={{ textAlign: 'right' }}>{b.finalSellingPrice?.toFixed(2)}</td>
                    <td className="bold-cell" style={{ color: isLow ? RED.main : GREEN.main, textAlign: 'right' }}>
                      {b.marginPercent?.toFixed(1)}%
                    </td>
                    <td className="actions-cell">
                      <Tooltip title="Update Selling Price">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenEditPrice(b)}
                          sx={{ p: 1 }}
                        >
                          <Edit size={20} />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="table-empty">
                  No inventory batch pricing logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Showing Page {currentPage} of {totalPages} ({filteredBatches.length} total items)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              sx={{ textTransform: 'none' }}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}
      {/* UPDATE PRICE MODAL */}
      <Dialog open={editPriceModalOpen} onClose={() => setEditPriceModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="dialog-title">
          Modify Selling Price ({selectedBatch?.batchNo})
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Update the final unit selling price. Direct updates require maintaining a minimum gross margin of <strong>{MIN_MARGIN_THRESHOLD}%</strong>.
            </Typography>

            <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: SLATE.bg }}>
              <Typography variant="caption" color="text.secondary">Landed Cost Price (INR):</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: BLUE.dark }}>
                ₹{selectedBatch?.landedUnitCost?.toFixed(2)}
              </Typography>
            </Paper>

            <TextField
              fullWidth
              label="New Unit Selling Price (INR) - Manual"
              type="number"
              value={inputPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="Enter manual price"
            />

            <TextField
              fullWidth
              label="Target Gross Margin Percentage (%)"
              type="number"
              value={inputMargin}
              onChange={(e) => handleMarginChange(e.target.value)}
              placeholder="Enter margin %"
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Current Margin Status:</Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 800,
                  color: inputMarginNumeric < MIN_MARGIN_THRESHOLD ? RED.main : GREEN.main
                }}
              >
                {inputMarginNumeric.toFixed(2)}%
              </Typography>
            </Box>

            {inputMarginNumeric < MIN_MARGIN_THRESHOLD && (
              <Alert severity="warning" icon={<AlertTriangle size={18} />} sx={{ py: 0.5 }}>
                <AlertTitle sx={{ fontSize: '13px', fontWeight: 700 }}>Margin Violation</AlertTitle>
                Margin falls below the 15% minimum threshold. Direct saving is blocked. You must request authorization.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditPriceModalOpen(false)} color="inherit">
            Cancel
          </Button>
          {inputMarginNumeric < MIN_MARGIN_THRESHOLD ? (
            <Button
              onClick={handleOpenApprovalDialog}
              variant="contained"
              color="warning"
              startIcon={<Lock size={16} />}
              sx={{ fontWeight: 600 }}
            >
              Request Approval
            </Button>
          ) : (
            <Button
              onClick={handleSavePriceDirectly}
              variant="contained"
              sx={{ backgroundColor: BLUE.main, fontWeight: 600 }}
            >
              Update Price
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* APPROVAL REQUEST FORM MODAL */}
      <Dialog open={approvalRequestModalOpen} onClose={() => setApprovalRequestModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          Submit Low-Margin Sales Authorization Request
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              A sales representative request will be submitted to the authorization pipeline. Please select the target customer.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: SLATE.bg }}>
                  <Typography variant="caption" color="text.secondary">Landed Cost:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{selectedBatch?.landedUnitCost?.toFixed(2)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: SLATE.bg }}>
                  <Typography variant="caption" color="text.secondary">Requested Price (Margin):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: RED.main }}>
                    ₹{Number(inputPrice)?.toFixed(2)} ({inputMarginNumeric.toFixed(1)}%)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel id="cust-select-label">Target Negotiated Customer</InputLabel>
              <Select
                labelId="cust-select-label"
                value={selectedCustomerId}
                label="Target Negotiated Customer"
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                {customers.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Sales Representative Name"
              value={salesRep}
              onChange={(e) => setSalesRep(e.target.value)}
            />

            <TextField
              fullWidth
              label="Sales / Negotiations Justification Remarks"
              multiline
              rows={3}
              placeholder="Provide a commercial reason for the lower margin (e.g. bulk order clearance, competitive bidding)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalRequestModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveApprovalRequest} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellingPrice;

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
  Lock, Edit3, ClipboardCheck, ArrowUpRight, DollarSign, Percent, Info,
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

      return matchSearch && matchMargin;
    });
  }, [batches, searchTerm, marginFilter]);

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

  // Negotiated Contracts Registry Mock Data
  const negotiatedContracts = [
    { customer: 'ACE FIRE ENGINEERING PTE LTD', item: 'Aluminium Profile AS-100', price: '₹520.00', margin: '19.6%', validity: '2026-12-31', status: 'Active' },
    { customer: 'AIR LIQUIDE SINGAPORE PTE LTD', item: 'EPDM Rubber Gasket', price: '₹48.00', margin: '6.25%', validity: '2026-08-30', status: 'Approved' }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Selling Price Finalization
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Validate gross profit margins, initiate low-margin workflow requests, and review customer pricing contracts.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={handleExportExcel}
            startIcon={<FileSpreadsheet size={18} />}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: BLUE.light, color: BLUE.light }}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportPDF}
            startIcon={<FileText size={18} />}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: BLUE.light, color: BLUE.light }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* PRICE SUMMARY CARDS */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: GREEN.bg }}>
                <TrendingUp size={24} style={{ color: GREEN.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Avg. Inventory Margin</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.avgMargin?.toFixed(1)}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderColor: stats.lowMarginCount > 0 ? RED.light : 'inherit' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: stats.lowMarginCount > 0 ? RED.bg : SLATE.bg }}>
                <Percent size={24} style={{ color: stats.lowMarginCount > 0 ? RED.main : SLATE.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Low Margin Batches (&lt;15%)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: stats.lowMarginCount > 0 ? RED.main : 'inherit' }}>
                  {stats.lowMarginCount} Batches
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderColor: stats.activeApprovals > 0 ? AMBER.light : 'inherit' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: stats.activeApprovals > 0 ? AMBER.bg : SLATE.bg }}>
                <Lock size={24} style={{ color: stats.activeApprovals > 0 ? AMBER.main : SLATE.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Pending Margin Approvals</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: stats.activeApprovals > 0 ? AMBER.main : 'inherit' }}>
                  {stats.activeApprovals} Requests
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTER PANEL */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by batch number or item name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-selects">
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
              <th>Landed Cost (INR)</th>
              <th>Final Selling Price</th>
              <th>Gross Margin (%)</th>
              <th>Margin Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBatches.length > 0 ? (
              paginatedBatches.map(b => {
                const isLow = b.marginPercent < MIN_MARGIN_THRESHOLD;
                return (
                  <tr key={b.batchNo} style={{ backgroundColor: isLow ? 'rgba(239, 68, 68, 0.01)' : 'inherit' }}>
                    <td className="bold-cell">{b.batchNo}</td>
                    <td>{b.itemCode}</td>
                    <td>{b.itemName}</td>
                    <td>₹{b.landedUnitCost?.toFixed(2)}</td>
                    <td className="bold-cell">₹{b.finalSellingPrice?.toFixed(2)}</td>
                    <td className="bold-cell" style={{ color: isLow ? RED.main : GREEN.main }}>
                      {b.marginPercent?.toFixed(1)}%
                    </td>
                    <td>
                      {isLow ? (
                        <Chip label="LOW MARGIN" size="small" style={{ backgroundColor: RED.bg, color: RED.main, fontWeight: 700 }} />
                      ) : (
                        <Chip label="OK" size="small" style={{ backgroundColor: GREEN.bg, color: GREEN.main, fontWeight: 700 }} />
                      )}
                    </td>
                    <td className="actions-cell">
                      <Tooltip title="Update Selling Price">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenEditPrice(b)}
                          sx={{ p: 1 }}
                        >
                          <Edit3 size={22} />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="table-empty">
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

      {/* LOWER GRID: MANAGER APPROVAL INBOX & NEGOTIATED CONTRACTS */}
      <Grid container spacing={3}>
        
        {/* MANAGER APPROVAL INBOX */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1, backgroundColor: BLUE.bg }}>
              <ClipboardCheck size={18} style={{ color: BLUE.main }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main }}>
                Manager Low-Margin Approval Inbox (Authorization Pipeline)
              </Typography>
            </Box>
            <CardContent sx={{ p: 0, height: '300px', overflowY: 'auto' }}>
              {marginApprovals.length > 0 ? (
                <table className="erp-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Details</th>
                      <th>Requested Price</th>
                      <th>Margin %</th>
                      <th>Customer Target</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marginApprovals.map(req => (
                      <tr key={req.id}>
                        <td>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{req.batchNo}</Typography>
                          <Typography variant="caption" color="text.secondary">{req.itemName}</Typography>
                        </td>
                        <td className="bold-cell">₹{req.requestedPrice?.toFixed(2)}</td>
                        <td className="bold-cell" style={{ color: RED.main }}>{req.marginPercent?.toFixed(1)}%</td>
                        <td>{req.customerName}</td>
                        <td>
                          <Chip
                            label={req.status}
                            size="small"
                            style={{
                              backgroundColor:
                                req.status === 'Approved' ? GREEN.bg :
                                req.status === 'Rejected' ? RED.bg : AMBER.bg,
                              color:
                                req.status === 'Approved' ? GREEN.main :
                                req.status === 'Rejected' ? RED.main : AMBER.main,
                              fontWeight: 600
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {req.status === 'Pending' ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Tooltip title="Approve Request">
                                <IconButton
                                  className="btn-icon-success"
                                  onClick={() => handleApproveRequest(req.id)}
                                  size="small"
                                >
                                  <CheckCircle size={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject Request">
                                <IconButton
                                  className="btn-icon-danger"
                                  onClick={() => handleRejectRequest(req.id)}
                                  size="small"
                                >
                                  <XCircle size={18} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No authorization requests are currently pending in queue.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* CUSTOMER NEGOTIATED CONTRACTS REGISTRY */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Users size={18} style={{ color: BLUE.main }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Customer-Specific Negotiated Contracts
              </Typography>
            </Box>
            <CardContent sx={{ height: '300px', overflowY: 'auto', p: 2 }}>
              {negotiatedContracts.map((contract, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1.5, backgroundColor: SLATE.bg }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: BLUE.dark }}>
                      {contract.customer}
                    </Typography>
                    <Chip label={contract.status} size="small" color="primary" sx={{ height: 20, fontSize: '10px' }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Item: {contract.item}
                  </Typography>
                  <Grid container sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Contract Price</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: BLUE.main }}>{contract.price}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Gross Margin</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: RED.main }}>{contract.margin}</Typography>
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Valid until: {contract.validity}
                  </Typography>
                </Paper>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

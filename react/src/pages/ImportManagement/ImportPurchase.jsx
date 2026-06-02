import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Tooltip, Chip, Paper, Box, Grid, Typography, Card, CardContent,
  TableContainer
} from '@mui/material';
import {
  Search, Plus, Eye, FileSpreadsheet, FileText, Globe, DollarSign,
  PlusCircle, Trash2, ArrowRight
} from 'lucide-react';
import { addImportPO } from '../../store/batchImportSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const GREEN = { main: '#15803D', light: '#22C55E', bg: '#DCFCE7' };
const RED = { main: '#B91C1C', light: '#EF4444', bg: '#FEE2E2' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

// Default exchange rates relative to INR
const DEFAULT_RATES = {
  USD: 83.5,
  EUR: 90.2,
  SGD: 62.0,
  GBP: 105.8,
  JPY: 0.55
};

const ImportPurchase = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const importPOs = useSelector(state => state.batchImport.importPOs);
  const suppliers = useSelector(state => state.suppliers.suppliers);
  const items = useSelector(state => state.items.items);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Form Fields
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formExchangeRate, setFormExchangeRate] = useState(83.5);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formItems, setFormItems] = useState([
    { itemCode: '', itemName: '', qty: 1, fcyUnitPrice: 0 }
  ]);
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 30');

  // Update default rate when currency changes
  const handleCurrencyChange = (currency) => {
    setFormCurrency(currency);
    setFormExchangeRate(DEFAULT_RATES[currency] || 83.5);
  };

  const handleSupplierChange = (supId) => {
    setFormSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      if (sup.paymentTerms) {
        setFormPaymentTerms(sup.paymentTerms);
      }
      if (sup.currency) {
        handleCurrencyChange(sup.currency);
      }
    }
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    let totalImportCostINR = 0;
    let activeOrdersCount = 0;
    
    importPOs.forEach(po => {
      totalImportCostINR += po.totalLCY;
      if (po.status === 'Ordered' || po.status === 'Shipped') {
        activeOrdersCount++;
      }
    });

    return {
      totalImportCostINR,
      activeOrdersCount,
      totalOrders: importPOs.length
    };
  }, [importPOs]);

  // Filtered lists
  const filteredPOs = useMemo(() => {
    return importPOs.filter(po => {
      const matchSearch =
        po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.currency.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'All' || po.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [importPOs, searchTerm, statusFilter]);

  // Pagination
  const paginatedPOs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPOs.slice(startIndex, startIndex + pageSize);
  }, [filteredPOs, currentPage]);

  const totalPages = Math.ceil(filteredPOs.length / pageSize) || 1;

  // Form handlers
  const handleAddRow = () => {
    setFormItems(prev => [...prev, { itemCode: '', itemName: '', qty: 1, fcyUnitPrice: 0 }]);
  };

  const handleRemoveRow = (idx) => {
    setFormItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRowChange = (idx, field, val) => {
    const newItems = [...formItems];
    if (field === 'itemCode') {
      const selectedItem = items.find(i => i.id === val);
      newItems[idx].itemCode = val;
      newItems[idx].itemName = selectedItem ? selectedItem.name : '';
    } else {
      newItems[idx][field] = val;
    }
    setFormItems(newItems);
  };

  const handleSavePO = () => {
    // Basic validation
    if (!formSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    const invalidItems = formItems.some(i => !i.itemCode || i.qty <= 0 || i.fcyUnitPrice <= 0);
    if (invalidItems) {
      alert('Please fill out all line items with valid quantities and prices.');
      return;
    }

    const supplierObj = suppliers.find(s => s.id === formSupplierId);
    const supplierName = supplierObj ? supplierObj.name : 'Unknown Supplier';

    // Calculate totals
    const totalFCY = formItems.reduce((acc, i) => acc + (Number(i.qty) * Number(i.fcyUnitPrice)), 0);
    const totalLCY = totalFCY * Number(formExchangeRate);

    const newPO = {
      id: `IPO-2026-${String(importPOs.length + 1).padStart(3, '0')}`,
      date: formDate,
      supplierName,
      currency: formCurrency,
      exchangeRate: Number(formExchangeRate),
      items: formItems.map(i => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        qty: Number(i.qty),
        fcyUnitPrice: Number(i.fcyUnitPrice)
      })),
      totalFCY,
      totalLCY,
      status: 'Ordered',
      paymentTerms: formPaymentTerms
    };

    dispatch(addImportPO(newPO));
    setCreateModalOpen(false);

    // Reset Form
    setFormSupplierId('');
    setFormCurrency('USD');
    setFormExchangeRate(83.5);
    setFormItems([{ itemCode: '', itemName: '', qty: 1, fcyUnitPrice: 0 }]);
    setFormPaymentTerms('Net 30');
  };

  const handleOpenDetails = (po) => {
    setSelectedPO(po);
    setDetailsModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <Chip label="Draft" size="small" style={{ backgroundColor: SLATE.bg, color: SLATE.main }} />;
      case 'Ordered':
        return <Chip label="Ordered" size="small" style={{ backgroundColor: BLUE.bg, color: BLUE.light, fontWeight: 600 }} />;
      case 'Shipped':
        return <Chip label="Shipped" size="small" style={{ backgroundColor: AMBER.bg, color: AMBER.main, fontWeight: 600 }} />;
      case 'Cleared':
        return <Chip label="Cleared" size="small" style={{ backgroundColor: GREEN.bg, color: GREEN.main, fontWeight: 600 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredPOs.map(po => ({
      'PO ID': po.id,
      'Date': po.date,
      'Supplier': po.supplierName,
      'Currency': po.currency,
      'Exchange Rate': po.exchangeRate,
      'Total FCY': po.totalFCY,
      'Total LCY (INR)': po.totalLCY,
      'Status': po.status
    }));
    exportToExcel(data, `Import_Purchase_Orders_${new Date().toISOString().split('T')[0]}`, 'Import POs');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'PO ID' },
      { field: 'date', headerName: 'Date' },
      { field: 'supplierName', headerName: 'Supplier' },
      { field: 'currency', headerName: 'Currency' },
      { field: 'exchangeRate', headerName: 'Rate' },
      { field: 'totalFCY', headerName: 'Total FCY' },
      { field: 'totalLCY', headerName: 'Total INR' },
      { field: 'status', headerName: 'Status' }
    ];
    exportToPDF(cols, filteredPOs, `Import_Purchase_Orders_${new Date().toISOString().split('T')[0]}`, 'Import Purchase Orders List');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Import Purchase Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Create and track purchasing orders for international suppliers in multiple global currencies.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={() => setCreateModalOpen(true)}
            startIcon={<Plus size={18} />}
            sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: BLUE.main }}
          >
            New Import PO
          </Button>
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

      {/* DASHBOARD SUMMARY CARDS */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: BLUE.bg }}>
                <DollarSign size={24} style={{ color: BLUE.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Import Cost (LCY)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>₹{stats.totalImportCostINR.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: AMBER.bg }}>
                <Globe size={24} style={{ color: AMBER.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Active Import POs</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.activeOrdersCount} POs</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: GREEN.bg }}>
                <Globe size={24} style={{ color: GREEN.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total PO Transactions</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.totalOrders} Orders</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTERS PANEL */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by PO number, currency, or supplier..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-selects">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              displayEmpty
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Ordered">Ordered</MenuItem>
              <MenuItem value="Shipped">Shipped</MenuItem>
              <MenuItem value="Cleared">Cleared</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {/* IMPORT PO LIST GRID */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Order Date</th>
              <th>Supplier Name</th>
              <th>Currency</th>
              <th>Exchange Rate</th>
              <th>Foreign Value</th>
              <th>Local Value (INR)</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPOs.length > 0 ? (
              paginatedPOs.map(po => (
                <tr key={po.id}>
                  <td className="bold-cell">{po.id}</td>
                  <td>{po.date}</td>
                  <td className="bold-cell">{po.supplierName}</td>
                  <td>{po.currency}</td>
                  <td>{po.exchangeRate?.toFixed(2)}</td>
                  <td className="bold-cell">{po.totalFCY?.toLocaleString()} {po.currency}</td>
                  <td>₹{po.totalLCY?.toLocaleString()}</td>
                  <td>{getStatusBadge(po.status)}</td>
                  <td className="actions-cell">
                    <Tooltip title="View Order Details">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDetails(po)}
                        sx={{ p: 1 }}
                      >
                        <Eye size={22} />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="table-empty">
                  No import purchase orders found.
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
            Showing Page {currentPage} of {totalPages} ({filteredPOs.length} total items)
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

      {/* CREATE IMPORT PO DIALOG */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          Create New Import Purchase Order
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel id="supplier-select-label">Overseas Supplier</InputLabel>
                  <Select
                    labelId="supplier-select-label"
                    value={formSupplierId}
                    label="Overseas Supplier"
                    onChange={(e) => handleSupplierChange(e.target.value)}
                  >
                    {suppliers.filter(s => s.type !== 'Local suppliers').map(s => (
                      <MenuItem key={s.id} value={s.id}>{s.name} ({s.currency})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth>
                  <InputLabel id="currency-select-label">FCY Currency</InputLabel>
                  <Select
                    labelId="currency-select-label"
                    value={formCurrency}
                    label="FCY Currency"
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="SGD">SGD (S$)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="JPY">JPY (¥)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Exchange Rate (to INR)"
                  type="number"
                  value={formExchangeRate}
                  onChange={(e) => setFormExchangeRate(e.target.value)}
                  inputProps={{ step: '0.01' }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel id="payment-terms-label">Payment Terms</InputLabel>
                  <Select
                    labelId="payment-terms-label"
                    value={formPaymentTerms}
                    label="Payment Terms"
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                  >
                    <MenuItem value="COD">COD (Cash on Delivery)</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Net 15">Net 15 Days</MenuItem>
                    <MenuItem value="Net 30">Net 30 Days</MenuItem>
                    <MenuItem value="Net 60">Net 60 Days</MenuItem>
                    <MenuItem value="Net 90">Net 90 Days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="PO Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Line Items Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  PO Line Items (Foreign Cost Basis)
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAddRow}
                  startIcon={<PlusCircle size={14} />}
                  sx={{ textTransform: 'none', color: BLUE.light, borderColor: BLUE.light }}
                >
                  Add Row
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ backgroundColor: SLATE.bg }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: '40%' }}>Item Description</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '20%' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '20%' }}>FCY Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '20%', textAlign: 'right' }}>Total (FCY)</TableCell>
                      <TableCell sx={{ width: '50px' }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formItems.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select
                            fullWidth
                            value={row.itemCode}
                            onChange={(e) => handleRowChange(idx, 'itemCode', e.target.value)}
                            size="small"
                            displayEmpty
                          >
                            <MenuItem value="" disabled>Select Item</MenuItem>
                            {items.map(item => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.name} ({item.id})
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={row.qty}
                            onChange={(e) => handleRowChange(idx, 'qty', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={row.fcyUnitPrice}
                            onChange={(e) => handleRowChange(idx, 'fcyUnitPrice', e.target.value)}
                            inputProps={{ step: '0.01' }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>
                          {(Number(row.qty || 0) * Number(row.fcyUnitPrice || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="error"
                            disabled={formItems.length === 1}
                            onClick={() => handleRemoveRow(idx)}
                            size="small"
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Calculations Summary Panel */}
            <Box sx={{ ml: 'auto', width: '320px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <Typography color="text.secondary">Total Foreign Cost:</Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {formItems.reduce((acc, i) => acc + (Number(i.qty || 0) * Number(i.fcyUnitPrice || 0)), 0).toFixed(2)} {formCurrency}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid #e2e8f0', pt: 1 }}>
                <Typography color="text.secondary">Exchange Conversion (INR):</Typography>
                <Typography sx={{ fontWeight: 700, color: BLUE.main }}>
                  ₹{(formItems.reduce((acc, i) => acc + (Number(i.qty || 0) * Number(i.fcyUnitPrice || 0)), 0) * Number(formExchangeRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Box>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSavePO} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* PO DETAILS VIEW DIALOG */}
      <Dialog open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Import PO Specifications: {selectedPO?.id}</span>
          {selectedPO && getStatusBadge(selectedPO.status)}
        </DialogTitle>
        <DialogContent dividers>
          {selectedPO && (
            <div className="view-detail-body">
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} md={2.4}>
                  <div className="view-detail-row">
                    <strong>Supplier:</strong>
                    <span>{selectedPO.supplierName}</span>
                  </div>
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <div className="view-detail-row">
                    <strong>Order Date:</strong>
                    <span>{selectedPO.date}</span>
                  </div>
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <div className="view-detail-row">
                    <strong>Currency / Exchange:</strong>
                    <span>{selectedPO.currency} @ ₹{selectedPO.exchangeRate?.toFixed(2)}</span>
                  </div>
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <div className="view-detail-row">
                    <strong>Payment Terms:</strong>
                    <span>{selectedPO.paymentTerms || 'Net 30'}</span>
                  </div>
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <div className="view-detail-row">
                    <strong>Total Value (INR):</strong>
                    <span>₹{selectedPO.totalLCY?.toLocaleString()}</span>
                  </div>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                PO Item Specifications
              </Typography>
              <div className="detail-table">
                <table>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Description</th>
                      <th>Quantity</th>
                      <th>FCY Unit Price</th>
                      <th className="num-col">Total FCY</th>
                      <th className="num-col">Total INR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.itemCode}</td>
                        <td className="bold-cell">{it.itemName}</td>
                        <td>{it.qty}</td>
                        <td>{it.fcyUnitPrice?.toFixed(2)} {selectedPO.currency}</td>
                        <td className="num-col">{(it.qty * it.fcyUnitPrice).toFixed(2)} {selectedPO.currency}</td>
                        <td className="num-col">₹{(it.qty * it.fcyUnitPrice * selectedPO.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsModalOpen(false)} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Close Details
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImportPurchase;

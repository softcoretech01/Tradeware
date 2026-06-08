import { formatDate } from '../../utils/dateUtils';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Tooltip, Chip, Paper, Box, Grid, Typography, Card, CardContent,
  TableContainer
} from '@mui/material';
import {
  Search, Plus, Eye, FileSpreadsheet, FileText, Globe, DollarSign,
  PlusCircle, Trash2, ArrowRight, Edit
} from 'lucide-react';
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

const API_BASE_URL = 'http://127.0.0.1:8000/api/import';

const ImportPurchase = () => {

  // Data States
  const [importPOs, setImportPOs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [paymentTermsList, setPaymentTermsList] = useState([]);
  const [currenciesList, setCurrenciesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [editingPOId, setEditingPOId] = useState(null);

  // Form Fields
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formCurrency, setFormCurrency] = useState('');
  const [formExchangeRate, setFormExchangeRate] = useState(83.5);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formItems, setFormItems] = useState([
    { itemCode: '', itemName: '', qty: 1, fcyUnitPrice: 0 }
  ]);
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 30');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [posRes, supRes, itemRes, ptRes, curRes] = await Promise.all([
        fetch(`${API_BASE_URL}/orders`),
        fetch(`${API_BASE_URL}/dropdown/overseas-suppliers`),
        fetch(`${API_BASE_URL}/dropdown/items`),
        fetch(`${API_BASE_URL}/dropdown/payment-terms`),
        fetch(`${API_BASE_URL}/dropdown/currencies`)
      ]);

      if (posRes.ok) {
        const posData = await posRes.json();
        // Map backend keys to frontend keys
        const mappedPOs = posData.map(po => ({
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
      if (supRes.ok) setSuppliers(await supRes.json());
      if (itemRes.ok) setItems(await itemRes.json());
      if (ptRes.ok) setPaymentTermsList(await ptRes.json());
      if (curRes.ok) setCurrenciesList(await curRes.json());
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPOId(null);
    setFormSupplierId('');
    setFormCurrency('');
    setFormExchangeRate(83.5);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormItems([{ itemCode: '', itemName: '', qty: 1, fcyUnitPrice: 0 }]);
    setFormPaymentTerms('');
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (po) => {
    setEditingPOId(po.db_id);
    setFormSupplierId(po.supplierId);
    setFormCurrency(po.currency_id || '');
    setFormExchangeRate(po.exchangeRate || 83.5);
    setFormDate(po.date || new Date().toISOString().split('T')[0]);
    setFormItems(po.items.length > 0 ? po.items : [{ itemCode: '', itemName: '', qty: 1, fcyUnitPrice: 0 }]);
    setFormPaymentTerms(po.paymentTerms || 'Net 30');
    setCreateModalOpen(true);
  };

  const handleDeletePO = async (po) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${po.db_id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
        } else {
          alert('Failed to delete PO');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Update default rate when currency changes
  const handleCurrencyChange = (currency_id) => {
    setFormCurrency(currency_id);
    const curr = currenciesList.find(c => c.id === currency_id);
    if (curr) {
      setFormExchangeRate(DEFAULT_RATES[curr.code] || 83.5);
    }
  };

  const handleSupplierChange = (supId) => {
    setFormSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      if (sup.paymentTerms && !formPaymentTerms) {
        setFormPaymentTerms(sup.paymentTerms);
      }
      if (sup.currency_id && !formCurrency) {
        handleCurrencyChange(sup.currency_id);
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
        po.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.currency?.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const handleSavePO = async () => {
    // Basic validation
    if (!formSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (!formCurrency) {
      alert('Please select a currency.');
      return;
    }
    const invalidItems = formItems.some(i => !i.itemCode || i.qty <= 0 || i.fcyUnitPrice <= 0);
    if (invalidItems) {
      alert('Please fill out all line items with valid quantities and prices.');
      return;
    }

    const supplierObj = suppliers.find(s => s.id === formSupplierId);
    const supplierName = supplierObj ? supplierObj.id : formSupplierId; // Use ID for DB

    // Calculate totals
    const totalFCY = formItems.reduce((acc, i) => acc + (Number(i.qty) * Number(i.fcyUnitPrice)), 0);
    const totalLCY = totalFCY * Number(formExchangeRate);

    const payload = {
      id: editingPOId ? null : `IPO-2026-${String(importPOs.length + 1).padStart(3, '0')}`,
      po_date: formDate,
      supplierName: supplierName,
      currency_id: formCurrency,
      exchangeRate: Number(formExchangeRate),
      items: formItems.map(i => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        currency_id: formCurrency,
        qty: Number(i.qty),
        fcyUnitPrice: Number(i.fcyUnitPrice)
      })),
      totalFCY,
      totalLCY,
      status: 'Ordered',
      paymentTerms: formPaymentTerms
    };

    try {
      let res;
      if (editingPOId) {
        res = await fetch(`${API_BASE_URL}/orders/${editingPOId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setCreateModalOpen(false);
        setEditingPOId(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.detail || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error while saving PO');
    }
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

  if (loading) return <div style={{padding: 20}}>Loading...</div>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Import Purchase Management
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
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> New
          </button>
        </Box>
      </Box>

      {/* FILTERS PANEL */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
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
              <th className="text-right">Exchange Rate</th>
              <th className="text-right">Foreign Value</th>
              <th className="text-right">Local Value (₹)</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPOs.length > 0 ? (
              paginatedPOs.map(po => (
                <tr key={po.id}>
                  <td className="bold-cell ">{po.id}</td>
                  <td>{formatDate(po.date)}</td>
                  <td className="bold-cell ">{po.supplierName}</td>
                  <td >{po.currency}</td>
                  <td className="text-right">{po.exchangeRate?.toFixed(2)}</td>
                  <td className="bold-cell text-right">{po.totalFCY?.toLocaleString()} {po.currency}</td>
                  <td className="text-right">{po.totalLCY?.toLocaleString()}</td>
                  <td>{getStatusBadge(po.status)}</td>
                  <td className="actions-cell">
                    <Tooltip title="Edit Order">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEdit(po)}
                        sx={{ p: 1 }}
                      >
                        <Edit size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Order Details">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDetails(po)}
                        sx={{ p: 1 }}
                      >
                        <Eye size={22} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Order">
                      <IconButton
                        color="error"
                        onClick={() => handleDeletePO(po)}
                        sx={{ p: 1 }}
                      >
                        <Trash2 size={20} />
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
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle className="dialog-title">
          {editingPOId ? 'Edit' : 'Create'}
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
                    {suppliers.map(s => (
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
                    {currenciesList.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.code}</MenuItem>
                    ))}
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
                    {paymentTermsList.map(pt => (
                      <MenuItem key={pt.id} value={pt.name}>{pt.name}</MenuItem>
                    ))}
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
                      <TableCell className="text-right" sx={{ fontWeight: 700, width: '20%' }}>Quantity</TableCell>
                      <TableCell  sx={{ fontWeight: 700, width: '20%' }}>FCY Unit Price</TableCell>
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
                        <TableCell >
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
            {editingPOId ? 'Update' : 'Save'}
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
                    <span>{formatDate(selectedPO.date)}</span>
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
                      <th className="text-right">Quantity</th>
                      <th className="text-right">FCY Unit Price</th>
                      <th className="num-col text-right">Total FCY</th>
                      <th className="num-col text-right">Total INR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.items.map((it, idx) => (
                      <tr key={idx}>
                        <td >{it.itemCode}</td>
                        <td className="bold-cell ">{it.itemName}</td>
                        <td className="text-right">{it.qty}</td>
                        <td className="text-right">{it.fcyUnitPrice?.toFixed(2)} {selectedPO.currency}</td>
                        <td className="num-col text-right">{(it.qty * it.fcyUnitPrice).toFixed(2)} {selectedPO.currency}</td>
                        <td className="num-col text-right">₹{(it.qty * it.fcyUnitPrice * selectedPO.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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

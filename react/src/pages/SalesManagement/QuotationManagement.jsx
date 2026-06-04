import { formatDate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Edit, Trash, Check, X, Printer,
  FileSpreadsheet, FileText, PlusCircle, Trash2, History, RotateCcw
} from 'lucide-react';
import { 
  addQuotation, 
  updateQuotation, 
  reviseQuotation, 
  approveQuotation, 
  deleteQuotation 
} from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';


const QuotationManagement = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  // Store Selectors
  const quotations = useSelector(state => state.erp.quotations);
  const enquiries = useSelector(state => state.erp.salesEnquiries.filter(e => e.status === 'Active'));
  const customers = useSelector(state => state.customers.customers);
  const itemsMaster = useSelector(state => state.items.items);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [custFilter, setCustFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    enqRef: '',
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    priceCategory: 'Retail',
    items: [],
    validity: '',
    paymentTerms: 'Net 30',
    remarks: '',
    status: 'Draft',
    revision: 0,
    revisionHistory: []
  });

  // Query Check
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      handleOpenCreate();
    }
  }, [location]);

  const handleOpenCreate = () => {
    const defaultCust = customers[0];
    const category = defaultCust ? defaultCust.priceCategory : 'Retail';
    
    // Auto markup based on category
    const defaultMarkup = category === 'Distributor' ? 10 : category === 'Wholesale' ? 15 : 25;
    const defaultBase = 100.0;
    const defaultPrice = defaultBase * (1 + defaultMarkup / 100);

    setFormData({
      id: `QT-2026-${Math.floor(100 + Math.random() * 900)}`,
      enqRef: '',
      date: new Date().toISOString().split('T')[0],
      customerId: defaultCust ? defaultCust.id : '',
      customerName: defaultCust ? defaultCust.name : '',
      priceCategory: category,
      items: [{ itemId: itemsMaster[0]?.id || '', qty: 1, basePrice: defaultBase, markupPct: defaultMarkup, unitPrice: defaultPrice }],
      validity: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      paymentTerms: defaultCust ? defaultCust.paymentTerms : 'Net 30',
      remarks: '',
      status: 'Draft',
      revision: 0,
      revisionHistory: []
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (quote) => {
    setFormData({ ...quote });
    setFormOpen(true);
  };

  const handleOpenRevise = (quote) => {
    setFormData({
      ...quote,
      status: 'Draft',
      // We will increment revision number on save
    });
    setFormOpen(true);
  };

  const handleCustomerChange = (custId) => {
    const cust = customers.find(c => c.id === custId);
    const category = cust ? cust.priceCategory : 'Retail';
    const defaultMarkup = category === 'Distributor' ? 10 : category === 'Wholesale' ? 15 : 25;

    // Apply customer-specific markup dynamically to existing lines
    const updatedLines = formData.items.map(line => {
      const price = line.basePrice * (1 + defaultMarkup / 100);
      return {
        ...line,
        markupPct: defaultMarkup,
        unitPrice: parseFloat(price.toFixed(2))
      };
    });

    setFormData(prev => ({
      ...prev,
      customerId: custId,
      customerName: cust ? cust.name : '',
      priceCategory: category,
      paymentTerms: cust ? cust.paymentTerms : 'Net 30',
      items: updatedLines
    }));
  };

  // Line item handlers
  const handleAddLineItem = () => {
    const markup = formData.priceCategory === 'Distributor' ? 10 : formData.priceCategory === 'Wholesale' ? 15 : 25;
    const base = 50.0;
    const price = base * (1 + markup / 100);

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: itemsMaster[0]?.id || '', qty: 1, basePrice: base, markupPct: markup, unitPrice: price }]
    }));
  };

  const handleRemoveLineItem = (idx) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formData.items];
    const current = updated[idx];

    if (field === 'itemId') {
      const match = itemsMaster.find(i => i.id === value);
      updated[idx] = {
        ...current,
        itemId: value,
        name: match ? match.name : ''
      };
    } else if (field === 'basePrice' || field === 'markupPct') {
      const base = field === 'basePrice' ? (parseFloat(value) || 0) : current.basePrice;
      const markup = field === 'markupPct' ? (parseFloat(value) || 0) : current.markupPct;
      const unitPrice = base * (1 + markup / 100);
      updated[idx] = {
        ...current,
        basePrice: base,
        markupPct: markup,
        unitPrice: parseFloat(unitPrice.toFixed(2))
      };
    } else if (field === 'unitPrice') {
      const unit = parseFloat(value) || 0;
      // Recompute markup
      const markup = current.basePrice > 0 ? ((unit - current.basePrice) / current.basePrice) * 100 : 0;
      updated[idx] = {
        ...current,
        unitPrice: unit,
        markupPct: parseFloat(markup.toFixed(1))
      };
    } else {
      updated[idx] = {
        ...current,
        [field]: value
      };
    }

    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleSave = () => {
    if (!formData.customerId) {
      alert('Customer selection is required.');
      return;
    }
    if (formData.items.length === 0) {
      alert('At least one item is required.');
      return;
    }

    // Enrich names
    const enriched = formData.items.map(item => {
      const match = itemsMaster.find(i => i.id === item.itemId);
      return {
        ...item,
        name: match ? match.name : 'Unknown Item'
      };
    });

    const isExisting = quotations.find(q => q.id === formData.id);

    if (isExisting) {
      if (isExisting.revision !== formData.revision || isExisting.status === 'Revised') {
        // This is a revision flow
        dispatch(reviseQuotation({
          id: formData.id,
          items: enriched,
          remarks: formData.remarks
        }));
      } else {
        // Standard edit
        dispatch(updateQuotation({ ...formData, items: enriched }));
      }
    } else {
      // Create new draft
      dispatch(addQuotation({ ...formData, items: enriched, status: 'Sent' }));
    }
    
    setFormOpen(false);
  };

  const handleAccept = (id, status) => {
    dispatch(approveQuotation({ id, status }));
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete Quotation ${id}?`)) {
      dispatch(deleteQuotation(id));
    }
  };

  // Filters
  const filteredQuotes = quotations.filter(q => {
    const matchesSearch = q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.enqRef.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? q.status === statusFilter : true;
    const matchesCust = custFilter ? q.customerId === custFilter : true;

    return matchesSearch && matchesStatus && matchesCust;
  });

  // Export
  const handleExportExcel = () => {
    const data = filteredQuotes.map(q => ({
      'Quote Number': q.id,
      'Date': q.date,
      'Customer': q.customerName,
      'Price Tier': q.priceCategory,
      'Subtotal': q.items.reduce((acc, i) => acc + (i.qty * i.unitPrice), 0),
      'Revision': `v${q.revision}`,
      'Status': q.status
    }));
    exportToExcel(data, 'Sales_Quotations', 'Quotations');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Quote Number' },
      { field: 'date', headerName: 'Date' },
      { field: 'customerName', headerName: 'Customer' },
      { field: 'priceCategory', headerName: 'Price Tier' },
      { field: 'status', headerName: 'Status' }
    ];
    exportToPDF(cols, filteredQuotes, 'Sales_Quotations', 'Sales Quotations Report');
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Quotation Management</h2>
          <p className="subtitle">Draft client offers with customer-specific pricing tiers, margins, and revision audits.</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="outlined" 
            startIcon={<FileSpreadsheet size={16} />} 
            onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#E8F5E9' }, borderRadius: 2 }}
          >
            Export Excel
          </Button>
          <button className="btn-secondary" onClick={handleExportPDF}>
            <FileText size={16} /> PDF
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> New</button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Quote No, Enquiry Ref, Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={custFilter} onChange={(e) => setCustFilter(e.target.value)}>
            <option value="">All Customers</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Revised">Revised</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Quote Number</th>
              <th>Date</th>
              <th>Enquiry Ref</th>
              <th>Customer</th>
              <th>Price category</th>
              <th>Value</th>
              <th>Revision</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan="9" className="table-empty">No quotations found matching filters.</td>
              </tr>
            ) : (
              filteredQuotes.map((q) => {
                const total = q.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0);
                return (
                  <tr key={q.id}>
                    <td className="bold-cell">{q.id}</td>
                    <td>{formatDate(q.date)}</td>
                    <td className="text-muted">{q.enqRef || 'Direct Draft'}</td>
                    <td>{q.customerName}</td>
                    <td>
                      <Chip label={q.priceCategory} variant="outlined" size="small" />
                    </td>
                    <td className="bold-cell">{total.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                    <td>
                      <Chip 
                        icon={<History size={12} />} 
                        label={`v${q.revision}`} 
                        onClick={() => { setSelectedQuote(q); setHistoryOpen(true); }} 
                        size="small" 
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <Chip 
                        label={q.status} 
                        color={q.status === 'Accepted' ? 'success' : q.status === 'Sent' ? 'primary' : q.status === 'Revised' ? 'info' : 'default'} 
                        size="small" 
                      />
                    </td>
                    <td className="actions-cell">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => { setSelectedQuote(q); setViewOpen(true); }}>
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>

                      {(q.status === 'Draft' || q.status === 'Sent') && (
                        <>
                          <Tooltip title="Edit Quote">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(q)}>
                              <Edit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Revise Offer (New Version)">
                            <IconButton size="small" color="secondary" onClick={() => handleOpenRevise(q)}>
                              <RotateCcw size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Accept Proposal">
                            <IconButton size="small" className="btn-icon-success" onClick={() => handleAccept(q.id, 'Accepted')}>
                              <Check size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Decline Proposal">
                            <IconButton size="small" className="btn-icon-danger" onClick={() => handleAccept(q.id, 'Rejected')}>
                              <X size={16} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip title="Print Quotation">
                        <IconButton size="small" onClick={() => { setSelectedQuote(q); setPrintOpen(true); }}>
                          <Printer size={16} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete Proposal">
                        <IconButton size="small" color="error" onClick={() => handleDelete(q.id)}>
                          <Trash size={16} />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          {quotations.some(q => q.id === formData.id) ? `Edit Quotation (Rev ${formData.revision})` : 'Draft Quotation'} ({formData.id})
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <FormControl fullWidth>
              <InputLabel>Enquiry Ref</InputLabel>
              <Select
                value={formData.enqRef}
                label="Enquiry Ref"
                onChange={(e) => setFormData(prev => ({ ...prev, enqRef: e.target.value }))}
              >
                <MenuItem value=""><em>None (Direct Quote)</em></MenuItem>
                {enquiries.map(enq => (
                  <MenuItem key={enq.id} value={enq.id}>{enq.id} ({enq.customerName})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Quotation Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select
                value={formData.customerId}
                label="Customer"
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                {customers.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name} ({c.id})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Validity Deadline"
              type="date"
              value={formData.validity}
              onChange={(e) => setFormData(prev => ({ ...prev, validity: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--primary)' }}>
              Pricing tier applied: {formData.priceCategory} Price Category (Customer Specific)
            </span>
          </div>

          {/* Lines */}
          <div className="line-items-section" style={{ marginTop: '20px' }}>
            <div className="section-title-row">
              <h4>Offer Items & Margins</h4>
              <Button startIcon={<PlusCircle size={16} />} size="small" onClick={handleAddLineItem}>
                Add Line
              </Button>
            </div>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell width="100">Qty</TableCell>
                  <TableCell width="120">Cost (₹)</TableCell>
                  <TableCell width="110">Markup (%)</TableCell>
                  <TableCell width="130">Unit Price (₹)</TableCell>
                  <TableCell width="130">Total (₹)</TableCell>
                  <TableCell width="60" align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <select 
                        className="table-select" 
                        value={item.itemId}
                        onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                      >
                        {itemsMaster.map(itm => (
                          <option key={itm.id} value={itm.id}>{itm.name} ({itm.id})</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <input 
                        type="number" 
                        className="table-input"
                        value={item.qty}
                        min="1"
                        onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <input 
                        type="number" 
                        className="table-input"
                        value={item.basePrice}
                        min="0.01"
                        step="0.01"
                        onChange={(e) => handleItemChange(idx, 'basePrice', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <input 
                        type="number" 
                        className="table-input"
                        value={item.markupPct}
                        onChange={(e) => handleItemChange(idx, 'markupPct', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <input 
                        type="number" 
                        className="table-input"
                        value={item.unitPrice}
                        min="0.01"
                        step="0.01"
                        onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell className="bold-cell">
                      {(item.qty * item.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveLineItem(idx)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div style={{ marginTop: '20px' }}>
            <TextField
              label="Quotation Remarks / Terms of Delivery"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Terms of shipping, delivery times, packing conditions..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Quotation details - {selectedQuote?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedQuote && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>Customer:</strong> <span>{selectedQuote.customerName}</span>
              </div>
              <div className="view-detail-row">
                <strong>Quotation Date:</strong> <span>{formatDate(selectedQuote.date)}</span>
              </div>
              <div className="view-detail-row">
                <strong>Validity Deadline:</strong> <span>{selectedQuote.validity}</span>
              </div>
              <div className="view-detail-row">
                <strong>Price tier applied:</strong> <span>{selectedQuote.priceCategory}</span>
              </div>
              <div className="view-detail-row">
                <strong>Revision Number:</strong> <span>Rev {selectedQuote.revision}</span>
              </div>
              <div className="view-detail-row">
                <strong>Status:</strong> 
                <Chip label={selectedQuote.status} color={selectedQuote.status==='Accepted' ? 'success':'primary'} size="small" />
              </div>
              <div className="view-detail-row">
                <strong>Remarks/Terms:</strong> <span>{selectedQuote.remarks || 'None.'}</span>
              </div>

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Line Items Offered</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit Price (₹)</TableCell>
                    <TableCell align="right">Markup</TableCell>
                    <TableCell align="right">Subtotal (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedQuote.items.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{itm.name} ({itm.itemId})</TableCell>
                      <TableCell align="right">{itm.qty}</TableCell>
                      <TableCell align="right">{itm.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">{itm.markupPct}%</TableCell>
                      <TableCell align="right">{(itm.qty * itm.unitPrice).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} align="right"><strong>Quotation Total:</strong></TableCell>
                    <TableCell align="right" className="bold-cell">
                      {selectedQuote.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* REVISION HISTORY DIALOG */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Revision History Logs - {selectedQuote?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedQuote && (
            <div className="view-detail-body">
              <div style={{ marginBottom: '16px' }}>
                <p><strong>Current Active Version:</strong> Revision {selectedQuote.revision} (Total: ₹ {selectedQuote.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0).toFixed(2)})</p>
              </div>

              {selectedQuote.revisionHistory.length === 0 ? (
                <div className="empty-state">
                  <History size={40} className="empty-icon" />
                  <p>No prior revisions. This document is on its initial version (v0).</p>
                </div>
              ) : (
                <div className="revision-timeline">
                  {selectedQuote.revisionHistory.map((hist, idx) => (
                    <div key={idx} className="revision-timeline-item" style={{ padding: '12px', background: '#f8fafc', borderLeft: '3px solid var(--primary)', marginBottom: '12px', borderRadius: '0 6px 6px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>Revision {hist.revision}</strong>
                        <span className="text-muted" style={{ fontSize: '12px' }}>Saved: {hist.date}</span>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: '600' }}>Voucher Total: ₹ {hist.total.toFixed(2)}</p>
                      
                      <Table size="small" style={{ marginTop: '8px' }}>
                        <TableHead>
                          <TableRow>
                            <TableCell style={{ fontSize: '11px', padding: '4px' }}>Item</TableCell>
                            <TableCell align="right" style={{ fontSize: '11px', padding: '4px' }}>Qty</TableCell>
                            <TableCell align="right" style={{ fontSize: '11px', padding: '4px' }}>Price (₹)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {hist.items.map((hi, hIdx) => (
                            <TableRow key={hIdx}>
                              <TableCell style={{ fontSize: '11px', padding: '4px' }}>{hi.name || hi.itemId}</TableCell>
                              <TableCell align="right" style={{ fontSize: '11px', padding: '4px' }}>{hi.qty}</TableCell>
                              <TableCell align="right" style={{ fontSize: '11px', padding: '4px' }}>{hi.unitPrice.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)} color="primary">Close Logs</Button>
        </DialogActions>
      </Dialog>

      {/* PRINT VIEW DIALOG */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="md" fullWidth>
        <DialogContent dividers>
          {selectedQuote && (
            <div className="print-voucher-area" id="print-area">
              <div className="print-header">
                <div>
                  <h1 className="company-title">TRADEWARE ERP SYSTEMS</h1>
                  <p>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</p>
                  <p>Email: contact@tradeware.com | Tel: 6543-2109</p>
                </div>
                <div className="voucher-title-block">
                  <h2>COMMERCIAL QUOTATION</h2>
                  <p><strong>QUOTATION NO:</strong> {selectedQuote.id}</p>
                  <p><strong>REVISION:</strong> Rev {selectedQuote.revision}</p>
                  <p><strong>DATE:</strong> {selectedQuote.date}</p>
                  <p><strong>VALID UNTIL:</strong> {selectedQuote.validity}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>PREPARED FOR (CLIENT):</strong></p>
                  <p className="bold-cell">{selectedQuote.customerName}</p>
                  <p>Payment Terms: {selectedQuote.paymentTerms}</p>
                </div>
                <div>
                  <p><strong>REF ENQUIRY REF:</strong> {selectedQuote.enqRef || 'Direct Request'}</p>
                  <p><strong>PRICING SCHEME:</strong> {selectedQuote.priceCategory} Rate Chart</p>
                  <p><strong>OFFER STATUS:</strong> {selectedQuote.status}</p>
                </div>
              </div>

              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Item Description</th>
                    <th className="num-col">Quantity</th>
                    <th className="num-col">Unit Price (₹)</th>
                    <th className="num-col">Tax (18%) (₹)</th>
                    <th className="num-col">Subtotal (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuote.items.map((itm, idx) => {
                    const lineVal = itm.qty * itm.unitPrice;
                    const taxVal = lineVal * 0.18;
                    return (
                      <tr key={idx}>
                        <td>{itm.itemId}</td>
                        <td>{itm.name}</td>
                        <td className="num-col">{itm.qty}</td>
                        <td className="num-col">{itm.unitPrice.toFixed(2)}</td>
                        <td className="num-col">{taxVal.toFixed(2)}</td>
                        <td className="num-col">{(lineVal + taxVal).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="subtotal-row">
                    <td colSpan="5">Total Taxable Value</td>
                    <td className="num-col">{selectedQuote.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0).toFixed(2)}</td>
                  </tr>
                  <tr className="subtotal-row">
                    <td colSpan="5">Integrated Goods & Services Tax (18%)</td>
                    <td className="num-col">{(selectedQuote.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0) * 0.18).toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan="5">Quoted Offer Grand Total</td>
                    <td className="num-col">{(selectedQuote.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0) * 1.18).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-remarks">
                <p><strong>TERMS & CONDITIONS:</strong></p>
                <p>{selectedQuote.remarks || 'Standard warranty and shipping rules apply. Rates valid until date noted above.'}</p>
              </div>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Authorized Sales Manager</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Customer Acceptance Signoff</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintOpen(false)} color="inherit">Close</Button>
          <Button 
            startIcon={<Printer size={16} />} 
            variant="contained" 
            color="primary"
            onClick={() => window.print()}
          >
            Print Quotation
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuotationManagement;

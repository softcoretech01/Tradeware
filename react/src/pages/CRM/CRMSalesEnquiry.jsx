import { formatDate } from '../../utils/dateUtils';
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel, 
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Edit, Trash2, ArrowRight, Calendar, PlusCircle, Trash, FileSpreadsheet
} from 'lucide-react';
import { 
  addSalesEnquiry, 
  updateSalesEnquiry, 
  convertEnquiry, 
  deleteSalesEnquiry,
  addQuotation
} from '../../store/erpSlice';
import { addFollowup } from '../../store/crmSlice';
import { exportToExcel } from '../../utils/exportUtil';


const CRMSalesEnquiry = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Selectors
  const salesEnquiries = useSelector(state => state.erp.salesEnquiries);
  const customers = useSelector(state => state.customers.customers);
  const itemsMaster = useSelector(state => state.items.items);
  const followups = useSelector(state => state.crm.followups);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    source: 'Email',
    items: [],
    status: 'Active',
    remarks: ''
  });

  const [followupData, setFollowupData] = useState({
    type: 'Call',
    dateTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().substring(0, 16),
    notes: ''
  });

  // Open Create Dialog
  const handleOpenCreate = () => {
    const defaultCust = customers[0];
    setFormData({
      id: `ENQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      customerId: defaultCust ? defaultCust.id : '',
      customerName: defaultCust ? defaultCust.name : '',
      source: 'Email',
      items: [{ itemId: itemsMaster[0]?.id || '', qty: 1, targetPrice: itemsMaster[0]?.standardPrice || 0 }],
      status: 'Active',
      remarks: ''
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (enq) => {
    setFormData({ ...enq });
    setFormOpen(true);
  };

  const handleCustomerChange = (custId) => {
    const cust = customers.find(c => c.id === custId);
    setFormData(prev => ({
      ...prev,
      customerId: custId,
      customerName: cust ? cust.name : ''
    }));
  };

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: itemsMaster[0]?.id || '', qty: 1, targetPrice: itemsMaster[0]?.standardPrice || 0 }]
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
    if (field === 'itemId') {
      const match = itemsMaster.find(i => i.id === value);
      updated[idx] = {
        ...updated[idx],
        itemId: value,
        name: match ? match.name : '',
        targetPrice: match ? (match.standardPrice || 0) : 0
      };
    } else {
      updated[idx] = {
        ...updated[idx],
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
      alert('At least one item request is required.');
      return;
    }

    const enriched = formData.items.map(item => {
      const match = itemsMaster.find(i => i.id === item.itemId);
      return {
        ...item,
        name: match ? match.name : 'Unknown Item'
      };
    });

    const finalData = { ...formData, items: enriched };
    const exists = salesEnquiries.some(e => e.id === formData.id);

    if (exists) {
      dispatch(updateSalesEnquiry(finalData));
    } else {
      dispatch(addSalesEnquiry(finalData));
    }
    setFormOpen(false);
  };

  const handleConvertToQuotation = (enq) => {
    const cust = customers.find(c => c.id === enq.customerId);
    const priceCat = cust ? cust.priceCategory : 'Retail';

    const quotationLines = enq.items.map(item => {
      const baseCost = item.targetPrice * 0.8;
      const finalPrice = item.targetPrice;
      const markupPct = 25;

      return {
        itemId: item.itemId,
        name: item.name,
        qty: item.qty,
        basePrice: parseFloat(baseCost.toFixed(2)),
        unitPrice: parseFloat(finalPrice.toFixed(2)),
        markupPct
      };
    });

    const newQuotation = {
      id: `QT-2026-${Math.floor(100 + Math.random() * 900)}`,
      enqRef: enq.id,
      date: new Date().toISOString().split('T')[0],
      customerId: enq.customerId,
      customerName: enq.customerName,
      priceCategory: priceCat,
      items: quotationLines,
      validity: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      paymentTerms: cust ? cust.paymentTerms : 'Net 30',
      revision: 0,
      revisionHistory: [],
      status: 'Draft',
      remarks: `Quoted matching target pricing from CRM Enquiry ${enq.id}.`
    };

    dispatch(addQuotation(newQuotation));
    dispatch(convertEnquiry(enq.id));

    alert(`Enquiry ${enq.id} converted successfully to Sales Order!`);
    navigate('/sales-orders/quotation-management');
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete enquiry record ${id}?`)) {
      dispatch(deleteSalesEnquiry(id));
    }
  };

  // Follow-up Handlers
  const handleOpenFollowup = (enq) => {
    setSelectedEnquiry(enq);
    setFollowupData({
      type: 'Call',
      dateTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().substring(0, 16),
      notes: `Discuss items in Enquiry ${enq.id} with ${enq.customerName}`
    });
    setFollowupOpen(true);
  };

  const handleSaveFollowup = () => {
    if (!followupData.notes.trim()) {
      alert('Agenda notes are required.');
      return;
    }
    const newFollow = {
      id: `FOL-${Date.now().toString().slice(-4)}`,
      entityType: 'Lead', // treats under lead/enquiry CRM follow-ups
      entityId: selectedEnquiry.id,
      entityName: selectedEnquiry.customerName,
      type: followupData.type,
      dateTime: followupData.dateTime,
      notes: followupData.notes,
      status: 'Pending'
    };
    dispatch(addFollowup(newFollow));
    setFollowupOpen(false);
    alert('Follow-up scheduled.');
  };

  // Filtering
  const filteredEnquiries = salesEnquiries.filter(e => {
    const matchesSearch = e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter ? e.source === sourceFilter : true;
    const matchesStatus = statusFilter ? e.status === statusFilter : true;
    return matchesSearch && matchesSource && matchesStatus;
  });

  const handleExportExcel = () => {
    const exportData = filteredEnquiries.map(e => ({
      'Enquiry No': e.id,
      'Date Logged': e.date,
      'Customer': e.customerName,
      'Channel Source': e.source,
      'Requested Item Count': e.items.length,
      'Total Value ($)': e.items.reduce((sum, item) => sum + (item.qty * item.targetPrice), 0),
      'Status': e.status,
      'Remarks': e.remarks
    }));
    exportToExcel(exportData, 'Sales_Enquiries_CRM', 'Enquiries');
  };

  // Find followups for selected enquiry
  const currentEnquiryFollowups = selectedEnquiry 
    ? followups.filter(f => f.entityId === selectedEnquiry.id)
    : [];

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Sales Enquiry</h2>
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
            placeholder="Search By" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All Sources</option>
            <option value="Email">Email</option>
            <option value="Call">Phone Call</option>
            <option value="Web">Website Form</option>
            <option value="Exhibition">Exhibition / Expo</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Converted">Converted to Sales Order</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Enquiry No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Source</th>
              <th>Requested Items</th>
              <th className="text-right">Est. Deal Value (₹)</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnquiries.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No sales enquiries logged.</td>
              </tr>
            ) : (
              filteredEnquiries.map((e) => {
                const dealValue = e.items.reduce((sum, item) => sum + (item.qty * item.targetPrice), 0);
                return (
                  <tr key={e.id}>
                    <td className="bold-cell ">{e.id}</td>
                    <td>{formatDate(e.date)}</td>
                    <td >{e.customerName}</td>
                    <td >{e.source}</td>
                    <td>
                      <span className="items-badge">{e.items.length} items</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }} className="text-right">
                      {dealValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <Chip 
                        label={e.status === 'Converted' ? 'Converted to Sales Order' : e.status} 
                        color={e.status === 'Converted' ? 'success' : 'primary'} 
                        size="small" 
                      />
                    </td>
                    <td className="actions-cell">
                      <Tooltip title="View Items & Followups">
                        <IconButton size="small" onClick={() => { setSelectedEnquiry(e); setViewOpen(true); }}>
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>

                      {e.status === 'Active' && (
                        <>
                          <Tooltip title="Edit Enquiry">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(e)}>
                              <Edit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Schedule Follow-up">
                            <IconButton size="small" color="secondary" onClick={() => handleOpenFollowup(e)}>
                              <Calendar size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Convert to Sales Order">
                            <IconButton size="small" className="btn-icon-success" onClick={() => handleConvertToQuotation(e)}>
                              <ArrowRight size={16} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip title="Delete record">
                        <IconButton size="small" color="error" onClick={() => handleDelete(e.id)}>
                          <Trash2 size={16} />
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

      {/* CREATE & EDIT FORM DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          {salesEnquiries.some(e => e.id === formData.id) ? 'Edit' : 'Log Sales Enquiry'} ({formData.id})
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <TextField
              label="Date Received"
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

            <FormControl fullWidth>
              <InputLabel>Enquiry Source</InputLabel>
              <Select
                value={formData.source}
                label="Enquiry Source"
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              >
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="Call">Phone Call</MenuItem>
                <MenuItem value="Web">Website Form</MenuItem>
                <MenuItem value="Exhibition">Exhibition / Expo</MenuItem>
              </Select>
            </FormControl>
          </div>

          {/* Line items table */}
          <div className="line-items-section">
            <div className="section-title-row">
              <h4>Items & Product Enquiry</h4>
              <Button startIcon={<PlusCircle size={16} />} size="small" onClick={handleAddLineItem}>
                Add Item Row
              </Button>
            </div>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell className="text-right" width="140">Qty Requested</TableCell>
                  <TableCell className="text-right" width="160">Unit Price</TableCell>
                  <TableCell className="text-right" width="160">Total Amount</TableCell>
                  <TableCell width="80" align="center">Action</TableCell>
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
                    <TableCell >
                      <input 
                        type="number" 
                        className="table-input"
                        value={item.qty}
                        min="1"
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <input 
                        type="number" 
                        className="table-input"
                        value={item.targetPrice}
                        min="0.01"
                        step="0.01"
                        onChange={(e) => handleItemChange(idx, 'targetPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <input 
                        type="text" 
                        className="table-input"
                        value={(item.qty * item.targetPrice).toFixed(2)}
                        disabled
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveLineItem(idx)}>
                        <Trash size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div style={{ marginTop: '20px' }}>
            <TextField
              label="Requirement Notes & Negotiation History"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Enter special technical guidelines, package requests, lead times, or negotiations..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS & FOLLOWUP FEED */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">Sales Enquiry details: {selectedEnquiry?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedEnquiry && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <div>
                <h4 style={{ marginBottom: '12px', color: 'var(--secondary)' }}>Enquiry Specs</h4>
                <div className="view-detail-row">
                  <strong>Customer:</strong> <span>{selectedEnquiry.customerName}</span>
                </div>
                <div className="view-detail-row">
                  <strong>Logged Date:</strong> <span>{formatDate(selectedEnquiry.date)}</span>
                </div>
                <div className="view-detail-row">
                  <strong>Source:</strong> <span>{selectedEnquiry.source}</span>
                </div>
                <div className="view-detail-row">
                  <strong>Client notes:</strong> <span>{selectedEnquiry.remarks || 'No notes logged.'}</span>
                </div>

                <h4 style={{ marginTop: '20px', marginBottom: '8px', color: 'var(--secondary)' }}>Inquired Products</h4>
                <Table size="small" className="detail-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell className="text-right" align="right">Qty</TableCell>
                      <TableCell className="text-right" align="right">Unit Price</TableCell>
                      <TableCell className="text-right" align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedEnquiry.items.map((itm, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{itm.name} ({itm.itemId})</TableCell>
                        <TableCell align="right" className="text-right">{itm.qty}</TableCell>
                        <TableCell className="text-right" align="right">{itm.targetPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right" align="right">{(itm.qty * itm.targetPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Follow-up feed */}
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ color: 'var(--secondary)' }}>Follow-ups Log</h4>
                  <Button startIcon={<Calendar size={14} />} size="small" onClick={() => handleOpenFollowup(selectedEnquiry)}>
                    Schedule
                  </Button>
                </div>

                {currentEnquiryFollowups.length === 0 ? (
                  <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-muted)', py: 4 }}>
                    No follow-ups logged for this enquiry.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentEnquiryFollowups.map(f => (
                      <div key={f.id} style={{ border: '1px solid var(--border)', padding: '10px', borderRadius: 'var(--radius)', background: 'var(--background)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>{f.type} | {f.id}</span>
                          <span>{f.status}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{f.notes}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Due: {new Date(f.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* SCHEDULE FOLLOWUP DIALOG */}
      <Dialog open={followupOpen} onClose={() => setFollowupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Schedule Enquiry Follow-up</DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormControl fullWidth>
              <InputLabel>Follow-up Mode</InputLabel>
              <Select
                value={followupData.type}
                label="Follow-up Mode"
                onChange={(e) => setFollowupData(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="Call">Phone Call</MenuItem>
                <MenuItem value="Meeting">Meeting (F2F/Virtual)</MenuItem>
                <MenuItem value="Email">Email Communication</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Scheduled Date & Time"
              type="datetime-local"
              value={followupData.dateTime}
              onChange={(e) => setFollowupData(prev => ({ ...prev, dateTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Follow-up Agenda Notes"
              value={followupData.notes}
              onChange={(e) => setFollowupData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              required
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowupOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveFollowup} variant="contained" color="primary">Schedule</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CRMSalesEnquiry;

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Edit, Trash, Check, X, Printer,
  FileSpreadsheet, FileText, PlusCircle, ArrowRight, Trash2
} from 'lucide-react';
import { 
  addSalesEnquiry, 
  updateSalesEnquiry, 
  convertEnquiry, 
  deleteSalesEnquiry,
  addQuotation
} from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const SalesEnquiry = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Store selectors
  const salesEnquiries = useSelector(state => state.erp.salesEnquiries);
  const customers = useSelector(state => state.customers.customers);
  const itemsMaster = useSelector(state => state.items.items);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
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

  // Check URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      handleOpenCreate();
    }
  }, [location]);

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

    // Attach item names
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
    // Generate standard quotation in draft state
    const cust = customers.find(c => c.id === enq.customerId);
    const priceCat = cust ? cust.priceCategory : 'Retail';

    const quotationLines = enq.items.map(item => {
      // Base cost lookup (mocked to 80% of target price)
      const baseCost = item.targetPrice * 0.8;
      const finalPrice = item.targetPrice;
      const markupPct = 25; // 25% standard markup

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
      validity: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // 30 days validity
      paymentTerms: cust ? cust.paymentTerms : 'Net 30',
      revision: 0,
      revisionHistory: [],
      status: 'Draft',
      remarks: `Quoted matching target pricing from Enquiry ${enq.id}.`
    };

    dispatch(addQuotation(newQuotation));
    dispatch(convertEnquiry(enq.id));

    alert(`Enquiry ${enq.id} converted successfully to draft Quotation ${newQuotation.id}!`);
    navigate('/sales-orders/quotation-management');
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete enquiry record ${id}?`)) {
      dispatch(deleteSalesEnquiry(id));
    }
  };

  // Filters
  const filteredEnquiries = salesEnquiries.filter(e => {
    const matchesSearch = e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.remarks.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = sourceFilter ? e.source === sourceFilter : true;
    const matchesStatus = statusFilter ? e.status === statusFilter : true;

    return matchesSearch && matchesSource && matchesStatus;
  });

  // Export
  const handleExportExcel = () => {
    const data = filteredEnquiries.map(e => ({
      'Enquiry No': e.id,
      'Date': e.date,
      'Customer': e.customerName,
      'Enquiry Source': e.source,
      'Items': e.items.length,
      'Status': e.status,
      'Remarks': e.remarks
    }));
    exportToExcel(data, 'Sales_Enquiries', 'Enquiries');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Enquiry No' },
      { field: 'date', headerName: 'Date' },
      { field: 'customerName', headerName: 'Customer' },
      { field: 'source', headerName: 'Source' },
      { field: 'status', headerName: 'Status' }
    ];
    exportToPDF(cols, filteredEnquiries, 'Sales_Enquiries', 'Sales Enquiries Report');
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Sales Enquiry</h2>
          <p className="subtitle">Log customer leads, specify target prices, and route into the Quotation pipeline.</p>
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
            <Plus size={16} /> Create Sales Enquiry
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Enquiry No, Customer..." 
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
            <option value="Converted">Converted to Quote</option>
            <option value="Closed">Closed / Lost</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Enquiry No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Source</th>
              <th>Requested Items</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnquiries.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty">No sales enquiries found matching criteria.</td>
              </tr>
            ) : (
              filteredEnquiries.map((e) => (
                <tr key={e.id}>
                  <td className="bold-cell">{e.id}</td>
                  <td>{e.date}</td>
                  <td>{e.customerName}</td>
                  <td>{e.source}</td>
                  <td>
                    <span className="items-badge">{e.items.length} items requested</span>
                  </td>
                  <td>
                    <Chip 
                      label={e.status} 
                      color={e.status === 'Converted' ? 'success' : e.status === 'Active' ? 'primary' : 'default'} 
                      size="small" 
                    />
                  </td>
                  <td className="actions-cell">
                    <Tooltip title="View Details">
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
                        <Tooltip title="Convert to Quotation">
                          <IconButton size="small" className="btn-icon-success" onClick={() => handleConvertToQuotation(e)}>
                            <ArrowRight size={16} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    <Tooltip title="Print Inquiry Sheet">
                      <IconButton size="small" onClick={() => { setSelectedEnquiry(e); setPrintOpen(true); }}>
                        <Printer size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Lead">
                      <IconButton size="small" color="error" onClick={() => handleDelete(e.id)}>
                        <Trash size={16} />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          {salesEnquiries.some(e => e.id === formData.id) ? 'Edit Sales Enquiry' : 'Log Sales Enquiry'} ({formData.id})
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

          <div className="line-items-section" style={{ marginTop: '20px' }}>
            <div className="section-title-row">
              <h4>Items Inquired</h4>
              <Button startIcon={<PlusCircle size={16} />} size="small" onClick={handleAddLineItem}>
                Add Item
              </Button>
            </div>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell width="140">Qty Requested</TableCell>
                  <TableCell width="160">Unit Price (INR)</TableCell>
                  <TableCell width="160">Total Amount (INR)</TableCell>
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
                    <TableCell>
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
                    <TableCell>
                      <input 
                        type="text" 
                        className="table-input"
                        value={(item.qty * item.targetPrice).toFixed(2)}
                        disabled
                      />
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
              label="Enquiry Remarks / Client Notes"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Log special requirements, delivery deadlines, negotiations, etc."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save Lead</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Sales Enquiry - {selectedEnquiry?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedEnquiry && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>Customer:</strong> <span>{selectedEnquiry.customerName}</span>
              </div>
              <div className="view-detail-row">
                <strong>Date Logged:</strong> <span>{selectedEnquiry.date}</span>
              </div>
              <div className="view-detail-row">
                <strong>Source Channel:</strong> <span>{selectedEnquiry.source}</span>
              </div>
              <div className="view-detail-row">
                <strong>Lead Status:</strong> 
                <Chip label={selectedEnquiry.status} color={selectedEnquiry.status==='Converted' ? 'success':'primary'} size="small" />
              </div>
              <div className="view-detail-row">
                <strong>Client Remarks:</strong> <span>{selectedEnquiry.remarks || 'No notes logged.'}</span>
              </div>

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Items Under Discussion</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="right">Qty Inquired</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Est. Total Deal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedEnquiry.items.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{itm.name} ({itm.itemId})</TableCell>
                      <TableCell align="right">{itm.qty}</TableCell>
                      <TableCell align="right">INR {itm.targetPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">INR {(itm.qty * itm.targetPrice).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selectedEnquiry.status === 'Active' && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<ArrowRight size={16} />}
                    onClick={() => handleConvertToQuotation(selectedEnquiry)}
                  >
                    Generate Quotation Offer
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* PRINT VIEW DIALOG */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="md" fullWidth>
        <DialogContent dividers>
          {selectedEnquiry && (
            <div className="print-voucher-area" id="print-area">
              <div className="print-header">
                <div>
                  <h1 className="company-title">TRADEWARE ERP SYSTEMS</h1>
                  <p>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</p>
                  <p>Email: contact@tradeware.com | Tel: 6543-2109</p>
                </div>
                <div className="voucher-title-block">
                  <h2>SALES ENQUIRY RECORD</h2>
                  <p><strong>ENQUIRY NO:</strong> {selectedEnquiry.id}</p>
                  <p><strong>DATE LOGGED:</strong> {selectedEnquiry.date}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>INQUIRING PROSPECT / CUSTOMER:</strong></p>
                  <p className="bold-cell">{selectedEnquiry.customerName}</p>
                </div>
                <div>
                  <p><strong>SOURCE CHANNEL:</strong> {selectedEnquiry.source}</p>
                  <p><strong>PIPELINE STATUS:</strong> {selectedEnquiry.status}</p>
                </div>
              </div>

              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Item Name</th>
                    <th className="num-col">Requested Qty</th>
                    <th className="num-col">Target Unit Cost</th>
                    <th className="num-col">Target Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEnquiry.items.map((itm, idx) => (
                    <tr key={idx}>
                      <td>{itm.itemId}</td>
                      <td>{itm.name}</td>
                      <td className="num-col">{itm.qty}</td>
                      <td className="num-col">INR {itm.targetPrice.toFixed(2)}</td>
                      <td className="num-col">INR {(itm.qty * itm.targetPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="4">Estimated Potential Pipeline Value</td>
                    <td className="num-col">INR {selectedEnquiry.items.reduce((sum, i) => sum + (i.qty * i.targetPrice), 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-remarks">
                <p><strong>ENQUIRY DISCUSSIONS & NOTES:</strong></p>
                <p>{selectedEnquiry.remarks || 'No detailed instructions logged.'}</p>
              </div>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Logged By (Sales Executive)</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Customer Representative Signoff</p>
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
            Print Enquiry sheet
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SalesEnquiry;

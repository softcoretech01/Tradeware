import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Check, X, Printer, Trash,
  FileSpreadsheet, FileText, UploadCloud, Paperclip
} from 'lucide-react';
import { 
  addCustomerPO, 
  deleteCustomerPO 
} from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const CustomerPO = () => {
  const dispatch = useDispatch();

  // Store selectors
  const customerPOs = useSelector(state => state.erp.customerPOs);
  const quotations = useSelector(state => state.erp.quotations.filter(q => q.status === 'Accepted'));

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [custFilter, setCustFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedCPO, setSelectedCPO] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    qtRef: '',
    customerName: '',
    customerPoRef: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    deliverySchedules: [],
    paymentTerms: 'Net 30'
  });

  const handleOpenCreate = () => {
    setFormData({
      id: `CPO-2026-${Math.floor(100 + Math.random() * 900)}`,
      qtRef: '',
      customerName: '',
      customerPoRef: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      deliverySchedules: [{ date: new Date().toISOString().split('T')[0], qty: 1 }],
      paymentTerms: 'Net 30'
    });
    setFormOpen(true);
  };

  const handleQTChange = (qtId) => {
    const q = quotations.find(qt => qt.id === qtId);
    if (q) {
      const sumAmount = q.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
      const deliverySchedules = q.items.map(item => ({
        date: new Date().toISOString().split('T')[0],
        qty: item.qty
      }));

      setFormData(prev => ({
        ...prev,
        qtRef: qtId,
        customerName: q.customerName,
        amount: sumAmount,
        deliverySchedules,
        paymentTerms: q.paymentTerms
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        qtRef: '',
        customerName: '',
        amount: 0,
        deliverySchedules: [],
        paymentTerms: 'Net 30'
      }));
    }
  };

  const handleSave = () => {
    if (!formData.qtRef) {
      alert('Approved Quotation reference is required.');
      return;
    }
    if (!formData.customerPoRef.trim()) {
      alert('Customer PO number is required.');
      return;
    }

    dispatch(addCustomerPO(formData));
    setFormOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete Customer PO ${id}?`)) {
      dispatch(deleteCustomerPO(id));
    }
  };

  // Filter
  const filteredCPOs = customerPOs.filter(cpo => {
    const matchesSearch = cpo.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cpo.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cpo.customerPoRef.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCust = custFilter ? cpo.customerName.includes(custFilter) : true;

    return matchesSearch && matchesCust;
  });

  // Export
  const handleExportExcel = () => {
    const data = filteredCPOs.map(cpo => ({
      'ERP CPO ID': cpo.id,
      'Quotation Ref': cpo.qtRef,
      'Client PO Number': cpo.customerPoRef,
      'Client Name': cpo.customerName,
      'Date': cpo.date,
      'Contract Value': cpo.amount,
      'Terms': cpo.paymentTerms
    }));
    exportToExcel(data, 'Customer_POs', 'CustomerPOs');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'ERP CPO ID' },
      { field: 'qtRef', headerName: 'Quotation Ref' },
      { field: 'customerPoRef', headerName: 'Client PO Number' },
      { field: 'customerName', headerName: 'Client Name' },
      { field: 'amount', headerName: 'Value' }
    ];
    exportToPDF(cols, filteredCPOs, 'Customer_POs', 'Customer PO Registry Report');
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Customer Purchase Order Management</h2>
          <p className="subtitle">Register client purchase orders, record file attachments, and lock delivery release milestones.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-secondary" onClick={handleExportPDF}>
            <FileText size={16} /> PDF
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Register Customer PO
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by CPO ID, Client PO Ref, Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={custFilter} onChange={(e) => setCustFilter(e.target.value)}>
            <option value="">All Customers</option>
            {customerPOs.map(cpo => (
              <option key={cpo.id} value={cpo.customerName}>{cpo.customerName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>ERP CPO ID</th>
              <th>Quotation Ref</th>
              <th>Client PO Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>PO Value</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCPOs.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No Customer POs registered yet.</td>
              </tr>
            ) : (
              filteredCPOs.map((cpo) => (
                <tr key={cpo.id}>
                  <td className="bold-cell">{cpo.id}</td>
                  <td className="text-muted">{cpo.qtRef}</td>
                  <td className="bold-cell">{cpo.customerPoRef}</td>
                  <td>{cpo.customerName}</td>
                  <td>{cpo.date}</td>
                  <td className="bold-cell">${cpo.amount.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                  <td className="actions-cell">
                    <Tooltip title="View CPO Details">
                      <IconButton size="small" onClick={() => { setSelectedCPO(cpo); setViewOpen(true); }}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Print Confirmation Voucher">
                      <IconButton size="small" onClick={() => { setSelectedCPO(cpo); setPrintOpen(true); }}>
                        <Printer size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Record">
                      <IconButton size="small" color="error" onClick={() => handleDelete(cpo.id)}>
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

      {/* CREATE CPO DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">Register Customer Purchase Order</DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <FormControl fullWidth>
              <InputLabel>Reference Accepted Quotation</InputLabel>
              <Select
                value={formData.qtRef}
                label="Reference Accepted Quotation"
                onChange={(e) => handleQTChange(e.target.value)}
              >
                {quotations.map(q => (
                  <MenuItem key={q.id} value={q.id}>{q.id} (Client: {q.customerName})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Customer PO Number (External)"
              value={formData.customerPoRef}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPoRef: e.target.value }))}
              fullWidth
              placeholder="e.g. ACE-PO-9921"
            />

            <TextField
              label="Register Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel id="payment-terms-label">Payment Terms</InputLabel>
              <Select
                labelId="payment-terms-label"
                value={formData.paymentTerms}
                label="Payment Terms"
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              >
                <MenuItem value="COD">COD (Cash on Delivery)</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Net 15">Net 15 Days</MenuItem>
                <MenuItem value="Net 30">Net 30 Days</MenuItem>
                <MenuItem value="Net 60">Net 60 Days</MenuItem>
                <MenuItem value="Net 90">Net 90 Days</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="dialog-grid" style={{ marginTop: '16px' }}>
            <TextField
              label="Customer Name"
              value={formData.customerName}
              fullWidth
              disabled
            />

            <TextField
              label="Order Total Value ($)"
              value={formData.amount}
              fullWidth
              disabled
            />
          </div>



          {/* Schedules */}
          {formData.deliverySchedules.length > 0 && (
            <div className="line-items-section">
              <h4>Required Delivery Schedule</h4>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Schedule Target Date</TableCell>
                    <TableCell width="250">Target Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.deliverySchedules.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{s.date}</TableCell>
                      <TableCell>{s.qty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Register PO</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Customer PO details - {selectedCPO?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedCPO && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>Quotation Reference:</strong> <span>{selectedCPO.qtRef}</span>
              </div>
              <div className="view-detail-row">
                <strong>Customer:</strong> <span>{selectedCPO.customerName}</span>
              </div>
              <div className="view-detail-row">
                <strong>External PO Number:</strong> <span>{selectedCPO.customerPoRef}</span>
              </div>
              <div className="view-detail-row">
                <strong>Date Registered:</strong> <span>{selectedCPO.date}</span>
              </div>
              <div className="view-detail-row">
                <strong>Order Value Total:</strong> <span>${selectedCPO.amount.toLocaleString()}</span>
              </div>
              <div className="view-detail-row">
                <strong>Payment Terms:</strong> <span>{selectedCPO.paymentTerms}</span>
              </div>

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Delivery Schedule Targets</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Schedule Date</TableCell>
                    <TableCell align="right">Target Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCPO.deliverySchedules.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{s.date}</TableCell>
                      <TableCell align="right">{s.qty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
          {selectedCPO && (
            <div className="print-voucher-area" id="print-area">
              <div className="print-header">
                <div>
                  <h1 className="company-title">TRADEWARE ERP SYSTEMS</h1>
                  <p>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</p>
                  <p>Email: contact@tradeware.com | Tel: 6543-2109</p>
                </div>
                <div className="voucher-title-block">
                  <h2>CUSTOMER PO CONFIRMATION</h2>
                  <p><strong>ERP CPO VOUCHER:</strong> {selectedCPO.id}</p>
                  <p><strong>DATE LOGGED:</strong> {selectedCPO.date}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>ORDERING CUSTOMER:</strong></p>
                  <p className="bold-cell">{selectedCPO.customerName}</p>
                  <p>Terms: {selectedCPO.paymentTerms}</p>
                </div>
                <div>
                  <p><strong>CLIENT PO REF:</strong> {selectedCPO.customerPoRef}</p>
                  <p><strong>QUOTATION REFERENCE:</strong> {selectedCPO.qtRef}</p>
                  <p><strong>PO VALUE:</strong> ${selectedCPO.amount.toFixed(2)}</p>
                </div>
              </div>

              <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Milestone Delivery Schedule</h4>
              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Target Delivery Date</th>
                    <th className="num-col">Authorized Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCPO.deliverySchedules.map((s, idx) => (
                    <tr key={idx}>
                      <td>{s.date}</td>
                      <td className="num-col">{s.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="print-remarks">
                <p>A corporate contract has been locked for the customer order outlined above. Items will be released according to scheduling details.</p>
              </div>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Registered Clerk (Receiving Officer)</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Authorized Sales Lead (Audit Check)</p>
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
            Print Voucher
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CustomerPO;

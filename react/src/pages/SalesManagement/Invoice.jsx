import { formatDate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Printer, FileSpreadsheet, FileText, Trash, Edit
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';


const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const INVOICE_API = 'http://127.0.0.1:8000/api/sales/invoices';
  const SO_API = 'http://127.0.0.1:8000/api/sales/orders';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, soRes, custRes] = await Promise.all([
        fetch(INVOICE_API).then(r => r.json()),
        fetch(SO_API).then(r => r.json()),
        fetch(`${SO_API}/masters/customers`).then(r => r.json())
      ]);
      setInvoices(invRes);
      // Filter out SOs that already have invoices generated
      setSalesOrders(soRes.filter(so => !so.invoiceGenerated));
      setCustomers(custRes);
    } catch (err) {
      console.error('API Error:', err);
      alert('Failed to load data from backend.');
    }
  };

  // States
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    invoiceId: '',
    soId: '',
    cpoRef: '',
    customerName: '',
    amount: 0,
    taxAmount: 0,
    taxType: 'IGST',
    total: 0,
    items: []
  });

  const handleOpenCreate = () => {
    setFormData({
      invoiceId: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      soId: '',
      cpoRef: '',
      customerName: '',
      amount: 0,
      taxAmount: 0,
      taxType: 'IGST',
      total: 0,
      items: []
    });
    setFormOpen(true);
  };

  const handleSOChange = (soId) => {
    const so = salesOrders.find(s => s.id === soId);
    if (so) {
      const cust = customers.find(c => c.name === so.customerName);
      let taxType = 'IGST';
      if (cust && cust.gstDetails && cust.gstDetails.stateCode === '33') {
        taxType = 'SGST';
      }

      // Calculate totals
      const totalTaxable = so.items.reduce((acc, curr) => acc + (curr.suppliedQty * curr.unitPrice), 0);
      const tax = totalTaxable * 0.18; // 18% standard tax
      const finalTotal = totalTaxable + tax;

      setFormData(prev => ({
        ...prev,
        soId,
        cpoRef: so.cpoRef,
        customerName: so.customerName,
        items: so.items,
        amount: totalTaxable,
        taxType,
        taxAmount: tax,
        total: finalTotal
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        soId: '',
        cpoRef: '',
        customerName: '',
        items: [],
        amount: 0,
        taxAmount: 0,
        taxType: 'IGST',
        total: 0
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.soId) {
      alert('Sales Order reference is required.');
      return;
    }

    try {
      const res = await fetch(INVOICE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed');
      setFormOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to create Invoice');
    }
  };

  const handleEditSave = async () => {
    if (!formData.soId) {
      alert('Sales Order reference is required.');
      return;
    }

    try {
      const res = await fetch(`${INVOICE_API}/${formData.invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed');
      setEditOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to update Invoice');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete Invoice ${id}?`)) {
      try {
        const res = await fetch(`${INVOICE_API}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed');
        fetchData();
      } catch (err) {
        alert('Failed to delete Invoice');
      }
    }
  };

  // Filter
  const filteredInvoices = invoices.filter(inv => {
    return inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           inv.soId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Export
  const handleExportExcel = () => {
    const data = filteredInvoices.map(inv => ({
      'Invoice No': inv.invoiceId,
      'SO Ref': inv.soId,
      'Customer': inv.customerName,
      'Tax Type': inv.taxType,
      'Tax Amount': inv.taxAmount,
      'Grand Total': inv.total
    }));
    exportToExcel(data, 'Invoices', 'Invoices');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Invoice No' },
      { field: 'soRef', headerName: 'SO Ref' },
      { field: 'customerName', headerName: 'Customer' },
      { field: 'taxType', headerName: 'Tax Type' },
      { field: 'grandTotal', headerName: 'Grand Total' }
    ];
    exportToPDF(cols, filteredInvoices, 'Invoices', 'Invoices Registry');
  };

  const pendingSOs = salesOrders.filter(so => !so.invoiceGenerated);

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Invoice Management</h2>
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
      </div>

      {/* Grid */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>SO Ref</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Tax Type</th>
              <th className="num-col text-right">Tax Amount (₹)</th>
              <th className="num-col text-right">Grand Total (₹)</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No Invoices found matching parameters.</td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.invoiceId}>
                  <td className="bold-cell ">{inv.invoiceId}</td>
                  <td className="text-muted ">{inv.soId}</td>
                  <td >{inv.customerName}</td>
                  <td>{formatDate(inv.date)}</td>
                  <td >
                    <Chip 
                      label={inv.taxType} 
                      color={inv.taxType === 'SGST' ? 'secondary' : 'primary'} 
                      size="small" 
                    />
                  </td>
                  <td className="num-col text-right">{inv.taxAmount?.toFixed(2)}</td>
                  <td className="num-col bold-cell text-right">{inv.total?.toFixed(2)}</td>
                  <td className="actions-cell ">
                    <Tooltip title="View Invoice Details">
                      <IconButton size="small" onClick={() => { setSelectedInvoice(inv); setViewOpen(true); }}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Invoice">
                      <IconButton size="small" color="primary" onClick={() => { 
                        setSelectedInvoice(inv); 
                        setFormData({
                          invoiceId: inv.invoiceId,
                          soId: inv.soId,
                          cpoRef: inv.cpoRef,
                          customerName: inv.customerName,
                          amount: inv.amount || 0,
                          taxAmount: inv.taxAmount || 0,
                          taxType: inv.taxType || 'IGST',
                          total: inv.total || 0,
                          items: inv.items || []
                        }); 
                        setEditOpen(true); 
                      }}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Tax Invoice">
                      <IconButton size="small" color="primary" onClick={() => { setSelectedInvoice(inv); setPrintOpen(true); }}>
                        <Printer size={16} />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE INVOICE DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          Invoice
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <FormControl fullWidth>
              <InputLabel>Select Pending Sales Order</InputLabel>
              <Select
                value={formData.soId}
                label="Select Pending Sales Order"
                onChange={(e) => handleSOChange(e.target.value)}
              >
                {pendingSOs.length === 0 && <MenuItem value="" disabled>No pending sales orders</MenuItem>}
                {pendingSOs.map(so => (
                  <MenuItem key={so.id} value={so.id}>{so.id} (Client: {so.customerName})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Invoice Number (Auto-assigned)"
              value={formData.invoiceId}
              fullWidth
              disabled
            />

            <TextField
              label="Customer Name"
              value={formData.customerName}
              fullWidth
              disabled
            />

            <TextField
              label="Tax Type"
              value={formData.soId ? (formData.taxType + " (18%)") : ''}
              fullWidth
              disabled
            />
          </div>

          {formData.items.length > 0 && (
            <div className="line-items-section" style={{ marginTop: '20px' }}>
              <h4>Supplied Line Items</h4>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell className="text-right" align="right">Supply Qty</TableCell>
                    <TableCell className="text-right" align="right">Unit Value (₹)</TableCell>
                    <TableCell align="right">Tax (18%) (₹)</TableCell>
                    <TableCell align="right">Subtotal (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, idx) => {
                    const itemSubtotal = item.suppliedQty * item.unitPrice;
                    const itemTax = itemSubtotal * 0.18;
                    return (
                    <TableRow key={idx}>
                      <TableCell>{item.name} ({item.itemId})</TableCell>
                      <TableCell className="text-right" align="right">{item.suppliedQty}</TableCell>
                      <TableCell className="text-right" align="right">{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right" align="right">{itemTax.toFixed(2)}</TableCell>
                      <TableCell align="right" className="bold-cell text-right">
                        {itemSubtotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )})}
                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell colSpan={4} align="right"><strong>Taxable Subtotal</strong></TableCell>
                    <TableCell className="text-right" align="right"><strong>{formData.amount.toFixed(2)}</strong></TableCell>
                  </TableRow>
                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell colSpan={4} align="right" ><strong>{formData.taxType} (18%)</strong></TableCell>
                    <TableCell className="text-right" align="right"><strong>{formData.taxAmount.toFixed(2)}</strong></TableCell>
                  </TableRow>
                  <TableRow style={{ backgroundColor: '#e3f2fd' }}>
                    <TableCell colSpan={4} align="right"><strong style={{ color: '#1565C0' }}>Grand Net Receivable</strong></TableCell>
                    <TableCell className="text-right" align="right"><strong style={{ color: '#1565C0', fontSize: '1.1em' }}>₹ {formData.total.toFixed(2)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="success" disabled={!formData.soId}>Save</Button>
        </DialogActions>
      </Dialog>

{/* EDIT INVOICE DIALOG */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          Edit
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <FormControl fullWidth>
              <InputLabel>Select Pending Sales Order</InputLabel>
              <Select
                value={formData.soId}
                label="Select Pending Sales Order"
                onChange={(e) => handleSOChange(e.target.value)}
              >
                {pendingSOs.length === 0 && <MenuItem value="" disabled>No pending sales orders</MenuItem>}
                {pendingSOs.map(so => (
                  <MenuItem key={so.id} value={so.id}>{so.id} (Client: {so.customerName})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Invoice Number (Auto-assigned)"
              value={formData.invoiceId}
              fullWidth
              disabled
            />

            <TextField
              label="Customer Name"
              value={formData.customerName}
              fullWidth
              disabled
            />

            <TextField
              label="Tax Type"
              value={formData.soId ? (formData.taxType + " (18%)") : ''}
              fullWidth
              disabled
            />
          </div>

          {formData.items.length > 0 && (
            <div className="line-items-section" style={{ marginTop: '20px' }}>
              <h4>Supplied Line Items</h4>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell className="text-right" align="right">Supply Qty</TableCell>
                    <TableCell className="text-right" align="right">Unit Value (₹)</TableCell>
                    <TableCell align="right">Tax (18%) (₹)</TableCell>
                    <TableCell align="right">Subtotal (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, idx) => {
                    const itemSubtotal = item.suppliedQty * item.unitPrice;
                    const itemTax = itemSubtotal * 0.18;
                    return (
                    <TableRow key={idx}>
                      <TableCell>{item.name} ({item.itemId})</TableCell>
                      <TableCell className="text-right" align="right">{item.suppliedQty}</TableCell>
                      <TableCell className="text-right" align="right">{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right" align="right">{itemTax.toFixed(2)}</TableCell>
                      <TableCell align="right" className="bold-cell text-right">
                        {itemSubtotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )})}
                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell colSpan={4} align="right"><strong>Taxable Subtotal</strong></TableCell>
                    <TableCell className="text-right" align="right"><strong>{formData.amount.toFixed(2)}</strong></TableCell>
                  </TableRow>
                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell colSpan={4} align="right" ><strong>{formData.taxType} (18%)</strong></TableCell>
                    <TableCell className="text-right" align="right"><strong>{formData.taxAmount.toFixed(2)}</strong></TableCell>
                  </TableRow>
                  <TableRow style={{ backgroundColor: '#e3f2fd' }}>
                    <TableCell colSpan={4} align="right"><strong style={{ color: '#1565C0' }}>Grand Net Receivable</strong></TableCell>
                    <TableCell className="text-right" align="right"><strong style={{ color: '#1565C0', fontSize: '1.1em' }}>₹ {formData.total.toFixed(2)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="success" disabled={!formData.soId}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">Invoice Details - {selectedInvoice?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>Sales Order Reference:</strong> <span>{selectedInvoice.soRef}</span>
              </div>
              <div className="view-detail-row">
                <strong>Customer Name:</strong> <span>{selectedInvoice.customerName}</span>
              </div>
              <div className="view-detail-row">
                <strong>Invoice Date:</strong> <span>{formatDate(selectedInvoice.date)}</span>
              </div>
              
              <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', margin: '12px 0' }}>
                <strong>Tax Summary:</strong><br />
                Taxable Value: ₹ {selectedInvoice.subTotal?.toFixed(2)}<br />
                {selectedInvoice.taxType} (18%): ₹ {selectedInvoice.taxAmount?.toFixed(2)}<br />
                <strong>Grand Total Receivable: ₹ {selectedInvoice.grandTotal?.toFixed(2)}</strong>
              </div>

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Line Items</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell className="text-right" align="right">Supplied Qty</TableCell>
                    <TableCell className="text-right" align="right">Unit Price (₹)</TableCell>
                    <TableCell align="right">Tax (18%) (₹)</TableCell>
                    <TableCell align="right">Subtotal (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedInvoice.items.map((itm, idx) => {
                    const itemSubtotal = itm.suppliedQty * itm.unitPrice;
                    const itemTax = itemSubtotal * 0.18;
                    return (
                    <TableRow key={idx}>
                      <TableCell>{itm.name} ({itm.itemId})</TableCell>
                      <TableCell className="text-right" align="right">{itm.suppliedQty}</TableCell>
                      <TableCell className="text-right" align="right">{itm.unitPrice?.toFixed(2)}</TableCell>
                      <TableCell className="text-right" align="right">{itemTax?.toFixed(2)}</TableCell>
                      <TableCell className="text-right" align="right">{itemSubtotal?.toFixed(2)}</TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* PRINT VIEW (TAX INVOICE) DIALOG */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="md" fullWidth>
        <DialogContent dividers>
          {selectedInvoice && (
            <div className="print-voucher-area" id="print-area">
              <div className="print-header">
                <div>
                  <h1 className="company-title">TRADEWARE ERP SYSTEMS</h1>
                  <p>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</p>
                  <p>Email: contact@tradeware.com | Tel: 6543-2109</p>
                </div>
                <div className="voucher-title-block">
                  <h2>TAX INVOICE</h2>
                  <p><strong>INVOICE ID:</strong> {selectedInvoice.id}</p>
                  <p><strong>DATE ISSUED:</strong> {selectedInvoice.date}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>BILL TO (CLIENT):</strong></p>
                  <p className="bold-cell">{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <p><strong>REF SALES ORDER:</strong> {selectedInvoice.soRef}</p>
                  <p><strong>REF CUSTOMER PO:</strong> {selectedInvoice.cpoRef}</p>
                </div>
              </div>

              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Item Name</th>
                    <th className="num-col text-right">Qty Supplied</th>
                    <th className="num-col text-right">Unit Price (₹)</th>
                    <th className="num-col">Tax (18%) (₹)</th>
                    <th className="num-col text-right">Taxable Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((itm, idx) => {
                    const itemSubtotal = itm.suppliedQty * itm.unitPrice;
                    const itemTax = itemSubtotal * 0.18;
                    return (
                    <tr key={idx}>
                      <td >{itm.itemId}</td>
                      <td >{itm.name}</td>
                      <td className="num-col text-right">{itm.suppliedQty}</td>
                      <td className="num-col text-right">{itm.unitPrice?.toFixed(2)}</td>
                      <td className="num-col text-right">{itemTax?.toFixed(2)}</td>
                      <td className="num-col text-right">{itemSubtotal?.toFixed(2)}</td>
                    </tr>
                  )})}
                  <tr className="subtotal-row">
                    <td colSpan="5">Subtotal Taxable Amount</td>
                    <td className="num-col text-right">{selectedInvoice.subTotal?.toFixed(2)}</td>
                  </tr>
                  <tr className="subtotal-row">
                    <td colSpan="5" >{selectedInvoice.taxType} (18% Tax)</td>
                    <td className="num-col text-right">{selectedInvoice.taxAmount?.toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan="5">Grand Net Payable Value</td>
                    <td className="num-col text-right">{selectedInvoice.grandTotal?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-remarks">
                <p>This is a computer generated commercial Tax Invoice. Payment terms net 30 apply from date issued.</p>
              </div>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Prepared By (Finance Officer)</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Authorized Signature (Director)</p>
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
            Print Tax Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Invoice;

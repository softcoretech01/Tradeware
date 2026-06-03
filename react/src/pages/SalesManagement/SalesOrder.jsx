import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Edit, Trash, Check, X, Printer,
  FileSpreadsheet, FileText, Receipt, PackageCheck
} from 'lucide-react';
import { 
  addSalesOrder, 
  updateSalesOrder, 
  updateSODeliveryQty,
  generateInvoice, 
  deleteSalesOrder 
} from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const SalesOrder = () => {
  const dispatch = useDispatch();

  // Store Selectors
  const salesOrders = useSelector(state => state.erp.salesOrders);
  const customerPOs = useSelector(state => state.erp.customerPOs);
  const quotations = useSelector(state => state.erp.quotations);
  const warehouses = useSelector(state => state.locations.warehouses);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedSO, setSelectedSO] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    cpoRef: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    warehouse: 'WH-MAIN-RACK2',
    deliveryStatus: 'Pending',
    deliverySchedule: '',
    invoiceGenerated: false,
    invoiceDetails: null
  });

  const handleOpenCreate = () => {
    setFormData({
      id: `SO-2026-${Math.floor(100 + Math.random() * 900)}`,
      cpoRef: '',
      customerName: '',
      date: new Date().toISOString().split('T')[0],
      items: [],
      warehouse: warehouses[0]?.name || 'SINGAPORE CENTRAL WAREHOUSE',
      deliveryStatus: 'Pending',
      deliverySchedule: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
      invoiceGenerated: false,
      invoiceDetails: null
    });
    setFormOpen(true);
  };

  const handleCPOChange = (cpoId) => {
    const cpo = customerPOs.find(c => c.id === cpoId);
    if (cpo) {
      // Trace back to quotation items
      const quote = quotations.find(q => q.id === cpo.qtRef);
      const items = quote ? quote.items.map(itm => ({
        itemId: itm.itemId,
        name: itm.name,
        orderedQty: itm.qty,
        suppliedQty: itm.qty, // Default to full delivery
        pendingQty: 0,
        unitPrice: itm.unitPrice
      })) : [];

      setFormData(prev => ({
        ...prev,
        cpoRef: cpoId,
        customerName: cpo.customerName,
        items
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cpoRef: '',
        customerName: '',
        items: []
      }));
    }
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formData.items];
    if (field === 'suppliedQty') {
      const sup = parseFloat(value) || 0;
      updated[idx] = {
        ...updated[idx],
        suppliedQty: sup,
        pendingQty: Math.max(0, updated[idx].orderedQty - sup)
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
    if (!formData.cpoRef) {
      alert('Customer PO reference is required.');
      return;
    }
    if (formData.items.length === 0) {
      alert('No line items found for the order.');
      return;
    }

    dispatch(addSalesOrder(formData));
    setFormOpen(false);
  };

  const handleOpenInvoiceModal = (so) => {
    alert('Invoice generation has been moved to the dedicated Invoice module. Please go to Sales & Orders -> Invoice to generate a tax invoice.');
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete Sales Order ${id}?`)) {
      dispatch(deleteSalesOrder(id));
    }
  };

  // Filter
  const filteredSOs = salesOrders.filter(so => {
    const matchesSearch = so.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          so.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          so.cpoRef.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDelivery = deliveryFilter ? so.deliveryStatus === deliveryFilter : true;

    return matchesSearch && matchesDelivery;
  });

  // Export
  const handleExportExcel = () => {
    const data = filteredSOs.map(so => ({
      'Sales Order No': so.id,
      'CPO Ref': so.cpoRef,
      'Customer': so.customerName,
      'Order Date': so.date,
      'Dispatch Origin': so.warehouse,
      'Delivery Schedule': so.deliverySchedule,
      'Invoice Status': so.invoiceGenerated ? 'Generated' : 'Pending',
      'Value Supplied': so.items.reduce((acc, i) => acc + (i.suppliedQty * i.unitPrice), 0)
    }));
    exportToExcel(data, 'Sales_Orders', 'SalesOrders');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Sales Order No' },
      { field: 'cpoRef', headerName: 'CPO Ref' },
      { field: 'customerName', headerName: 'Customer' },
      { field: 'deliveryStatus', headerName: 'Delivery' },
      { field: 'deliverySchedule', headerName: 'Schedule' }
    ];
    exportToPDF(cols, filteredSOs, 'Sales_Orders', 'Sales Orders Dispatch Registry');
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Sales Order Management</h2>
          <p className="subtitle">Execute order dispatches, manage warehouse allocations, track partial supply, and issue tax invoices.</p>
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
            <Plus size={16} /> Create Sales Order
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by SO No, Customer, CPO Ref..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)}>
            <option value="">All Delivery Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Shipped">Partially Shipped</option>
            <option value="Fully Shipped">Fully Shipped</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Sales Order No</th>
              <th>CPO Ref</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Warehouse Origin</th>
              <th>Delivery Status</th>
              <th>Invoice Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSOs.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No Sales Orders logged matching parameters.</td>
              </tr>
            ) : (
              filteredSOs.map((so) => (
                <tr key={so.id}>
                  <td className="bold-cell">{so.id}</td>
                  <td className="text-muted">{so.cpoRef}</td>
                  <td>{so.customerName}</td>
                  <td>{so.date}</td>
                  <td>{so.warehouse}</td>
                  <td>
                    <Chip 
                      label={so.deliveryStatus} 
                      color={so.deliveryStatus === 'Fully Shipped' ? 'success' : so.deliveryStatus === 'Partially Shipped' ? 'primary' : 'default'} 
                      size="small" 
                    />
                  </td>
                  <td>
                    <Chip 
                      label={so.invoiceGenerated ? 'Invoice Generated' : 'Pending Invoice'} 
                      color={so.invoiceGenerated ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </td>
                  <td className="actions-cell">
                    <Tooltip title="View Order Details">
                      <IconButton size="small" onClick={() => { setSelectedSO(so); setViewOpen(true); }}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>

                    {!so.invoiceGenerated && (
                      <Tooltip title="Generate Tax Invoice">
                        <IconButton size="small" color="primary" onClick={() => handleOpenInvoiceModal(so)}>
                          <Receipt size={16} />
                        </IconButton>
                      </Tooltip>
                    )}

                    {so.invoiceGenerated && (
                      <Tooltip title="Print Tax Invoice">
                        <IconButton size="small" onClick={() => { setSelectedSO(so); setPrintOpen(true); }}>
                          <Printer size={16} />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Delete Order">
                      <IconButton size="small" color="error" onClick={() => handleDelete(so.id)}>
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

      {/* CREATE SO DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">Create Sales Dispatch Order</DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <FormControl fullWidth>
              <InputLabel>Reference Customer PO</InputLabel>
              <Select
                value={formData.cpoRef}
                label="Reference Customer PO"
                onChange={(e) => handleCPOChange(e.target.value)}
              >
                {customerPOs.map(cpo => (
                  <MenuItem key={cpo.id} value={cpo.id}>{cpo.id} (Client: {cpo.customerName})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Sales Order Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Dispatch Origin (Warehouse)</InputLabel>
              <Select
                value={formData.warehouse}
                label="Dispatch Origin (Warehouse)"
                onChange={(e) => setFormData(prev => ({ ...prev, warehouse: e.target.value }))}
              >
                {warehouses.map(w => (
                  <MenuItem key={w.id} value={w.name}>{w.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Expected Shipping Date"
              type="date"
              value={formData.deliverySchedule}
              onChange={(e) => setFormData(prev => ({ ...prev, deliverySchedule: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <TextField
              label="Client Name"
              value={formData.customerName}
              fullWidth
              disabled
            />
          </div>

          {formData.items.length > 0 && (
            <div className="line-items-section" style={{ marginTop: '20px' }}>
              <h4>Dispatch Allocation & Quantity Tracking</h4>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell width="120">Ordered Qty</TableCell>
                    <TableCell width="120">Supply Qty</TableCell>
                    <TableCell width="120">Pending Qty</TableCell>
                    <TableCell width="140">Unit Value</TableCell>
                    <TableCell width="140">Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.name} ({item.itemId})</TableCell>
                      <TableCell>{item.orderedQty}</TableCell>
                      <TableCell>
                        <input 
                          type="number" 
                          className="table-input"
                          value={item.suppliedQty}
                          min="1"
                          max={item.orderedQty}
                          onChange={(e) => handleItemChange(idx, 'suppliedQty', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="bold-cell" style={{ color: item.pendingQty > 0 ? 'red' : 'inherit' }}>
                        {item.pendingQty}
                      </TableCell>
                      <TableCell>INR {item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="bold-cell">
                        INR {(item.suppliedQty * item.unitPrice).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Create Dispatch Order</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Sales Order details - {selectedSO?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedSO && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>CPO Reference:</strong> <span>{selectedSO.cpoRef}</span>
              </div>
              <div className="view-detail-row">
                <strong>Customer Name:</strong> <span>{selectedSO.customerName}</span>
              </div>
              <div className="view-detail-row">
                <strong>Order Date:</strong> <span>{selectedSO.date}</span>
              </div>
              <div className="view-detail-row">
                <strong>Dispatch Origin:</strong> <span>{selectedSO.warehouse}</span>
              </div>
              <div className="view-detail-row">
                <strong>Delivery Status:</strong> 
                <Chip label={selectedSO.deliveryStatus} color="primary" size="small" />
              </div>
              <div className="view-detail-row">
                <strong>Invoice status:</strong> 
                <Chip label={selectedSO.invoiceGenerated ? 'Invoiced' : 'Pending'} color={selectedSO.invoiceGenerated ? 'success' : 'warning'} size="small" />
              </div>

              {selectedSO.invoiceGenerated && (
                <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', margin: '12px 0' }}>
                  <strong>Tax Invoice Issued:</strong><br />
                  Invoice Number: {selectedSO.invoiceDetails.id}<br />
                  Taxable Value: INR {selectedSO.invoiceDetails.amount.toFixed(2)}<br />
                  Integrated Tax (18%): INR {selectedSO.invoiceDetails.taxAmount.toFixed(2)}<br />
                  <strong>Grand Total Receivable: INR {selectedSO.invoiceDetails.total.toFixed(2)}</strong>
                </div>
              )}

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Line Items Supplied</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="right">Ordered Qty</TableCell>
                    <TableCell align="right">Supplied Qty</TableCell>
                    <TableCell align="right">Pending Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedSO.items.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{itm.name} ({itm.itemId})</TableCell>
                      <TableCell align="right">{itm.orderedQty}</TableCell>
                      <TableCell align="right">{itm.suppliedQty}</TableCell>
                      <TableCell align="right" style={{ color: itm.pendingQty > 0 ? 'red' : 'inherit' }}>{itm.pendingQty}</TableCell>
                      <TableCell align="right">INR {itm.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">INR {(itm.suppliedQty * itm.unitPrice).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!selectedSO.invoiceGenerated && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<Receipt size={16} />}
                    onClick={() => handleOpenInvoiceModal(selectedSO)}
                  >
                    Generate Invoice
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


    </div>
  );
};

export default SalesOrder;

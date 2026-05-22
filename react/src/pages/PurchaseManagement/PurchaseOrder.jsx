import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip, FormControlLabel, Checkbox
} from '@mui/material';
import { 
  Search, Plus, Eye, Edit, Trash, Check, X, Printer,
  FileSpreadsheet, FileText, Trash2, PlusCircle, Calendar
} from 'lucide-react';
import { 
  addPurchaseOrder, 
  updatePurchaseOrder, 
  approvePurchaseOrder, 
  deletePurchaseOrder 
} from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const PurchaseOrder = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  
  // Store selectors
  const purchaseOrders = useSelector(state => state.erp.purchaseOrders);
  const approvedPRs = useSelector(state => state.erp.requisitions.filter(r => r.status === 'Approved'));
  const suppliers = useSelector(state => state.suppliers.suppliers);
  const itemsMaster = useSelector(state => state.items.items);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    prRef: '',
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierName: '',
    items: [],
    paymentTerms: 'Net 30',
    isBlanket: false,
    blanketDetails: {
      contractValue: 0,
      validity: '',
      releases: []
    },
    deliverySchedules: [],
    status: 'Draft',
    deliveryStatus: 'Pending'
  });

  // Check query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      handleOpenCreate();
    }
  }, [location]);

  const handleOpenCreate = () => {
    const defaultSupp = suppliers[0];
    setFormData({
      id: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      prRef: '',
      date: new Date().toISOString().split('T')[0],
      supplierId: defaultSupp ? defaultSupp.id : '',
      supplierName: defaultSupp ? defaultSupp.name : '',
      items: [{ itemId: itemsMaster[0]?.id || '', orderedQty: 1, receivedQty: 0, unitPrice: 10, pendingQty: 1 }],
      paymentTerms: defaultSupp ? defaultSupp.paymentTerms : 'Net 30',
      isBlanket: false,
      blanketDetails: {
        contractValue: 10000,
        validity: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        releases: []
      },
      deliverySchedules: [{ date: new Date().toISOString().split('T')[0], qty: 1 }],
      status: 'Draft',
      deliveryStatus: 'Pending'
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (po) => {
    setFormData({ ...po });
    setFormOpen(true);
  };

  // PR Ref Select triggers item populating
  const handlePRChange = (prId) => {
    const pr = approvedPRs.find(r => r.id === prId);
    if (pr) {
      const items = pr.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        orderedQty: item.qty,
        receivedQty: 0,
        unitPrice: item.unitPrice,
        pendingQty: item.qty
      }));

      const deliverySchedules = pr.items.map(item => ({
        date: new Date().toISOString().split('T')[0],
        qty: item.qty
      }));

      setFormData(prev => ({
        ...prev,
        prRef: prId,
        items,
        deliverySchedules
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        prRef: '',
        items: []
      }));
    }
  };

  const handleSupplierChange = (supId) => {
    const sup = suppliers.find(s => s.id === supId);
    setFormData(prev => ({
      ...prev,
      supplierId: supId,
      supplierName: sup ? sup.name : '',
      paymentTerms: sup ? sup.paymentTerms : 'Net 30'
    }));
  };

  // Item lines logic
  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: itemsMaster[0]?.id || '', orderedQty: 1, receivedQty: 0, unitPrice: 10, pendingQty: 1 }]
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
        name: match ? match.name : ''
      };
    } else if (field === 'orderedQty') {
      const qty = parseFloat(value) || 0;
      updated[idx] = {
        ...updated[idx],
        orderedQty: qty,
        pendingQty: Math.max(0, qty - (updated[idx].receivedQty || 0))
      };
    } else {
      updated[idx] = {
        ...updated[idx],
        [field]: value
      };
    }
    setFormData(prev => ({ ...prev, items: updated }));
  };

  // Delivery Schedules
  const handleAddSchedule = () => {
    setFormData(prev => ({
      ...prev,
      deliverySchedules: [...prev.deliverySchedules, { date: new Date().toISOString().split('T')[0], qty: 1 }]
    }));
  };

  const handleRemoveSchedule = (idx) => {
    setFormData(prev => ({
      ...prev,
      deliverySchedules: prev.deliverySchedules.filter((_, i) => i !== idx)
    }));
  };

  const handleScheduleChange = (idx, field, value) => {
    const updated = [...formData.deliverySchedules];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'qty' ? (parseFloat(value) || 0) : value
    };
    setFormData(prev => ({ ...prev, deliverySchedules: updated }));
  };

  const handleSave = () => {
    if (!formData.supplierId) {
      alert('Supplier selection is required.');
      return;
    }
    if (formData.items.length === 0) {
      alert('At least one line item is required.');
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
    const exists = purchaseOrders.some(p => p.id === formData.id);

    if (exists) {
      dispatch(updatePurchaseOrder(finalData));
    } else {
      dispatch(addPurchaseOrder({ ...finalData, status: 'Pending Approval' }));
    }
    setFormOpen(false);
  };

  const handleApprove = (id, status) => {
    dispatch(approvePurchaseOrder({ id, status, approvedBy: 'John Manager' }));
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete PO ${id}?`)) {
      dispatch(deletePurchaseOrder(id));
    }
  };

  // Filters
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          po.prRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupp = supplierFilter ? po.supplierId === supplierFilter : true;
    const matchesDelivery = deliveryStatusFilter ? po.deliveryStatus === deliveryStatusFilter : true;

    return matchesSearch && matchesSupp && matchesDelivery;
  });

  // Export
  const handleExportExcel = () => {
    const data = filteredPOs.map(po => ({
      'PO Number': po.id,
      'PR Ref': po.prRef || 'Standalone',
      'Date': po.date,
      'Supplier': po.supplierName,
      'Terms': po.paymentTerms,
      'Blanket PO': po.isBlanket ? 'Yes' : 'No',
      'Total Value': po.items.reduce((acc, i) => acc + (i.orderedQty * i.unitPrice), 0),
      'Approval Status': po.status,
      'Delivery Status': po.deliveryStatus
    }));
    exportToExcel(data, 'Purchase_Orders', 'PurchaseOrders');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'PO Number' },
      { field: 'date', headerName: 'Date' },
      { field: 'supplierName', headerName: 'Supplier' },
      { field: 'paymentTerms', headerName: 'Terms' },
      { field: 'status', headerName: 'Approval' },
      { field: 'deliveryStatus', headerName: 'Delivery' }
    ];
    exportToPDF(cols, filteredPOs, 'Purchase_Orders', 'Purchase Orders Report');
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Purchase Order</h2>
          <p className="subtitle">Track supplier orders, release Blanket PO contracts, and manage schedules.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-secondary" onClick={handleExportPDF}>
            <FileText size={16} /> PDF
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by PO, PR reference, Supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select value={deliveryStatusFilter} onChange={(e) => setDeliveryStatusFilter(e.target.value)}>
            <option value="">All Delivery Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Fully Received">Fully Received</option>
          </select>
        </div>
      </div>

      {/* Grid view */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Date</th>
              <th>PR Ref</th>
              <th>Supplier</th>
              <th>Value</th>
              <th>Type</th>
              <th>Approval</th>
              <th>Delivery</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPOs.length === 0 ? (
              <tr>
                <td colSpan="9" className="table-empty">No purchase orders found matching filters.</td>
              </tr>
            ) : (
              filteredPOs.map((po) => {
                const totalValue = po.items.reduce((sum, item) => sum + (item.orderedQty * item.unitPrice), 0);
                return (
                  <tr key={po.id}>
                    <td className="bold-cell">{po.id}</td>
                    <td>{po.date}</td>
                    <td className="text-muted">{po.prRef || 'Direct'}</td>
                    <td>{po.supplierName}</td>
                    <td className="bold-cell">${totalValue.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                    <td>
                      <Chip 
                        label={po.isBlanket ? 'Blanket Contract' : 'Standard'} 
                        variant="outlined" 
                        color={po.isBlanket ? 'secondary' : 'default'} 
                        size="small" 
                      />
                    </td>
                    <td>
                      <Chip 
                        label={po.status} 
                        color={po.status === 'Approved' ? 'success' : po.status === 'Pending Approval' ? 'warning' : 'error'} 
                        size="small" 
                      />
                    </td>
                    <td>
                      <Chip 
                        label={po.deliveryStatus} 
                        color={po.deliveryStatus === 'Fully Received' ? 'success' : po.deliveryStatus === 'Partially Received' ? 'primary' : 'default'} 
                        size="small" 
                      />
                    </td>
                    <td className="actions-cell">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => { setSelectedPO(po); setViewOpen(true); }}>
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>

                      {po.status === 'Draft' && (
                        <Tooltip title="Edit PO">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(po)}>
                            <Edit size={16} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {po.status === 'Pending Approval' && (
                        <>
                          <Tooltip title="Approve PO">
                            <IconButton size="small" className="btn-icon-success" onClick={() => handleApprove(po.id, 'Approved')}>
                              <Check size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject PO">
                            <IconButton size="small" className="btn-icon-danger" onClick={() => handleApprove(po.id, 'Rejected')}>
                              <X size={16} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip title="Print PO">
                        <IconButton size="small" onClick={() => { setSelectedPO(po); setPrintOpen(true); }}>
                          <Printer size={16} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(po.id)}>
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
          {purchaseOrders.some(p => p.id === formData.id) ? 'Edit Purchase Order' : 'Create Purchase Order'} ({formData.id})
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <FormControl fullWidth>
              <InputLabel>Reference PR</InputLabel>
              <Select
                value={formData.prRef}
                label="Reference PR"
                onChange={(e) => handlePRChange(e.target.value)}
              >
                <MenuItem value=""><em>None (Standalone PO)</em></MenuItem>
                {approvedPRs.map(pr => (
                  <MenuItem key={pr.id} value={pr.id}>{pr.id} (Requester: {pr.requester})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="PO Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={formData.supplierId}
                label="Supplier"
                onChange={(e) => handleSupplierChange(e.target.value)}
              >
                {suppliers.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name} ({s.id})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Payment Terms"
              value={formData.paymentTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              fullWidth
            />
          </div>

          {/* Blanket PO Option */}
          <div style={{ margin: '16px 0', padding: '12px', border: '1px solid var(--border)', borderRadius: '6px' }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={formData.isBlanket} 
                  onChange={(e) => setFormData(prev => ({ ...prev, isBlanket: e.target.checked }))} 
                />
              }
              label="Mark as Blanket Purchase Agreement (Contract)"
            />

            {formData.isBlanket && (
              <div className="dialog-grid" style={{ marginTop: '12px' }}>
                <TextField
                  label="Contract Limit Value ($)"
                  type="number"
                  value={formData.blanketDetails.contractValue}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    blanketDetails: { ...prev.blanketDetails, contractValue: parseFloat(e.target.value) || 0 }
                  }))}
                  fullWidth
                />
                <TextField
                  label="Agreement Validity Date"
                  type="date"
                  value={formData.blanketDetails.validity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    blanketDetails: { ...prev.blanketDetails, validity: e.target.value }
                  }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="line-items-section">
            <div className="section-title-row">
              <h4>Purchase Line Items</h4>
              {!formData.prRef && (
                <Button startIcon={<PlusCircle size={16} />} size="small" onClick={handleAddLineItem}>
                  Add Line
                </Button>
              )}
            </div>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell width="120">Order Qty</TableCell>
                  <TableCell width="140">Unit Cost</TableCell>
                  <TableCell width="140">Line Total</TableCell>
                  {!formData.prRef && <TableCell width="80" align="center">Action</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {formData.prRef ? (
                        <span>{item.name || itemsMaster.find(i => i.id === item.itemId)?.name} ({item.itemId})</span>
                      ) : (
                        <select 
                          className="table-select" 
                          value={item.itemId}
                          onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                        >
                          {itemsMaster.map(itm => (
                            <option key={itm.id} value={itm.id}>{itm.name} ({itm.id})</option>
                          ))}
                        </select>
                      )}
                    </TableCell>
                    <TableCell>
                      <input 
                        type="number" 
                        className="table-input"
                        value={item.orderedQty}
                        min="1"
                        onChange={(e) => handleItemChange(idx, 'orderedQty', parseFloat(e.target.value) || 0)}
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
                      ${(item.orderedQty * item.unitPrice).toFixed(2)}
                    </TableCell>
                    {!formData.prRef && (
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleRemoveLineItem(idx)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Delivery Schedule Section */}
          <div className="line-items-section" style={{ marginTop: '20px' }}>
            <div className="section-title-row">
              <h4>Delivery & Release Schedule</h4>
              <Button startIcon={<Calendar size={16} />} size="small" onClick={handleAddSchedule}>
                Add Release Date
              </Button>
            </div>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Expected Delivery Date</TableCell>
                  <TableCell width="250">Target Quantity</TableCell>
                  <TableCell width="80" align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.deliverySchedules.map((sched, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <input 
                        type="date" 
                        className="table-input"
                        value={sched.date}
                        onChange={(e) => handleScheduleChange(idx, 'date', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <input 
                        type="number" 
                        className="table-input"
                        value={sched.qty}
                        min="1"
                        onChange={(e) => handleScheduleChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveSchedule(idx)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Draft Order</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Purchase Order - {selectedPO?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedPO && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>Supplier:</strong> <span>{selectedPO.supplierName}</span>
              </div>
              <div className="view-detail-row">
                <strong>Date:</strong> <span>{selectedPO.date}</span>
              </div>
              <div className="view-detail-row">
                <strong>PR Reference:</strong> <span>{selectedPO.prRef || 'Direct Standalone'}</span>
              </div>
              <div className="view-detail-row">
                <strong>Payment Terms:</strong> <span>{selectedPO.paymentTerms}</span>
              </div>
              <div className="view-detail-row">
                <strong>Approval:</strong> 
                <Chip label={selectedPO.status} color={selectedPO.status==='Approved' ? 'success':'warning'} size="small" />
              </div>
              <div className="view-detail-row">
                <strong>Delivery Status:</strong> 
                <Chip label={selectedPO.deliveryStatus} color="primary" size="small" />
              </div>

              {selectedPO.isBlanket && (
                <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', margin: '10px 0' }}>
                  <strong>Blanket PO details:</strong><br />
                  Contract Limit: ${selectedPO.blanketDetails.contractValue.toLocaleString()}<br />
                  Validity Date: {selectedPO.blanketDetails.validity}
                </div>
              )}

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Order Line Items</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="right">Qty Ordered</TableCell>
                    <TableCell align="right">Qty Received</TableCell>
                    <TableCell align="right">Qty Pending</TableCell>
                    <TableCell align="right">Unit Cost</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPO.items.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{itm.name} ({itm.itemId})</TableCell>
                      <TableCell align="right">{itm.orderedQty}</TableCell>
                      <TableCell align="right">{itm.receivedQty || 0}</TableCell>
                      <TableCell align="right" style={{ color: itm.pendingQty > 0 ? 'var(--warning)' : 'inherit' }}>
                        {itm.pendingQty}
                      </TableCell>
                      <TableCell align="right">${itm.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">${(itm.orderedQty * itm.unitPrice).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} align="right"><strong>Grand Total Value:</strong></TableCell>
                    <TableCell align="right" className="bold-cell">
                      ${selectedPO.items.reduce((sum, i) => sum + (i.orderedQty * i.unitPrice), 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Delivery Schedule Releases</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Expected Date</TableCell>
                    <TableCell align="right">Quantity Released</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPO.deliverySchedules.map((s, idx) => (
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
          {selectedPO && (
            <div className="print-voucher-area" id="print-area">
              <div className="print-header">
                <div>
                  <h1 className="company-title">TRADEWARE ERP SYSTEMS</h1>
                  <p>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</p>
                  <p>Email: contact@tradeware.com | Tel: 6543-2109</p>
                </div>
                <div className="voucher-title-block">
                  <h2>PURCHASE ORDER</h2>
                  <p><strong>PO NUMBER:</strong> {selectedPO.id}</p>
                  <p><strong>DATE:</strong> {selectedPO.date}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>VENDOR / SUPPLIER:</strong></p>
                  <p className="bold-cell">{selectedPO.supplierName}</p>
                  <p>Terms: {selectedPO.paymentTerms}</p>
                </div>
                <div>
                  <p><strong>PR REFERENCE:</strong> {selectedPO.prRef || 'Direct Standalone'}</p>
                  <p><strong>TYPE:</strong> {selectedPO.isBlanket ? 'Blanket Contract' : 'Standard PO'}</p>
                  <p><strong>DELIVERY STATUS:</strong> {selectedPO.deliveryStatus}</p>
                </div>
              </div>

              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Item Name</th>
                    <th className="num-col">Qty Ordered</th>
                    <th className="num-col">Qty Received</th>
                    <th className="num-col">Unit Price</th>
                    <th className="num-col">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items.map((itm, idx) => (
                    <tr key={idx}>
                      <td>{itm.itemId}</td>
                      <td>{itm.name}</td>
                      <td className="num-col">{itm.orderedQty}</td>
                      <td className="num-col">{itm.receivedQty || 0}</td>
                      <td className="num-col">${itm.unitPrice.toFixed(2)}</td>
                      <td className="num-col">${(itm.orderedQty * itm.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="5">Purchase Value Total</td>
                    <td className="num-col">${selectedPO.items.reduce((sum, i) => sum + (i.orderedQty * i.unitPrice), 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Authorized Purchasing Officer</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space">{selectedPO.approvedBy ? selectedPO.approvedBy : ''}</div>
                  <p>Authorized Director Approval</p>
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
            Print Purchase Order
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PurchaseOrder;

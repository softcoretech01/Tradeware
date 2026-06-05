import { formatDate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Tooltip, Chip
} from '@mui/material';
import {
  Search, Plus, Eye, Edit, Trash, Printer,
  FileSpreadsheet, Trash2, PlusCircle, Calendar
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const API_BASE_URL = 'http://127.0.0.1:8000/api/purchase/orders';
const REQ_API_URL = 'http://127.0.0.1:8000/api/purchase/requisitions';

const PurchaseOrder = () => {
  const location = useLocation();

  // Data states
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [approvedPRs, setApprovedPRs] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    po_id: null,
    po_number: '',
    pr_id: '',
    po_date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    payment_terms: 'Net 30',
    items: [],
    schedules: [],
    sub_total: 0,
    tax_total: 0,
    grand_total: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchPOs = async () => {
    try {
      let url = `${API_BASE_URL}/`;
      if (searchTerm) url += `?search=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPurchaseOrders(data);
      }
    } catch (error) {
      console.error("Error fetching POs:", error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPOs();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, supRes, prRes, itemRes] = await Promise.all([
        fetch(`${API_BASE_URL}/`),
        fetch(`${API_BASE_URL}/dropdown/suppliers`),
        fetch(`${API_BASE_URL}/dropdown/requisitions`),
        fetch(`${REQ_API_URL}/dropdown/items`)
      ]);
      
      if (poRes.ok) setPurchaseOrders(await poRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
      if (prRes.ok) setApprovedPRs(await prRes.json());
      if (itemRes.ok) setItemsMaster(await itemRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true' && !loading) {
      handleOpenCreate();
    }
  }, [location, loading]);

  const handleOpenCreate = () => {
    let nextNum = 1;
    if (purchaseOrders.length > 0) {
      const nums = purchaseOrders.map(po => {
        const match = po.po_number.match(/PO-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const nextPoNumber = `PO-${String(nextNum).padStart(3, '0')}`;

    setFormData({
      po_id: null,
      po_number: nextPoNumber,
      pr_id: '',
      po_date: new Date().toISOString().split('T')[0],
      supplier_id: suppliers.length > 0 ? suppliers[0].id : '',
      payment_terms: 'Net 30',
      items: [{ item_id: itemsMaster[0]?.id || '', quantity: 1, uom: 'pcs', unit_price: itemsMaster[0]?.standardPrice || 0, line_total: itemsMaster[0]?.standardPrice || 0 }],
      schedules: [{ expected_delivery_date: new Date().toISOString().split('T')[0], target_quantity: 1 }],
      sub_total: 0,
      tax_total: 0,
      grand_total: 0
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (po) => {
    setFormData({
      ...po,
      pr_id: po.pr_id || '', // Ensure it's not null for the select dropdown
      items: po.items.map(item => ({ ...item, quantity: Number(item.quantity) })),
      schedules: po.schedules.map(sched => ({ ...sched, target_quantity: Number(sched.target_quantity) }))
    });
    setFormOpen(true);
  };

  const handlePRChange = (prId) => {
    const pr = approvedPRs.find(r => r.pr_id === prId);
    if (pr) {
      const mappedItems = pr.items.map(item => ({
        item_id: item.item_id,
        quantity: Number(item.requested_quantity),
        uom: item.uom || 'pcs',
        unit_price: item.unit_price || 0,
        line_total: item.requested_quantity * (item.unit_price || 0)
      }));

      const schedules = pr.items.map(item => ({
        expected_delivery_date: new Date().toISOString().split('T')[0],
        target_quantity: Number(item.requested_quantity)
      }));

      setFormData(prev => ({
        ...prev,
        pr_id: prId,
        items: mappedItems,
        schedules
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        pr_id: '',
        items: [],
        schedules: []
      }));
    }
  };

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_id: itemsMaster[0]?.id || '', quantity: 1, uom: 'pcs', unit_price: itemsMaster[0]?.standardPrice || 0, line_total: itemsMaster[0]?.standardPrice || 0 }]
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
    let item = { ...updated[idx], [field]: value };

    if (field === 'item_id') {
      const match = itemsMaster.find(i => i.id === value);
      item.unit_price = match ? match.standardPrice : 0;
    }
    
    // Auto calculate line_total
    item.line_total = (item.quantity || 0) * (item.unit_price || 0);
    updated[idx] = item;
    
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleAddSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, { expected_delivery_date: new Date().toISOString().split('T')[0], target_quantity: 1 }]
    }));
  };

  const handleRemoveSchedule = (idx) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== idx)
    }));
  };

  const handleScheduleChange = (idx, field, value) => {
    const updated = [...formData.schedules];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData(prev => ({ ...prev, schedules: updated }));
  };

  const handleSave = async () => {
    if (!formData.supplier_id) {
      alert('Supplier selection is required.');
      return;
    }
    if (formData.items.length === 0) {
      alert('At least one line item is required.');
      return;
    }

    const payload = {
      po_number: formData.po_number,
      pr_id: formData.pr_id || null,
      supplier_id: formData.supplier_id,
      po_date: formData.po_date,
      payment_terms: formData.payment_terms,
      sub_total: formData.items.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0),
      tax_total: 0,
      grand_total: formData.items.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0),
      items: formData.items.map(i => ({
        ...i,
        tax_rate: 0
      })),
      schedules: formData.schedules
    };

    try {
      let response;
      if (formData.po_id) {
        response = await fetch(`${API_BASE_URL}/${formData.po_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        fetchPOs();
        setFormOpen(false);
      } else {
        const err = await response.json();
        alert(`Save failed: ${JSON.stringify(err)}`);
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (po_id) => {
    if (window.confirm(`Are you sure you want to delete this PO?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/${po_id}`, { method: 'DELETE' });
        if (response.ok) fetchPOs();
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const getSupplierName = (id) => {
    const s = suppliers.find(sup => sup.id === id);
    return s ? s.name : id;
  };

  const getItemName = (id) => {
    const i = itemsMaster.find(item => item.id === id);
    return i ? i.name : id;
  };

  const getPRNumber = (id) => {
    if (!id) return 'Direct';
    const pr = approvedPRs.find(r => r.pr_id === id);
    return pr ? pr.pr_number : `PR ID: ${id}`;
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSupp = supplierFilter ? po.supplier_id === supplierFilter : true;
    return matchesSupp; // Search term is handled by API
  });

  const handleExportExcel = () => {
    const data = filteredPOs.map(po => ({
      'PO Number': po.po_number,
      'PR Ref': getPRNumber(po.pr_id),
      'Date': po.po_date,
      'Supplier': getSupplierName(po.supplier_id),
      'Terms': po.payment_terms,
      'Total Value': po.grand_total
    }));
    exportToExcel(data, 'Purchase_Orders', 'PurchaseOrders');
  };

  if (loading) return <div style={{ padding: 20 }}>Loading Purchase Orders...</div>;

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Purchase Order</h2>
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
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search PO Number or Supplier Name"
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
        </div>
      </div>

      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Date</th>
              <th>PR Ref</th>
              <th>Supplier</th>
              <th className="text-right">Value (₹)</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPOs.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty">No purchase orders found.</td>
              </tr>
            ) : (
              filteredPOs.map((po) => (
                <tr key={po.po_id}>
                  <td className="bold-cell ">{po.po_number}</td>
                  <td>{formatDate(po.po_date)}</td>
                  <td className="text-muted">{getPRNumber(po.pr_id)}</td>
                  <td >{getSupplierName(po.supplier_id)}</td>
                  <td className="bold-cell text-right">{Number(po.grand_total || 0).toFixed(2)}</td>
                  <td className="actions-cell">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => { setSelectedPO(po); setViewOpen(true); }}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit PO">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(po)}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print PO">
                      <IconButton size="small" onClick={() => { setSelectedPO(po); setPrintOpen(true); }}>
                        <Printer size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(po.po_id)}>
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
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle className="dialog-title">
          {formData.po_id ? 'Update' : 'Create'} Purchase Order
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <FormControl fullWidth>
              <InputLabel>Reference PR</InputLabel>
              <Select
                value={formData.pr_id}
                label="Reference PR"
                onChange={(e) => handlePRChange(e.target.value)}
              >
                <MenuItem value=""><em>None (Standalone PO)</em></MenuItem>
                {approvedPRs.map(pr => (
                  <MenuItem key={pr.pr_id} value={pr.pr_id}>{pr.pr_number}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="PO Date"
              type="date"
              value={formData.po_date}
              onChange={(e) => setFormData(prev => ({ ...prev, po_date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={formData.supplier_id}
                label="Supplier"
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
              >
                {suppliers.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name} ({s.id})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Payment Terms</InputLabel>
              <Select
                value={formData.payment_terms}
                label="Payment Terms"
                onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
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

          {/* Line Items Table */}
          <div className="line-items-section">
            <div className="section-title-row">
              <h4>Purchase Line Items</h4>
              {!formData.pr_id && (
                <Button startIcon={<PlusCircle size={16} />} size="small" onClick={handleAddLineItem}>
                  Add Line
                </Button>
              )}
            </div>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell className="text-right" width="120">Order Qty</TableCell>
                  <TableCell className="text-right" width="140">Unit Cost</TableCell>
                  <TableCell className="text-right" width="140">Line Total</TableCell>
                  {!formData.pr_id && <TableCell width="80" align="center">Action</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {formData.pr_id ? (
                        <span>{getItemName(item.item_id)} ({item.item_id})</span>
                      ) : (
                        <select
                          className="table-select"
                          value={item.item_id}
                          onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                        >
                          {itemsMaster.map(itm => (
                            <option key={itm.id} value={itm.id}>{itm.name} ({itm.id})</option>
                          ))}
                        </select>
                      )}
                    </TableCell>
                    <TableCell >
                      <input
                        type="number"
                        className="table-input text-right"
                        value={item.quantity}
                        min="1"
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="table-input text-right"
                        value={item.unit_price}
                        min="0"
                        step="0.01"
                        onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell className="bold-cell text-right">
                      {Number(item.line_total || 0).toFixed(2)}
                    </TableCell>
                    {!formData.pr_id && (
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
                  <TableCell className="text-right" width="250">Target Quantity</TableCell>
                  <TableCell width="80" align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.schedules.map((sched, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <input
                        type="date"
                        className="table-input"
                        value={sched.expected_delivery_date}
                        onChange={(e) => handleScheduleChange(idx, 'expected_delivery_date', e.target.value)}
                      />
                    </TableCell>
                    <TableCell >
                      <input
                        type="number"
                        className="table-input text-right"
                        value={sched.target_quantity}
                        min="1"
                        onChange={(e) => handleScheduleChange(idx, 'target_quantity', e.target.value)}
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
          <Button onClick={handleSave} variant="contained" color="primary">
            {formData.po_id ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Purchase Order - {selectedPO?.po_number}</DialogTitle>
        <DialogContent dividers>
          {selectedPO && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>Supplier:</strong> <span>{getSupplierName(selectedPO.supplier_id)}</span>
              </div>
              <div className="view-detail-row">
                <strong>Date:</strong> <span>{formatDate(selectedPO.po_date)}</span>
              </div>
              <div className="view-detail-row">
                <strong>PR Reference:</strong> <span>{getPRNumber(selectedPO.pr_id)}</span>
              </div>
              <div className="view-detail-row">
                <strong>Payment Terms:</strong> <span>{selectedPO.payment_terms}</span>
              </div>

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Order Line Items</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell className="text-right" align="right">Qty Ordered</TableCell>
                    <TableCell className="text-right" align="right">Unit Cost (₹)</TableCell>
                    <TableCell align="right">Subtotal (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPO.items.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{getItemName(itm.item_id)} ({itm.item_id})</TableCell>
                      <TableCell className="text-right" align="right">{Number(itm.quantity)}</TableCell>
                      <TableCell className="text-right" align="right">{Number(itm.unit_price || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right" align="right">{Number(itm.line_total || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="text-right" colSpan={3} align="right"><strong>Grand Total Value:</strong></TableCell>
                    <TableCell align="right" className="bold-cell text-right">
                      {Number(selectedPO.grand_total || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Delivery Schedule Releases</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Expected Date</TableCell>
                    <TableCell className="text-right" align="right">Quantity Released</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPO.schedules.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{formatDate(s.expected_delivery_date)}</TableCell>
                      <TableCell align="right" className="text-right">{Number(s.target_quantity)}</TableCell>
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
                  <p><strong>PO NUMBER:</strong> {selectedPO.po_number}</p>
                  <p><strong>DATE:</strong> {selectedPO.po_date}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>VENDOR / SUPPLIER:</strong></p>
                  <p className="bold-cell">{getSupplierName(selectedPO.supplier_id)}</p>
                  <p>Terms: {selectedPO.payment_terms}</p>
                </div>
                <div>
                  <p><strong>PR REFERENCE:</strong> {getPRNumber(selectedPO.pr_id)}</p>
                  <p><strong>STATUS:</strong> {selectedPO.status}</p>
                </div>
              </div>

              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Item Name</th>
                    <th className="num-col text-right">Qty Ordered</th>
                    <th className="num-col text-right">Unit Price (₹)</th>
                    <th className="num-col text-right">Total Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items.map((itm, idx) => (
                    <tr key={idx}>
                      <td >{itm.item_id}</td>
                      <td >{getItemName(itm.item_id)}</td>
                      <td className="num-col text-right">{Number(itm.quantity)}</td>
                      <td className="num-col text-right">{Number(itm.unit_price || 0).toFixed(2)}</td>
                      <td className="num-col text-right">{Number(itm.line_total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="4">Purchase Value Total</td>
                    <td className="num-col text-right">{Number(selectedPO.grand_total || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Authorized Purchasing Officer</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space"></div>
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

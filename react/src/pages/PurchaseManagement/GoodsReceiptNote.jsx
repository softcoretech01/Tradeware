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
  FileSpreadsheet, FileText, ClipboardCheck, ArrowUpRight
} from 'lucide-react';
import { 
  addGRN, 
  updateGRNQC, 
  updatePODeliveryQty,
  deleteGRN 
} from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const GoodsReceiptNote = () => {
  const dispatch = useDispatch();

  // Store Selectors
  const grns = useSelector(state => state.erp.grns);
  const purchaseOrders = useSelector(state => state.erp.purchaseOrders.filter(po => po.status === 'Approved'));
  const warehouses = useSelector(state => state.locations.warehouses);

  // Component States
  const [searchTerm, setSearchTerm] = useState('');
  const [qcStatusFilter, setQcStatusFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    poRef: '',
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    receivedItems: [],
    status: 'Pending QC'
  });

  // QC Form Fields
  const [qcData, setQcData] = useState({
    grnId: '',
    itemId: '',
    itemName: '',
    orderedQty: 0,
    receivedQty: 0,
    acceptedQty: 0,
    rejectedQty: 0,
    qcStatus: 'Passed', // Passed, Failed
    qcInspector: '',
    qcRemarks: ''
  });

  // Handlers
  const handleOpenCreate = () => {
    setFormData({
      id: `GRN-2026-${Math.floor(100 + Math.random() * 900)}`,
      poRef: '',
      date: new Date().toISOString().split('T')[0],
      supplierName: '',
      receivedItems: [],
      status: 'Pending QC'
    });
    setFormOpen(true);
  };

  const handlePOChange = (poId) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      const items = po.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        orderedQty: item.orderedQty,
        receivedQty: item.pendingQty, // Default received qty to PO's pending qty
        acceptedQty: item.pendingQty,
        rejectedQty: 0,
        pendingQty: 0,
        batches: [
          { batchNo: `BAT-${item.itemId.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`, mfgDate: '2026-05-01', expiryDate: '2028-05-01', qty: item.pendingQty }
        ],
        warehouseId: warehouses[0]?.id || '',
        warehouse: warehouses[0]?.name || '',
        rack: warehouses[0]?.racks[0] || 'Rack A-01',
        qcStatus: 'Pending QC',
        qcInspector: '',
        qcRemarks: ''
      }));

      setFormData(prev => ({
        ...prev,
        poRef: poId,
        supplierName: po.supplierName,
        receivedItems: items
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        poRef: '',
        supplierName: '',
        receivedItems: []
      }));
    }
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formData.receivedItems];
    
    if (field === 'warehouseId') {
      const wh = warehouses.find(w => w.id === value);
      updated[idx] = {
        ...updated[idx],
        warehouseId: value,
        warehouse: wh ? wh.name : '',
        rack: wh?.racks[0] || ''
      };
    } else if (field === 'receivedQty') {
      const qty = parseFloat(value) || 0;
      updated[idx] = {
        ...updated[idx],
        receivedQty: qty,
        acceptedQty: qty,
        rejectedQty: 0,
        batches: updated[idx].batches.map(b => ({ ...b, qty }))
      };
    } else {
      updated[idx] = {
        ...updated[idx],
        [field]: value
      };
    }

    setFormData(prev => ({ ...prev, receivedItems: updated }));
  };

  const handleBatchChange = (itemIdx, batchIdx, field, value) => {
    const updated = [...formData.receivedItems];
    const batches = [...updated[itemIdx].batches];
    batches[batchIdx] = {
      ...batches[batchIdx],
      [field]: field === 'qty' ? (parseFloat(value) || 0) : value
    };
    updated[itemIdx] = { ...updated[itemIdx], batches };
    setFormData(prev => ({ ...prev, receivedItems: updated }));
  };

  const handleSave = () => {
    if (!formData.poRef) {
      alert('Approved PO selection is required.');
      return;
    }
    if (formData.receivedItems.length === 0) {
      alert('No received items to inward.');
      return;
    }

    dispatch(addGRN(formData));

    // Update PO deliveries with received quantities (automatically)
    formData.receivedItems.forEach(item => {
      dispatch(updatePODeliveryQty({
        poId: formData.poRef,
        itemId: item.itemId,
        receivedQty: item.acceptedQty // Commit accepted quantities to PO
      }));
    });

    setFormOpen(false);
  };

  // QC inspection logic
  const handleOpenQC = (grn, item) => {
    setQcData({
      grnId: grn.id,
      itemId: item.itemId,
      itemName: item.name,
      orderedQty: item.orderedQty,
      receivedQty: item.receivedQty,
      acceptedQty: item.receivedQty,
      rejectedQty: 0,
      qcStatus: 'Passed',
      qcInspector: 'Sam Inspector',
      qcRemarks: ''
    });
    setQcOpen(true);
  };

  const handleSaveQC = () => {
    if (!qcData.qcInspector.trim()) {
      alert('Inspector name is required.');
      return;
    }
    if (qcData.acceptedQty + qcData.rejectedQty !== qcData.receivedQty) {
      alert(`Sum of Accepted (${qcData.acceptedQty}) and Rejected (${qcData.rejectedQty}) must equal Received Qty (${qcData.receivedQty}).`);
      return;
    }

    dispatch(updateGRNQC({
      grnId: qcData.grnId,
      itemId: qcData.itemId,
      qcStatus: qcData.qcStatus,
      acceptedQty: qcData.acceptedQty,
      rejectedQty: qcData.rejectedQty,
      qcInspector: qcData.qcInspector,
      qcRemarks: qcData.qcRemarks
    }));

    setQcOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete GRN ${id}?`)) {
      dispatch(deleteGRN(id));
    }
  };

  // Filter
  const filteredGRNs = grns.filter(grn => {
    const matchesSearch = grn.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          grn.poRef.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          grn.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesQC = qcStatusFilter 
      ? grn.receivedItems.some(i => i.qcStatus === qcStatusFilter) 
      : true;

    return matchesSearch && matchesQC;
  });

  // Export
  const handleExportExcel = () => {
    const data = filteredGRNs.flatMap(grn => 
      grn.receivedItems.map(item => ({
        'GRN Number': grn.id,
        'Date': grn.date,
        'PO Ref': grn.poRef,
        'Supplier': grn.supplierName,
        'Item Name': item.name,
        'Ordered Qty': item.orderedQty,
        'Received Qty': item.receivedQty,
        'Accepted Qty': item.acceptedQty || 0,
        'Rejected Qty': item.rejectedQty || 0,
        'Warehouse': item.warehouse,
        'Rack/Bin': item.rack,
        'QC Status': item.qcStatus,
        'QC Inspector': item.qcInspector || 'N/A'
      }))
    );
    exportToExcel(data, 'Goods_Receipt_Notes', 'GRN_Records');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'GRN Number' },
      { field: 'date', headerName: 'Date' },
      { field: 'poRef', headerName: 'PO Ref' },
      { field: 'supplierName', headerName: 'Supplier' },
      { field: 'status', headerName: 'QC Status' }
    ];
    exportToPDF(cols, filteredGRNs, 'Goods_Receipt_Notes', 'Goods Receipt Notes (GRN) Report');
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Goods Receipt Note (GRN)</h2>
          <p className="subtitle">Record supplier deliveries, specify batches/lot info, allocate warehouse bins, and complete QC checks.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-secondary" onClick={handleExportPDF}>
            <FileText size={16} /> PDF
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Record Goods Receipt (GRN)
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by GRN, PO Ref, Supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={qcStatusFilter} onChange={(e) => setQcStatusFilter(e.target.value)}>
            <option value="">All QC Statuses</option>
            <option value="Pending QC">Pending QC</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>GRN Number</th>
              <th>Date</th>
              <th>PO Ref</th>
              <th>Supplier</th>
              <th>Items Receipt</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGRNs.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty">No Goods Receipt Notes found.</td>
              </tr>
            ) : (
              filteredGRNs.map((grn) => (
                <tr key={grn.id}>
                  <td className="bold-cell">{grn.id}</td>
                  <td>{grn.date}</td>
                  <td className="text-muted">{grn.poRef}</td>
                  <td>{grn.supplierName}</td>
                  <td>
                    <span className="items-badge">{grn.receivedItems.length} items</span>
                  </td>
                  <td>
                    <Chip 
                      label={grn.status} 
                      color={grn.status === 'QC Completed' ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </td>
                  <td className="actions-cell">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => { setSelectedGRN(grn); setViewOpen(true); }}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Print GRN Voucher">
                      <IconButton size="small" onClick={() => { setSelectedGRN(grn); setPrintOpen(true); }}>
                        <Printer size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete GRN Record">
                      <IconButton size="small" color="error" onClick={() => handleDelete(grn.id)}>
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

      {/* CREATE GRN DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">Create Goods Receipt Note (GRN)</DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <FormControl fullWidth>
              <InputLabel>Reference Purchase Order</InputLabel>
              <Select
                value={formData.poRef}
                label="Reference Purchase Order"
                onChange={(e) => handlePOChange(e.target.value)}
              >
                {purchaseOrders.map(po => (
                  <MenuItem key={po.id} value={po.id}>{po.id} ({po.supplierName})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="GRN Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Supplier"
              value={formData.supplierName}
              fullWidth
              disabled
            />
          </div>

          {/* Line items inwarding */}
          {formData.receivedItems.length > 0 && (
            <div className="line-items-section" style={{ marginTop: '20px' }}>
              <h4>Items Received</h4>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell width="120">PO Qty</TableCell>
                    <TableCell width="120">Received Qty</TableCell>
                    <TableCell width="180">Warehouse Allocation</TableCell>
                    <TableCell width="160">Bin Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.receivedItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.name} ({item.itemId})</TableCell>
                      <TableCell>{item.orderedQty}</TableCell>
                      <TableCell>
                        <input 
                          type="number" 
                          className="table-input"
                          value={item.receivedQty}
                          min="1"
                          max={item.orderedQty}
                          onChange={(e) => handleItemChange(idx, 'receivedQty', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          className="table-select"
                          value={item.warehouseId}
                          onChange={(e) => handleItemChange(idx, 'warehouseId', e.target.value)}
                        >
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <select
                          className="table-select"
                          value={item.rack}
                          onChange={(e) => handleItemChange(idx, 'rack', e.target.value)}
                        >
                          {warehouses.find(w => w.id === item.warehouseId)?.racks.map(rack => (
                            <option key={rack} value={rack}>{rack}</option>
                          )) || <option value="Rack A-01">Rack A-01</option>}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Batch wise layout */}
              <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Batch details / Expiry Dates</h4>
              {formData.receivedItems.map((item, itemIdx) => (
                <div key={itemIdx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', marginBottom: '12px', border: '1px solid var(--border)' }}>
                  <strong>Item: {item.name}</strong>
                  {item.batches.map((batch, batchIdx) => (
                    <div className="dialog-grid" style={{ marginTop: '8px' }} key={batchIdx}>
                      <TextField
                        label="Batch / Lot Number"
                        value={batch.batchNo}
                        onChange={(e) => handleBatchChange(itemIdx, batchIdx, 'batchNo', e.target.value)}
                        size="small"
                      />
                      <TextField
                        label="Mfg Date"
                        type="date"
                        value={batch.mfgDate}
                        onChange={(e) => handleBatchChange(itemIdx, batchIdx, 'mfgDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                      <TextField
                        label="Expiry Date"
                        type="date"
                        value={batch.expiryDate}
                        onChange={(e) => handleBatchChange(itemIdx, batchIdx, 'expiryDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Inward Goods</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS & QC WORKFLOW DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">GRN Details - {selectedGRN?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedGRN && (
            <div className="view-detail-body">
              <div className="dialog-grid" style={{ marginBottom: '16px' }}>
                <div><strong>PO Ref:</strong> {selectedGRN.poRef}</div>
                <div><strong>Inward Date:</strong> {selectedGRN.date}</div>
                <div><strong>Supplier:</strong> {selectedGRN.supplierName}</div>
                <div><strong>Voucher Status:</strong> <Chip label={selectedGRN.status} size="small" /></div>
              </div>

              <h4>Received Items & QC Inspection Pipeline</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="right">Ordered Qty</TableCell>
                    <TableCell align="right">Received Qty</TableCell>
                    <TableCell align="right">Accepted Qty</TableCell>
                    <TableCell align="right">Rejected Qty</TableCell>
                    <TableCell>QC status</TableCell>
                    <TableCell align="center">QC Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedGRN.receivedItems.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <strong>{itm.name}</strong><br />
                        <span className="text-muted" style={{ fontSize: '11px' }}>
                          Warehouse: {itm.warehouse} ({itm.rack})
                        </span>
                        {itm.batches && itm.batches.map(b => (
                          <div key={b.batchNo} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Batch: {b.batchNo} | Exp: {b.expiryDate}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell align="right">{itm.orderedQty}</TableCell>
                      <TableCell align="right">{itm.receivedQty}</TableCell>
                      <TableCell align="right">{itm.acceptedQty || 0}</TableCell>
                      <TableCell align="right" style={{ color: (itm.rejectedQty || 0) > 0 ? 'red' : 'inherit' }}>
                        {itm.rejectedQty || 0}
                      </TableCell>
                      <td>
                        <Chip 
                          label={itm.qcStatus} 
                          color={itm.qcStatus === 'Passed' ? 'success' : itm.qcStatus === 'Failed' ? 'error' : 'warning'} 
                          size="small" 
                        />
                      </td>
                      <td align="center">
                        {itm.qcStatus === 'Pending QC' && (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<ClipboardCheck size={14} />}
                            onClick={() => handleOpenQC(selectedGRN, itm)}
                          >
                            Inspect QC
                          </Button>
                        )}
                        {itm.qcStatus !== 'Pending QC' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            By: {itm.qcInspector}
                          </span>
                        )}
                      </td>
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

      {/* QC INSPECTION MODAL */}
      <Dialog open={qcOpen} onClose={() => setQcOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="dialog-title">Perform QC Check</DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p><strong>Item:</strong> {qcData.itemName} ({qcData.itemId})</p>
            <p><strong>Total Received:</strong> {qcData.receivedQty} pcs</p>

            <TextField
              label="Accepted Quantity"
              type="number"
              value={qcData.acceptedQty}
              onChange={(e) => {
                const acc = parseFloat(e.target.value) || 0;
                setQcData(prev => ({
                  ...prev,
                  acceptedQty: acc,
                  rejectedQty: Math.max(0, prev.receivedQty - acc)
                }));
              }}
              fullWidth
            />

            <TextField
              label="Rejected Quantity"
              type="number"
              value={qcData.rejectedQty}
              onChange={(e) => {
                const rej = parseFloat(e.target.value) || 0;
                setQcData(prev => ({
                  ...prev,
                  rejectedQty: rej,
                  acceptedQty: Math.max(0, prev.receivedQty - rej)
                }));
              }}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>QC Status</InputLabel>
              <Select
                value={qcData.qcStatus}
                label="QC Status"
                onChange={(e) => setQcData(prev => ({ ...prev, qcStatus: e.target.value }))}
              >
                <MenuItem value="Passed">Passed (Approved for Stock)</MenuItem>
                <MenuItem value="Failed">Failed (Return to Supplier)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="QC Inspector Name"
              value={qcData.qcInspector}
              onChange={(e) => setQcData(prev => ({ ...prev, qcInspector: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Inspector Notes / QC Remarks"
              value={qcData.qcRemarks}
              onChange={(e) => setQcData(prev => ({ ...prev, qcRemarks: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQcOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveQC} variant="contained" color="primary">Authorize QC</Button>
        </DialogActions>
      </Dialog>

      {/* PRINT VIEW DIALOG */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="md" fullWidth>
        <DialogContent dividers>
          {selectedGRN && (
            <div className="print-voucher-area" id="print-area">
              <div className="print-header">
                <div>
                  <h1 className="company-title">TRADEWARE ERP SYSTEMS</h1>
                  <p>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</p>
                  <p>Email: contact@tradeware.com | Tel: 6543-2109</p>
                </div>
                <div className="voucher-title-block">
                  <h2>GOODS RECEIPT NOTE (GRN)</h2>
                  <p><strong>GRN NUMBER:</strong> {selectedGRN.id}</p>
                  <p><strong>DATE RECEIPT:</strong> {selectedGRN.date}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>RECEIVED FROM SUPPLIER:</strong></p>
                  <p className="bold-cell">{selectedGRN.supplierName}</p>
                </div>
                <div>
                  <p><strong>REF PO NUMBER:</strong> {selectedGRN.poRef}</p>
                  <p><strong>GRN STATUS:</strong> {selectedGRN.status}</p>
                </div>
              </div>

              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Item Details</th>
                    <th>Warehouse Location</th>
                    <th className="num-col">Ordered</th>
                    <th className="num-col">Received</th>
                    <th className="num-col">Accepted</th>
                    <th className="num-col">Rejected</th>
                    <th>QC Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGRN.receivedItems.map((itm, idx) => (
                    <tr key={idx}>
                      <td>{itm.itemId}</td>
                      <td>
                        <strong>{itm.name}</strong>
                        {itm.batches && itm.batches.map(b => (
                          <div key={b.batchNo} style={{ fontSize: '10px', color: '#64748b' }}>
                            Batch: {b.batchNo} | Exp: {b.expiryDate}
                          </div>
                        ))}
                      </td>
                      <td>{itm.warehouse} ({itm.rack})</td>
                      <td className="num-col">{itm.orderedQty}</td>
                      <td className="num-col">{itm.receivedQty}</td>
                      <td className="num-col">{itm.acceptedQty || 0}</td>
                      <td className="num-col" style={{ color: (itm.rejectedQty || 0) > 0 ? 'red' : 'inherit' }}>{itm.rejectedQty || 0}</td>
                      <td>{itm.qcStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Store Inward Clerk (Received By)</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Authorized QA Officer (QC Verified)</p>
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
            Print GRN Voucher
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default GoodsReceiptNote;

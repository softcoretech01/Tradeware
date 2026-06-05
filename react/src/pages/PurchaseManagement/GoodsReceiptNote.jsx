import { formatDate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Printer, Trash, Edit, FileSpreadsheet
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const API_BASE_URL = 'http://127.0.0.1:8000/api/purchase/grns';
const PO_API_URL = 'http://127.0.0.1:8000/api/purchase/orders/dropdown/pos';

const GoodsReceiptNote = () => {
  // Data States
  const [grns, setGrns] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Component States
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    grn_id: null,
    id: '', // GRN Number
    poRef: '', // PO ID
    poNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierName: '',
    receivedItems: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchGrns(), fetchPOs()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPOs = async () => {
    const res = await fetch(PO_API_URL);
    if(res.ok) {
      const data = await res.json();
      setPurchaseOrders(data);
    }
  };

  const fetchGrns = async () => {
    const res = await fetch(`${API_BASE_URL}/`);
    if(res.ok) {
      const data = await res.json();
      const mapped = data.map(g => ({
        grn_id: g.grn_id,
        id: g.grn_number,
        poRef: g.po_id,
        poNumber: g.po_number,
        date: g.grn_date,
        supplierId: g.supplier_id,
        supplierName: g.supplier_name,
        receivedItems: g.items.map(i => ({
          itemId: i.item_id,
          name: i.item_name,
          orderedQty: Number(i.po_qty),
          receivedQty: Number(i.received_qty),
          batches: [{
            batchNo: i.batch_lot_number || '',
            mfgDate: i.mfg_date || '',
            expiryDate: i.expiry_date || '',
            qty: i.received_qty
          }]
        }))
      }));
      setGrns(mapped);
    }
  };

  // Handlers
  const handleOpenCreate = () => {
    let nextNum = 1;
    if (grns.length > 0) {
      const nums = grns.map(g => {
        const match = g.id.match(/GRN-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const nextGrnNumber = `GRN-${String(nextNum).padStart(3, '0')}`;

    setFormData({
      grn_id: null,
      id: nextGrnNumber,
      poRef: '',
      poNumber: '',
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      supplierName: '',
      receivedItems: []
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (grn) => {
    setFormData(grn);
    setFormOpen(true);
  };

  const handlePOChange = (poId) => {
    const po = purchaseOrders.find(p => p.po_id === poId);
    if (po) {
      const items = po.items.map(item => ({
        itemId: item.item_id,
        name: item.item_name,
        orderedQty: Number(item.quantity),
        receivedQty: Number(item.quantity), 
        batches: [
          { batchNo: `BAT-${item.item_id.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`, mfgDate: new Date().toISOString().split('T')[0], expiryDate: '', qty: Number(item.quantity) }
        ]
      }));

      setFormData(prev => ({
        ...prev,
        poRef: poId,
        poNumber: po.po_number,
        supplierId: po.supplier_id,
        supplierName: po.supplier_name,
        receivedItems: items
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        poRef: '',
        poNumber: '',
        supplierId: '',
        supplierName: '',
        receivedItems: []
      }));
    }
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formData.receivedItems];
    
    if (field === 'receivedQty') {
      const qty = parseFloat(value) || 0;
      updated[idx] = {
        ...updated[idx],
        receivedQty: qty,
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

  const handleSave = async () => {
    if (!formData.poRef) {
      alert('Approved PO selection is required.');
      return;
    }
    if (formData.receivedItems.length === 0) {
      alert('No received items to inward.');
      return;
    }

    const payload = {
      grn_number: formData.id,
      po_id: formData.poRef,
      supplier_id: formData.supplierId,
      grn_date: formData.date,
      items: formData.receivedItems.map(item => ({
        item_id: item.itemId,
        po_qty: item.orderedQty,
        received_qty: item.receivedQty,
        batch_lot_number: item.batches[0]?.batchNo || null,
        mfg_date: item.batches[0]?.mfgDate || null,
        expiry_date: item.batches[0]?.expiryDate || null
      }))
    };

    try {
      let res;
      if (formData.grn_id) {
        res = await fetch(`${API_BASE_URL}/${formData.grn_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        fetchGrns();
        setFormOpen(false);
      } else {
        const err = await res.json();
        alert(`Failed to save: ${JSON.stringify(err)}`);
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while saving.');
    }
  };

  const handleDelete = async (id, grn_id) => {
    if (window.confirm(`Are you sure you want to delete GRN ${id}?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/${grn_id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchGrns();
        } else {
          alert("Failed to delete");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Filter
  const filteredGRNs = grns.filter(grn => {
    const matchesSearch = grn.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (grn.poNumber && grn.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          grn.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Export
  const handleExportExcel = () => {
    const data = filteredGRNs.flatMap(grn => 
      grn.receivedItems.map(item => ({
        'GRN Number': grn.id,
        'Date': grn.date,
        'PO Ref': grn.poNumber,
        'Supplier': grn.supplierName,
        'Item Name': item.name,
        'Ordered Qty': item.orderedQty,
        'Received Qty': item.receivedQty,
        'Batch': item.batches[0]?.batchNo || 'N/A'
      }))
    );
    exportToExcel(data, 'Goods_Receipt_Notes', 'GRN_Records');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'GRN Number' },
      { field: 'date', headerName: 'Date' },
      { field: 'poNumber', headerName: 'PO Ref' },
      { field: 'supplierName', headerName: 'Supplier' }
    ];
    exportToPDF(cols, filteredGRNs, 'Goods_Receipt_Notes', 'Goods Receipt Notes (GRN) Report');
  };

  if (loading) return <div style={{ padding: 20 }}>Loading GRNs...</div>;

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Goods Receipt Note (GRN)</h2>
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

      {/* Filter bar */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by" 
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
              <th>GRN Number</th>
              <th>Date</th>
              <th>PO Ref</th>
              <th>Supplier</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGRNs.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty">No Goods Receipt Notes found.</td>
              </tr>
            ) : (
              filteredGRNs.map((grn) => (
                <tr key={grn.id}>
                  <td className="bold-cell ">{grn.id}</td>
                  <td>{formatDate(grn.date)}</td>
                  <td className="text-muted ">{grn.poNumber}</td>
                  <td >{grn.supplierName}</td>
                  <td className="actions-cell">
                    <Tooltip title="Edit Record">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(grn)}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>

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
                      <IconButton size="small" color="error" onClick={() => handleDelete(grn.id, grn.grn_id)}>
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
        <DialogTitle className="dialog-title">
          {formData.grn_id ? 'Edit' : 'Create'} GRN
        </DialogTitle>
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
                  <MenuItem key={po.po_id} value={po.po_id}>{po.po_number} ({po.supplier_name})</MenuItem>
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
                    <TableCell className="text-right" width="120">PO Qty</TableCell>
                    <TableCell className="text-right" width="120">Received Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.receivedItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.name} ({item.itemId})</TableCell>
                      <TableCell className="text-right">{item.orderedQty}</TableCell>
                      <TableCell >
                        <input 
                          type="number" 
                          className="table-input"
                          value={item.receivedQty}
                          min="1"
                          max={item.orderedQty}
                          onChange={(e) => handleItemChange(idx, 'receivedQty', parseFloat(e.target.value) || 0)}
                        />
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
          <Button onClick={handleSave} variant="contained" color="primary">
            {formData.grn_id ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">GRN Details - {selectedGRN?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedGRN && (
            <div className="view-detail-body">
              <div className="dialog-grid" style={{ marginBottom: '16px' }}>
                <div><strong>PO Ref:</strong> {selectedGRN.poNumber}</div>
                <div><strong>Inward Date:</strong> {selectedGRN.date}</div>
                <div><strong>Supplier:</strong> {selectedGRN.supplierName}</div>
              </div>

              <h4>Received Items</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell className="text-right" align="right">Ordered Qty</TableCell>
                    <TableCell className="text-right" align="right">Received Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedGRN.receivedItems.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <strong>{itm.name}</strong><br />
                        {itm.batches && itm.batches.map(b => (
                          <div key={b.batchNo} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Batch: {b.batchNo} | Exp: {b.expiryDate}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right" align="right">{itm.orderedQty}</TableCell>
                      <TableCell className="text-right" align="right">{itm.receivedQty}</TableCell>
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
                  <p><strong>REF PO NUMBER:</strong> {selectedGRN.poNumber}</p>
                </div>
              </div>

              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Item Details</th>
                    <th className="num-col">Ordered</th>
                    <th className="num-col">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGRN.receivedItems.map((itm, idx) => (
                    <tr key={idx}>
                      <td >{itm.itemId}</td>
                      <td>
                        <strong>{itm.name}</strong>
                        {itm.batches && itm.batches.map(b => (
                          <div key={b.batchNo} style={{ fontSize: '10px', color: '#64748b' }}>
                            Batch: {b.batchNo} | Exp: {b.expiryDate}
                          </div>
                        ))}
                      </td>
                      <td className="num-col text-right">{itm.orderedQty}</td>
                      <td className="num-col text-right">{itm.receivedQty}</td>
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

import { formatDate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Printer, Trash, Edit,
  FileSpreadsheet, FileSpreadsheet as DebitIcon
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const API_BASE_URL = 'http://127.0.0.1:8000/api/purchase/returns';
const GRN_API_URL = 'http://127.0.0.1:8000/api/purchase/grns/dropdown/grns';

const PurchaseReturn = () => {
  // Data States
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [debitFilter, setDebitFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    return_id: null,
    id: '',
    grnRef: '',
    grnNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierName: '',
    returnedItems: [],
    debitNoteGenerated: false,
    refundTotal: 0.00,
    debitNoteDetails: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchReturns(), fetchGRNs()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGRNs = async () => {
    const res = await fetch(GRN_API_URL);
    if(res.ok) {
      const data = await res.json();
      setGrns(data);
    }
  };

  const fetchReturns = async () => {
    const res = await fetch(`${API_BASE_URL}/`);
    if(res.ok) {
      const data = await res.json();
      const mapped = data.map(r => ({
        return_id: r.return_id,
        id: r.return_number,
        grnRef: r.grn_id,
        grnNumber: r.grn_number,
        date: r.return_date,
        supplierId: r.supplier_id,
        supplierName: r.supplier_name,
        debitNoteGenerated: r.debit_note_status === 'Debit Note Created',
        refundTotal: Number(r.refund_total || 0),
        returnedItems: r.items.map(i => ({
          return_item_id: i.return_item_id,
          itemId: i.item_id,
          name: i.item_name,
          returnedQty: Number(i.return_qty),
          maxReturnQty: Number(i.inwarded_qty),
          reason: i.return_reason || '',
          unitPrice: 0 
        })),
        debitNoteDetails: r.debit_note_status === 'Debit Note Created' ? {
          id: `DN-${r.return_id}`,
          date: r.return_date,
          amount: Number(r.refund_total || 0) / 1.18,
          taxAmount: Number(r.refund_total || 0) - (Number(r.refund_total || 0) / 1.18),
          total: Number(r.refund_total || 0)
        } : null
      }));
      setPurchaseReturns(mapped);
    }
  };

  const handleOpenCreate = () => {
    let nextNum = 1;
    if (purchaseReturns.length > 0) {
      const nums = purchaseReturns.map(r => {
        const match = r.id.match(/RET-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const nextId = `RET-2026-${String(nextNum).padStart(3, '0')}`;

    setFormData({
      return_id: null,
      id: nextId,
      grnRef: '',
      grnNumber: '',
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      supplierName: '',
      returnedItems: [],
      debitNoteGenerated: false,
      refundTotal: 0.00,
      debitNoteDetails: null
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (ret) => {
    setFormData(ret);
    setFormOpen(true);
  };

  const handleGRNChange = (grnId) => {
    const grn = grns.find(g => g.grn_id === grnId);
    if (grn) {
      const items = grn.items.map(item => {
        return {
          itemId: item.item_id,
          name: item.item_name,
          returnedQty: Number(item.received_qty) > 0 ? 1 : 0, 
          maxReturnQty: Number(item.received_qty),
          reason: 'QC verification failed - Rejected items.',
          unitPrice: Number(item.unit_price)
        };
      });

      setFormData(prev => ({
        ...prev,
        grnRef: grnId,
        grnNumber: grn.grn_number,
        supplierId: grn.supplier_id,
        supplierName: grn.supplier_name,
        returnedItems: items
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        grnRef: '',
        grnNumber: '',
        supplierId: '',
        supplierName: '',
        returnedItems: []
      }));
    }
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formData.returnedItems];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'returnedQty' ? (parseFloat(value) || 0) : value
    };
    setFormData(prev => ({ ...prev, returnedItems: updated }));
  };

  const handleSave = async () => {
    if (!formData.grnRef) {
      alert('GRN reference is required.');
      return;
    }
    if (formData.returnedItems.length === 0) {
      alert('At least one item to return is required.');
      return;
    }

    const payload = {
      return_number: formData.id,
      grn_id: formData.grnRef,
      supplier_id: formData.supplierId,
      return_date: formData.date,
      debit_note_status: formData.debitNoteGenerated ? 'Debit Note Created' : 'Pending',
      refund_total: formData.refundTotal || 0,
      items: formData.returnedItems.map(item => ({
        item_id: item.itemId,
        inwarded_qty: item.maxReturnQty,
        return_qty: item.returnedQty,
        return_reason: item.reason
      }))
    };

    try {
      let res;
      if (formData.return_id) {
        res = await fetch(`${API_BASE_URL}/${formData.return_id}`, {
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
        fetchReturns();
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

  const handleCreateDebitNote = async (ret) => {
    let totalAmount = 0;
    const grnData = grns.find(g => g.grn_id === ret.grnRef);
    
    ret.returnedItems.forEach(retItem => {
      let uPrice = 0;
      if(grnData) {
         const gi = grnData.items.find(i => i.item_id === retItem.itemId);
         if(gi) uPrice = Number(gi.unit_price);
      }
      totalAmount += (retItem.returnedQty * uPrice);
    });

    const taxAmount = totalAmount * 0.18; // Standard 18% tax refund
    const grandTotal = totalAmount + taxAmount;

    try {
      const res = await fetch(`${API_BASE_URL}/${ret.return_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debit_note_status: 'Debit Note Created',
          refund_total: grandTotal
        })
      });

      if (res.ok) {
        alert(`Debit Note generated successfully for ${ret.id}!`);
        await fetchReturns(); 
        
        // Temporarily patch the selected Return so the dialog immediately updates without closing
        setSelectedReturn(prev => ({
          ...prev,
          debitNoteGenerated: true,
          refundTotal: grandTotal,
          debitNoteDetails: {
            id: `DN-${ret.return_id}`,
            amount: totalAmount,
            taxAmount: taxAmount,
            total: grandTotal,
            date: new Date().toISOString().split('T')[0]
          }
        }));
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while generating Debit Note.');
    }
  };

  const handleDelete = async (id, return_id) => {
    if (window.confirm(`Are you sure you want to delete return record ${id}?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/${return_id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchReturns();
        } else {
          alert("Failed to delete");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Filter
  const filteredReturns = purchaseReturns.filter(ret => {
    const matchesSearch = ret.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (ret.grnNumber && ret.grnNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          ret.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDebit = debitFilter 
      ? (debitFilter === 'Yes' ? ret.debitNoteGenerated : !ret.debitNoteGenerated)
      : true;

    return matchesSearch && matchesDebit;
  });

  // Export
  const handleExportExcel = () => {
    const data = filteredReturns.map(ret => ({
      'Return ID': ret.id,
      'Date': ret.date,
      'GRN Ref': ret.grnNumber,
      'Supplier': ret.supplierName,
      'Debit Note Status': ret.debitNoteGenerated ? 'Generated' : 'Pending',
      'Debit Note ID': ret.debitNoteDetails?.id || 'N/A',
      'Refund Total': ret.refundTotal || 0
    }));
    exportToExcel(data, 'Purchase_Returns', 'Returns');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Return ID' },
      { field: 'date', headerName: 'Date' },
      { field: 'grnNumber', headerName: 'GRN Ref' },
      { field: 'supplierName', headerName: 'Supplier' },
      { field: 'debitNoteGenerated', headerName: 'Debit Note?' }
    ];
    exportToPDF(cols, filteredReturns, 'Purchase_Returns', 'Purchase Returns & Debit Notes');
  };

  if (loading) return <div style={{ padding: 20 }}>Loading Purchase Returns...</div>;

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Purchase Return</h2>
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

      {/* Filter panel */}
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
        <div className="filter-selects">
          <select value={debitFilter} onChange={(e) => setDebitFilter(e.target.value)}>
            <option value="">All Debit Note Statuses</option>
            <option value="Yes">Debit Note Generated</option>
            <option value="No">Pending Generation</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Date</th>
              <th>GRN Ref</th>
              <th>Supplier</th>
              <th>Debit Note Status</th>
              <th className="text-right">Refund Total</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty">No returns found matching search criteria.</td>
              </tr>
            ) : (
              filteredReturns.map((ret) => (
                <tr key={ret.return_id}>
                  <td className="bold-cell ">{ret.id}</td>
                  <td>{formatDate(ret.date)}</td>
                  <td className="text-muted ">{ret.grnNumber}</td>
                  <td >{ret.supplierName}</td>
                  <td>
                    <Chip 
                      label={ret.debitNoteGenerated ? 'Debit Note Created' : 'Pending'} 
                      color={ret.debitNoteGenerated ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </td>
                  <td className="bold-cell text-right">
                    {ret.debitNoteGenerated ? Number(ret.refundTotal || 0).toFixed(2) : '0.00'}
                  </td>
                  <td className="actions-cell">
                    <Tooltip title="Edit Record">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(ret)}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="View Return Details">
                      <IconButton size="small" onClick={() => { setSelectedReturn(ret); setViewOpen(true); }}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>

                    {!ret.debitNoteGenerated && (
                      <Tooltip title="Generate Debit Note">
                        <IconButton size="small" color="primary" onClick={() => handleCreateDebitNote(ret)}>
                          <DebitIcon size={16} />
                        </IconButton>
                      </Tooltip>
                    )}

                    {ret.debitNoteGenerated && (
                      <Tooltip title="Print Debit Note">
                        <IconButton size="small" onClick={() => { setSelectedReturn(ret); setPrintOpen(true); }}>
                          <Printer size={16} />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Delete Record">
                      <IconButton size="small" color="error" onClick={() => handleDelete(ret.id, ret.return_id)}>
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

      {/* CREATE RETURN DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          {formData.return_id ? 'Edit' : 'Create'} Purchase Return
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <FormControl fullWidth>
              <InputLabel>Reference GRN Voucher</InputLabel>
              <Select
                value={formData.grnRef}
                label="Reference GRN Voucher"
                onChange={(e) => handleGRNChange(e.target.value)}
              >
                {grns.map(g => (
                  <MenuItem key={g.grn_id} value={g.grn_id}>{g.grn_number} (Supplier: {g.supplier_name})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Return Date"
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

          {formData.returnedItems.length > 0 && (
            <div className="line-items-section" style={{ marginTop: '20px' }}>
              <h4>Items to Return</h4>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell className="text-right" width="120">Inwarded Qty</TableCell>
                    <TableCell className="text-right" width="120">Return Qty</TableCell>
                    <TableCell>Return Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.returnedItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.name} ({item.itemId})</TableCell>
                      <TableCell className="text-right">{item.maxReturnQty}</TableCell>
                      <TableCell>
                        <input 
                          type="number" 
                          className="table-input"
                          value={item.returnedQty}
                          min="1"
                          max={item.maxReturnQty}
                          onChange={(e) => handleItemChange(idx, 'returnedQty', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <input 
                          type="text" 
                          className="table-input"
                          value={item.reason}
                          onChange={(e) => handleItemChange(idx, 'reason', e.target.value)}
                        />
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
          <Button onClick={handleSave} variant="contained" color="primary">
            {formData.return_id ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Goods Return - {selectedReturn?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedReturn && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>GRN Reference:</strong> <span>{selectedReturn.grnNumber}</span>
              </div>
              <div className="view-detail-row">
                <strong>Supplier:</strong> <span>{selectedReturn.supplierName}</span>
              </div>
              <div className="view-detail-row">
                <strong>Return Date:</strong> <span>{formatDate(selectedReturn.date)}</span>
              </div>
              <div className="view-detail-row">
                <strong>Debit Note status:</strong> 
                <Chip label={selectedReturn.debitNoteGenerated ? 'Issued' : 'Pending'} color={selectedReturn.debitNoteGenerated ? 'success' : 'warning'} size="small" />
              </div>

              {selectedReturn.debitNoteGenerated && (
                <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', margin: '12px 0' }}>
                  <strong>Debit Note Details:</strong><br />
                  Voucher Number: {selectedReturn.debitNoteDetails.id}<br />
                  Credit Value: ₹ {selectedReturn.debitNoteDetails.amount.toFixed(2)}<br />
                  Refund Tax (18%): ₹ {selectedReturn.debitNoteDetails.taxAmount.toFixed(2)}<br />
                  <strong>Grand Refund Credit: ₹ {selectedReturn.debitNoteDetails.total.toFixed(2)}</strong>
                </div>
              )}

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Returned Line Items</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell className="text-right" align="right">Qty Returned</TableCell>
                    <TableCell align="right">Refund Subtotal (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedReturn.returnedItems.map((itm, idx) => {
                    let uPrice = 0;
                    const gData = grns.find(g => g.grn_id === selectedReturn.grnRef);
                    if(gData) {
                        const gi = gData.items.find(i => i.item_id === itm.itemId);
                        if(gi) uPrice = Number(gi.unit_price);
                    }
                    return (
                    <TableRow key={idx}>
                      <TableCell>
                        {itm.name} ({itm.itemId})<br />
                        <span className="text-muted" style={{ fontSize: '11px' }}>Reason: {itm.reason}</span>
                      </TableCell>
                      <TableCell className="text-right" align="right">{itm.returnedQty}</TableCell>
                      <TableCell className="text-right" align="right">{(itm.returnedQty * uPrice).toFixed(2)}</TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>

              {!selectedReturn.debitNoteGenerated && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<DebitIcon size={16} />}
                    onClick={() => handleCreateDebitNote(selectedReturn)}
                  >
                    Generate Debit Note Now
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

      {/* PRINT VIEW (DEBIT NOTE) DIALOG */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="md" fullWidth>
        <DialogContent dividers>
          {selectedReturn && selectedReturn.debitNoteGenerated && (
            <div className="print-voucher-area" id="print-area">
              <div className="print-header">
                <div>
                  <h1 className="company-title">TRADEWARE ERP SYSTEMS</h1>
                  <p>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</p>
                  <p>Email: contact@tradeware.com | Tel: 6543-2109</p>
                </div>
                <div className="voucher-title-block">
                  <h2>DEBIT NOTE</h2>
                  <p><strong>NOTE ID:</strong> {selectedReturn.debitNoteDetails.id}</p>
                  <p><strong>DATE ISSUED:</strong> {selectedReturn.debitNoteDetails.date}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>DEBITED TO (SUPPLIER):</strong></p>
                  <p className="bold-cell">{selectedReturn.supplierName}</p>
                </div>
                <div>
                  <p><strong>REF RETURN VOUCHER:</strong> {selectedReturn.id}</p>
                  <p><strong>REF GRN NUMBER:</strong> {selectedReturn.grnNumber}</p>
                </div>
              </div>

              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Returned Items & Specs</th>
                    <th className="num-col text-right">Qty Returned</th>
                    <th className="num-col text-right">Unit Price (₹)</th>
                    <th className="num-col text-right">Taxable Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReturn.returnedItems.map((itm, idx) => {
                     let uPrice = 0;
                     const gData = grns.find(g => g.grn_id === selectedReturn.grnRef);
                     if(gData) {
                         const gi = gData.items.find(i => i.item_id === itm.itemId);
                         if(gi) uPrice = Number(gi.unit_price);
                     }
                     return (
                    <tr key={idx}>
                      <td >{itm.itemId}</td>
                      <td>
                        <strong>{itm.name}</strong><br />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Reason: {itm.reason}</span>
                      </td>
                      <td className="num-col text-right">{itm.returnedQty}</td>
                      <td className="num-col text-right">{uPrice.toFixed(2)}</td>
                      <td className="num-col text-right">{(itm.returnedQty * uPrice).toFixed(2)}</td>
                    </tr>
                  )})}
                  <tr className="subtotal-row">
                    <td colSpan="4">Subtotal Taxable Amount</td>
                    <td className="num-col text-right">{selectedReturn.debitNoteDetails.amount.toFixed(2)}</td>
                  </tr>
                  <tr className="subtotal-row">
                    <td colSpan="4">Integrated Tax Credit (18%)</td>
                    <td className="num-col text-right">{selectedReturn.debitNoteDetails.taxAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan="4">Total Adjusting Credit Value</td>
                    <td className="num-col text-right">{selectedReturn.debitNoteDetails.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-remarks">
                <p>We have debited your account with the amounts specified above due to items failing QC check and being returned.</p>
              </div>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Prepared By</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Authorized Signature</p>
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
            Print Debit Note
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PurchaseReturn;

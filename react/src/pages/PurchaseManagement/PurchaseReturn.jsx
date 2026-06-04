import { formatDate } from '../../utils/dateUtils';
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Check, X, Printer, Trash, Edit,
  FileSpreadsheet, FileText, FileSpreadsheet as DebitIcon
} from 'lucide-react';
import { 
  addPurchaseReturn, 
  generateDebitNote, 
  deletePurchaseReturn 
} from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';


const PurchaseReturn = () => {
  const dispatch = useDispatch();

  // Store selectors
  const purchaseReturns = useSelector(state => state.erp.purchaseReturns);
  const grns = useSelector(state => state.erp.grns);
  const purchaseOrders = useSelector(state => state.erp.purchaseOrders);

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
    id: '',
    grnRef: '',
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    returnedItems: [],
    debitNoteGenerated: false,
    debitNoteDetails: null
  });

  const handleOpenCreate = () => {
    setFormData({
      id: `RET-2026-${Math.floor(100 + Math.random() * 900)}`,
      grnRef: '',
      date: new Date().toISOString().split('T')[0],
      supplierName: '',
      returnedItems: [],
      debitNoteGenerated: false,
      debitNoteDetails: null
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (ret) => {
    setFormData(ret);
    setFormOpen(true);
  };

  const handleGRNChange = (grnId) => {
    const grn = grns.find(g => g.id === grnId);
    if (grn) {
      // Find items in GRN (focus on rejected ones first)
      const items = grn.receivedItems.map(item => {
        // Look up price from PO to compute return value
        const po = purchaseOrders.find(p => p.id === grn.poRef);
        const poItem = po?.items.find(pi => pi.itemId === item.itemId);
        const unitPrice = poItem ? poItem.unitPrice : 10.0;

        return {
          itemId: item.itemId,
          name: item.name,
          returnedQty: item.rejectedQty || 1, // Default to rejected amount
          maxReturnQty: item.receivedQty,
          reason: 'QC verification failed - Rejected items.',
          unitPrice
        };
      });

      setFormData(prev => ({
        ...prev,
        grnRef: grnId,
        supplierName: grn.supplierName,
        returnedItems: items
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        grnRef: '',
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

  const handleSave = () => {
    if (!formData.grnRef) {
      alert('GRN reference is required.');
      return;
    }
    if (formData.returnedItems.length === 0) {
      alert('At least one item to return is required.');
      return;
    }

    dispatch(addPurchaseReturn(formData));
    setFormOpen(false);
  };

  const handleCreateDebitNote = (ret) => {
    const amount = ret.returnedItems.reduce((acc, curr) => acc + (curr.returnedQty * (curr.unitPrice || 0)), 0);
    const taxAmount = amount * 0.18; // Standard 18% tax refund
    const total = amount + taxAmount;
    
    dispatch(generateDebitNote({
      returnId: ret.id,
      debitNoteId: `DN-2026-${Math.floor(100 + Math.random() * 900)}`,
      amount,
      taxAmount,
      total
    }));

    alert(`Debit Note generated successfully for ${ret.id}!`);
    // Auto update selected state to refresh view dialog
    setSelectedReturn(prev => prev ? {
      ...prev,
      debitNoteGenerated: true,
      debitNoteDetails: {
        id: `DN-2026-${Math.floor(100 + Math.random() * 900)}`,
        amount,
        taxAmount,
        total,
        date: new Date().toISOString().split('T')[0]
      }
    } : null);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete return record ${id}?`)) {
      dispatch(deletePurchaseReturn(id));
    }
  };

  // Filter
  const filteredReturns = purchaseReturns.filter(ret => {
    const matchesSearch = ret.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ret.grnRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      'GRN Ref': ret.grnRef,
      'Supplier': ret.supplierName,
      'Debit Note Status': ret.debitNoteGenerated ? 'Generated' : 'Pending',
      'Debit Note ID': ret.debitNoteDetails?.id || 'N/A',
      'Refund Total': ret.debitNoteDetails?.total || 0
    }));
    exportToExcel(data, 'Purchase_Returns', 'Returns');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Return ID' },
      { field: 'date', headerName: 'Date' },
      { field: 'grnRef', headerName: 'GRN Ref' },
      { field: 'supplierName', headerName: 'Supplier' },
      { field: 'debitNoteGenerated', headerName: 'Debit Note?' }
    ];
    exportToPDF(cols, filteredReturns, 'Purchase_Returns', 'Purchase Returns & Debit Notes');
  };

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
                <td colSpan="8" className="table-empty">No returns found matching search criteria.</td>
              </tr>
            ) : (
              filteredReturns.map((ret) => (
                <tr key={ret.id}>
                  <td className="bold-cell ">{ret.id}</td>
                  <td>{formatDate(ret.date)}</td>
                  <td className="text-muted ">{ret.grnRef}</td>
                  <td >{ret.supplierName}</td>
                  <td>
                    <Chip 
                      label={ret.debitNoteGenerated ? 'Debit Note Created' : 'Pending Debit Note'} 
                      color={ret.debitNoteGenerated ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </td>
                  <td className="bold-cell text-right">
                    {ret.debitNoteGenerated ? ret.debitNoteDetails.total.toFixed(2) : '0.00'}
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
                      <IconButton size="small" color="error" onClick={() => handleDelete(ret.id)}>
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
          {purchaseReturns.some(r => r.id === formData.id) ? 'Edit' : 'Create'}
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
                  <MenuItem key={g.id} value={g.id}>{g.id} (Supplier: {g.supplierName})</MenuItem>
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
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Goods Return - {selectedReturn?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedReturn && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>GRN Reference:</strong> <span>{selectedReturn.grnRef}</span>
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
                    <TableCell className="text-right" align="right">Unit Cost (₹)</TableCell>
                    <TableCell align="right">Refund Subtotal (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedReturn.returnedItems.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {itm.name} ({itm.itemId})<br />
                        <span className="text-muted" style={{ fontSize: '11px' }}>Reason: {itm.reason}</span>
                      </TableCell>
                      <TableCell className="text-right" align="right">{itm.returnedQty}</TableCell>
                      <TableCell className="text-right" align="right">{(itm.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right" align="right">{(itm.returnedQty * (itm.unitPrice || 0)).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
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
                  <p><strong>REF GRN NUMBER:</strong> {selectedReturn.grnRef}</p>
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
                  {selectedReturn.returnedItems.map((itm, idx) => (
                    <tr key={idx}>
                      <td >{itm.itemId}</td>
                      <td>
                        <strong>{itm.name}</strong><br />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Reason: {itm.reason}</span>
                      </td>
                      <td className="num-col text-right">{itm.returnedQty}</td>
                      <td className="num-col text-right">{(itm.unitPrice || 0).toFixed(2)}</td>
                      <td className="num-col text-right">{(itm.returnedQty * (itm.unitPrice || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
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

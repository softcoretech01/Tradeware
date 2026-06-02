import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Edit, Trash, Check, X, Printer,
  FileSpreadsheet, FileText, Trash2, PlusCircle
} from 'lucide-react';
import { 
  addRequisition, 
  updateRequisition, 
  approveRequisition, 
  deleteRequisition 
} from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const PurchaseRequisition = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  
  // Store Selectors
  const requisitions = useSelector(state => state.erp.requisitions);
  const itemsMaster = useSelector(state => state.items.items);
  const inventory = useSelector(state => state.inventory?.inventory || []);

  // Component States
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    requester: '',
    department: 'Production',
    priority: 'Medium',
    items: [],
    remarks: '',
    status: 'Draft'
  });

  // Check if opened via quick action
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      handleOpenCreate();
    }
  }, [location]);

  // Form handlers
  const handleOpenCreate = () => {
    setFormData({
      id: `PR-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      requester: '',
      department: 'Production',
      priority: 'Medium',
      items: [{ itemId: itemsMaster[0]?.id || '', qty: 1, uom: 'pcs', unitPrice: 10 }],
      remarks: '',
      status: 'Draft'
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (pr) => {
    setFormData({ ...pr });
    setFormOpen(true);
  };

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: itemsMaster[0]?.id || '', qty: 1, uom: 'pcs', unitPrice: 10 }]
    }));
  };

  const handleRemoveLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    if (field === 'itemId') {
      const selectedItem = itemsMaster.find(i => i.id === value);
      updatedItems[index] = {
        ...updatedItems[index],
        itemId: value,
        name: selectedItem ? selectedItem.name : ''
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
    }
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSave = () => {
    if (!formData.requester.trim()) {
      alert('Requester name is required.');
      return;
    }
    if (formData.items.length === 0) {
      alert('At least one line item is required.');
      return;
    }

    // Attach item names
    const enrichedItems = formData.items.map(item => {
      const match = itemsMaster.find(i => i.id === item.itemId);
      return {
        ...item,
        name: match ? match.name : 'Unknown Item'
      };
    });

    const finalData = { ...formData, items: enrichedItems };

    const exists = requisitions.some(r => r.id === formData.id);
    if (exists) {
      dispatch(updateRequisition(finalData));
    } else {
      dispatch(addRequisition({ ...finalData, status: 'Pending Approval' }));
    }
    setFormOpen(false);
  };

  // Actions
  const handleApprove = (id, status) => {
    dispatch(approveRequisition({ id, status, approvedBy: 'John Manager' }));
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete Requisition ${id}?`)) {
      dispatch(deleteRequisition(id));
    }
  };

  // Filters calculation
  const filteredPRs = requisitions.filter(pr => {
    const matchesSearch = pr.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pr.requester.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pr.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter ? pr.department === deptFilter : true;
    const matchesStatus = statusFilter ? pr.status === statusFilter : true;
    const matchesPriority = priorityFilter ? pr.priority === priorityFilter : true;

    return matchesSearch && matchesDept && matchesStatus && matchesPriority;
  });

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredPRs.map(pr => ({
      'Requisition ID': pr.id,
      'Date': pr.date,
      'Requester': pr.requester,
      'Department': pr.department,
      'Priority': pr.priority,
      'Total Items': pr.items.length,
      'Status': pr.status,
      'Approved By': pr.approvedBy || 'N/A'
    }));
    exportToExcel(data, 'Purchase_Requisitions', 'Requisitions');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Requisition ID' },
      { field: 'date', headerName: 'Date' },
      { field: 'requester', headerName: 'Requester' },
      { field: 'department', headerName: 'Department' },
      { field: 'priority', headerName: 'Priority' },
      { field: 'status', headerName: 'Status' }
    ];
    exportToPDF(cols, filteredPRs, 'Purchase_Requisitions', 'Purchase Requisitions Report');
  };

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending Approval': return 'warning';
      case 'Draft': return 'default';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="module-container fade-in">
      {/* Module Title Section */}
      <div className="module-header">
        <div>
          <h2>Purchase Requisition</h2>
          <p className="subtitle">Manage internal item requests, priorities, and workflow approval paths.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-secondary" onClick={handleExportPDF}>
            <FileText size={16} /> PDF
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Requisition
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Requisition ID, Requester..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            <option value="Production">Production</option>
            <option value="R&D">R&D</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Sales">Sales</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requisitions Grid */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Requester</th>
              <th>Department</th>
              <th>Priority</th>
              <th>Items Requested</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPRs.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No requisitions found matching current filters.</td>
              </tr>
            ) : (
              filteredPRs.map((pr) => (
                <tr key={pr.id}>
                  <td className="bold-cell">{pr.id}</td>
                  <td>{pr.date}</td>
                  <td>{pr.requester}</td>
                  <td>{pr.department}</td>
                  <td>
                    <Chip label={pr.priority} color={getPriorityColor(pr.priority)} size="small" variant="outlined" />
                  </td>
                  <td>
                    <span className="items-badge">
                      {pr.items.length} {pr.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </td>
                  <td>
                    <Chip label={pr.status} color={getStatusColor(pr.status)} size="small" />
                  </td>
                  <td className="actions-cell">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => { setSelectedPR(pr); setViewOpen(true); }}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>
                    
                    {pr.status === 'Draft' && (
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(pr)}>
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                    )}

                    {pr.status === 'Pending Approval' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton size="small" className="btn-icon-success" onClick={() => handleApprove(pr.id, 'Approved')}>
                            <Check size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton size="small" className="btn-icon-danger" onClick={() => handleApprove(pr.id, 'Rejected')}>
                            <X size={16} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    <Tooltip title="Print Form">
                      <IconButton size="small" onClick={() => { setSelectedPR(pr); setPrintOpen(true); }}>
                        <Printer size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(pr.id)}>
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
          {requisitions.some(r => r.id === formData.id) ? 'Edit Requisition' : 'Create Purchase Requisition'} ({formData.id})
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Requester Name"
              value={formData.requester}
              onChange={(e) => setFormData(prev => ({ ...prev, requester: e.target.value }))}
              fullWidth
              placeholder="e.g. Alice Smith"
            />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                label="Department"
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              >
                <MenuItem value="Production">Production</MenuItem>
                <MenuItem value="R&D">R&D</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="line-items-section">
            <div className="section-title-row">
              <h4>Requested Items</h4>
              <Button startIcon={<PlusCircle size={16} />} size="small" onClick={handleAddLineItem}>
                Add Item
              </Button>
            </div>
            
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell width="120">Available Stock</TableCell>
                  <TableCell width="120">Qty</TableCell>
                  <TableCell width="120">UOM</TableCell>
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
                      {inventory.find(inv => inv.itemCode === item.itemId)?.availableStock || 0}
                    </TableCell>
                    <TableCell>
                      <input 
                        type="number" 
                        className="table-input"
                        value={item.qty}
                        min="1"
                        onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <input 
                        type="text" 
                        className="table-input"
                        value={item.uom}
                        onChange={(e) => handleItemChange(idx, 'uom', e.target.value)}
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
              label="Requisition Remarks"
              multiline
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              fullWidth
              placeholder="Provide reason or specifications for requisition..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Submit for Approval</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Requisition Details - {selectedPR?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedPR && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>Requester:</strong> <span>{selectedPR.requester}</span>
              </div>
              <div className="view-detail-row">
                <strong>Department:</strong> <span>{selectedPR.department}</span>
              </div>
              <div className="view-detail-row">
                <strong>Date:</strong> <span>{selectedPR.date}</span>
              </div>
              <div className="view-detail-row">
                <strong>Priority:</strong> 
                <Chip label={selectedPR.priority} color={getPriorityColor(selectedPR.priority)} size="small" />
              </div>
              <div className="view-detail-row">
                <strong>Status:</strong> 
                <Chip label={selectedPR.status} color={getStatusColor(selectedPR.status)} size="small" />
              </div>
              {selectedPR.approvedBy && (
                <>
                  <div className="view-detail-row">
                    <strong>Approved By:</strong> <span>{selectedPR.approvedBy}</span>
                  </div>
                  <div className="view-detail-row">
                    <strong>Approval Date:</strong> <span>{selectedPR.approvalDate}</span>
                  </div>
                </>
              )}
              <div className="view-detail-row">
                <strong>Remarks:</strong> <span>{selectedPR.remarks || 'No remarks provided.'}</span>
              </div>

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Line Items Requested</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell align="right">Est. Unit Price</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPR.items.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{itm.name} ({itm.itemId})</TableCell>
                      <TableCell align="right">{itm.qty}</TableCell>
                      <TableCell>{itm.uom}</TableCell>
                      <TableCell align="right">${itm.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">${(itm.qty * itm.unitPrice).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} align="right"><strong>Estimated Total Value:</strong></TableCell>
                    <TableCell align="right" className="bold-cell">
                      ${selectedPR.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
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
        <DialogTitle className="dialog-title">Print Voucher Preview</DialogTitle>
        <DialogContent dividers>
          {selectedPR && (
            <div className="print-voucher-area" id="print-area">
              <div className="print-header">
                <div>
                  <h1 className="company-title">TRADEWARE ERP SYSTEMS</h1>
                  <p>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</p>
                  <p>Email: contact@tradeware.com | Tel: 6543-2109</p>
                </div>
                <div className="voucher-title-block">
                  <h2>PURCHASE REQUISITION</h2>
                  <p><strong>VOUCHER ID:</strong> {selectedPR.id}</p>
                  <p><strong>DATE:</strong> {selectedPR.date}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>REQUESTED BY:</strong> {selectedPR.requester}</p>
                  <p><strong>DEPARTMENT:</strong> {selectedPR.department}</p>
                </div>
                <div>
                  <p><strong>PRIORITY LEVEL:</strong> {selectedPR.priority}</p>
                  <p><strong>CURRENT STATUS:</strong> {selectedPR.status}</p>
                </div>
              </div>

              <table className="print-items-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Item Name</th>
                    <th className="num-col">Qty</th>
                    <th>UOM</th>
                    <th className="num-col">Est. Unit Price</th>
                    <th className="num-col">Total Est. Value</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPR.items.map((itm, idx) => (
                    <tr key={idx}>
                      <td>{itm.itemId}</td>
                      <td>{itm.name}</td>
                      <td className="num-col">{itm.qty}</td>
                      <td>{itm.uom}</td>
                      <td className="num-col">${itm.unitPrice.toFixed(2)}</td>
                      <td className="num-col">${(itm.qty * itm.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="5">Estimated Grand Total</td>
                    <td className="num-col">${selectedPR.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-remarks">
                <p><strong>REQUISITION REMARKS:</strong></p>
                <p>{selectedPR.remarks || 'No specific remarks attached.'}</p>
              </div>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Prepared By (Requester)</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space">{selectedPR.approvedBy ? selectedPR.approvedBy : ''}</div>
                  <p>Authorized Signature (Manager)</p>
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

export default PurchaseRequisition;

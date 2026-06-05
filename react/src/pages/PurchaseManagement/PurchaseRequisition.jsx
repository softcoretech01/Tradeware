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
  Search, Plus, Eye, Edit, Trash, Check, X, Printer,
  FileSpreadsheet, FileText, Trash2, PlusCircle
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const API_BASE_URL = 'http://127.0.0.1:8000/api/purchase/requisitions';

const PurchaseRequisition = () => {
  const location = useLocation();
  
  // Data States
  const [requisitions, setRequisitions] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    pr_id: null,
    pr_number: '',
    pr_date: new Date().toISOString().split('T')[0],
    requested_by: '',
    department: 'Production',
    priority: 'Medium',
    items: [],
    notes: ''
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchRequisitions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (res.ok) {
        const data = await res.json();
        setRequisitions(data);
      }
    } catch (error) {
      console.error("Error fetching requisitions:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, usersRes, itemsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/`),
        fetch(`${API_BASE_URL}/dropdown/users`),
        fetch(`${API_BASE_URL}/dropdown/items`)
      ]);
      
      const reqData = await reqRes.json();
      const usersData = await usersRes.json();
      const itemsData = await itemsRes.json();

      setRequisitions(reqData);
      setUsers(usersData);
      setItemsMaster(itemsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if opened via quick action
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true' && !loading) {
      handleOpenCreate();
    }
  }, [location, loading]);

  // Form handlers
  const handleOpenCreate = () => {
    let nextNum = 1;
    if (requisitions.length > 0) {
      const nums = requisitions.map(req => {
        const match = req.pr_number.match(/PR-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const nextPrNumber = `PR-${String(nextNum).padStart(3, '0')}`;

    setFormData({
      pr_id: null,
      pr_number: nextPrNumber,
      pr_date: new Date().toISOString().split('T')[0],
      requested_by: users.length > 0 ? users[0].id : '',
      department: 'Production',
      priority: 'Medium',
      items: [{ item_id: itemsMaster[0]?.id || '', requested_quantity: 1, uom: 'pcs', unit_price: itemsMaster[0]?.standardPrice || 0 }],
      notes: ''
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (pr) => {
    setFormData({ 
      ...pr,
      items: pr.items.map(item => ({
        ...item,
        requested_quantity: Number(item.requested_quantity)
      }))
    });
    setFormOpen(true);
  };

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_id: itemsMaster[0]?.id || '', requested_quantity: 1, uom: 'pcs', unit_price: itemsMaster[0]?.standardPrice || 0 }]
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
    if (field === 'item_id') {
      const selectedItem = itemsMaster.find(i => i.id === value);
      updatedItems[index] = {
        ...updatedItems[index],
        item_id: value,
        unit_price: selectedItem ? selectedItem.standardPrice : 0
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
    }
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSave = async () => {
    if (!formData.requested_by) {
      alert('Requester name is required.');
      return;
    }
    if (formData.items.length === 0) {
      alert('At least one line item is required.');
      return;
    }

    try {
      let response;
      const payload = {
        pr_number: formData.pr_number,
        pr_date: formData.pr_date,
        department: formData.department,
        requested_by: formData.requested_by,
        priority: formData.priority,
        notes: formData.notes,
        items: formData.items.map(item => ({
          item_id: item.item_id,
          requested_quantity: item.requested_quantity,
          uom: item.uom,
          unit_price: item.unit_price,
          total_price: item.requested_quantity * (item.unit_price || 0),
          reason_for_request: ""
        }))
      };

      if (formData.pr_id) {
        // Update existing
        response = await fetch(`${API_BASE_URL}/${formData.pr_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new
        response = await fetch(`${API_BASE_URL}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        fetchRequisitions(); // Reload list quietly
        setFormOpen(false);
      } else {
        const err = await response.json();
        alert(`Failed to save: ${JSON.stringify(err)}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred while saving.");
    }
  };

  const handleDelete = async (pr_id) => {
    if (window.confirm(`Are you sure you want to delete this requisition?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/${pr_id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchRequisitions();
        } else {
          alert('Failed to delete.');
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  // Helper to get user name
  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : `User ${id}`;
  };

  // Helper to get item name
  const getItemName = (id) => {
    const item = itemsMaster.find(i => i.id === id);
    return item ? item.name : id;
  };

  // Filters calculation
  const filteredPRs = requisitions.filter(pr => {
    const userName = getUserName(pr.requested_by).toLowerCase();
    const matchesSearch = pr.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          userName.includes(searchTerm.toLowerCase()) || 
                          (pr.notes && pr.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = deptFilter ? pr.department === deptFilter : true;
    const matchesPriority = priorityFilter ? pr.priority === priorityFilter : true;

    return matchesSearch && matchesDept && matchesPriority;
  });

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredPRs.map(pr => ({
      'Requisition ID': pr.pr_number,
      'Date': pr.pr_date,
      'Requester': getUserName(pr.requested_by),
      'Department': pr.department,
      'Priority': pr.priority,
      'Total Items': pr.items.length
    }));
    exportToExcel(data, 'Purchase_Requisitions', 'Requisitions');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'pr_number', headerName: 'Requisition ID' },
      { field: 'pr_date', headerName: 'Date' },
      { field: 'requester_name', headerName: 'Requester' },
      { field: 'department', headerName: 'Department' },
      { field: 'priority', headerName: 'Priority' }
    ];
    // Map data for PDF
    const pdfData = filteredPRs.map(pr => ({
      ...pr,
      requester_name: getUserName(pr.requested_by)
    }));
    exportToPDF(cols, pdfData, 'Purchase_Requisitions', 'Purchase Requisitions Report');
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
      case 'Pending': return 'warning';
      case 'Draft': return 'default';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading Purchase Requisitions...</div>;

  return (
    <div className="module-container fade-in">
      {/* Module Title Section */}
      <div className="module-header">
        <div>
          <h2>Purchase Requisition</h2>
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

      {/* Search & Filters */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or Requester" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
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
              <th>Priority</th>
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
                <tr key={pr.pr_id}>
                  <td className="bold-cell ">{pr.pr_number}</td>
                  <td>{formatDate(pr.pr_date)}</td>
                  <td >{getUserName(pr.requested_by)}</td>
                  <td>
                    <Chip label={pr.priority} color={getPriorityColor(pr.priority)} size="small" variant="outlined" />
                  </td>
                  <td className="actions-cell">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => { setSelectedPR(pr); setViewOpen(true); }}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(pr)}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Print Form">
                      <IconButton size="small" onClick={() => { setSelectedPR(pr); setPrintOpen(true); }}>
                        <Printer size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(pr.pr_id)}>
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
          {formData.pr_id ? 'Edit' : 'Create'} Requisition
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <TextField
              label="Date"
              type="date"
              value={formData.pr_date}
              onChange={(e) => setFormData(prev => ({ ...prev, pr_date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Requester Name</InputLabel>
              <Select
                value={formData.requested_by}
                label="Requester Name"
                onChange={(e) => setFormData(prev => ({ ...prev, requested_by: e.target.value }))}
              >
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                ))}
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
                  <TableCell className="text-right" width="100">Qty</TableCell>
                  <TableCell width="100">UOM</TableCell>
                  <TableCell className="text-right" width="120">Unit Price</TableCell>
                  <TableCell className="text-right" width="120">Total Price</TableCell>
                  <TableCell width="80" align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <select 
                        className="table-select" 
                        value={item.item_id}
                        onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                      >
                        {itemsMaster.map(itm => (
                          <option key={itm.id} value={itm.id}>{itm.name} ({itm.id})</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell >
                      <input 
                        type="number" 
                        className="table-input"
                        value={item.requested_quantity}
                        min="1"
                        onChange={(e) => handleItemChange(idx, 'requested_quantity', e.target.value)}
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
                      {Number(item.requested_quantity * (item.unit_price || 0)).toFixed(2)}
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
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              placeholder="Provide reason or specifications for requisition..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {formData.pr_id ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Requisition Details - {selectedPR?.pr_number}</DialogTitle>
        <DialogContent dividers>
          {selectedPR && (
            <div className="view-detail-body">
              <div className="view-detail-row">
                <strong>Requester:</strong> <span>{getUserName(selectedPR.requested_by)}</span>
              </div>
              <div className="view-detail-row">
                <strong>Department:</strong> <span>{selectedPR.department}</span>
              </div>
              <div className="view-detail-row">
                <strong>Date:</strong> <span>{formatDate(selectedPR.pr_date)}</span>
              </div>
              <div className="view-detail-row">
                <strong>Priority:</strong> 
                <Chip label={selectedPR.priority} color={getPriorityColor(selectedPR.priority)} size="small" />
              </div>
              <div className="view-detail-row">
                <strong>Remarks:</strong> <span>{selectedPR.notes || 'No remarks provided.'}</span>
              </div>

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Line Items Requested</h4>
              <Table size="small" className="detail-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell className="text-right" align="right">Qty</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell  align="right">Unit Price (₹)</TableCell>
                    <TableCell align="right">Subtotal (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPR.items.map((itm, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{getItemName(itm.item_id)}</TableCell>
                      <TableCell align="right" className="text-right">{Number(itm.requested_quantity)}</TableCell>
                      <TableCell >{itm.uom}</TableCell>
                      <TableCell className="text-right" align="right">{itm.unit_price}</TableCell>
                      <TableCell className="text-right" align="right">{(itm.requested_quantity * (itm.unit_price || 0)).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="text-right" colSpan={4} align="right"><strong>Estimated Total Value:</strong></TableCell>
                    <TableCell align="right" className="bold-cell text-right">
                      {selectedPR.items.reduce((sum, i) => sum + (i.requested_quantity * (i.unit_price || 0)), 0).toFixed(2)}
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
                  <p><strong>VOUCHER ID:</strong> {selectedPR.pr_number}</p>
                  <p><strong>DATE:</strong> {selectedPR.pr_date}</p>
                </div>
              </div>

              <hr className="print-divider" />

              <div className="print-metadata-grid">
                <div>
                  <p><strong>REQUESTED BY:</strong> {getUserName(selectedPR.requested_by)}</p>
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
                    <th className="num-col text-right">Qty</th>
                    <th>UOM</th>
                    <th className="num-col text-right">Unit Price (₹)</th>
                    <th className="num-col text-right">Total Est. Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPR.items.map((itm, idx) => (
                    <tr key={idx}>
                      <td >{itm.item_id}</td>
                      <td >{getItemName(itm.item_id)}</td>
                      <td className="num-col text-right">{Number(itm.requested_quantity)}</td>
                      <td >{itm.uom}</td>
                      <td className="num-col text-right">{itm.unit_price}</td>
                      <td className="num-col text-right">{(itm.requested_quantity * (itm.unit_price || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="5">Estimated Grand Total</td>
                    <td className="num-col text-right">{selectedPR.items.reduce((sum, i) => sum + (i.requested_quantity * (i.unit_price || 0)), 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-remarks">
                <p><strong>REQUISITION REMARKS:</strong></p>
                <p>{selectedPR.notes || 'No specific remarks attached.'}</p>
              </div>

              <div className="print-signatures">
                <div className="sig-line">
                  <div className="sig-space"></div>
                  <p>Prepared By (Requester)</p>
                </div>
                <div className="sig-line">
                  <div className="sig-space"></div>
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

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel, 
  Tooltip, IconButton, Chip, Grid, Card, CardContent, Typography, Box
} from '@mui/material';
import { 
  Search, Plus, Edit, CheckCircle2, AlertTriangle, LifeBuoy, FileSpreadsheet
} from 'lucide-react';
import { 
  addComplaint, updateComplaint, resolveComplaint 
} from '../../store/crmSlice';
import { exportToExcel } from '../../utils/exportUtil';

const ComplaintManagement = () => {
  const dispatch = useDispatch();

  // Selectors
  const complaints = useSelector(state => state.crm.complaints);
  const customers = useSelector(state => state.customers.customers);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    customerId: '',
    customerName: '',
    subject: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    resolutionNotes: ''
  });

  const [resNotes, setResNotes] = useState('');

  // Computations
  const openCount = complaints.filter(c => c.status === 'Open').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  // Handlers
  const handleOpenCreate = () => {
    setSelectedComplaint(null);
    const defaultCust = customers[0];
    setFormData({
      id: `CMP-${Date.now().toString().slice(-4)}`,
      customerId: defaultCust ? defaultCust.id : '',
      customerName: defaultCust ? defaultCust.name : '',
      subject: '',
      description: '',
      priority: 'Medium',
      status: 'Open',
      resolutionNotes: ''
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (cmp) => {
    setSelectedComplaint(cmp);
    setFormData({ ...cmp });
    setFormOpen(true);
  };

  const handleCustomerChange = (custId) => {
    const cust = customers.find(c => c.id === custId);
    setFormData(prev => ({
      ...prev,
      customerId: custId,
      customerName: cust ? cust.name : ''
    }));
  };

  const handleSave = () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      alert('Subject and description are required.');
      return;
    }
    if (selectedComplaint) {
      dispatch(updateComplaint(formData));
    } else {
      dispatch(addComplaint({ 
        ...formData, 
        dateLogged: new Date().toISOString().split('T')[0],
        dateResolved: null
      }));
    }
    setFormOpen(false);
  };

  const handleOpenResolve = (cmp) => {
    setSelectedComplaint(cmp);
    setResNotes(`Ticket resolved: corrective action applied.`);
    setResolveOpen(true);
  };

  const handleSaveResolve = () => {
    if (!resNotes.trim()) {
      alert('Resolution notes are required.');
      return;
    }
    dispatch(resolveComplaint({ id: selectedComplaint.id, resolutionNotes: resNotes }));
    setResolveOpen(false);
    alert('Ticket resolved successfully.');
  };

  // Filtering
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter ? c.priority === priorityFilter : true;
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const handleExportExcel = () => {
    const exportData = filteredComplaints.map(c => ({
      'Ticket ID': c.id,
      'Customer ID': c.customerId,
      'Customer Name': c.customerName,
      'Subject': c.subject,
      'Description': c.description,
      'Priority': c.priority,
      'Status': c.status,
      'Logged Date': c.dateLogged,
      'Resolved Date': c.dateResolved || 'N/A',
      'Resolution Notes': c.resolutionNotes || 'N/A'
    }));
    exportToExcel(exportData, 'Customer_Complaints_Report', 'Tickets');
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
      case 'Open': return 'primary';
      case 'In Progress': return 'warning';
      case 'Resolved': return 'success';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Complaint Management</h2>
          <p className="subtitle">Register customer issues, designate priority levels, log progress, and record resolutions.</p>
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

      {/* KPI counters */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">OPEN TICKETS</Typography>
                <AlertTriangle color="#3b82f6" size={20} />
              </Box>
              <Typography variant="h4" fontWeight="700" color="primary.main" sx={{ mt: 1.5 }}>
                {openCount}
              </Typography>
              <Typography variant="caption" color="var(--text-muted)">Awaiting review or delegation</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">IN PROGRESS</Typography>
                <LifeBuoy color="#f59e0b" size={20} />
              </Box>
              <Typography variant="h4" fontWeight="700" color="warning.main" sx={{ mt: 1.5 }}>
                {inProgressCount}
              </Typography>
              <Typography variant="caption" color="var(--text-muted)">Currently undergoing investigation</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">RESOLVED TICKETS</Typography>
                <CheckCircle2 color="#10b981" size={20} />
              </Box>
              <Typography variant="h4" fontWeight="700" color="success.main" sx={{ mt: 1.5 }}>
                {resolvedCount}
              </Typography>
              <Typography variant="caption" color="var(--text-muted)">Client satisfaction verified</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Customer, Ticket ID, Subject..." 
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

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Grid Table */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Customer</th>
              <th>Subject</th>
              <th>Priority</th>
              <th>Date Logged</th>
              <th>Status</th>
              <th>Resolution Notes</th>
              <th className="actions-column">Ticket Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No complaints registered matching filters.</td>
              </tr>
            ) : (
              filteredComplaints.map(c => (
                <tr key={c.id}>
                  <td className="bold-cell">{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.customerName}</td>
                  <td>
                    <div>{c.subject}</div>
                    <Typography variant="caption" color="var(--text-muted)" sx={{ display: 'block', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.description}
                    </Typography>
                  </td>
                  <td>
                    <Chip 
                      label={c.priority} 
                      color={getPriorityColor(c.priority)} 
                      size="small" 
                    />
                  </td>
                  <td>{c.dateLogged}</td>
                  <td>
                    <Chip 
                      label={c.status} 
                      color={getStatusColor(c.status)} 
                      size="small" 
                    />
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontStyle: 'italic', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.resolutionNotes || 'No notes.'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {c.status !== 'Resolved' && c.status !== 'Closed' && (
                      <Tooltip title="Mark Resolved">
                        <IconButton size="small" className="btn-icon-success" onClick={() => handleOpenResolve(c)}>
                          <CheckCircle2 size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit Ticket">
                      <IconButton size="small" onClick={() => handleOpenEdit(c)}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE & EDIT FORM DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          {selectedComplaint ? 'Edit Complaint Ticket' : 'Register Support Complaint'} ({formData.id})
        </DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select
                value={formData.customerId}
                label="Customer"
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                {customers.map(cust => (
                  <MenuItem key={cust.id} value={cust.id}>{cust.name} ({cust.id})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Subject / Ticket Issue"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              fullWidth
              required
            />

            <TextField
              label="Detailed Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={4}
              fullWidth
              required
              placeholder="Detail what occurred, error details, product issues, or delivery delays..."
            />

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Resolved">Resolved</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* RESOLVE TICKET DIALOG */}
      <Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Resolve Customer Ticket</DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p>Log details of the fix or compensation provided to <strong>{selectedComplaint?.customerName}</strong>.</p>
            <TextField
              label="Resolution & Corrective Action Notes"
              value={resNotes}
              onChange={(e) => setResNotes(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
              placeholder="Detail parts replacement, credits issued, or customer signoff details..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveResolve} variant="contained" color="success">Resolve Ticket</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ComplaintManagement;

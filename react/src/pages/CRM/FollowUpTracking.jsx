import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel, 
  Tooltip, IconButton, Chip, Box
} from '@mui/material';
import { 
  Search, Plus, CheckCircle, Clock, XCircle, Edit, Trash2, 
  Phone, Video, Mail, Calendar, FileSpreadsheet
} from 'lucide-react';
import { 
  addFollowup, updateFollowup, deleteFollowup, completeFollowup 
} from '../../store/crmSlice';
import { exportToExcel } from '../../utils/exportUtil';

const FollowUpTracking = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const followups = useSelector(state => state.crm.followups);
  const leads = useSelector(state => state.crm.leads);
  const opportunities = useSelector(state => state.crm.opportunities);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    id: '',
    entityType: 'Lead',
    entityId: '',
    entityName: '',
    type: 'Call',
    dateTime: '',
    notes: '',
    status: 'Pending'
  });

  const [completionNotes, setCompletionNotes] = useState('');

  // Handlers
  const handleOpenCreate = () => {
    setSelectedFollowup(null);
    
    // Pick first lead or opportunity as default reference
    const defaultLead = leads[0];
    
    setFormData({
      id: `FOL-${Date.now().toString().slice(-4)}`,
      entityType: 'Lead',
      entityId: defaultLead ? defaultLead.id : '',
      entityName: defaultLead ? defaultLead.name : '',
      type: 'Call',
      dateTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().substring(0, 16),
      notes: '',
      status: 'Pending'
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (fol) => {
    setSelectedFollowup(fol);
    setFormData({ ...fol });
    setFormOpen(true);
  };

  const handleEntityChange = (type, id) => {
    let name = '';
    if (type === 'Lead') {
      const match = leads.find(l => l.id === id);
      name = match ? match.name : '';
    } else if (type === 'Opportunity') {
      const match = opportunities.find(o => o.id === id);
      name = match ? match.customerName : '';
    }
    setFormData(prev => ({ ...prev, entityType: type, entityId: id, entityName: name }));
  };

  const handleSave = () => {
    if (!formData.entityId || !formData.notes.trim()) {
      alert('Referenced Lead/Opportunity and Agenda notes are required.');
      return;
    }
    
    if (selectedFollowup) {
      dispatch(updateFollowup(formData));
    } else {
      dispatch(addFollowup(formData));
    }
    setFormOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete follow-up schedule ${id}?`)) {
      dispatch(deleteFollowup(id));
    }
  };

  const handleOpenComplete = (fol) => {
    setSelectedFollowup(fol);
    setCompletionNotes(`Completed follow-up: ${fol.notes}. Customer discussed terms.`);
    setCompleteOpen(true);
  };

  const handleSaveComplete = () => {
    if (!completionNotes.trim()) {
      alert('Completion notes are required.');
      return;
    }
    dispatch(completeFollowup({ id: selectedFollowup.id, notes: completionNotes }));
    setCompleteOpen(false);
    alert('Follow-up marked as Completed.');
  };

  // Filters
  const filteredFollowups = followups.filter(f => {
    const matchesSearch = f.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter ? f.type === typeFilter : true;
    const matchesStatus = statusFilter ? f.status === statusFilter : true;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExportExcel = () => {
    const exportData = filteredFollowups.map(f => ({
      'Task ID': f.id,
      'Reference Module': f.entityType,
      'Reference ID': f.entityId,
      'Prospect Name': f.entityName,
      'Mode': f.type,
      'Date & Time Scheduled': new Date(f.dateTime).toLocaleString(),
      'Status': f.status,
      'Agenda / Outcome Notes': f.notes
    }));
    exportToExcel(exportData, 'CRM_Followups_Report', 'Schedules');
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Follow-up Tracking</h2>
          <p className="subtitle">Schedule client interactions, record task notes, and coordinate follow-up alerts across sales representatives.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Schedule Follow-up
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Company, Notes, ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Modes</option>
            <option value="Call">Phone Call</option>
            <option value="Meeting">Meeting</option>
            <option value="Email">Email</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid cards / Table of reminders */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Prospect / Target</th>
              <th>Reference Module</th>
              <th>Follow-up Mode</th>
              <th>Date & Time</th>
              <th>Agenda Notes</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFollowups.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No follow-up schedules found matching filters.</td>
              </tr>
            ) : (
              filteredFollowups.map(f => (
                <tr key={f.id}>
                  <td className="bold-cell">{f.id}</td>
                  <td style={{ fontWeight: 600 }}>{f.entityName}</td>
                  <td>
                    <Chip label={`${f.entityType} (${f.entityId})`} size="small" variant="outlined" />
                  </td>
                  <td>
                    <Box display="flex" alignItems="center" gap={1}>
                      {f.type === 'Call' && <Phone size={14} color="#3b82f6" />}
                      {f.type === 'Meeting' && <Video size={14} color="#10b981" />}
                      {f.type === 'Email' && <Mail size={14} color="#f59e0b" />}
                      <span style={{ fontSize: '13px' }}>{f.type}</span>
                    </Box>
                  </td>
                  <td>
                    {new Date(f.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <span style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.notes}
                    </span>
                  </td>
                  <td>
                    <Chip 
                      label={f.status} 
                      color={f.status === 'Completed' ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </td>
                  <td className="actions-cell">
                    {f.status === 'Pending' && (
                      <Tooltip title="Mark Task Completed">
                        <IconButton size="small" className="btn-icon-success" onClick={() => handleOpenComplete(f)}>
                          <CheckCircle size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit Schedule">
                      <IconButton size="small" onClick={() => handleOpenEdit(f)}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Schedule">
                      <IconButton size="small" color="error" onClick={() => handleDelete(f.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT FOLLOWUP DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          {selectedFollowup ? 'Reschedule Follow-up' : 'Create Follow-up Schedule'} ({formData.id})
        </DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormControl fullWidth>
              <InputLabel>Reference Module</InputLabel>
              <Select
                value={formData.entityType}
                label="Reference Module"
                onChange={(e) => handleEntityChange(e.target.value, '')}
              >
                <MenuItem value="Lead">Lead Management</MenuItem>
                <MenuItem value="Opportunity">Opportunity Management</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Target Record</InputLabel>
              <Select
                value={formData.entityId}
                label="Target Record"
                onChange={(e) => handleEntityChange(formData.entityType, e.target.value)}
              >
                {formData.entityType === 'Lead' ? (
                  leads.map(l => (
                    <MenuItem key={l.id} value={l.id}>{l.name} ({l.id})</MenuItem>
                  ))
                ) : (
                  opportunities.map(o => (
                    <MenuItem key={o.id} value={o.id}>{o.customerName} ({o.id})</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Follow-up Mode</InputLabel>
              <Select
                value={formData.type}
                label="Follow-up Mode"
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="Call">Phone Call</MenuItem>
                <MenuItem value="Meeting">Meeting (F2F/Virtual)</MenuItem>
                <MenuItem value="Email">Email Communication</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Scheduled Date & Time"
              type="datetime-local"
              value={formData.dateTime}
              onChange={(e) => setFormData(prev => ({ ...prev, dateTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Agenda & Remarks"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Outline meeting details, items to propose, or notes on phone discussions..."
              required
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* MARK COMPLETED DIALOG */}
      <Dialog open={completeOpen} onClose={() => setCompleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Mark Follow-up Completed</DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p>Log the outcome of your call/meeting with <strong>{selectedFollowup?.entityName}</strong>.</p>
            
            <TextField
              label="Outcome / Resolution Notes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              multiline
              rows={4}
              fullWidth
              placeholder="Detail what was discussed, what materials were requested, pricing feedback, etc..."
              required
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveComplete} variant="contained" color="success">Log Outcome</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FollowUpTracking;

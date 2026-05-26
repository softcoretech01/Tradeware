import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel, 
  Tooltip, IconButton, Chip, TablePagination
} from '@mui/material';
import { 
  Search, Plus, Edit, Trash2, Calendar, Award, FileSpreadsheet, Sparkles
} from 'lucide-react';
import { 
  addLead, updateLead, deleteLead, 
  addOpportunity, addFollowup 
} from '../../store/crmSlice';
import { exportToExcel } from '../../utils/exportUtil';

const LeadManagement = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const leads = useSelector(state => state.crm.leads);
  const usersList = useSelector(state => state.erp.users);
  const salesTeam = usersList.filter(u => u.role === 'Sales Team' || u.role === 'Admin');

  // Local States
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Form Data States
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    source: 'Website',
    status: 'New',
    assignedSalesperson: 'usr004',
    followUpDate: new Date().toISOString().split('T')[0],
    notes: '',
    opportunityValue: 0
  });

  const [followupData, setFollowupData] = useState({
    type: 'Call',
    dateTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().substring(0, 16),
    notes: ''
  });

  const [convertData, setConvertData] = useState({
    expectedCloseDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    notes: ''
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedLead(null);
    setFormData({
      id: `LEAD-${Date.now().toString().slice(-4)}`,
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      source: 'Website',
      status: 'New',
      assignedSalesperson: salesTeam[0]?.id || 'usr004',
      followUpDate: new Date().toISOString().split('T')[0],
      notes: '',
      opportunityValue: 5000
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({ ...lead });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.contactPerson.trim()) {
      alert('Company/Lead Name and Contact Person are required.');
      return;
    }
    if (selectedLead) {
      dispatch(updateLead(formData));
    } else {
      dispatch(addLead({ ...formData, createdDate: new Date().toISOString().split('T')[0] }));
    }
    setFormOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete lead ${id}?`)) {
      dispatch(deleteLead(id));
    }
  };

  // Follow-up handlers
  const handleOpenFollowup = (lead) => {
    setSelectedLead(lead);
    setFollowupData({
      type: 'Call',
      dateTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().substring(0, 16),
      notes: `Follow-up with ${lead.contactPerson} from ${lead.name}`
    });
    setFollowupOpen(true);
  };

  const handleSaveFollowup = () => {
    if (!followupData.notes.trim()) {
      alert('Follow-up notes are required.');
      return;
    }

    const newFollowup = {
      id: `FOL-${Date.now().toString().slice(-4)}`,
      entityType: 'Lead',
      entityId: selectedLead.id,
      entityName: selectedLead.name,
      type: followupData.type,
      dateTime: followupData.dateTime,
      notes: followupData.notes,
      status: 'Pending'
    };

    dispatch(addFollowup(newFollowup));
    
    // Also update lead's follow-up date
    dispatch(updateLead({
      ...selectedLead,
      followUpDate: followupData.dateTime.split('T')[0]
    }));

    setFollowupOpen(false);
    alert('Follow-up schedule created successfully.');
  };

  // Conversion Handlers
  const handleOpenConvert = (lead) => {
    setSelectedLead(lead);
    setConvertData({
      expectedCloseDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      notes: `Converted from Lead ${lead.id}. Client expressed strong interest.`
    });
    setConvertOpen(true);
  };

  const handleSaveConvert = () => {
    const oppId = `OPP-${Date.now().toString().slice(-4)}`;
    
    // Create new opportunity
    const newOpportunity = {
      id: oppId,
      leadId: selectedLead.id,
      customerName: selectedLead.name,
      value: selectedLead.opportunityValue,
      stage: 'Qualification',
      expectedClosingDate: convertData.expectedCloseDate,
      assignedSalesperson: selectedLead.assignedSalesperson,
      notes: convertData.notes
    };

    dispatch(addOpportunity(newOpportunity));

    // Update Lead status to Converted
    dispatch(updateLead({
      ...selectedLead,
      status: 'Converted'
    }));

    setConvertOpen(false);
    alert(`Lead ${selectedLead.name} successfully converted to Opportunity ${oppId}!`);
  };

  // Filtering
  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = sourceFilter ? l.source === sourceFilter : true;
    const matchesStatus = statusFilter ? l.status === statusFilter : true;

    return matchesSearch && matchesSource && matchesStatus;
  });

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredLeads.map(l => {
      const sp = salesTeam.find(u => u.id === l.assignedSalesperson);
      return {
        'Lead ID': l.id,
        'Company Name': l.name,
        'Contact Person': l.contactPerson,
        'Email': l.email,
        'Phone': l.phone,
        'Source': l.source,
        'Status': l.status,
        'Salesperson': sp ? sp.name : l.assignedSalesperson,
        'Next Follow-up': l.followUpDate,
        'Opportunity Value ($)': l.opportunityValue,
        'Date Logged': l.createdDate,
        'Notes': l.notes
      };
    });
    exportToExcel(exportData, 'Lead_Management_Report', 'Leads');
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'New': return 'primary';
      case 'Contacted': return 'warning';
      case 'Follow-up': return 'secondary';
      case 'Converted': return 'success';
      case 'Lost': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Lead Management</h2>
          <p className="subtitle">Track sales prospects, manage lead sources, assign executives, and push converted leads into opportunities.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Add New Lead
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Company, Name, ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Exhibition">Exhibition / Expo</option>
            <option value="Social Media">Social Media</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Lead ID</th>
              <th>Company Name</th>
              <th>Contact Person</th>
              <th>Contact Details</th>
              <th>Source</th>
              <th>Est. Value</th>
              <th>Assigned Rep</th>
              <th>Next Follow-up</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="10" className="table-empty">No leads found matching criteria.</td>
              </tr>
            ) : (
              filteredLeads
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(l => {
                  const salesperson = salesTeam.find(u => u.id === l.assignedSalesperson)?.name || 'Unassigned';
                  return (
                    <tr key={l.id}>
                      <td className="bold-cell">{l.id}</td>
                      <td style={{ fontWeight: 600 }}>{l.name}</td>
                      <td>{l.contactPerson}</td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.email}</div>
                        <div style={{ fontSize: '12px' }}>{l.phone}</div>
                      </td>
                      <td>{l.source}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        ${l.opportunityValue?.toLocaleString() || '0'}
                      </td>
                      <td>{salesperson}</td>
                      <td>{l.followUpDate}</td>
                      <td>
                        <Chip 
                          label={l.status} 
                          color={getStatusChipColor(l.status)} 
                          size="small" 
                        />
                      </td>
                      <td className="actions-cell">
                        {l.status !== 'Converted' && (
                          <>
                            <Tooltip title="Schedule Follow-up">
                              <IconButton size="small" color="primary" onClick={() => handleOpenFollowup(l)}>
                                <Calendar size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Convert to Opportunity">
                              <IconButton size="small" color="success" onClick={() => handleOpenConvert(l)}>
                                <Sparkles size={16} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Edit Lead">
                          <IconButton size="small" onClick={() => handleOpenEdit(l)}>
                            <Edit size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Lead">
                          <IconButton size="small" color="error" onClick={() => handleDelete(l.id)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={filteredLeads.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </div>

      {/* CREATE & EDIT LEAD DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          {selectedLead ? `Edit Lead Details: ${formData.name}` : 'Log New Prospect Lead'} ({formData.id})
        </DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid">
            <TextField
              label="Company / Lead Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Contact Person Name"
              value={formData.contactPerson}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Lead Source</InputLabel>
              <Select
                value={formData.source}
                label="Lead Source"
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              >
                <MenuItem value="Website">Website</MenuItem>
                <MenuItem value="Referral">Referral</MenuItem>
                <MenuItem value="Cold Call">Cold Call</MenuItem>
                <MenuItem value="Exhibition">Exhibition / Expo</MenuItem>
                <MenuItem value="Social Media">Social Media</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Lead Status</InputLabel>
              <Select
                value={formData.status}
                label="Lead Status"
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="Contacted">Contacted</MenuItem>
                <MenuItem value="Follow-up">Follow-up</MenuItem>
                <MenuItem value="Converted">Converted</MenuItem>
                <MenuItem value="Lost">Lost</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Assign Salesperson</InputLabel>
              <Select
                value={formData.assignedSalesperson}
                label="Assign Salesperson"
                onChange={(e) => setFormData(prev => ({ ...prev, assignedSalesperson: e.target.value }))}
              >
                {salesTeam.map(rep => (
                  <MenuItem key={rep.id} value={rep.id}>{rep.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Estimated Opportunity Value ($)"
              type="number"
              value={formData.opportunityValue}
              onChange={(e) => setFormData(prev => ({ ...prev, opportunityValue: parseFloat(e.target.value) || 0 }))}
              fullWidth
            />

            <TextField
              label="Next Follow-up Date"
              type="date"
              value={formData.followUpDate}
              onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </div>
          <div style={{ marginTop: '16px' }}>
            <TextField
              label="Lead Requirement Notes / Remarks"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Enter customer specific needs, background info, or previous conversation history..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save Lead</Button>
        </DialogActions>
      </Dialog>

      {/* SCHEDULE FOLLOWUP DIALOG */}
      <Dialog open={followupOpen} onClose={() => setFollowupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Schedule Follow-up ({selectedLead?.name})</DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormControl fullWidth>
              <InputLabel>Follow-up Mode</InputLabel>
              <Select
                value={followupData.type}
                label="Follow-up Mode"
                onChange={(e) => setFollowupData(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="Call">Phone Call</MenuItem>
                <MenuItem value="Meeting">Meeting (F2F/Virtual)</MenuItem>
                <MenuItem value="Email">Email Communication</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Scheduled Date & Time"
              type="datetime-local"
              value={followupData.dateTime}
              onChange={(e) => setFollowupData(prev => ({ ...prev, dateTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Agenda & Follow-up Notes"
              value={followupData.notes}
              onChange={(e) => setFollowupData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              required
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowupOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveFollowup} variant="contained" color="primary">Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* CONVERT TO OPPORTUNITY DIALOG */}
      <Dialog open={convertOpen} onClose={() => setConvertOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          Convert Lead to Deal Opportunity
        </DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p>You are converting <strong>{selectedLead?.name}</strong> to a sales opportunity pipeline.</p>
            
            <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: 'var(--radius)', border: '1px solid #bfdbfe' }}>
              <div><strong>Deal Name:</strong> {selectedLead?.name}</div>
              <div><strong>Expected Deal Value:</strong> ${selectedLead?.opportunityValue?.toLocaleString()}</div>
            </div>

            <TextField
              label="Expected Closing Date"
              type="date"
              value={convertData.expectedCloseDate}
              onChange={(e) => setConvertData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Closing Strategy / Sales Notes"
              value={convertData.notes}
              onChange={(e) => setConvertData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Outline steps needed to win this deal..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveConvert} variant="contained" color="success">Convert Lead</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LeadManagement;

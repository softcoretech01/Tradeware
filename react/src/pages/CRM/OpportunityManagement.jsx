import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel, 
  Tooltip, IconButton, Chip, Grid, Card, CardContent, Typography, Box
} from '@mui/material';
import { 
  Search, Plus, Edit, Trash2, Calendar, User, TrendingUp, CheckCircle, XCircle, FileSpreadsheet
} from 'lucide-react';
import { 
  addOpportunity, updateOpportunity, deleteOpportunity 
} from '../../store/crmSlice';
import { exportToExcel } from '../../utils/exportUtil';

const OpportunityManagement = () => {
  const dispatch = useDispatch();

  // Selectors
  const opportunities = useSelector(state => state.crm.opportunities);
  const leads = useSelector(state => state.crm.leads);
  const usersList = useSelector(state => state.erp.users);
  const salesTeam = usersList.filter(u => u.role === 'Sales Team' || u.role === 'Admin');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    leadId: '',
    customerName: '',
    value: 0,
    stage: 'Qualification',
    expectedClosingDate: '',
    assignedSalesperson: '',
    notes: ''
  });

  // KPI Calculations
  const openOpps = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost');
  const totalValue = openOpps.reduce((sum, o) => sum + o.value, 0);
  const wonCount = opportunities.filter(o => o.stage === 'Won').length;
  const wonValue = opportunities.filter(o => o.stage === 'Won').reduce((sum, o) => sum + o.value, 0);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedOpp(null);
    const defaultLead = leads[0];
    setFormData({
      id: `OPP-${Date.now().toString().slice(-4)}`,
      leadId: defaultLead ? defaultLead.id : '',
      customerName: defaultLead ? defaultLead.name : '',
      value: defaultLead ? defaultLead.opportunityValue : 10000,
      stage: 'Qualification',
      expectedClosingDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      assignedSalesperson: salesTeam[0]?.id || 'usr004',
      notes: ''
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (opp) => {
    setSelectedOpp(opp);
    setFormData({ ...opp });
    setFormOpen(true);
  };

  const handleLeadChange = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    setFormData(prev => ({
      ...prev,
      leadId: leadId,
      customerName: lead ? lead.name : '',
      value: lead ? lead.opportunityValue : prev.value
    }));
  };

  const handleSave = () => {
    if (!formData.customerName.trim() || formData.value <= 0) {
      alert('Deal customer name and valid deal value are required.');
      return;
    }

    if (selectedOpp) {
      dispatch(updateOpportunity(formData));
    } else {
      dispatch(addOpportunity(formData));
    }
    setFormOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete opportunity record ${id}?`)) {
      dispatch(deleteOpportunity(id));
    }
  };

  const handleQuickStageUpdate = (opp, nextStage) => {
    dispatch(updateOpportunity({
      ...opp,
      stage: nextStage
    }));
    alert(`Opportunity ${opp.id} status updated to ${nextStage}.`);
  };

  // Filter
  const filteredOpps = opportunities.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter ? o.stage === stageFilter : true;
    return matchesSearch && matchesStage;
  });

  const handleExportExcel = () => {
    const exportData = filteredOpps.map(o => {
      const sp = salesTeam.find(u => u.id === o.assignedSalesperson);
      return {
        'Opportunity ID': o.id,
        'Source Lead ID': o.leadId,
        'Deal Prospect Name': o.customerName,
        'Value ($)': o.value,
        'Pipeline Stage': o.stage,
        'Target Close Date': o.expectedClosingDate,
        'Assigned Rep': sp ? sp.name : o.assignedSalesperson,
        'Deal Notes': o.notes
      };
    });
    exportToExcel(exportData, 'CRM_Opportunities_Forecast', 'Deals');
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'Qualification': return 'default';
      case 'Proposal': return 'primary';
      case 'Negotiation': return 'warning';
      case 'Won': return 'success';
      case 'Lost': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Opportunity Management</h2>
          <p className="subtitle">Forecast pipeline valuations, trace negotiations, schedule expected closing dates, and log won accounts.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> New Opportunity
          </button>
        </div>
      </div>

      {/* KPI stats bar */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">ACTIVE PIPELINE VALUE</Typography>
              <Typography variant="h4" fontWeight="700" color="primary.main" sx={{ mt: 1 }}>
                ${totalValue.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="var(--text-muted)">{openOpps.length} active negotiating deals</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">DEALS CLOSED (WON)</Typography>
              <Typography variant="h4" fontWeight="700" color="success.main" sx={{ mt: 1 }}>
                ${wonValue.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="var(--text-muted)">{wonCount} successful customer conversions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">WIN CONVERSION RATE</Typography>
              <Typography variant="h4" fontWeight="700" sx={{ mt: 1 }}>
                {opportunities.length ? ((wonCount / opportunities.length) * 100).toFixed(0) : 0}%
              </Typography>
              <Typography variant="caption" color="var(--text-muted)">Out of {opportunities.length} total registered opportunities</Typography>
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
            placeholder="Search by Deal Prospect Name, Notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="">All Stages</option>
            <option value="Qualification">Qualification</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won (Closed)</option>
            <option value="Lost">Lost (Closed)</option>
          </select>
        </div>
      </div>

      {/* Grid Table */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Opp ID</th>
              <th>Customer Name</th>
              <th>Source Lead</th>
              <th>Deal Value</th>
              <th>Target Closing Date</th>
              <th>Assigned Rep</th>
              <th>Current Stage</th>
              <th className="actions-column">Pipeline Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOpps.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No opportunities registered.</td>
              </tr>
            ) : (
              filteredOpps.map(opp => {
                const rep = salesTeam.find(u => u.id === opp.assignedSalesperson)?.name || 'Unassigned';
                return (
                  <tr key={opp.id}>
                    <td className="bold-cell">{opp.id}</td>
                    <td style={{ fontWeight: 600 }}>{opp.customerName}</td>
                    <td>
                      <Chip label={opp.leadId} size="small" variant="outlined" />
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      ${opp.value?.toLocaleString()}
                    </td>
                    <td>{opp.expectedClosingDate}</td>
                    <td>{rep}</td>
                    <td>
                      <Chip 
                        label={opp.stage} 
                        color={getStageColor(opp.stage)} 
                        size="small" 
                      />
                    </td>
                    <td className="actions-cell">
                      {opp.stage !== 'Won' && opp.stage !== 'Lost' && (
                        <>
                          <Tooltip title="Mark Deal Won">
                            <IconButton size="small" color="success" onClick={() => handleQuickStageUpdate(opp, 'Won')}>
                              <CheckCircle size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mark Deal Lost">
                            <IconButton size="small" color="error" onClick={() => handleQuickStageUpdate(opp, 'Lost')}>
                              <XCircle size={16} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Edit Details">
                        <IconButton size="small" onClick={() => handleOpenEdit(opp)}>
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete record">
                        <IconButton size="small" color="error" onClick={() => handleDelete(opp.id)}>
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
      </div>

      {/* CREATE & EDIT DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          {selectedOpp ? 'Edit Opportunity Record' : 'Create Opportunity Pipeline'} ({formData.id})
        </DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormControl fullWidth>
              <InputLabel>Reference Lead Prospect</InputLabel>
              <Select
                value={formData.leadId}
                label="Reference Lead Prospect"
                onChange={(e) => handleLeadChange(e.target.value)}
              >
                {leads.map(l => (
                  <MenuItem key={l.id} value={l.id}>{l.name} ({l.id})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Deal/Customer Name"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              fullWidth
              required
            />

            <TextField
              label="Pipeline Value ($)"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Pipeline Stage</InputLabel>
              <Select
                value={formData.stage}
                label="Pipeline Stage"
                onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
              >
                <MenuItem value="Qualification">Qualification</MenuItem>
                <MenuItem value="Proposal">Proposal</MenuItem>
                <MenuItem value="Negotiation">Negotiation</MenuItem>
                <MenuItem value="Won">Won (Closed)</MenuItem>
                <MenuItem value="Lost">Lost (Closed)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Expected Closing Date"
              type="date"
              value={formData.expectedClosingDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedClosingDate: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Assign Executive Rep</InputLabel>
              <Select
                value={formData.assignedSalesperson}
                label="Assign Executive Rep"
                onChange={(e) => setFormData(prev => ({ ...prev, assignedSalesperson: e.target.value }))}
              >
                {salesTeam.map(rep => (
                  <MenuItem key={rep.id} value={rep.id}>{rep.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Strategy Notes / Closing Plan"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Record negotiation discussions, discount expectations, or pending checklist steps..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save Opportunity</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OpportunityManagement;

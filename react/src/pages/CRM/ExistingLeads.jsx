import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, IconButton, Tooltip, Chip 
} from '@mui/material';
import { Search, Edit } from 'lucide-react';
import { updateExistingLeadFollowup } from '../../store/crmSlice';
import { formatDate } from '../../utils/dateUtils';

const ExistingLeads = () => {
  const dispatch = useDispatch();
  
  const customers = useSelector(state => state.customers.customers);
  const existingLeadsFollowups = useSelector(state => state.crm.existingLeadsFollowups);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    details: '',
    nextAction: '',
    nextFollowUpDate: ''
  });

  const getFollowUpClass = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      const followDate = new Date(year, month - 1, day);
      followDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.getTime() > followDate.getTime() ? 'text-firebrick' : '';
    } catch (e) {
      return '';
    }
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    const existingData = existingLeadsFollowups[customer.id];
    setFormData({
      date: new Date().toISOString().split('T')[0],
      details: existingData?.details || '',
      nextAction: existingData?.nextAction || '',
      nextFollowUpDate: existingData?.nextFollowUpDate || ''
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    dispatch(updateExistingLeadFollowup({
      customerId: selectedCustomer.id,
      data: formData
    }));
    setFormOpen(false);
  };

  const filteredData = useMemo(() => {
    return customers.filter(c => {
      const s = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(s) ||
        c.name.toLowerCase().includes(s) ||
        (c.email && c.email.toLowerCase().includes(s))
      );
    });
  }, [customers, searchTerm]);

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Existing Leads (Customer Followups)</h2>
        </div>
      </div>

      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search By Customer Code, Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Customer Code</th>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Phone No</th>
              <th>Type</th>
              <th className="text-center">Next Followup Date</th>
              <th className="actions-column">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty">No records found.</td>
              </tr>
            ) : (
              filteredData.map(c => {
                const followup = existingLeadsFollowups[c.id];
                return (
                  <tr key={c.id}>
                    <td className="bold-cell ">{c.id}</td>
                    <td >{c.name}</td>
                    <td >{c.email}</td>
                    <td >{c.phone}</td>
                    <td>
                      <Chip label={c.type} size="small" />
                    </td>
                    <td className={`bold-cell text-center ${getFollowUpClass(followup?.nextFollowUpDate)}`}>
                      {followup?.nextFollowUpDate ? formatDate(followup.nextFollowUpDate) : '-'}
                    </td>
                    <td className="actions-cell">
                      <Tooltip title="Edit Followup">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(c)}>
                          <Edit size={16} />
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

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Followup Details for {selectedCustomer?.name}</DialogTitle>
        <DialogContent dividers>
          <div className="dialog-grid" style={{ gridTemplateColumns: '1fr' }}>
            <TextField
              label="Date"
              type="date"
              size="small"
              fullWidth
              disabled
              InputLabelProps={{ shrink: true }}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <TextField
              label="Details"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
            <TextField
              label="Next Action"
              size="small"
              fullWidth
              value={formData.nextAction}
              onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
            />
            <TextField
              label="Next Followup Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.nextFollowUpDate}
              onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
      <style>{`
        .text-firebrick {
          color: #b22222 !important;
        }
      `}</style>
    </div>
  );
};

export default ExistingLeads;

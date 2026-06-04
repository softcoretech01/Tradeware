import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  addUser, 
  updateUser, 
  updatePermissions 
} from '../../store/erpSlice';
import { 
  Plus, Edit2, Shield, Users, Save, Check, X,
  UserCheck, AlertCircle, Search, FileText, ChevronDown, ChevronRight
} from 'lucide-react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, Box, Button, IconButton, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const RolesPermissions = () => {
  const dispatch = useDispatch();
  const users = useSelector(state => state.erp.users);
  const rolesPermissions = useSelector(state => state.erp.rolesPermissions);

  const [activeTab, setActiveTab] = useState(0);
  
  // User Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState({
    id: '', name: '', department: '', role: 'Sachin', email: '', status: 'Active', monthlyTarget: 0
  });

  // Selected Role for Permissions matrix editing
  const roles = Object.keys(rolesPermissions);
  const [selectedRole, setSelectedRole] = useState(roles[0] || 'Admin');
  const [tempPermissions, setTempPermissions] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

  React.useEffect(() => {
    if (rolesPermissions[selectedRole]) {
      setTempPermissions(JSON.parse(JSON.stringify(rolesPermissions[selectedRole])));
    }
  }, [selectedRole, rolesPermissions]);

  const handleOpenAddUser = () => {
    setIsEditingUser(false);
    setSelectedUser({
      id: `usr00${users.length + 1}`,
      name: '',
      department: '',
      role: 'Sachin',
      email: '',
      status: 'Active',
      monthlyTarget: 0
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setIsEditingUser(true);
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser.name || !selectedUser.email) {
      alert('Please fill in all fields');
      return;
    }
    if (isEditingUser) {
      dispatch(updateUser(selectedUser));
    } else {
      dispatch(addUser(selectedUser));
    }
    setUserModalOpen(false);
  };

  const handleTogglePermission = (modName, subItems, val) => {
    setTempPermissions(prev => {
      const updated = { ...prev };
      
      // Update parent
      updated[modName] = { ...updated[modName], read: val };
      
      // If it has submodules, cascade the change to all submodules
      if (subItems && subItems.length > 0) {
        subItems.forEach(sub => {
          updated[sub] = { ...updated[sub], read: val };
        });
      }
      return updated;
    });
  };

  const handleToggleSubPermission = (subName, val) => {
    setTempPermissions(prev => ({
      ...prev,
      [subName]: { ...prev[subName], read: val }
    }));
  };

  const handleSavePermissions = () => {
    const updatedMatrix = {
      ...rolesPermissions,
      [selectedRole]: tempPermissions
    };
    dispatch(updatePermissions(updatedMatrix));
    alert(`Permissions for ${selectedRole} updated successfully!`);
  };

  const userColumns = [
    { field: 'id', headerName: 'User ID', width: 100 },
    { field: 'name', headerName: 'Name', width: 200, renderCell: (params) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: '12px'
        }}>
          {params.value.charAt(0)}
        </div>
        <span style={{ fontWeight: 600, color: '#334155' }}>{params.value}</span>
      </div>
    )},
    { field: 'department', headerName: 'Department', width: 160 },
    { field: 'role', headerName: 'Role', width: 180, renderCell: (params) => (
      <Chip 
        label={params.value} 
        size="small"
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          color: '#2563eb',
          fontWeight: 600,
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}
      />
    )},
    { field: 'email', headerName: 'Email Address', width: 220 },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params) => (
      <Chip 
        icon={<UserCheck size={14} style={{ color: params.value === 'Active' ? '#10b981' : '#64748b' }} />}
        label={params.value} 
        variant="outlined"
        color={params.value === 'Active' ? 'success' : 'default'}
        size="small"
      />
    )},
    { field: 'monthlyTarget', headerName: 'Monthly Target (INR)', width: 160, type: 'number', renderCell: (params) => (
      <span style={{ fontWeight: 600 }}>{params.value ? `INR ${params.value.toLocaleString()}` : '-'}</span>
    )},
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" color="primary" onClick={() => handleOpenEditUser(params.row)}>
          <Edit2 size={16} />
        </IconButton>
      )
    }
  ];

  const modulesList = [
    { name: 'Dashboard' },
    { name: 'Masters', subItems: ['Items', 'Customers', 'Suppliers', 'Location Master', 'Tax Master'] },
    { name: 'Purchase Management', subItems: ['Purchase Requisition', 'Purchase Order', 'GRN', 'Purchase Return', 'Landed Cost Calculation'] },
    { name: 'Import Management', subItems: ['Import Purchase Management', 'Landed Cost Calculation', 'Selling Price Finalization'] },
    { name: 'Batch & Lot Management', subItems: ['Batch Maintenance', 'Batch Stock Inquiry', 'Batch Aging Analysis'] },
    { name: 'Inventory Management', subItems: ['Stock Overview', 'Damages'] },
    { name: 'Sales & Orders', subItems: ['Sales Order', 'Invoice'] },
    { name: 'CRM Module', subItems: ['CRM Dashboard', 'Lead Management', 'Customer Management', 'Follow-up Tracking', 'Sales Enquiry', 'Existing Leads'] },
    { name: 'User Roles & Approval', subItems: ['Roles & Permissions'] },
    { name: 'Document Management', subItems: ['Document Management'] }
  ];

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} style={{ color: 'var(--primary)' }} /> User Roles & Access Matrix
          </h1>
        </div>
        {activeTab === 0 && (
          <Button 
            variant="contained" 
            startIcon={<Plus size={16} />}
            onClick={handleOpenAddUser}
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            Add User Account
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(e, val) => setActiveTab(val)}
        sx={{
          borderBottom: '1px solid var(--border)',
          marginBottom: '24px',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--text-muted)',
            '&.Mui-selected': {
              color: 'var(--primary)'
            }
          }
        }}
      >
        <Tab icon={<Users size={18} style={{ marginRight: '6px' }} />} iconPosition="start" label="User Accounts" />
        <Tab icon={<Shield size={18} style={{ marginRight: '6px' }} />} iconPosition="start" label="Permission Matrix" />
      </Tabs>

      {/* Tab Content 1: User Accounts */}
      {activeTab === 0 && (
        <div className="fade-in">
          <div style={{ height: 450, width: '100%' }}>
            <DataGrid
              rows={users}
              columns={userColumns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              rowHeight={56}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  background: 'var(--background)',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 'bold',
                  color: '#475569'
                },
                '& .MuiDataGrid-row': {
                  borderBottom: '1px solid var(--border)',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.02)'
                  }
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: 'none'
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Tab Content 2: Permission Matrix */}
      {activeTab === 1 && (
        <div className="fade-in">
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px', background: 'var(--background)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<X size={16} />}
                onClick={() => {
                  setTempPermissions({});
                }}
                style={{ textTransform: 'none', borderRadius: '6px' }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<Save size={16} />}
                onClick={handleSavePermissions}
                style={{ background: 'var(--primary)', textTransform: 'none', borderRadius: '6px' }}
              >
                Save Permissions
              </Button>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#475569', width: '40%' }}>Module / Submodule</th>
                  <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Show</th>
                  <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Hide</th>
                </tr>
              </thead>
              <tbody>
                {modulesList.map((mod, idx) => {
                  const hasPerm = tempPermissions[mod.name] || { read: false };
                  const isExpanded = expandedModules[mod.name];
                  return (
                    <React.Fragment key={mod.name}>
                      <tr style={{ borderBottom: (idx === modulesList.length - 1 && !isExpanded) ? 'none' : '1px solid var(--border)', transition: 'background 0.2s', background: 'var(--surface)' }}>
                        <td style={{ padding: '16px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={16} style={{ color: 'var(--primary)' }} />
                          <span 
                            style={{ cursor: mod.subItems ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              if (mod.subItems) setExpandedModules(p => ({...p, [mod.name]: !p[mod.name]}));
                            }}
                          >
                            {mod.name}
                            {mod.subItems && (
                              isExpanded ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <input 
                            type="radio"
                            name={`perm_${mod.name}`}
                            checked={hasPerm.read === true}
                            onChange={() => handleTogglePermission(mod.name, mod.subItems, true)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--success)' }}
                          />
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <input 
                            type="radio"
                            name={`perm_${mod.name}`}
                            checked={!hasPerm.read}
                            onChange={() => handleTogglePermission(mod.name, mod.subItems, false)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--danger)' }}
                          />
                        </td>
                      </tr>
                      {isExpanded && mod.subItems && mod.subItems.map((sub, sIdx) => {
                        const subPerm = tempPermissions[sub] || { read: false };
                        return (
                          <tr key={sub} style={{ background: 'var(--background)', borderBottom: (idx === modulesList.length - 1 && sIdx === mod.subItems.length - 1) ? 'none' : '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 16px 12px 48px', fontWeight: 500, color: '#475569', fontSize: '14px' }}>
                              {sub}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <input 
                                type="radio"
                                name={`perm_sub_${sub}`}
                                checked={subPerm.read === true}
                                onChange={() => handleToggleSubPermission(sub, true)}
                                style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--success)' }}
                              />
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <input 
                                type="radio"
                                name={`perm_sub_${sub}`}
                                checked={!subPerm.read}
                                onChange={() => handleToggleSubPermission(sub, false)}
                                style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--danger)' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      <Dialog open={userModalOpen} onClose={() => setUserModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontWeight: 700, fontSize: '18px', borderBottom: '1px solid var(--border)' }}>
          {isEditingUser ? 'Edit' : 'Create User Account'}
        </DialogTitle>
        <DialogContent style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            value={selectedUser.name}
            onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
          />
          <TextField
            label="Email Address"
            variant="outlined"
            fullWidth
            value={selectedUser.email}
            onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              value={selectedUser.department}
              onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
            >
              <MenuItem value="Production">Production</MenuItem>
              <MenuItem value="R&D">R&D</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
              <MenuItem value="Sales">Sales</MenuItem>
              <MenuItem value="Management">Management</MenuItem>
              <MenuItem value="IT">IT</MenuItem>
              <MenuItem value="Warehouse">Warehouse</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>User Role</InputLabel>
            <Select
              label="User Role"
              value={selectedUser.role}
              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
            >
              {roles.map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={selectedUser.status}
              onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Monthly Target (INR)"
            variant="outlined"
            type="number"
            fullWidth
            value={selectedUser.monthlyTarget}
            onChange={(e) => setSelectedUser({ ...selectedUser, monthlyTarget: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <Button onClick={() => setUserModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveUser}
            variant="contained"
            style={{ background: 'var(--primary)' }}
          >
            Save Account
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RolesPermissions;

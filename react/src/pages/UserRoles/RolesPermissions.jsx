import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  addUser, 
  updateUser, 
  updatePermissions 
} from '../../store/erpSlice';
import { 
  Plus, Edit2, Shield, Users, Save, Check, X,
  UserCheck, AlertCircle, Search, FileText
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
  const [searchTerm, setSearchTerm] = useState('');
  
  // User Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState({
    id: '', name: '', role: 'Sachin', email: '', status: 'Active', monthlyTarget: 0
  });

  // Selected Role for Permissions matrix editing
  const roles = Object.keys(rolesPermissions);
  const [selectedRole, setSelectedRole] = useState(roles[0] || 'Admin');
  const [tempPermissions, setTempPermissions] = useState({});

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

  const handleTogglePermission = (moduleName, type) => {
    setTempPermissions(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [type]: !prev[moduleName]?.[type]
      }
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

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    'Dashboard',
    'Masters',
    'Purchase Management',
    'Import Management',
    'Batch & Lot Management',
    'Inventory Management',
    'Pricing Management',
    'Sales & Orders',
    'Account Integration',
    'Reports & Dashboards',
    'User Roles & Approval',
    'Document Management'
  ];

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} style={{ color: 'var(--primary)' }} /> User Roles & Access Matrix
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Configure active ERP logins and define module-specific permission profiles.
          </p>
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
          {/* Search bar */}
          <div style={{ display: 'flex', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', maxWidth: '350px', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search users, roles, email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--text-main)' }}
            />
          </div>

          <div style={{ height: 450, width: '100%' }}>
            <DataGrid
              rows={filteredUsers}
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
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '15px' }}>Configure access rights for:</span>
            <FormControl size="small" style={{ minWidth: '200px' }}>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ background: 'white', borderRadius: '6px' }}
              >
                {roles.map(role => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<X size={16} />}
                onClick={() => {
                  if (rolesPermissions[selectedRole]) {
                    setTempPermissions(JSON.parse(JSON.stringify(rolesPermissions[selectedRole])));
                  }
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
                  <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Read</th>
                  <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Write</th>
                  <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Approve</th>
                </tr>
              </thead>
              <tbody>
                {modulesList.map((modName, idx) => {
                  const hasPerm = tempPermissions[modName] || { read: false, write: false, approve: false };
                  return (
                    <tr key={modName} style={{ borderBottom: idx === modulesList.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={16} style={{ color: 'var(--primary)' }} />
                        {modName}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={hasPerm.read}
                          onChange={() => handleTogglePermission(modName, 'read')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={hasPerm.write}
                          onChange={() => handleTogglePermission(modName, 'write')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={hasPerm.approve}
                          onChange={() => handleTogglePermission(modName, 'approve')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                      </td>
                    </tr>
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
          {isEditingUser ? 'Edit User Details' : 'Create User Account'}
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

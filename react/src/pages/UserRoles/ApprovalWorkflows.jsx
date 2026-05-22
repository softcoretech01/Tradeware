import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  processApproval, 
  addWorkflow, 
  updateWorkflow 
} from '../../store/erpSlice';
import { 
  CheckCircle, XCircle, Clock, ShieldAlert, Settings, 
  History, Plus, Edit2, Check, X, Search, FileText, AlertCircle
} from 'lucide-react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, Button, IconButton, Chip, Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const ApprovalWorkflows = () => {
  const dispatch = useDispatch();
  
  // Load data from Redux
  const approvalRequests = useSelector(state => state.erp.approvalRequests);
  const workflows = useSelector(state => state.erp.workflows);
  const currentUser = useSelector(state => state.erp.currentUser);
  const rolesPermissions = useSelector(state => state.erp.rolesPermissions);

  const activeRole = currentUser?.role || 'Admin';
  const permissions = rolesPermissions?.[activeRole] || {};

  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Process Approval Modal State
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionType, setDecisionType] = useState('Approved'); // Approved or Rejected
  const [remarks, setRemarks] = useState('');

  // Workflow Dialog State
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState({
    id: '', name: '', condition: '', approverRole: 'Kaviya', status: 'Active'
  });

  const handleOpenApproval = (req, decision) => {
    // Check if user has approve permission for this module
    const moduleName = req.module;
    const hasApprovePerm = permissions[moduleName]?.approve || permissions['User Roles & Approval']?.approve || activeRole === 'Admin';
    
    if (!hasApprovePerm) {
      alert(`Access Denied: Your role (${activeRole}) does not have approve permissions for the '${moduleName}' module.`);
      return;
    }
    
    setSelectedRequest(req);
    setDecisionType(decision);
    setRemarks('');
    setApprovalModalOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!remarks.trim() && decisionType === 'Rejected') {
      alert('Please specify a rejection reason in the remarks.');
      return;
    }
    
    dispatch(processApproval({
      id: selectedRequest.id,
      decision: decisionType,
      remarks: remarks || `${decisionType} by ${currentUser?.name || 'User'}`,
      user: `${currentUser?.name} (${activeRole})`
    }));

    setApprovalModalOpen(false);
    setSelectedRequest(null);
  };

  const handleOpenAddWorkflow = () => {
    setIsEditingWorkflow(false);
    setSelectedWorkflow({
      id: `WF-00${workflows.length + 1}`,
      name: '',
      condition: '',
      approverRole: 'Kaviya',
      status: 'Active'
    });
    setWorkflowModalOpen(true);
  };

  const handleOpenEditWorkflow = (wf) => {
    setIsEditingWorkflow(true);
    setSelectedWorkflow(wf);
    setWorkflowModalOpen(true);
  };

  const handleSaveWorkflow = () => {
    if (!selectedWorkflow.name || !selectedWorkflow.condition) {
      alert('Please fill in all fields');
      return;
    }
    if (isEditingWorkflow) {
      dispatch(updateWorkflow(selectedWorkflow));
    } else {
      dispatch(addWorkflow(selectedWorkflow));
    }
    setWorkflowModalOpen(false);
  };

  // Filter requests for search
  const filteredQueue = approvalRequests.filter(req => 
    req.status === 'Pending' && 
    (req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     req.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
     req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
     req.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group all historical timeline logs from approvalRequests
  const allLogs = approvalRequests.flatMap(req => 
    req.history.map(hist => ({
      reqId: req.id,
      module: req.module,
      type: req.type,
      referenceId: req.referenceId,
      status: hist.status,
      timestamp: hist.timestamp,
      user: hist.user,
      remarks: hist.remarks
    }))
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const queueColumns = [
    { field: 'id', headerName: 'Request ID', width: 120 },
    { field: 'module', headerName: 'Module', width: 160 },
    { field: 'type', headerName: 'Request Type', width: 160, renderCell: (params) => (
      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{params.value}</span>
    )},
    { field: 'referenceId', headerName: 'Ref ID', width: 120, renderCell: (params) => (
      <Chip label={params.value} size="small" variant="outlined" />
    )},
    { field: 'requestedBy', headerName: 'Requested By', width: 140 },
    { field: 'requestDate', headerName: 'Date Requested', width: 130 },
    { field: 'details', headerName: 'Details', width: 280, renderCell: (params) => (
      <Tooltip title={params.value}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {params.value}
        </span>
      </Tooltip>
    )},
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params) => {
        const req = params.row;
        const moduleName = req.module;
        const hasApprovePerm = permissions[moduleName]?.approve || permissions['User Roles & Approval']?.approve || activeRole === 'Admin';
        
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '100%' }}>
            <Tooltip title={hasApprovePerm ? "Approve Request" : "No Approval Permission"}>
              <span>
                <IconButton 
                  size="small" 
                  onClick={() => handleOpenApproval(req, 'Approved')}
                  disabled={!hasApprovePerm}
                  style={{ color: hasApprovePerm ? '#10b981' : '#cbd5e1' }}
                >
                  <CheckCircle size={18} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={hasApprovePerm ? "Reject Request" : "No Approval Permission"}>
              <span>
                <IconButton 
                  size="small" 
                  onClick={() => handleOpenApproval(req, 'Rejected')}
                  disabled={!hasApprovePerm}
                  style={{ color: hasApprovePerm ? '#ef4444' : '#cbd5e1' }}
                >
                  <XCircle size={18} />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        );
      }
    }
  ];

  const workflowColumns = [
    { field: 'id', headerName: 'Rule ID', width: 100 },
    { field: 'name', headerName: 'Workflow Name', width: 250, renderCell: (params) => (
      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{params.value}</span>
    )},
    { field: 'condition', headerName: 'Rule Condition / Threshold', width: 280, renderCell: (params) => (
      <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#1e3a8a', fontFamily: 'monospace' }}>
        {params.value}
      </code>
    )},
    { field: 'approverRole', headerName: 'Required Sign-off Role', width: 180, renderCell: (params) => (
      <Chip label={params.value} size="small" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#2563eb', fontWeight: 600 }} />
    )},
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params) => (
      <Chip 
        label={params.value} 
        color={params.value === 'Active' ? 'success' : 'default'} 
        size="small" 
        variant="outlined" 
      />
    )},
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" color="primary" onClick={() => handleOpenEditWorkflow(params.row)}>
          <Edit2 size={16} />
        </IconButton>
      )
    }
  ];

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={24} style={{ color: 'var(--primary)' }} /> Approval Workflows
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Review pending transactions requiring authorization and manage approval threshold rules.
          </p>
        </div>
        {activeTab === 1 && (
          <Button 
            variant="contained" 
            startIcon={<Plus size={16} />}
            onClick={handleOpenAddWorkflow}
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            Create Rule
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
        <Tab icon={<Clock size={18} style={{ marginRight: '6px' }} />} iconPosition="start" label="Pending Queue" />
        <Tab icon={<Settings size={18} style={{ marginRight: '6px' }} />} iconPosition="start" label="Threshold Rules" />
        <Tab icon={<History size={18} style={{ marginRight: '6px' }} />} iconPosition="start" label="Audit History Logs" />
      </Tabs>

      {/* Tab Content 1: Pending Queue */}
      {activeTab === 0 && (
        <div className="fade-in">
          {/* Active Tester Alert */}
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.04)', 
            border: '1px solid rgba(59, 130, 246, 0.15)', 
            borderRadius: '8px', 
            padding: '12px 16px', 
            marginBottom: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            color: '#1e3a8a' 
          }}>
            <AlertCircle size={20} />
            <div style={{ fontSize: '13px' }}>
              Current User: <strong>{currentUser?.name || 'Anonymous'}</strong> | Role: <Chip size="small" label={activeRole} style={{ background: '#3b82f6', color: 'white', fontWeight: 600, fontSize: '11px', height: '20px' }} />. Switch roles in the top-right header menu to test approval permissions.
            </div>
          </div>

          <div style={{ display: 'flex', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', maxWidth: '350px', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search queue..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--text-main)' }}
            />
          </div>

          <div style={{ height: 450, width: '100%' }}>
            <DataGrid
              rows={filteredQueue}
              columns={queueColumns}
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

      {/* Tab Content 2: Rules Configuration */}
      {activeTab === 1 && (
        <div className="fade-in">
          <div style={{ height: 450, width: '100%' }}>
            <DataGrid
              rows={workflows}
              columns={workflowColumns}
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

      {/* Tab Content 3: Audit Trail Timeline */}
      {activeTab === 2 && (
        <div className="fade-in" style={{ padding: '8px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {/* Timeline center line */}
            <div style={{ position: 'absolute', left: '30px', top: '15px', bottom: '15px', width: '2px', background: '#e2e8f0' }}></div>
            
            {allLogs.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                No approval records found in history.
              </div>
            ) : (
              allLogs.map((log, idx) => {
                const isApproved = log.status === 'Approved';
                const isRejected = log.status === 'Rejected';
                const isSubmitted = log.status === 'Submitted';

                return (
                  <div key={idx} style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 1 }}>
                    {/* Circle icon */}
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      background: 'white', 
                      border: '3px solid',
                      borderColor: isApproved ? '#10b981' : isRejected ? '#ef4444' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isApproved ? '#10b981' : isRejected ? '#ef4444' : '#64748b',
                      flexShrink: 0
                    }}>
                      {isApproved && <Check size={24} />}
                      {isRejected && <X size={24} />}
                      {isSubmitted && <FileText size={20} />}
                    </div>
                    
                    {/* Log detail box */}
                    <div style={{ 
                      background: 'white', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      flexGrow: 1, 
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                        <div>
                          <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginRight: '8px' }}>
                            {log.reqId}
                          </span>
                          <Chip label={log.type} size="small" style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', height: '22px' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                      </div>
                      
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                        Decision: <span style={{ color: isApproved ? '#10b981' : isRejected ? '#ef4444' : '#64748b' }}>{log.status}</span>
                        {log.user && ` by ${log.user}`}
                      </div>

                      {log.remarks && (
                        <div style={{ fontSize: '13px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #cbd5e1', color: '#475569', fontStyle: 'italic' }}>
                          "{log.remarks}"
                        </div>
                      )}

                      <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Module: <strong>{log.module}</strong> | Reference Transaction ID: <strong style={{ color: 'var(--primary)' }}>{log.referenceId}</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Confirmation & Remarks Approval Dialog */}
      <Dialog open={approvalModalOpen} onClose={() => setApprovalModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontWeight: 700, fontSize: '18px', borderBottom: '1px solid var(--border)', color: decisionType === 'Approved' ? '#10b981' : '#ef4444' }}>
          {decisionType === 'Approved' ? 'Confirm Approval Action' : 'Confirm Rejection Action'}
        </DialogTitle>
        <DialogContent style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Are you sure you want to <strong>{decisionType.toLowerCase()}</strong> request <strong>{selectedRequest?.id}</strong> ({selectedRequest?.type})?
          </div>
          <TextField
            label="Approver Remarks / Comments"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={decisionType === 'Approved' ? "e.g. Validated. Verified contract rate." : "Please describe reason for rejection (Required)"}
            error={decisionType === 'Rejected' && !remarks.trim()}
            helperText={decisionType === 'Rejected' && !remarks.trim() ? "Remarks are required for rejections." : ""}
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <Button onClick={() => setApprovalModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmApproval}
            variant="contained"
            style={{ background: decisionType === 'Approved' ? '#10b981' : '#ef4444', color: 'white' }}
          >
            Confirm {decisionType}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Workflow Dialog */}
      <Dialog open={workflowModalOpen} onClose={() => setWorkflowModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontWeight: 700, fontSize: '18px', borderBottom: '1px solid var(--border)' }}>
          {isEditingWorkflow ? 'Modify Workflow Rule' : 'Add Workflow Threshold'}
        </DialogTitle>
        <DialogContent style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="Workflow Name"
            variant="outlined"
            fullWidth
            value={selectedWorkflow.name}
            onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, name: e.target.value })}
            placeholder="e.g. Discount Approval Limit"
          />
          <TextField
            label="Rule Condition (Syntax / Logic)"
            variant="outlined"
            fullWidth
            value={selectedWorkflow.condition}
            onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, condition: e.target.value })}
            placeholder="e.g. Discount > 15%"
          />
          <FormControl fullWidth>
            <InputLabel>Approver Role</InputLabel>
            <Select
              label="Approver Role"
              value={selectedWorkflow.approverRole}
              onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, approverRole: e.target.value })}
            >
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Kaviya">Kaviya</MenuItem>
              <MenuItem value="Suoer admin">Suoer admin</MenuItem>
              <MenuItem value="Sachin">Sachin</MenuItem>
              <MenuItem value="Tharna">Tharna</MenuItem>
              <MenuItem value="Kabilesh">Kabilesh</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={selectedWorkflow.status}
              onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, status: e.target.value })}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <Button onClick={() => setWorkflowModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveWorkflow}
            variant="contained"
            style={{ background: 'var(--primary)' }}
          >
            Save Rule
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ApprovalWorkflows;

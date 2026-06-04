import { formatDate } from '../../utils/dateUtils';
import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { uploadDocument, deleteDocument } from '../../store/erpSlice';
import { 
  Paperclip, Search, Plus, Trash2, Eye, Download, FileText, 
  UploadCloud, AlertTriangle, Check, X, File, ShieldAlert
} from 'lucide-react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, Button, IconButton, Chip, Tooltip, Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';


const DocumentManagement = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  // Load data from Redux
  const documents = useSelector(state => state.erp.documents);
  const currentUser = useSelector(state => state.erp.currentUser);
  const rolesPermissions = useSelector(state => state.erp.rolesPermissions);

  const activeRole = currentUser?.role || 'Admin';
  const permissions = rolesPermissions?.[activeRole] || {};
  const hasWritePerm = permissions['Document Management']?.write || activeRole === 'Admin';
  const hasDeletePerm = permissions['Document Management']?.approve || activeRole === 'Admin'; // Let's tie delete to approve/admin role for security

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Preview Dialog State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Upload Dialog State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'Expenses',
    linkedTransaction: '',
    remarks: '',
    size: '1.2 MB'
  });

  const categories = [
    'Expenses',
    'Bill of Entry'
  ];

  // Detect duplicate filename for version control warning
  const isDuplicateName = documents.some(d => d.name.toLowerCase() === uploadForm.name.toLowerCase());
  const existingDoc = documents.find(d => d.name.toLowerCase() === uploadForm.name.toLowerCase());

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadForm(prev => ({
        ...prev,
        name: file.name,
        size: `${sizeMB} MB`
      }));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadForm(prev => ({
        ...prev,
        name: file.name,
        size: `${sizeMB} MB`
      }));
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadForm.name.trim()) {
      alert('Please select or specify a file name.');
      return;
    }

    const payload = {
      name: uploadForm.name,
      category: uploadForm.category,
      uploadedBy: currentUser?.name || 'Admin User',
      size: uploadForm.size,
      linkedTransaction: uploadForm.linkedTransaction,
      remarks: uploadForm.remarks || (isDuplicateName ? `Uploaded version revision` : `Initial file upload`)
    };

    dispatch(uploadDocument(payload));
    setUploadOpen(false);
    setUploadForm({
      name: '',
      category: 'Expenses',
      linkedTransaction: '',
      remarks: '',
      size: '1.2 MB'
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this document and all its versions?')) {
      dispatch(deleteDocument(id));
    }
  };

  const handleDownloadMock = (doc) => {
    alert(`Downloading document: ${doc.name} (v${doc.version}, Size: ${doc.size})\nDownload transfer completed!`);
  };

  // Filters
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.linkedTransaction && doc.linkedTransaction.toLowerCase().includes(searchTerm.toLowerCase())) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const columns = [
    { field: 'id', headerName: 'Doc ID', width: 110 },
    { field: 'name', headerName: 'Document Name', width: 220, renderCell: (params) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-main)' }}>
        <FileText size={18} style={{ color: 'var(--primary)' }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{params.value}</span>
      </div>
    )},
    { field: 'category', headerName: 'Category', width: 150, renderCell: (params) => {
      let color = 'default';
      if (params.value === 'Expenses') color = 'success';
      if (params.value === 'Bill of Entry') color = 'warning';

      return <Chip label={params.value} size="small" color={color} variant="outlined" />;
    }},
    { field: 'version', headerName: 'Version', width: 90, renderCell: (params) => (
      <Chip label={`v${params.value}`} size="small" style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700 }} />
    )},
    { field: 'size', headerName: 'Size', width: 100 },
    { field: 'linkedTransaction', headerName: 'Linked Ref', width: 130, renderCell: (params) => (
      params.value ? <Chip label={params.value} size="small" style={{ background: 'rgba(59, 130, 246, 0.05)', color: '#2563eb' }} /> : <span style={{ color: '#cbd5e1' }}>—</span>
    )},
    { field: 'uploadedBy', headerName: 'Uploaded By', width: 140 },
    { field: 'uploadDate', headerName: 'Upload Date', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '100%' }}>
          <Tooltip title="Preview & History">
            <IconButton size="small" color="primary" onClick={() => { setPreviewDoc(params.row); setPreviewOpen(true); }}>
              <Eye size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download File">
            <IconButton size="small" style={{ color: '#10b981' }} onClick={() => handleDownloadMock(params.row)}>
              <Download size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title={hasDeletePerm ? "Delete Document" : "No Delete Permission"}>
            <span>
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => handleDelete(params.row.id)}
                disabled={!hasDeletePerm}
              >
                <Trash2 size={16} />
              </IconButton>
            </span>
          </Tooltip>
        </div>
      )
    }
  ];

  // Helper to render dynamic SVG blueprints and PDF tables for mock previews
  const renderDocumentPreviewBody = () => {
    if (!previewDoc) return null;

    if (previewDoc.category === 'Product Drawing') {
      return (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#38bdf8' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', tracking: '1px', marginBottom: '8px', color: '#94a3b8', fontFamily: 'monospace' }}>
            TradeWare CAD Blueprint Viewer v2.4 (Read-Only)
          </div>
          <svg viewBox="0 0 400 240" style={{ width: '100%', height: '240px', background: '#020617', borderRadius: '4px' }}>
            {/* Grid Lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Cylinder / Piston Pin Drawing */}
            <rect x="100" y="80" width="200" height="80" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="none" />
            <line x1="80" y1="120" x2="320" y2="120" stroke="#f43f5e" strokeWidth="1" strokeDasharray="8 4 2 4" /> {/* Center line */}
            <circle cx="100" cy="120" r="40" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="300" cy="120" r="40" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Chamfers */}
            <line x1="100" y1="80" x2="90" y2="90" stroke="#38bdf8" strokeWidth="2" />
            <line x1="100" y1="160" x2="90" y2="150" stroke="#38bdf8" strokeWidth="2" />
            <line x1="300" y1="80" x2="310" y2="90" stroke="#38bdf8" strokeWidth="2" />
            <line x1="300" y1="160" x2="310" y2="150" stroke="#38bdf8" strokeWidth="2" />

            {/* Dimensions */}
            <line x1="100" y1="50" x2="300" y2="50" stroke="#e2e8f0" strokeWidth="1" />
            <path d="M 100 50 L 105 47 L 105 53 Z M 300 50 L 295 47 L 295 53 Z" fill="#e2e8f0" />
            <text x="200" y="44" fill="#e2e8f0" fontSize="10" textAnchor="middle" fontFamily="sans-serif">200 mm</text>

            <line x1="340" y1="80" x2="340" y2="160" stroke="#e2e8f0" strokeWidth="1" />
            <path d="M 340 80 L 337 85 L 343 85 Z M 340 160 L 337 155 L 343 155 Z" fill="#e2e8f0" />
            <text x="352" y="124" fill="#e2e8f0" fontSize="10" textAnchor="start" fontFamily="sans-serif">Ø 80 mm</text>

            {/* Blueprint text details */}
            <rect x="15" y="190" width="150" height="40" fill="rgba(30,41,59,0.9)" stroke="#1e293b" rx="3" />
            <text x="24" y="202" fill="#38bdf8" fontSize="8" fontFamily="monospace">PART: Pin Piston Sanchin 120</text>
            <text x="24" y="214" fill="#64748b" fontSize="7" fontFamily="monospace">DWG REF: {previewDoc.linkedTransaction || 'ITM05316'}</text>
            <text x="24" y="224" fill="#64748b" fontSize="7" fontFamily="monospace">TOLERANCE: ±0.05 mm | MAT: Cr-Steel</text>

            <text x="385" y="225" fill="#10b981" fontSize="9" textAnchor="end" fontFamily="monospace">APPROVED BLUEPRINT</text>
          </svg>
        </div>
      );
    }

    if (previewDoc.category === 'Expenses' || previewDoc.category === 'Bill of Entry') {
      return (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', color: '#1e293b', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)', fontFamily: 'sans-serif' }}>
          {/* Invoice/PO Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1e40af', paddingBottom: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>TRADEWARE OPERATIONS LTD</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{previewDoc.category.toUpperCase()}</div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Doc Ref: <strong style={{ color: '#1e40af' }}>{previewDoc.linkedTransaction || 'TXN-9982'}</strong></div>
            </div>
          </div>

          {/* Doc details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '12px' }}>
            <div>
              <div style={{ color: '#64748b', marginBottom: '2px' }}>Transaction Partner:</div>
              <div style={{ fontWeight: 'bold' }}>ACE FIRE ENGINEERING PTE LTD</div>
              <div style={{ color: '#475569' }}>Woodlands Industrial Park E1, Singapore</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#64748b', marginBottom: '2px' }}>Document Details:</div>
              <div>Date: <strong>{formatDate(previewDoc.uploadDate)}</strong></div>
              <div>Author: <strong>{previewDoc.uploadedBy}</strong></div>
              <div>Size: <strong>{previewDoc.size}</strong></div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '6px', textAlign: 'left' }}>Item Description</th>
                <th style={{ padding: '6px', textAlign: 'center', width: '60px' }}>Qty</th>
                <th style={{ padding: '6px', textAlign: 'right', width: '80px' }}>Unit Price</th>
                <th style={{ padding: '6px', textAlign: 'right', width: '90px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 6px' }}>Pin Piston Sanchin 120 (Premium Quality Cr-Steel)</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>100</td>
                <td style={{ padding: '8px 6px', textAlign: 'right' }}>$15.00</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 'bold' }}>$1,500.00</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 6px' }}>Stang Piston Sanchin 120 (Standard Buffer Stock)</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>20</td>
                <td style={{ padding: '8px 6px', textAlign: 'right' }}>$24.00</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 'bold' }}>$480.00</td>
              </tr>
            </tbody>
          </table>

          {/* Document Summary Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ 
              border: '2px dashed #10b981', 
              color: '#059669', 
              padding: '6px 12px', 
              borderRadius: '4px', 
              fontSize: '11px', 
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              ✓ ERP VERIFIED ATTACHMENT
            </div>
            <div style={{ textAlign: 'right', fontSize: '13px' }}>
              <div>Subtotal: <strong>$1,980.00</strong></div>
              <div style={{ color: '#64748b', fontSize: '11px', margin: '2px 0' }}>Tax (GST 9%): $178.20</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af', borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '4px' }}>
                Grand Total: $2,158.20
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (previewDoc.category === 'Delivery Proof') {
      return (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>PROOF OF DELIVERY ACKNOWLEDGEMENT</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Challan Reference: {previewDoc.linkedTransaction || 'DC-2026-001'}</div>
          </div>

          <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#334155', marginBottom: '16px' }}>
            <div>Recipient Site: <strong>Woodlands Site (Ace Builders Depot)</strong></div>
            <div>Delivery Address: <strong>10 Woodlands Loop, Singapore 738388</strong></div>
            <div>Driver Assigned: <strong>John Doe (XB-1234-A)</strong></div>
            <div>Delivery Completed: <strong>{previewDoc.uploadDate} 11:45 AM</strong></div>
          </div>

          {/* Supervisor signature simulation */}
          <div style={{ border: '1px dashed #cbd5e1', borderRadius: '6px', background: 'white', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Authorized Receiver:</div>
              <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Supervisor Keith Tan</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>ID: S9283182C</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>Digital Signature Stamp:</div>
              <div style={{ fontStyle: 'italic', fontFamily: '"Caveat", cursive, "Brush Script MT", sans-serif', fontSize: '22px', color: '#1e40af', padding: '0 10px' }}>
                Keith Tan
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Paperclip size={24} style={{ color: 'var(--primary)' }} /> Document Explorer & Attachment Vault
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Upload legal vouchers, CAD design drawings, invoices, and delivery proofs with revision version controls.
          </p>
        </div>
        <Button 
          variant="contained" 
          startIcon={<Plus size={16} />}
          onClick={() => {
            if (!hasWritePerm) {
              alert(`Access Denied: Your role (${activeRole}) does not have permissions to upload documents.`);
              return;
            }
            setUploadOpen(true);
          }}
          disabled={!hasWritePerm}
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
        >
          Upload Document
        </Button>
      </div>

      {/* Access alert */}
      {!hasWritePerm && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.04)', 
          border: '1px solid rgba(239, 68, 68, 0.15)', 
          borderRadius: '8px', 
          padding: '12px 16px', 
          marginBottom: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          color: '#b91c1c' 
        }}>
          <ShieldAlert size={20} />
          <div style={{ fontSize: '13px' }}>
            Your current active role is <strong>{activeRole}</strong>. You have <strong>Read-Only Access</strong> to documents. Document uploads and deletion controls are restricted. Switch roles in the header menu to request admin access.
          </div>
        </div>
      )}

      {/* Explorer Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Category Pill Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Chip 
            label="All Categories" 
            onClick={() => setSelectedCategory('All')}
            color={selectedCategory === 'All' ? 'primary' : 'default'}
            variant={selectedCategory === 'All' ? 'default' : 'outlined'}
            size="medium"
            style={{ fontWeight: 600 }}
          />
          {categories.map(cat => (
            <Chip 
              key={cat}
              label={cat} 
              onClick={() => setSelectedCategory(cat)}
              color={selectedCategory === cat ? 'primary' : 'default'}
              variant={selectedCategory === cat ? 'default' : 'outlined'}
              size="medium"
              style={{ fontWeight: 600 }}
            />
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', width: '100%', maxWidth: '300px', alignItems: 'center', gap: '10px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by file name, ID, link..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--text-main)' }}
          />
        </div>
      </div>

      {/* DataGrid Document Table */}
      <div style={{ height: 450, width: '100%' }}>
        <DataGrid
          rows={filteredDocs}
          columns={columns}
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

      {/* File Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle style={{ fontWeight: 700, fontSize: '18px', borderBottom: '1px solid var(--border)' }}>
          Upload New Document to Vault
        </DialogTitle>
        <DialogContent style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Drag & Drop Mock Zone */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragActive ? 'rgba(59, 130, 246, 0.04)' : '#f8fafc',
              borderColor: dragActive ? 'var(--primary)' : 'var(--border)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <UploadCloud size={36} style={{ color: dragActive ? 'var(--primary)' : 'var(--text-muted)' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
              Drag & Drop file here, or <span style={{ color: 'var(--primary)' }}>browse computer</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Supported: PDF, DWG, PNG (Max size: 10MB)
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect} 
            />
          </div>

          {/* Form fields */}
          <TextField
            label="File Name"
            variant="outlined"
            fullWidth
            required
            value={uploadForm.name}
            onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
            placeholder="e.g. customer_po_9921.pdf"
            helperText="Uploading a file with the same name as an existing file triggers version control."
          />

          {/* Version collision alert warning */}
          {isDuplicateName && (
            <Alert severity="warning" icon={<AlertTriangle size={18} />} style={{ borderRadius: '6px' }}>
              <strong>Filename Collision Detected:</strong> File <code>{uploadForm.name}</code> already exists. Submitting will update it to <strong>version v{existingDoc.version + 1}</strong> under version control.
            </Alert>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormControl fullWidth>
              <InputLabel>Document Category</InputLabel>
              <Select
                label="Document Category"
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
              >
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Linked Transaction Ref"
              variant="outlined"
              fullWidth
              value={uploadForm.linkedTransaction}
              onChange={(e) => setUploadForm({ ...uploadForm, linkedTransaction: e.target.value })}
              placeholder="e.g. CPO-2026-001, ITM05316"
            />
          </div>

          <TextField
            label="Remarks / Version Description"
            variant="outlined"
            fullWidth
            value={uploadForm.remarks}
            onChange={(e) => setUploadForm({ ...uploadForm, remarks: e.target.value })}
            placeholder={isDuplicateName ? "e.g. Updated layout margins." : "e.g. Uploaded original customer agreement."}
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <Button onClick={() => setUploadOpen(false)} style={{ color: 'var(--text-muted)' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleUploadSubmit}
            variant="contained"
            style={{ background: 'var(--primary)' }}
          >
            {isDuplicateName ? 'Create New Version' : 'Upload File'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview & Version History Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle style={{ fontWeight: 700, fontSize: '18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Document Vault - File Details</span>
          <IconButton size="small" onClick={() => setPreviewOpen(false)}><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          {/* Left panel: Visual File Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Visual Document Preview
            </span>
            {renderDocumentPreviewBody()}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Button 
                variant="outlined" 
                startIcon={<Download size={14} />} 
                onClick={() => handleDownloadMock(previewDoc)}
                style={{ textTransform: 'none', fontSize: '12px', borderRadius: '6px', flexGrow: 1 }}
              >
                Download File
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={() => alert(`Document metadata verified successfully against transaction logs!`)}
                style={{ textTransform: 'none', fontSize: '12px', borderRadius: '6px', flexGrow: 1 }}
              >
                Verify MD5 Hash
              </Button>
            </div>
          </div>

          {/* Right panel: Metadata & Version Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Metadata Card */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--secondary)', marginBottom: '12px' }}>Document Metadata</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px 12px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Document ID:</span>
                <span style={{ fontWeight: 600 }}>{previewDoc?.id}</span>

                <span style={{ color: 'var(--text-muted)' }}>File Name:</span>
                <span style={{ fontWeight: 600, wordBreak: 'break-all' }}>{previewDoc?.name}</span>

                <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                <span>{previewDoc?.category}</span>

                <span style={{ color: 'var(--text-muted)' }}>Active Version:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>v{previewDoc?.version}</span>

                <span style={{ color: 'var(--text-muted)' }}>File Size:</span>
                <span>{previewDoc?.size}</span>

                <span style={{ color: 'var(--text-muted)' }}>Linked Ref:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{previewDoc?.linkedTransaction || 'Not Linked'}</span>
              </div>
            </div>

            {/* Version History Log */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                Version History Log
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {previewDoc?.history?.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                    {/* Circle bullet */}
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: log.version === previewDoc.version ? 'var(--primary)' : '#cbd5e1', 
                      marginTop: '6px',
                      flexShrink: 0
                    }} />
                    
                    {/* History details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ color: log.version === previewDoc.version ? 'var(--primary)' : 'var(--text-main)' }}>
                          Version v{log.version} {log.version === previewDoc.version ? '(Current)' : ''}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{formatDate(log.date)}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Uploaded by: <strong>{log.user}</strong>
                      </div>
                      <div style={{ color: '#475569', fontSize: '11px', fontStyle: 'italic', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', marginTop: '2px' }}>
                        "{log.action}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </DialogContent>
        <DialogActions style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <Button onClick={() => setPreviewOpen(false)} variant="contained" style={{ background: 'var(--primary)' }}>
            Close Detail Panel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DocumentManagement;

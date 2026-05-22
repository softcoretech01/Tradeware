import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Trash,
  FileSpreadsheet, FileText, MapPin, Building, Clipboard, User
} from 'lucide-react';
import { addMaterialIssue } from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const MaterialIssueTracking = () => {
  const dispatch = useDispatch();

  // Store Selectors
  const materialIssues = useSelector(state => state.erp.materialIssues || []);
  const deliveryChallans = useSelector(state => state.erp.deliveryChallans || []);

  // Grid States
  const [searchTerm, setSearchTerm] = useState('');
  const [builderFilter, setBuilderFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    builderName: 'Ace Builders',
    siteLocation: 'Woodlands Site',
    dcRef: '',
    date: new Date().toISOString().split('T')[0],
    items: [
      { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', issuedQty: 10, uom: 'pcs' }
    ],
    issuedBy: '',
    status: 'Issued'
  });

  const buildersList = ['Ace Builders', 'Woodlands Construction', 'Apex Projects', 'Capital Infrastructure'];
  const sitesList = ['Woodlands Site', 'Changi Airport T5 Site', 'Jurong Hub Depot', 'Marina Boulevard Site'];
  const inventoryItems = [
    { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', uom: 'pcs' },
    { itemId: 'ITM05315', name: 'Stang Piston Sanchin 120', uom: 'pcs' },
    { itemId: 'ITM05312', name: 'Oil Seal Kit Sanchin 120', uom: 'kits' },
    { itemId: 'ITM05310', name: 'Selendang Ban 1100-20 KR Malaysia', uom: 'pcs' }
  ];

  // Compute live aggregates for summary cards
  const totalQtyIssued = materialIssues.reduce((sum, mi) => {
    const qty = mi.items.reduce((iSum, itm) => iSum + (itm.issuedQty || 0), 0);
    return sum + qty;
  }, 0);

  const aceQtyIssued = materialIssues
    .filter(mi => mi.builderName === 'Ace Builders')
    .reduce((sum, mi) => {
      const qty = mi.items.reduce((iSum, itm) => iSum + (itm.issuedQty || 0), 0);
      return sum + qty;
    }, 0);

  const woodlandsQtyIssued = materialIssues
    .filter(mi => mi.builderName === 'Woodlands Construction')
    .reduce((sum, mi) => {
      const qty = mi.items.reduce((iSum, itm) => iSum + (itm.issuedQty || 0), 0);
      return sum + qty;
    }, 0);

  const uniqueSitesCount = new Set(materialIssues.map(mi => mi.siteLocation)).size;

  // Handle Sort
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filter & Search data
  const filteredIssues = materialIssues
    .filter(mi => {
      const matchSearch = 
        mi.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mi.builderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mi.siteLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mi.dcRef && mi.dcRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
        mi.issuedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mi.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchBuilder = builderFilter === '' || mi.builderName === builderFilter;
      return matchSearch && matchBuilder;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination
  const paginatedIssues = filteredIssues.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleOpenCreate = () => {
    setFormData({
      id: `MIT-2026-${Math.floor(100 + Math.random() * 900)}`,
      builderName: 'Ace Builders',
      siteLocation: 'Woodlands Site',
      dcRef: '',
      date: new Date().toISOString().split('T')[0],
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', issuedQty: 10, uom: 'pcs' }
      ],
      issuedBy: 'Supervisor Keith',
      status: 'Issued'
    });
    setFormOpen(true);
  };

  const handleDCRefChange = (dcId) => {
    const dc = deliveryChallans.find(c => c.id === dcId);
    if (dc) {
      const items = dc.items.map(itm => ({
        itemId: itm.itemId,
        name: itm.name,
        issuedQty: itm.deliveredQty,
        uom: 'pcs'
      }));
      setFormData(prev => ({
        ...prev,
        dcRef: dcId,
        builderName: dc.builderName || 'Ace Builders',
        siteLocation: dc.siteLocation || 'Woodlands Site',
        items
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dcRef: '',
        items: [{ itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', issuedQty: 10, uom: 'pcs' }]
      }));
    }
  };

  const handleItemSelectChange = (idx, itemId) => {
    const updated = [...formData.items];
    const selected = inventoryItems.find(i => i.itemId === itemId);
    if (selected) {
      updated[idx] = {
        ...updated[idx],
        itemId: selected.itemId,
        name: selected.name,
        uom: selected.uom
      };
      setFormData(prev => ({ ...prev, items: updated }));
    }
  };

  const handleItemQtyChange = (idx, value) => {
    const updated = [...formData.items];
    updated[idx].issuedQty = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleAddItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', issuedQty: 10, uom: 'pcs' }]
    }));
  };

  const handleRemoveItemRow = (idx) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = () => {
    if (!formData.issuedBy) {
      alert('Issued By signature name is required.');
      return;
    }
    const hasValidItems = formData.items.every(i => i.issuedQty > 0);
    if (!hasValidItems) {
      alert('All items must have a quantity greater than 0.');
      return;
    }

    dispatch(addMaterialIssue(formData));
    setFormOpen(false);
  };

  const handleViewDetails = (issue) => {
    setSelectedIssue(issue);
    setViewOpen(true);
  };

  // Export actions
  const handleExportExcel = () => {
    const data = materialIssues.map(mi => ({
      'Issue Log ID': mi.id,
      'Date': mi.date,
      'Builder Name': mi.builderName,
      'Site Location': mi.siteLocation,
      'Reference DC': mi.dcRef || 'Direct Issue',
      'Material Shipped': mi.items.map(i => `${i.name} (${i.issuedQty} ${i.uom})`).join(', '),
      'Issued By': mi.issuedBy,
      'Status': mi.status
    }));
    exportToExcel(data, 'MaterialIssues_Report', 'MaterialIssues');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Log ID' },
      { field: 'date', headerName: 'Date' },
      { field: 'builderName', headerName: 'Builder Name' },
      { field: 'siteLocation', headerName: 'Site Location' },
      { field: 'dcRef', headerName: 'DC Reference' },
      { field: 'issuedBy', headerName: 'Issued By' },
      { field: 'status', headerName: 'Status' }
    ];
    exportToPDF(cols, materialIssues, 'MaterialIssues_Report', 'Site Material Issue Tracking Registers');
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Site Material Issue Tracking</h2>
          <p className="breadcrumb">Delivery & Dispatch &gt; Material Issue Tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleExportExcel} title="Export to Excel">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-secondary" onClick={handleExportPDF} title="Export to PDF">
            <FileText size={16} /> PDF
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Log Material Issue
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-icon blue">
            <Clipboard size={22} />
          </div>
          <div className="card-content">
            <span className="lbl">Total Items Issued</span>
            <span className="val">{totalQtyIssued} pcs</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon green">
            <Building size={22} />
          </div>
          <div className="card-content">
            <span className="lbl">Ace Builders Supplies</span>
            <span className="val">{aceQtyIssued} pcs</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon amber">
            <Building size={22} />
          </div>
          <div className="card-content">
            <span className="lbl">Woodlands Const Supplies</span>
            <span className="val">{woodlandsQtyIssued} pcs</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon purple">
            <MapPin size={22} />
          </div>
          <div className="card-content">
            <span className="lbl">Active Site Nodes</span>
            <span className="val">{uniqueSitesCount} Locations</span>
          </div>
        </div>
      </div>

      {/* Grid Filter and Search */}
      <div className="table-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search logs (ID, Builder, Site, Challan, Item, Supervisor...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={builderFilter} 
            onChange={(e) => setBuilderFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Builders</option>
            {buildersList.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>Issue Log ID {sortField === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>Issue Date {sortField === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('builderName')} style={{ cursor: 'pointer' }}>Builder {sortField === 'builderName' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th>Site Destination</th>
              <th>Ref Challan</th>
              <th>Material Details</th>
              <th>Issued By</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedIssues.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No site material issue records found.
                </td>
              </tr>
            ) : (
              paginatedIssues.map((mi) => (
                <tr key={mi.id}>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{mi.id}</td>
                  <td>{mi.date}</td>
                  <td style={{ fontWeight: '500' }}>{mi.builderName}</td>
                  <td>
                    <div style={{ fontWeight: '500', fontSize: '13px' }}><MapPin size={11} style={{ display: 'inline', marginRight: '3px' }} />{mi.siteLocation}</div>
                  </td>
                  <td>
                    {mi.dcRef ? (
                      <Chip label={mi.dcRef} size="small" color="primary" variant="outlined" />
                    ) : (
                      <Chip label="Direct Issue" size="small" variant="outlined" />
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {mi.items.map((itm, i) => (
                        <span key={i} style={{ fontSize: '12px' }}>
                          <strong>{itm.issuedQty} {itm.uom}</strong> - {itm.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}><User size={10} style={{ display: 'inline', marginRight: '4px' }} />{mi.issuedBy}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <Tooltip title="View Material Issue Logs">
                        <IconButton size="small" color="primary" onClick={() => handleViewDetails(mi)}>
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="pagination-bar">
        <span className="pagination-info">
          Showing {filteredIssues.length === 0 ? 0 : page * rowsPerPage + 1} to {Math.min(filteredIssues.length, (page + 1) * rowsPerPage)} of {filteredIssues.length} entries
        </span>
        <div className="pagination-buttons">
          <button 
            disabled={page === 0} 
            onClick={() => setPage(prev => prev - 1)}
            className="paginate-btn"
          >
            Previous
          </button>
          <button 
            disabled={(page + 1) * rowsPerPage >= filteredIssues.length} 
            onClick={() => setPage(prev => prev + 1)}
            className="paginate-btn"
          >
            Next
          </button>
        </div>
      </div>

      {/* Dialog for Logging Material Issue */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid var(--border)', pb: 2, fontWeight: 'bold', color: 'var(--primary)' }}>
          Log Site Material Issue Voucher
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <div className="dialog-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
            <FormControl fullWidth size="small">
              <InputLabel>Reference Delivery Challan (Optional)</InputLabel>
              <Select
                autoFocus
                value={formData.dcRef}
                onChange={(e) => handleDCRefChange(e.target.value)}
                label="Reference Delivery Challan (Optional)"
              >
                <MenuItem value="">-- Direct Issue (No Challan) --</MenuItem>
                {deliveryChallans.map(dc => (
                  <MenuItem key={dc.id} value={dc.id}>
                    {dc.id} - {dc.customerName} ({dc.status})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Issue Voucher ID"
              value={formData.id}
              disabled
              size="small"
              fullWidth
            />

            <FormControl fullWidth size="small" disabled={!!formData.dcRef}>
              <InputLabel>Builder Name *</InputLabel>
              <Select
                value={formData.builderName}
                onChange={(e) => setFormData(prev => ({ ...prev, builderName: e.target.value }))}
                label="Builder Name *"
              >
                {buildersList.map(b => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={!!formData.dcRef}>
              <InputLabel>Site Location *</InputLabel>
              <Select
                value={formData.siteLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, siteLocation: e.target.value }))}
                label="Site Location *"
              >
                {sitesList.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Date Logged"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Issued By / Supervisor Signature *"
              value={formData.issuedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, issuedBy: e.target.value }))}
              placeholder="e.g. Keith Storekeeper"
              size="small"
              fullWidth
            />
          </div>

          <div style={{ marginTop: '20px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '10px 16px', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Items To Issue</span>
              {!formData.dcRef && (
                <Button size="small" startIcon={<Plus size={14} />} onClick={handleAddItemRow}>
                  Add Row
                </Button>
              )}
            </div>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Material Description *</TableCell>
                  <TableCell align="right" style={{ width: '150px' }}>Issued Qty *</TableCell>
                  <TableCell style={{ width: '80px' }}>UOM</TableCell>
                  {!formData.dcRef && <TableCell style={{ width: '60px' }}></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((itm, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ py: 1 }}>
                      {formData.dcRef ? (
                        <strong>{itm.name}</strong>
                      ) : (
                        <Select
                          value={itm.itemId}
                          onChange={(e) => handleItemSelectChange(idx, e.target.value)}
                          size="small"
                          fullWidth
                        >
                          {inventoryItems.map(item => (
                            <MenuItem key={item.itemId} value={item.itemId}>
                              {item.name} ({item.itemId})
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1 }}>
                      <TextField
                        type="number"
                        value={itm.issuedQty}
                        onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                        size="small"
                        inputProps={{ min: 1, style: { textAlign: 'right' } }}
                        fullWidth
                        disabled={!!formData.dcRef}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>{itm.uom}</TableCell>
                    {!formData.dcRef && (
                      <TableCell align="center" sx={{ py: 1 }}>
                        <IconButton size="small" onClick={() => handleRemoveItemRow(idx)} disabled={formData.items.length === 1}>
                          <Trash size={14} style={{ color: 'var(--danger)' }} />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border)', px: 3, py: 2 }}>
          <Button onClick={() => setFormOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save Log
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Viewing Issue Details */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid var(--border)', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Material Issue Log: {selectedIssue?.id}</span>
          <Chip label={selectedIssue?.status} size="small" color="primary" style={{ margin: 0 }} />
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedIssue && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><strong>Issue Date:</strong> {selectedIssue.date}</div>
                <div><strong>Builder Name:</strong> {selectedIssue.builderName}</div>
                <div><strong>Site Location:</strong> {selectedIssue.siteLocation}</div>
                <div><strong>Reference DC:</strong> {selectedIssue.dcRef || 'Direct Issue (No Challan)'}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Issued By / Store Signatory:</strong> {selectedIssue.issuedBy}</div>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Materials Shipped List</div>
                <Table size="small" style={{ border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <TableHead style={{ background: '#f8fafc' }}>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Issued Quantity</TableCell>
                      <TableCell>UOM</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedIssue.items.map((itm, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <strong>{itm.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{itm.itemId}</div>
                        </TableCell>
                        <TableCell align="right" style={{ fontWeight: 'bold' }}>{itm.issuedQty}</TableCell>
                        <TableCell>{itm.uom}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx="true">{`
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .summary-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: var(--shadow-sm);
        }

        .card-icon {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .card-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .card-icon.amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .card-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

        .card-content {
          display: flex;
          flex-direction: column;
        }

        .card-content .lbl {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .card-content .val {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 2px;
        }

        .table-filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 20px;
          gap: 16px;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: #f1f5f9;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px 12px;
          width: 320px;
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 8px;
        }

        .search-input-wrapper input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 14px;
          color: var(--text-main);
        }

        .filter-select {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          outline: none;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: var(--surface);
          color: var(--text-main);
          border: 1px solid var(--border);
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .erp-table-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          overflow-x: auto;
        }

        .erp-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .erp-table th, .erp-table td {
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
        }

        .erp-table th {
          background: #f8fafc;
          font-weight: 600;
          color: var(--text-muted);
        }

        .erp-table tr:hover {
          background: #f8fafc;
        }

        .pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
        }

        .pagination-info {
          font-size: 14px;
          color: var(--text-muted);
        }

        .pagination-buttons {
          display: flex;
          gap: 8px;
        }

        .paginate-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          color: var(--text-main);
          font-weight: 500;
          cursor: pointer;
        }

        .paginate-btn:disabled {
          color: #cbd5e1;
          cursor: not-allowed;
        }

        .paginate-btn:not(:disabled):hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
};

export default MaterialIssueTracking;

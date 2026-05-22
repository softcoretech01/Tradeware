import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, 
  Tooltip, Chip
} from '@mui/material';
import { 
  Search, Plus, Eye, Trash, Printer,
  FileSpreadsheet, FileText, Truck, Clipboard, MapPin
} from 'lucide-react';
import { 
  addDeliveryChallan, 
  deleteDeliveryChallan,
  updateDispatchStatus
} from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const DeliveryChallan = () => {
  const dispatch = useDispatch();

  // Store Selectors
  const deliveryChallans = useSelector(state => state.erp.deliveryChallans || []);
  const salesOrders = useSelector(state => state.erp.salesOrders || []);
  const warehouses = useSelector(state => state.locations.warehouses || []);

  // Grid States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedDC, setSelectedDC] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    soRef: '',
    cpoRef: '',
    customerName: '',
    builderName: 'Ace Builders',
    siteLocation: 'Woodlands Site',
    date: new Date().toISOString().split('T')[0],
    items: [],
    deliveryLocation: '',
    vehicleNo: '',
    vehicleType: '10-ton Truck',
    driverName: '',
    driverContact: '',
    status: 'Draft',
    trackingTimeline: []
  });

  // Pre-configured fleets and builders
  const buildersList = ['Ace Builders', 'Woodlands Construction', 'Apex Projects', 'Capital Infrastructure'];
  const sitesList = ['Woodlands Site', 'Changi Airport T5 Site', 'Jurong Hub Depot', 'Marina Boulevard Site'];
  const vehicleTypes = ['10-ton Truck', '5-ton Lorry', '3-ton Van', 'Flatbed Trailer'];

  // Handle Sort
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filter & Search data
  const filteredChallans = deliveryChallans
    .filter(dc => {
      const matchSearch = 
        dc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dc.soRef && dc.soRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dc.vehicleNo && dc.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dc.driverName && dc.driverName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === '' || dc.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination slice
  const paginatedChallans = filteredChallans.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleOpenCreate = () => {
    setFormData({
      id: `DC-2026-${Math.floor(100 + Math.random() * 900)}`,
      soRef: '',
      cpoRef: '',
      customerName: '',
      builderName: 'Ace Builders',
      siteLocation: 'Woodlands Site',
      date: new Date().toISOString().split('T')[0],
      items: [],
      deliveryLocation: '',
      vehicleNo: '',
      vehicleType: '10-ton Truck',
      driverName: '',
      driverContact: '',
      status: 'Draft',
      trackingTimeline: [
        { status: 'Draft', timestamp: new Date().toLocaleString(), remarks: 'Delivery Challan Draft created.' }
      ]
    });
    setFormOpen(true);
  };

  const handleSOChange = (soId) => {
    const so = salesOrders.find(s => s.id === soId);
    if (so) {
      // Build items with remaining pending quantities
      const items = so.items
        .filter(itm => itm.pendingQty > 0)
        .map(itm => ({
          itemId: itm.itemId,
          name: itm.name,
          orderedQty: itm.orderedQty,
          alreadyDelivered: itm.suppliedQty,
          pendingQty: itm.pendingQty,
          deliveredQty: itm.pendingQty, // default to deliver all remaining
          warehouseBin: warehouses[0]?.racks[0] || 'Rack A-01'
        }));

      setFormData(prev => ({
        ...prev,
        soRef: soId,
        cpoRef: so.cpoRef || '',
        customerName: so.customerName,
        items,
        deliveryLocation: so.warehouse === 'JURONG EAST DEPOT' ? '50 Jurong Gateway Road, Singapore' : '10 Ubi Crescent, Singapore'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        soRef: '',
        cpoRef: '',
        customerName: '',
        items: [],
        deliveryLocation: ''
      }));
    }
  };

  const handleItemQtyChange = (idx, value) => {
    const updated = [...formData.items];
    const qty = parseFloat(value) || 0;
    const maxQty = updated[idx].pendingQty;
    
    if (qty > maxQty) {
      alert(`Delivered quantity cannot exceed pending quantity of ${maxQty}`);
      updated[idx].deliveredQty = maxQty;
    } else if (qty <= 0) {
      updated[idx].deliveredQty = 0;
    } else {
      updated[idx].deliveredQty = qty;
    }
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleItemBinChange = (idx, bin) => {
    const updated = [...formData.items];
    updated[idx].warehouseBin = bin;
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleSave = () => {
    if (!formData.soRef) {
      alert('Sales Order reference is required.');
      return;
    }
    const hasItemsToDeliver = formData.items.some(i => i.deliveredQty > 0);
    if (!hasItemsToDeliver) {
      alert('At least one item must have a delivery quantity greater than 0.');
      return;
    }
    if (!formData.vehicleNo || !formData.driverName) {
      alert('Vehicle Number and Driver Name are required.');
      return;
    }

    dispatch(addDeliveryChallan(formData));
    setFormOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete challan ${id}? This will revert pending quantities in the Sales Order.`)) {
      dispatch(deleteDeliveryChallan(id));
    }
  };

  const handleViewDetails = (dc) => {
    setSelectedDC(dc);
    setViewOpen(true);
  };

  const handleOpenPrint = (dc) => {
    setSelectedDC(dc);
    setPrintOpen(true);
  };

  const handlePrintAction = () => {
    window.print();
  };

  // Export Grids
  const handleExportExcel = () => {
    const data = deliveryChallans.map(dc => ({
      'Challan ID': dc.id,
      'Date': dc.date,
      'SO Ref': dc.soRef,
      'Customer': dc.customerName,
      'Builder': dc.builderName,
      'Site Location': dc.siteLocation,
      'Vehicle No': dc.vehicleNo,
      'Driver': dc.driverName,
      'Status': dc.status,
      'Dispatch Date': dc.dispatchDate || 'N/A',
      'Delivery Date': dc.deliveryDate || 'N/A'
    }));
    exportToExcel(data, 'DeliveryChallans_Report', 'Challans');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Challan ID' },
      { field: 'date', headerName: 'Date' },
      { field: 'soRef', headerName: 'SO Reference' },
      { field: 'customerName', headerName: 'Customer Name' },
      { field: 'vehicleNo', headerName: 'Vehicle No' },
      { field: 'driverName', headerName: 'Driver Name' },
      { field: 'status', headerName: 'Status' }
    ];
    exportToPDF(cols, deliveryChallans, 'DeliveryChallans_Report', 'ERP Delivery Challan Registers');
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Delivery Challan Management</h2>
          <p className="breadcrumb">Delivery & Dispatch &gt; Delivery Challan</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleExportExcel} title="Export to Excel">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-secondary" onClick={handleExportPDF} title="Export to PDF">
            <FileText size={16} /> PDF
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Challan
          </button>
        </div>
      </div>

      {/* Grid Filter and Search */}
      <div className="table-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search Challans (ID, Customer, Vehicle, Driver...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Main Grid Data Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>Challan ID {sortField === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>Date {sortField === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th>Sales Order</th>
              <th onClick={() => handleSort('customerName')} style={{ cursor: 'pointer' }}>Customer {sortField === 'customerName' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th>Builder & Site</th>
              <th>Driver / Vehicle</th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status {sortField === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedChallans.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No delivery challans found matching filters.
                </td>
              </tr>
            ) : (
              paginatedChallans.map((dc) => (
                <tr key={dc.id}>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{dc.id}</td>
                  <td>{dc.date}</td>
                  <td>
                    <Chip label={dc.soRef} size="small" variant="outlined" color="primary" />
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{dc.customerName}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{dc.builderName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}><MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} />{dc.siteLocation}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{dc.driverName || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dc.vehicleNo} ({dc.vehicleType})</div>
                  </td>
                  <td>
                    <span className={`status-badge ${dc.status.toLowerCase().replace(' ', '-')}`}>
                      {dc.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <Tooltip title="View Challan Details">
                        <IconButton size="small" color="primary" onClick={() => handleViewDetails(dc)}>
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Challan Receipt">
                        <IconButton size="small" color="info" onClick={() => handleOpenPrint(dc)}>
                          <Printer size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Challan">
                        <IconButton size="small" color="error" onClick={() => handleDelete(dc.id)}>
                          <Trash size={16} />
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
          Showing {filteredChallans.length === 0 ? 0 : page * rowsPerPage + 1} to {Math.min(filteredChallans.length, (page + 1) * rowsPerPage)} of {filteredChallans.length} entries
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
            disabled={(page + 1) * rowsPerPage >= filteredChallans.length} 
            onClick={() => setPage(prev => prev + 1)}
            className="paginate-btn"
          >
            Next
          </button>
        </div>
      </div>

      {/* Dialog for Creating Delivery Challan */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid var(--border)', pb: 2, fontWeight: 'bold', color: 'var(--primary)' }}>
          Create New Delivery Challan
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <div className="dialog-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Sales Order *</InputLabel>
              <Select
                value={formData.soRef}
                onChange={(e) => handleSOChange(e.target.value)}
                label="Select Sales Order *"
              >
                {salesOrders.filter(so => so.deliveryStatus !== 'Fully Shipped').map(so => (
                  <MenuItem key={so.id} value={so.id}>
                    {so.id} - {so.customerName} ({so.deliveryStatus || 'Pending'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Challan ID"
              value={formData.id}
              disabled
              size="small"
              fullWidth
            />

            <TextField
              label="Customer Name"
              value={formData.customerName}
              disabled
              size="small"
              fullWidth
            />

            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth size="small">
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

            <FormControl fullWidth size="small">
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
          </div>

          <div style={{ marginTop: '20px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '10px 16px', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid var(--border)' }}>
              Line Items Allocation
            </div>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell align="right">Ordered Qty</TableCell>
                  <TableCell align="right">Delivered</TableCell>
                  <TableCell align="right">Pending</TableCell>
                  <TableCell align="right" style={{ width: '120px' }}>This Delivery *</TableCell>
                  <TableCell style={{ width: '180px' }}>Warehouse Bin *</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.length === 0 ? (
                  <TableRow>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Select a Sales Order to load items.
                    </td>
                  </TableRow>
                ) : (
                  formData.items.map((itm, idx) => (
                    <TableRow key={itm.itemId}>
                      <TableCell>
                        <div style={{ fontWeight: '500' }}>{itm.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{itm.itemId}</div>
                      </TableCell>
                      <TableCell align="right">{itm.orderedQty}</TableCell>
                      <TableCell align="right">{itm.alreadyDelivered || 0}</TableCell>
                      <TableCell align="right" style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{itm.pendingQty}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={itm.deliveredQty}
                          onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                          size="small"
                          inputProps={{ min: 0, max: itm.pendingQty, style: { textAlign: 'right' } }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={itm.warehouseBin}
                          onChange={(e) => handleItemBinChange(idx, e.target.value)}
                          size="small"
                          fullWidth
                        >
                          {warehouses.flatMap(w => w.racks.map(r => (
                            <MenuItem key={`${w.id}-${r}`} value={r}>
                              {w.name.split(' ')[0]} - {r}
                            </MenuItem>
                          )))}
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="section-divider" style={{ margin: '20px 0 10px 0', borderBottom: '1px dashed var(--border)' }}></div>

          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px', color: 'var(--primary)' }}>
            Logistics & Transport Assignment
          </div>

          <div className="dialog-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <TextField
              label="Delivery / Shipping Address"
              value={formData.deliveryLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
              size="small"
              fullWidth
            />

            <TextField
              label="Vehicle Number *"
              placeholder="e.g. XB-1234-A"
              value={formData.vehicleNo}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicleNo: e.target.value }))}
              size="small"
              fullWidth
            />

            <FormControl fullWidth size="small">
              <InputLabel>Vehicle Type *</InputLabel>
              <Select
                value={formData.vehicleType}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                label="Vehicle Type *"
              >
                {vehicleTypes.map(vt => (
                  <MenuItem key={vt} value={vt}>{vt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Driver Name *"
              placeholder="e.g. Alan Tan"
              value={formData.driverName}
              onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
              size="small"
              fullWidth
            />

            <TextField
              label="Driver Contact Phone *"
              placeholder="e.g. +65 9234 5678"
              value={formData.driverContact}
              onChange={(e) => setFormData(prev => ({ ...prev, driverContact: e.target.value }))}
              size="small"
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border)', px: 3, py: 2 }}>
          <Button onClick={() => setFormOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save & Issue Challan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Viewing Challan Details */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid var(--border)', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Challan Info: {selectedDC?.id}</span>
          <Chip label={selectedDC?.status} size="small" className={`status-badge ${selectedDC?.status?.toLowerCase().replace(' ', '-')}`} style={{ margin: 0 }} />
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedDC && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><strong>Date:</strong> {selectedDC.date}</div>
                <div><strong>Sales Order Ref:</strong> {selectedDC.soRef}</div>
                <div><strong>Customer PO Ref:</strong> {selectedDC.cpoRef || 'N/A'}</div>
                <div><strong>Customer Name:</strong> {selectedDC.customerName}</div>
                <div><strong>Builder:</strong> {selectedDC.builderName}</div>
                <div><strong>Site Location:</strong> {selectedDC.siteLocation}</div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <Truck size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Vehicle & Driver Assignment
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Vehicle No:</strong> {selectedDC.vehicleNo}</div>
                  <div><strong>Vehicle Type:</strong> {selectedDC.vehicleType}</div>
                  <div><strong>Driver Name:</strong> {selectedDC.driverName}</div>
                  <div><strong>Driver Contact:</strong> {selectedDC.driverContact}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong>Destination Address:</strong> {selectedDC.deliveryLocation}</div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Allocated Items</div>
                <Table size="small" style={{ border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <TableHead style={{ background: '#f8fafc' }}>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Bin Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedDC.items.map((itm) => (
                      <TableRow key={itm.itemId}>
                        <TableCell>
                          <strong>{itm.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{itm.itemId}</div>
                        </TableCell>
                        <TableCell align="right" style={{ fontWeight: 'bold' }}>{itm.deliveredQty} pcs</TableCell>
                        <TableCell><Chip label={itm.warehouseBin} size="small" color="primary" variant="outlined" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedDC.trackingTimeline && selectedDC.trackingTimeline.length > 0 && (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Dispatch Log Activity</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                    {selectedDC.trackingTimeline.map((tl, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{tl.timestamp.split(',')[1] || tl.timestamp}</span>
                        <strong style={{ color: 'var(--primary)', width: '70px' }}>{tl.status}</strong>
                        <span style={{ color: 'var(--text-main)' }}>- {tl.remarks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Printing Delivery Challan */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid var(--border)', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
          <span style={{ fontWeight: 'bold' }}>Print challan voucher: {selectedDC?.id}</span>
          <Button startIcon={<Printer size={16} />} variant="contained" onClick={handlePrintAction}>
            Print Now
          </Button>
        </DialogTitle>
        <DialogContent>
          {selectedDC && (
            <div className="print-challan-voucher" style={{ padding: '20px', fontFamily: 'Courier New, monospace', color: '#000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>TRADEWARE ERP PTE LTD</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>10 Changi South Lane, Singapore 486123</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>Phone: +65 6789 0123 | Email: logistics@tradeware.com</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold', letterSpacing: '1px' }}>DELIVERY CHALLAN</h1>
                  <div style={{ marginTop: '8px', border: '1px solid #000', padding: '4px 8px', display: 'inline-block' }}>
                    <strong>DC NO: {selectedDC.id}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', fontSize: '13px', lineHeight: '1.5' }}>
                <div>
                  <strong>CONSIGNEE (SHIP TO):</strong>
                  <div style={{ border: '1px solid #000', padding: '10px', minHeight: '80px', marginTop: '5px' }}>
                    <strong>{selectedDC.customerName}</strong><br />
                    Builder: {selectedDC.builderName}<br />
                    Site: {selectedDC.siteLocation}<br />
                    Dest: {selectedDC.deliveryLocation}
                  </div>
                </div>
                <div>
                  <strong>CHALLAN DETAILS:</strong>
                  <table style={{ width: '100%', fontSize: '13px', marginTop: '5px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '120px' }}><strong>Challan Date</strong></td>
                        <td>: {selectedDC.date}</td>
                      </tr>
                      <tr>
                        <td><strong>Sales Order Ref</strong></td>
                        <td>: {selectedDC.soRef}</td>
                      </tr>
                      <tr>
                        <td><strong>Customer PO Ref</strong></td>
                        <td>: {selectedDC.cpoRef || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Vehicle No</strong></td>
                        <td>: {selectedDC.vehicleNo} ({selectedDC.vehicleType})</td>
                      </tr>
                      <tr>
                        <td><strong>Driver Name</strong></td>
                        <td>: {selectedDC.driverName} ({selectedDC.driverContact})</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: '25px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>S.NO</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>ITEM CODE</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>MATERIAL DESCRIPTION</th>
                      <th style={{ textAlign: 'center', padding: '8px 4px' }}>UOM</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px' }}>DISPATCHED QTY</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px', paddingLeft: '15px' }}>STOCK SLOT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDC.items.map((itm, index) => (
                      <tr key={itm.itemId} style={{ borderBottom: '1px dashed #000' }}>
                        <td style={{ padding: '8px 4px' }}>{index + 1}</td>
                        <td style={{ padding: '8px 4px' }}>{itm.itemId}</td>
                        <td style={{ padding: '8px 4px' }}><strong>{itm.name}</strong></td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>pcs</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>{itm.deliveredQty}</td>
                        <td style={{ padding: '8px 4px', paddingLeft: '15px' }}>{itm.warehouseBin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px', fontSize: '12px' }}>
                <strong>Declaration:</strong> The materials specified above have been checked and dispatched in good condition. Please verify the quantities upon receipt.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginTop: '60px', textAlign: 'center', fontSize: '12px' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #000', margin: '0 auto 5px auto', width: '100px', height: '30px' }}></div>
                  <strong>PREPARED BY</strong>
                </div>
                <div>
                  <div style={{ borderBottom: '1px solid #000', margin: '0 auto 5px auto', width: '100px', height: '30px' }}></div>
                  <strong>CHECKED / ISSUED BY</strong>
                </div>
                <div>
                  <div style={{ borderBottom: '1px solid #000', margin: '0 auto 5px auto', width: '100px', height: '30px' }}></div>
                  <strong>DRIVER'S SIGNATURE</strong>
                </div>
                <div>
                  <div style={{ borderBottom: '1px solid #000', margin: '0 auto 5px auto', width: '100px', height: '30px' }}></div>
                  <strong>RECEIVER'S SIGN & STAMP</strong>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="no-print">
          <Button onClick={() => setPrintOpen(false)} variant="contained" color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx="true">{`
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
          color: var(--text-main);
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

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        .status-badge.draft { background: #e2e8f0; color: #475569; }
        .status-badge.dispatched { background: #dbeafe; color: #1e40af; }
        .status-badge.in-transit { background: #fef3c7; color: #d97706; }
        .status-badge.delivered { background: #d1fae5; color: #065f46; }

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

        @media print {
          body * {
            visibility: hidden;
          }
          .print-challan-voucher, .print-challan-voucher * {
            visibility: visible;
          }
          .print-challan-voucher {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .MuiDialog-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          .MuiBackdrop-root {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DeliveryChallan;

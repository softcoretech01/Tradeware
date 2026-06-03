import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Chip, Paper, Box, Grid, Typography, Card, CardContent
} from '@mui/material';
import {
  Search, FileSpreadsheet, FileText, Truck, Anchor, CheckCircle,
  FileCheck, Edit3, Compass, AlertCircle
} from 'lucide-react';
import { updateShipmentStatus, addShipment } from '../../store/batchImportSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const GREEN = { main: '#15803D', light: '#22C55E', bg: '#DCFCE7' };
const RED = { main: '#B91C1C', light: '#EF4444', bg: '#FEE2E2' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

const ShipmentTracking = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const shipments = useSelector(state => state.batchImport.shipments);
  const importPOs = useSelector(state => state.batchImport.importPOs);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [newShipmentModalOpen, setNewShipmentModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Update Form Fields
  const [boeNo, setBoeNo] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState('');

  // New Shipment Form Fields
  const [newPoNo, setNewPoNo] = useState('');
  const [newContainerNo, setNewContainerNo] = useState('');
  const [newBlNo, setNewBlNo] = useState('');
  const [newDeparture, setNewDeparture] = useState('');
  const [newEta, setNewEta] = useState('');

  // Dashboard metrics
  const stats = useMemo(() => {
    let activeTransit = 0;
    let customsPending = 0;
    let totalCleared = 0;

    shipments.forEach(s => {
      if (s.status === 'In Transit') activeTransit++;
      else if (s.status === 'Customs Clearance') customsPending++;
      else if (s.status === 'Cleared' || s.status === 'Arrived') totalCleared++;
    });

    return { activeTransit, customsPending, totalCleared };
  }, [shipments]);

  // Filtering
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      const matchSearch =
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.containerNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'All' || s.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [shipments, searchTerm, statusFilter]);

  // Pagination
  const paginatedShipments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredShipments.slice(startIndex, startIndex + pageSize);
  }, [filteredShipments, currentPage]);

  const totalPages = Math.ceil(filteredShipments.length / pageSize) || 1;

  // Handlers
  const handleOpenUpdate = (sh) => {
    setSelectedShipment(sh);
    setBoeNo(sh.billOfEntryNo || '');
    setShipmentStatus(sh.status);
    setUpdateModalOpen(true);
  };

  const handleSaveUpdate = () => {
    if (!selectedShipment) return;
    dispatch(updateShipmentStatus({
      id: selectedShipment.id,
      status: shipmentStatus,
      billOfEntryNo: boeNo
    }));
    setUpdateModalOpen(false);
    setSelectedShipment(null);
  };

  const handleOpenNewShipment = () => {
    setNewShipmentModalOpen(true);
  };

  const handleSaveNewShipment = () => {
    if (!newPoNo || !newContainerNo || !newBlNo) {
      alert('Please fill out PO No, Container No, and Bill of Lading No.');
      return;
    }

    const linkedPo = importPOs.find(po => po.id === newPoNo);
    if (!linkedPo) {
      alert('Invalid Import PO Reference Selected.');
      return;
    }

    const newSh = {
      id: `SH-2026-${String(shipments.length + 1).padStart(3, '0')}`,
      poNo: newPoNo,
      supplierName: linkedPo.supplierName,
      containerNo: newContainerNo,
      blNo: newBlNo,
      departureDate: newDeparture || new Date().toISOString().split('T')[0],
      eta: newEta || new Date(Date.now() + 15*24*60*60*1000).toISOString().split('T')[0],
      status: 'In Transit',
      billOfEntryNo: '',
      customsDuty: 0,
      freightCharges: 0,
      handlingCharges: 0,
      insuranceCost: 0,
      currency: linkedPo.currency,
      exchangeRate: linkedPo.exchangeRate,
      items: linkedPo.items
    };

    dispatch(addShipment(newSh));
    setNewShipmentModalOpen(false);
    // Reset fields
    setNewPoNo('');
    setNewContainerNo('');
    setNewBlNo('');
    setNewDeparture('');
    setNewEta('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Transit':
        return <Chip label="In Transit" size="small" style={{ backgroundColor: BLUE.bg, color: BLUE.light, fontWeight: 600 }} />;
      case 'Customs Clearance':
        return <Chip label="Customs Check" size="small" style={{ backgroundColor: AMBER.bg, color: AMBER.main, fontWeight: 600 }} />;
      case 'Cleared':
        return <Chip label="Cleared" size="small" style={{ backgroundColor: GREEN.bg, color: GREEN.main, fontWeight: 600 }} />;
      case 'Arrived':
        return <Chip label="Arrived Warehouse" size="small" style={{ backgroundColor: GREEN.bg, color: GREEN.main, fontWeight: 600 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredShipments.map(s => ({
      'Shipment ID': s.id,
      'PO Number': s.poNo,
      'Supplier': s.supplierName,
      'Container No': s.containerNo,
      'B/L Number': s.blNo,
      'Departure Date': s.departureDate,
      'ETA': s.eta,
      'Status': s.status,
      'Bill of Entry No': s.billOfEntryNo
    }));
    exportToExcel(data, `Shipments_Tracking_${new Date().toISOString().split('T')[0]}`, 'Shipments');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Shipment ID' },
      { field: 'poNo', headerName: 'PO Number' },
      { field: 'supplierName', headerName: 'Supplier' },
      { field: 'containerNo', headerName: 'Container No' },
      { field: 'departureDate', headerName: 'Departure' },
      { field: 'eta', headerName: 'ETA' },
      { field: 'status', headerName: 'Status' },
      { field: 'billOfEntryNo', headerName: 'BOE Number' }
    ];
    exportToPDF(cols, filteredShipments, `Shipments_Tracking_${new Date().toISOString().split('T')[0]}`, 'Ocean Containers Shipment Tracking');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Shipment & Container Tracking
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Monitor global freight dispatch logs, track estimated times of arrival (ETA), and log customs entries.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            startIcon={<FileSpreadsheet size={16} />} 
            onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#E8F5E9' }, borderRadius: 2 }}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportPDF}
            startIcon={<FileText size={18} />}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: BLUE.light, color: BLUE.light }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* TRACKING METRIC CARDS */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: BLUE.bg }}>
                <Compass size={24} style={{ color: BLUE.light }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Active Ocean Shipments</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.activeTransit} Containers</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: AMBER.bg }}>
                <AlertCircle size={24} style={{ color: AMBER.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Pending Customs Check</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.customsPending} Cargoes</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: GREEN.bg }}>
                <CheckCircle size={24} style={{ color: GREEN.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Cleared & Received</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.totalCleared} Shipments</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTER PANEL */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search container, supplier, PO reference..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-selects">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              displayEmpty
            >
              <MenuItem value="All">All Transit Stages</MenuItem>
              <MenuItem value="In Transit">In Transit</MenuItem>
              <MenuItem value="Customs Clearance">Customs Clearance</MenuItem>
              <MenuItem value="Cleared">Cleared</MenuItem>
              <MenuItem value="Arrived">Arrived</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {/* SHIPMENTS LIST GRID WITH TIMELINE PROGRESS */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Shipment ID</th>
              <th>PO Link</th>
              <th>Supplier Name</th>
              <th>Container No</th>
              <th>Bill of Lading</th>
              <th>Est. Arrival (ETA)</th>
              <th>Status</th>
              <th>Bill of Entry (BOE)</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedShipments.length > 0 ? (
              paginatedShipments.map(sh => (
                <tr key={sh.id}>
                  <td className="bold-cell">{sh.id}</td>
                  <td className="bold-cell">{sh.poNo}</td>
                  <td>{sh.supplierName}</td>
                  <td className="bold-cell">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Anchor size={14} style={{ color: BLUE.light }} />
                      {sh.containerNo}
                    </Box>
                  </td>
                  <td>{sh.blNo}</td>
                  <td>{sh.eta}</td>
                  <td>{getStatusBadge(sh.status)}</td>
                  <td>{sh.billOfEntryNo ? <Chip label={sh.billOfEntryNo} size="small" color="primary" variant="outlined" /> : '—'}</td>
                  <td className="actions-cell">
                    <Tooltip title="Log Customs BOE / Update Status">
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenUpdate(sh)}
                        sx={{ p: 1 }}
                      >
                        <Edit3 size={22} style={{ color: BLUE.light }} />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="table-empty">
                  No shipments tracked under these filter parameters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Showing Page {currentPage} of {totalPages} ({filteredShipments.length} total items)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              sx={{ textTransform: 'none' }}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* UPDATE STATUS & LOG CUSTOMS BOE MODAL */}
      <Dialog open={updateModalOpen} onClose={() => setUpdateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          Update Transit Status & Customs BOE ({selectedShipment?.id})
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Update shipment milestone status. If entering customs clearance or cleared, you must log a unique Customs Bill of Entry No.
            </Typography>

            <FormControl fullWidth>
              <InputLabel id="status-update-select-label">Milestone Transit Status</InputLabel>
              <Select
                labelId="status-update-select-label"
                value={shipmentStatus}
                label="Milestone Transit Status"
                onChange={(e) => setShipmentStatus(e.target.value)}
              >
                <MenuItem value="In Transit">In Transit (Sea/Ocean Freight)</MenuItem>
                <MenuItem value="Customs Clearance">Customs Clearance (Port Lock)</MenuItem>
                <MenuItem value="Cleared">Cleared (Ready for Landed Costing)</MenuItem>
                <MenuItem value="Arrived">Arrived Warehouse (Stocks Posted)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Customs Bill of Entry (BOE) Number"
              placeholder="e.g. BOE-887711-X"
              value={boeNo}
              onChange={(e) => setBoeNo(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveUpdate} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Update Transit Log
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREATE SHIPMENT MODAL */}
      <Dialog open={newShipmentModalOpen} onClose={() => setNewShipmentModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          Log Ocean Container Shipment
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
            
            <FormControl fullWidth>
              <InputLabel id="ship-po-select-label">Select Active Import PO</InputLabel>
              <Select
                labelId="ship-po-select-label"
                value={newPoNo}
                label="Select Active Import PO"
                onChange={(e) => setNewPoNo(e.target.value)}
              >
                {importPOs.filter(p => p.status === 'Ordered').map(po => (
                  <MenuItem key={po.id} value={po.id}>
                    {po.id} - {po.supplierName} ({po.currency})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Container Number"
              placeholder="e.g. MSKU9981240"
              value={newContainerNo}
              onChange={(e) => setNewContainerNo(e.target.value)}
            />

            <TextField
              fullWidth
              label="Ocean Bill of Lading (B/L) No"
              placeholder="e.g. BL-9921008"
              value={newBlNo}
              onChange={(e) => setNewBlNo(e.target.value)}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Departure Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newDeparture}
                  onChange={(e) => setNewDeparture(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Estimated Arrival (ETA)"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newEta}
                  onChange={(e) => setNewEta(e.target.value)}
                />
              </Grid>
            </Grid>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewShipmentModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveNewShipment} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Post Shipment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShipmentTracking;

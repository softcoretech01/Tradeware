import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Tooltip, Chip, Paper, Box, Grid, Typography, Card, CardContent, Divider
} from '@mui/material';
import {
  Search, Edit, Eye, History, FileSpreadsheet, FileText, 
  Calendar, MapPin, CheckCircle, AlertTriangle, XCircle, Tag,
  ArrowRight, Truck, ClipboardCheck
} from 'lucide-react';
import { updateBatchStatus } from '../../store/batchImportSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const GREEN = { main: '#15803D', light: '#22C55E', bg: '#DCFCE7' };
const RED = { main: '#B91C1C', light: '#EF4444', bg: '#FEE2E2' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

const BatchMaintenance = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const batches = useSelector(state => state.batchImport.batches);
  const shipments = useSelector(state => state.batchImport.shipments);
  const importPOs = useSelector(state => state.batchImport.importPOs);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Edit Fields
  const [editStatus, setEditStatus] = useState('');
  const [editWarehouse, setEditWarehouse] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');

  // Filtering & Sorting
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      const matchSearch = 
        batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.itemName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'All' || batch.status === statusFilter;
      const matchWarehouse = warehouseFilter === 'All' || batch.warehouse === warehouseFilter;

      return matchSearch && matchStatus && matchWarehouse;
    });
  }, [batches, searchTerm, statusFilter, warehouseFilter]);

  // Pagination
  const paginatedBatches = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBatches.slice(startIndex, startIndex + pageSize);
  }, [filteredBatches, currentPage]);

  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1;

  // Handlers
  const handleOpenEdit = (batch) => {
    setSelectedBatch(batch);
    setEditStatus(batch.status);
    setEditWarehouse(batch.warehouse || 'Main Warehouse');
    setEditExpiryDate(batch.expiryDate || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedBatch) return;
    dispatch(updateBatchStatus({
      batchNo: selectedBatch.batchNo,
      status: editStatus,
      warehouse: editWarehouse,
      expiryDate: editExpiryDate
    }));
    setEditModalOpen(false);
    setSelectedBatch(null);
  };

  const handleOpenTimeline = (batch) => {
    // Gather timeline information
    const poDetails = importPOs.find(p => p.id === batch.poReference);
    const shipmentDetails = shipments.find(s => s.id === batch.shipmentRef);
    
    setSelectedBatch({
      ...batch,
      po: poDetails,
      shipment: shipmentDetails
    });
    setTimelineModalOpen(true);
  };

  // Expiry check helper
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Unknown', color: SLATE };
    const exp = new Date(expiryDate);
    const today = new Date();
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { label: 'Expired', color: RED, days: diffDays };
    } else if (diffDays <= 60) {
      return { label: `Expiring soon (${diffDays}d)`, color: AMBER, days: diffDays };
    } else {
      return { label: `${diffDays} days left`, color: GREEN, days: diffDays };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <Chip label="Available" size="small" style={{ backgroundColor: GREEN.bg, color: GREEN.main, fontWeight: 600 }} />;
      case 'On Hold':
        return <Chip label="On Hold" size="small" style={{ backgroundColor: AMBER.bg, color: AMBER.main, fontWeight: 600 }} />;
      case 'Expired':
        return <Chip label="Expired" size="small" style={{ backgroundColor: RED.bg, color: RED.main, fontWeight: 600 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredBatches.map(b => ({
      'Batch No': b.batchNo,
      'Item Code': b.itemCode,
      'Item Name': b.itemName,
      'Available Qty': b.qty,
      'Initial Qty': b.initialQty,
      'Mfg Date': b.mfgDate,
      'Expiry Date': b.expiryDate,
      'Landed Unit Cost (INR)': b.landedUnitCost,
      'Status': b.status,
      'Warehouse': b.warehouse
    }));
    exportToExcel(data, `Batch_Maintenance_Report_${new Date().toISOString().split('T')[0]}`, 'Batches');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'batchNo', headerName: 'Batch No' },
      { field: 'itemCode', headerName: 'Item Code' },
      { field: 'itemName', headerName: 'Item Name' },
      { field: 'qty', headerName: 'Qty' },
      { field: 'expiryDate', headerName: 'Expiry Date' },
      { field: 'landedUnitCost', headerName: 'Landed Cost' },
      { field: 'status', headerName: 'Status' },
      { field: 'warehouse', headerName: 'Warehouse' }
    ];
    exportToPDF(cols, filteredBatches, `Batch_Maintenance_Report_${new Date().toISOString().split('T')[0]}`, 'Batch & Lot Maintenance List');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Batch & Lot Maintenance
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

      {/* FILTERS PANEL */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by batch, item code, item name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-selects">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              displayEmpty
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="On Hold">On Hold</MenuItem>
              <MenuItem value="Expired">Expired</MenuItem>
            </Select>
          </FormControl>

        </div>
      </div>

      {/* BATCHES TABLE GRID */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Batch No</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Available / Initial Qty</th>
              <th>Mfg Date</th>
              <th>Expiry Date</th>
              <th>Landed Cost (INR)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBatches.length > 0 ? (
              paginatedBatches.map((batch) => {
                const expStatus = getExpiryStatus(batch.expiryDate);
                return (
                  <tr key={batch.batchNo}>
                    <td className="bold-cell">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tag size={16} style={{ color: BLUE.light }} />
                        {batch.batchNo}
                      </Box>
                    </td>
                    <td>{batch.itemCode}</td>
                    <td>{batch.itemName}</td>
                    <td className="bold-cell">{batch.qty} / {batch.initialQty}</td>
                    <td>{batch.mfgDate}</td>
                    <td>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{batch.expiryDate}</span>
                        <span style={{ fontSize: '11px', color: expStatus.color.main, fontWeight: 600 }}>
                          {expStatus.label}
                        </span>
                      </Box>
                    </td>
                    <td>₹{batch.landedUnitCost?.toFixed(2)}</td>
                    <td>{getStatusBadge(batch.status)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="table-empty">
                  No batches found matching filter parameters.
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
            Showing Page {currentPage} of {totalPages} ({filteredBatches.length} total items)
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

      {/* EDIT STATUS & EXPIRY DIALOG */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          Modify Batch Details ({selectedBatch?.batchNo})
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Update the inspection classification status or extend/correct the manufacturer expiry data.
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Inspection Status</InputLabel>
              <Select
                value={editStatus}
                label="Inspection Status"
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <MenuItem value="Available">Available (PASSED QC)</MenuItem>
                <MenuItem value="On Hold">On Hold (QC HOLD / LOCK)</MenuItem>
                <MenuItem value="Expired">Expired (FAILED QC)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Warehouse Bin Location</InputLabel>
              <Select
                value={editWarehouse}
                label="Warehouse Bin Location"
                onChange={(e) => setEditWarehouse(e.target.value)}
              >
                <MenuItem value="Main Warehouse">Main Warehouse</MenuItem>
                <MenuItem value="Hold Warehouse">Hold Warehouse</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Expiry Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editExpiryDate}
              onChange={(e) => setEditExpiryDate(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* TRACEABILITY TIMELINE DIALOG */}
      <Dialog open={timelineModalOpen} onClose={() => setTimelineModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History size={22} style={{ color: BLUE.light }} />
          Batch Inventory Traceability Timeline ({selectedBatch?.batchNo})
        </DialogTitle>
        <DialogContent dividers>
          {selectedBatch && (
            <Box sx={{ py: 2 }}>
              {/* Product Info Card */}
              <Card variant="outlined" sx={{ mb: 4, backgroundColor: SLATE.bg }}>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Item Details</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedBatch.itemName}</Typography>
                      <Typography variant="caption" color="text.secondary">{selectedBatch.itemCode}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Current Warehouse</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        <MapPin size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                        {selectedBatch.warehouse}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Available Stock</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: BLUE.main }}>
                        {selectedBatch.qty} of {selectedBatch.initialQty} Units
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Manufacturing Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        <Calendar size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                        {selectedBatch.mfgDate}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Timeline Steps */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: 2, position: 'relative' }}>
                {/* Vertical Line */}
                <Box sx={{
                  position: 'absolute',
                  left: '27px',
                  top: '10px',
                  bottom: '10px',
                  width: '2px',
                  backgroundColor: '#cbd5e1',
                  zIndex: 0
                }} />

                {/* Step 1: Import Order */}
                <Box sx={{ display: 'flex', gap: 3, zIndex: 1 }}>
                  <Box sx={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: BLUE.bg, border: `2px solid ${BLUE.main}`,
                    display: 'flex', alignItems: 'center', justify: 'center', ml: '16px', mt: '3px'
                  }}>
                    <FileText size={12} style={{ color: BLUE.main, margin: 'auto' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      1. Import Purchase Order Logged
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Purchase contract was generated on <strong>{selectedBatch.po?.date || selectedBatch.mfgDate}</strong> with supplier <strong>{selectedBatch.po?.supplierName || 'Global Extrusions Corp'}</strong>.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Ref No: {selectedBatch.poReference || 'IPO-2026-001'} | Currency: {selectedBatch.po?.currency || 'USD'}
                    </Typography>
                  </Box>
                </Box>

                {/* Step 2: Shipment */}
                <Box sx={{ display: 'flex', gap: 3, zIndex: 1 }}>
                  <Box sx={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: BLUE.bg, border: `2px solid ${BLUE.light}`,
                    display: 'flex', alignItems: 'center', justify: 'center', ml: '16px', mt: '3px'
                  }}>
                    <Truck size={12} style={{ color: BLUE.light, margin: 'auto' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      2. Freight Shipment & Sea Transit
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Container <strong>{selectedBatch.shipment?.containerNo || 'MSKU9981240'}</strong> loaded at port. Ocean Bill of Lading (B/L) issued: <strong>{selectedBatch.shipment?.blNo || 'BL-9921008'}</strong>.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Transit Ref: {selectedBatch.shipmentRef || 'SH-2026-001'} | Est. Arrival Date: {selectedBatch.shipment?.eta || '2026-05-25'}
                    </Typography>
                  </Box>
                </Box>

                {/* Step 3: Customs & QC Inward */}
                <Box sx={{ display: 'flex', gap: 3, zIndex: 1 }}>
                  <Box sx={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: selectedBatch.status === 'Available' ? GREEN.bg : (selectedBatch.status === 'On Hold' ? AMBER.bg : RED.bg),
                    border: `2px solid ${selectedBatch.status === 'Available' ? GREEN.main : (selectedBatch.status === 'On Hold' ? AMBER.main : RED.main)}`,
                    display: 'flex', alignItems: 'center', justify: 'center', ml: '16px', mt: '3px'
                  }}>
                    <ClipboardCheck size={12} style={{ color: selectedBatch.status === 'Available' ? GREEN.main : (selectedBatch.status === 'On Hold' ? AMBER.main : RED.main), margin: 'auto' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      3. Customs Clearance & Inward Quality Control Check
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Materials received at custom dock. Bill of Entry logged: <strong>{selectedBatch.shipment?.billOfEntryNo || 'BOE-992120-A'}</strong>. Quality auditor verified batch sample checks.
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedBatch.status === 'Available' ? (
                        <Chip icon={<CheckCircle size={14} />} label="QC Status: PASS" size="small" style={{ backgroundColor: GREEN.bg, color: GREEN.main }} />
                      ) : selectedBatch.status === 'On Hold' ? (
                        <Chip icon={<AlertTriangle size={14} />} label="QC Status: ON HOLD" size="small" style={{ backgroundColor: AMBER.bg, color: AMBER.main }} />
                      ) : (
                        <Chip icon={<XCircle size={14} />} label="QC Status: EXPIRED / FAIL" size="small" style={{ backgroundColor: RED.bg, color: RED.main }} />
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Step 4: Storage Allocation */}
                <Box sx={{ display: 'flex', gap: 3, zIndex: 1 }}>
                  <Box sx={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: GREEN.bg, border: `2px solid ${GREEN.main}`,
                    display: 'flex', alignItems: 'center', justify: 'center', ml: '16px', mt: '3px'
                  }}>
                    <MapPin size={12} style={{ color: GREEN.main, margin: 'auto' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      4. Warehouse Location Allocations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inventory stocked into bin slots under <strong>{selectedBatch.warehouse}</strong>. Stock is index-tracked for FIFO dispatch sequence.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Allocation Sequence Priority: #{selectedBatch.sequence}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimelineModalOpen(false)} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Close Traceability
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchMaintenance;

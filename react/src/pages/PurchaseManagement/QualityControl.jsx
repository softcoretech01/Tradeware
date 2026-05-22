import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Tooltip, Chip, Paper, Box, Grid, Typography, Card, CardContent, Divider
} from '@mui/material';
import {
  Search, CheckCircle, AlertTriangle, XCircle, RotateCcw,
  FileSpreadsheet, FileText, Eye, Check, X
} from 'lucide-react';
import {
  approveInspection, rejectInspection
} from '../../store/qcSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const GREEN = { main: '#15803D', light: '#22C55E', bg: '#DCFCE7' };
const RED = { main: '#B91C1C', light: '#EF4444', bg: '#FEE2E2' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

const QualityControl = () => {
  const dispatch = useDispatch();

  // Store selectors
  const inspections = useSelector(state => state.qc.inspections);

  // View States
  const [searchTerm, setSearchTerm] = useState('');
  const [qcFilter, setQcFilter] = useState('All');
  const [approvalFilter, setApprovalFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Apply filters & search to inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter(ins => {
      if (qcFilter !== 'All' && ins.qcStatus !== qcFilter) return false;
      if (approvalFilter !== 'All' && ins.approvalStatus !== approvalFilter) return false;
      
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return (
          ins.id.toLowerCase().includes(s) ||
          (ins.grnNo && ins.grnNo.toLowerCase().includes(s)) ||
          (ins.batchNo && ins.batchNo.toLowerCase().includes(s)) ||
          ins.supplierName.toLowerCase().includes(s) ||
          ins.itemCode.toLowerCase().includes(s) ||
          ins.itemName.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [inspections, searchTerm, qcFilter, approvalFilter]);

  const paginatedInspections = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredInspections.slice(startIndex, startIndex + pageSize);
  }, [filteredInspections, currentPage]);

  const totalPages = Math.ceil(filteredInspections.length / pageSize) || 1;

  const handleViewDetails = (ins) => {
    setSelectedInspection(ins);
    setDetailsModalOpen(true);
  };

  const handleApproveQC = (ins) => {
    dispatch(approveInspection({ id: ins.id, inspectorName: 'Manager Auditor' }));
    alert(`QC Approval approved for inspection ${ins.id}. Approved stock quantity of ${ins.acceptedQty} units has been updated in store warehouse allocation!`);
  };

  const handleRejectQC = (ins) => {
    dispatch(rejectInspection({ id: ins.id, inspectorName: 'Manager Auditor' }));
    alert(`QC Rejected. inspection ${ins.id} is marked as rejected.`);
  };

  // Export Handlers
  const handleExportExcelLocal = () => {
    const formatted = filteredInspections.map(ins => ({
      'Inspection ID': ins.id,
      'Inspection Date': ins.date,
      'GRN / DC No': ins.grnNo || ins.batchNo || '—',
      'Supplier / Entity': ins.supplierName,
      'Item Code': ins.itemCode,
      'Item Name': ins.itemName,
      'Qty Received': ins.qtyReceived,
      'Accepted Qty': ins.acceptedQty,
      'Rejected Qty': ins.rejectedQty,
      'QC Status': ins.qcStatus,
      'Inspector': ins.inspectorName,
      'Approval Status': ins.approvalStatus
    }));
    exportToExcel(formatted, `QC_Inspection_${new Date().toISOString().split('T')[0]}`, 'Quality Inspections');
  };

  const handleExportPDFLocal = () => {
    const cols = [
      { field: 'id', headerName: 'Inspection ID' },
      { field: 'date', headerName: 'Date' },
      { field: 'grnNo', headerName: 'GRN / DC No' },
      { field: 'supplierName', headerName: 'Supplier Name' },
      { field: 'itemCode', headerName: 'Item Code' },
      { field: 'qtyReceived', headerName: 'Received Qty' },
      { field: 'acceptedQty', headerName: 'Accepted Qty' },
      { field: 'qcStatus', headerName: 'QC Status' },
      { field: 'approvalStatus', headerName: 'Approval' }
    ];
    exportToPDF(cols, filteredInspections, `QC_Inspection_${new Date().toISOString().split('T')[0]}`, 'Quality Control Inspection Report');
  };

  // Color mappings
  const getQcStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return { bg: GREEN.bg, color: GREEN.main };
      case 'Rejected': return { bg: RED.bg, color: RED.main };
      case 'Rework Required': return { bg: AMBER.bg, color: AMBER.main };
      case 'Under Inspection': return { bg: BLUE.bg, color: BLUE.light };
      case 'Hold': return { bg: SLATE.bg, color: SLATE.main };
      default: return { bg: SLATE.bg, color: SLATE.main };
    }
  };

  const getApprovalStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return { bg: GREEN.bg, color: GREEN.main };
      case 'Rejected': return { bg: RED.bg, color: RED.main };
      default: return { bg: AMBER.bg, color: AMBER.main };
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Quality Control (QC) Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Inspect incoming supply materials, production batches, and pre-shipment packages. Give DC / GRN approvals below.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<FileSpreadsheet size={16} />} onClick={handleExportExcelLocal}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#16A34A', color: '#16A34A', '&:hover': { bgcolor: '#F0FDF4' } }}>
            Export Excel
          </Button>
          <Button variant="outlined" startIcon={<FileText size={16} />} onClick={handleExportPDFLocal}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#DC2626', color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
            Print Report
          </Button>
        </Box>
      </Box>

      {/* SEARCH & FILTERS BAR */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search by Inspection ID, GRN, Batch, Item..." value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          InputProps={{
            startAdornment: <Search size={16} style={{ color: '#94A3B8', marginRight: 8 }} />
          }}
          sx={{ minWidth: 280, bgcolor: '#FAFAFA' }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>QC Status</InputLabel>
          <Select value={qcFilter} label="QC Status" onChange={e => { setQcFilter(e.target.value); setCurrentPage(1); }}>
            <MenuItem value="All">All QC Status</MenuItem>
            <MenuItem value="Pending Inspection">Pending Inspection</MenuItem>
            <MenuItem value="Under Inspection">Under Inspection</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
            <MenuItem value="Rework Required">Rework Required</MenuItem>
            <MenuItem value="Hold">Hold</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Approval Status</InputLabel>
          <Select value={approvalFilter} label="Approval Status" onChange={e => { setApprovalFilter(e.target.value); setCurrentPage(1); }}>
            <MenuItem value="All">All Approval</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        {(searchTerm || qcFilter !== 'All' || approvalFilter !== 'All') && (
          <Button size="small" startIcon={<RotateCcw size={14} />}
            onClick={() => { setSearchTerm(''); setQcFilter('All'); setApprovalFilter('All'); setCurrentPage(1); }}
            sx={{ textTransform: 'none', color: RED.main }}>
            Clear Filters
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {filteredInspections.length} Quality Control records
        </Typography>
      </Paper>

      {/* MAIN INSPECTION GRID TABLE */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700 }}>Inspection ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>GRN / DC No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Supplier / Entity</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Item Details</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Qty Recd</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Accepted</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Rejected</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>QC Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Approval</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInspections.length > 0 ? (
              paginatedInspections.map(ins => {
                const qcStyle = getQcStatusStyle(ins.qcStatus);
                const appStyle = getApprovalStatusStyle(ins.approvalStatus);
                return (
                  <TableRow key={ins.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: BLUE.main }}>{ins.id}</TableCell>
                    <TableCell>{ins.date}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{ins.grnNo || ins.batchNo || '—'}</TableCell>
                    <TableCell>{ins.supplierName}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{ins.itemName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{ins.itemCode}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{ins.qtyReceived}</TableCell>
                    <TableCell align="right" sx={{ color: GREEN.main, fontWeight: 700 }}>{ins.acceptedQty}</TableCell>
                    <TableCell align="right" sx={{ color: ins.rejectedQty > 0 ? RED.main : 'text.secondary', fontWeight: 700 }}>{ins.rejectedQty}</TableCell>
                    <TableCell>
                      <Chip label={ins.qcStatus} size="small" sx={{ bgcolor: qcStyle.bg, color: qcStyle.color, fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={ins.approvalStatus} size="small" sx={{ bgcolor: appStyle.bg, color: appStyle.color, fontWeight: 700, fontSize: 10 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Tooltip title="View Detailed Report">
                          <IconButton size="small" onClick={() => handleViewDetails(ins)}>
                            <Eye size={16} style={{ color: BLUE.main }} />
                          </IconButton>
                        </Tooltip>
                        
                        {ins.approvalStatus === 'Pending' ? (
                          <>
                            <Button size="small" variant="contained" color="success" startIcon={<Check size={14} />} onClick={() => handleApproveQC(ins)}
                              sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, py: 0.5 }}>
                              Approve
                            </Button>
                            <Button size="small" variant="contained" color="error" startIcon={<X size={14} />} onClick={() => handleRejectQC(ins)}
                              sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, py: 0.5 }}>
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Chip label={ins.approvalStatus === 'Approved' ? 'Released' : 'Rejected'} size="small" variant="outlined" 
                            color={ins.approvalStatus === 'Approved' ? 'success' : 'error'} sx={{ fontSize: 10, fontWeight: 700 }} />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No quality inspection records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredInspections.length)} of {filteredInspections.length} records
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</Button>
            <Button size="small" variant="outlined" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</Button>
            <Chip label={`Page ${currentPage} of ${totalPages}`} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
            <Button size="small" variant="outlined" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</Button>
            <Button size="small" variant="outlined" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</Button>
          </Box>
        </Box>
      )}

      {/* ────────────────────────────────────────────────────────
          INSPECTION DETAILED READ-ONLY VIEW DIALOG
          ──────────────────────────────────────────────────────── */}
      <Dialog open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#F1F5F9', borderBottom: '1px solid #E2E8F0', py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: BLUE.dark }}>
            QC Detailed Audit Report — {selectedInspection?.id}
          </Typography>
          <IconButton size="small" onClick={() => setDetailsModalOpen(false)}><X size={16} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedInspection && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">INSPECTION STAGE</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedInspection.stage}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">DATE REGISTERED</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedInspection.date}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">GRN/BATCH/DC NO</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedInspection.grnNo || selectedInspection.batchNo || '—'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">SUPPLIER/PROD LINE</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedInspection.supplierName}</Typography></Grid>
                <Grid item xs={12}><Typography variant="caption" color="text.secondary">ITEM NAME (CODE)</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedInspection.itemName} ({selectedInspection.itemCode})</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">QTY INWARD</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedInspection.qtyReceived}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary" sx={{ color: GREEN.main }}>ACCEPTED</Typography><Typography variant="body2" sx={{ fontWeight: 700, color: GREEN.main }}>{selectedInspection.acceptedQty}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary" sx={{ color: RED.main }}>REJECTED</Typography><Typography variant="body2" sx={{ fontWeight: 700, color: RED.main }}>{selectedInspection.rejectedQty}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">QC STATUS</Typography><Box><Chip label={selectedInspection.qcStatus} size="small" sx={{ bgcolor: getQcStatusStyle(selectedInspection.qcStatus).bg, color: getQcStatusStyle(selectedInspection.qcStatus).color, fontWeight: 700 }} /></Box></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">RELEASE APPROVAL</Typography><Box><Chip label={selectedInspection.approvalStatus} size="small" sx={{ bgcolor: getApprovalStatusStyle(selectedInspection.approvalStatus).bg, color: getApprovalStatusStyle(selectedInspection.approvalStatus).color, fontWeight: 700 }} /></Box></Grid>
              </Grid>
              
              {selectedInspection.checklist && selectedInspection.checklist.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: BLUE.dark }}>Checklist Audit Logs</Typography>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Parameter</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Expected</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Observed</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedInspection.checklist.map((c, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{c.name}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{c.range}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{c.value || '—'}</TableCell>
                          <TableCell><Chip label={c.status} size="small" color={c.status === 'Pass' ? 'success' : 'error'} sx={{ fontSize: 9, height: 16 }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
              
              {selectedInspection.attachments && selectedInspection.attachments.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">INSPECTION ATTACHMENTS</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {selectedInspection.attachments.map(file => (
                        <Chip key={file} label={file} size="small" variant="outlined" color="primary" icon={<FileText size={12} />} />
                      ))}
                    </Box>
                  </Box>
                </>
              )}
              
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">REMARKS / CORRECTIVE DIRECTIVES</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, bgcolor: '#F8FAFC', p: 1.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  {selectedInspection.remarks || 'No inspection remarks logged.'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #E2E8F0' }}>
          <Button variant="contained" onClick={() => setDetailsModalOpen(false)} sx={{ textTransform: 'none', bgcolor: BLUE.main }}>
            Close Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityControl;

import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Paper, Typography, Button, IconButton, Chip, TextField,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Divider, Grid, Autocomplete, Stack
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Edit as EditIcon,
  Delete as DeleteIcon, FileDownload as ExportIcon,
  PictureAsPdf as PdfIcon, TableChart as ExcelIcon,
  Refresh as RefreshIcon, Close as CloseIcon,
  CallMade as OutwardIcon, Save as SaveIcon
} from '@mui/icons-material';
import { addStockOutward, updateStockOutward, deleteStockOutward } from '../../store/stockOutwardSlice';
import dayjs from 'dayjs';

const BLUE = { main: '#1565C0', light: '#1976D2', dark: '#0D47A1', bg: '#E3F2FD' };

const STATUS_COLORS = {
  'Completed': { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' },
  'Draft': { bg: '#FFF8E1', color: '#F57F17', border: '#FFE082' },
  'Cancelled': { bg: '#FFEBEE', color: '#C62828', border: '#EF9A9A' },
};

const TYPE_COLORS = {
  'Sales Delivery': { bg: '#FFEBEE', color: '#C62828' },
  'Project Supply': { bg: '#FFF8E1', color: '#F57F17' },
  'Sample Issue': { bg: '#E3F2FD', color: '#0D47A1' },
  'Stock Transfer': { bg: '#E8EAF6', color: '#1A237E' },
  'Damage Issue': { bg: '#FCE7F3', color: '#880E4F' },
};

const OUTWARD_TYPES = ['Sales Delivery', 'Project Supply', 'Sample Issue', 'Stock Transfer', 'Damage Issue'];
const WAREHOUSES = ['Main Warehouse', 'Secondary Warehouse', 'Cold Storage', 'Transit Warehouse'];
const UOMS = ['PCS', 'SET', 'KGS', 'MTR', 'SQM', 'LTR', 'BOX', 'NOS'];

const StockOutward = () => {
  const dispatch = useDispatch();
  const transactions = useSelector(state => state.stockOutward.transactions);
  const { items } = useSelector(state => state.items);

  /* ── UI Filters State ── */
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  /* ── Form Dialog State ── */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /* ── Form Data ── */
  const [formData, setFormData] = useState({
    id: '',
    date: dayjs().format('YYYY-MM-DD'),
    outwardType: 'Sales Delivery',
    refNo: '',
    itemCode: '',
    itemName: '',
    warehouse: 'Main Warehouse',
    batchNo: '',
    uom: 'PCS',
    quantity: '',
    costPrice: '',
    totalValue: 0,
    customerName: '',
    customerPO: '',
    remarks: '',
    status: 'Completed',
    createdBy: 'Admin',
  });

  /* ── Snackbar State ── */
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  /* ── Search and Filter Logic ── */
  const filtered = useMemo(() => {
    return transactions.filter(row => {
      if (typeFilter !== 'All' && row.outwardType !== typeFilter) return false;
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          (row.id || '').toLowerCase().includes(s) ||
          (row.itemCode || '').toLowerCase().includes(s) ||
          (row.itemName || '').toLowerCase().includes(s) ||
          (row.refNo || '').toLowerCase().includes(s) ||
          (row.batchNo || '').toLowerCase().includes(s) ||
          (row.warehouse || '').toLowerCase().includes(s) ||
          (row.customerName || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  /* ── Handlers ── */
  const handleAddNew = () => {
    setSelectedItem(null);
    setFormData({
      id: `SO-${String(Date.now()).slice(-4)}`,
      date: dayjs().format('YYYY-MM-DD'),
      outwardType: 'Sales Delivery',
      refNo: '',
      itemCode: '',
      itemName: '',
      warehouse: 'Main Warehouse',
      batchNo: '',
      uom: 'PCS',
      quantity: '',
      costPrice: '',
      totalValue: 0,
      customerName: '',
      customerPO: '',
      remarks: '',
      status: 'Completed',
      createdBy: 'Admin',
    });
    setDialogOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedItem(row);
    setFormData({
      ...row,
      quantity: row.quantity || '',
      costPrice: row.costPrice || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (row) => {
    setDeleteConfirm(row);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      dispatch(deleteStockOutward(deleteConfirm));
      showSnack('Stock Outward transaction deleted successfully', 'info');
      setDeleteConfirm(null);
    }
  };

  const handleFormChange = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'quantity' || name === 'costPrice') {
        const qty = Number(updated.quantity || 0);
        const cost = Number(updated.costPrice || 0);
        updated.totalValue = qty * cost;
      }
      return updated;
    });
  };

  const handleItemSelect = (event, selectedItemObj) => {
    if (selectedItemObj) {
      setFormData(prev => {
        const qty = Number(prev.quantity || 0);
        const cost = Number(selectedItemObj.standardPrice || prev.costPrice || 0);
        return {
          ...prev,
          itemCode: selectedItemObj.id,
          itemName: selectedItemObj.name,
          uom: selectedItemObj.uom || 'PCS',
          costPrice: cost,
          totalValue: qty * cost
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        itemCode: '',
        itemName: '',
        uom: 'PCS',
      }));
    }
  };

  const handleFormSave = (e) => {
    e.preventDefault();
    if (!formData.itemCode || !formData.itemName || !formData.refNo || !formData.quantity || Number(formData.quantity) <= 0) {
      showSnack('Please fill in all required fields correctly', 'error');
      return;
    }

    const payload = {
      ...formData,
      quantity: Number(formData.quantity),
      costPrice: Number(formData.costPrice || 0),
      totalValue: Number(formData.totalValue || 0),
      createdAt: selectedItem ? selectedItem.createdAt : new Date().toISOString()
    };

    if (selectedItem) {
      dispatch(updateStockOutward({ oldTransaction: selectedItem, newTransaction: payload }));
      showSnack('Stock Outward transaction updated successfully');
    } else {
      dispatch(addStockOutward(payload));
      showSnack('Stock Outward transaction created successfully');
    }
    setDialogOpen(false);
  };

  /* ── Export Actions ── */
  const handleExportExcel = useCallback(() => {
    import('xlsx').then(XLSX => {
      const exportData = filtered.map(r => ({
        'Outward ID': r.id, 'Date': r.date, 'Outward Type': r.outwardType,
        'Ref No': r.refNo, 'Item Code': r.itemCode, 'Item Name': r.itemName,
        'Warehouse': r.warehouse, 'Batch No': r.batchNo || '—', 'UOM': r.uom,
        'Quantity': r.quantity, 'Cost Price': r.costPrice, 'Total Value': r.totalValue,
        'Customer': r.customerName || '—', 'Customer PO': r.customerPO || '—',
        'Status': r.status, 'Created By': r.createdBy,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stock Outwards');
      XLSX.writeFile(wb, `Stock_Outward_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
      showSnack('Excel exported successfully');
    });
  }, [filtered]);

  const handleExportPDF = useCallback(() => {
    import('jspdf').then(jsPDFModule => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDFModule.default('l', 'mm', 'a4');
        doc.setFontSize(16);
        doc.setTextColor(21, 101, 192);
        doc.text('Stock Outward Register', 14, 15);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Generated: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 14, 22);

        const head = [['Outward ID', 'Date', 'Type', 'Ref No.', 'Item Code', 'Item Name', 'Warehouse', 'Batch', 'Qty', 'Cost (₹)', 'Total (₹)', 'Customer', 'Status']];
        const body = filtered.map(r => [
          r.id, r.date, r.outwardType, r.refNo, r.itemCode, r.itemName,
          r.warehouse, r.batchNo || '—', r.quantity.toLocaleString(),
          r.costPrice.toFixed(2), r.totalValue.toFixed(2), r.customerName || '—', r.status
        ]);

        doc.autoTable({
          head, body, startY: 28,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [21, 101, 192], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 248, 255] }
        });

        doc.save(`Stock_Outward_${dayjs().format('YYYYMMDD_HHmm')}.pdf`);
        showSnack('PDF exported successfully');
      });
    });
  }, [filtered]);

  /* ── DataGrid Columns ── */
  const columns = useMemo(() => [
    {
      field: 'id', headerName: 'Outward ID', width: 110,
      renderCell: (p) => (
        <Typography sx={{ fontFamily: '"Fira Code", monospace', fontWeight: 700, color: BLUE.main, fontSize: 13 }}>
          {p.value}
        </Typography>
      ),
    },
    { field: 'date', headerName: 'Date', width: 110 },
    {
      field: 'outwardType', headerName: 'Outward Type', width: 140,
      renderCell: (p) => {
        const c = TYPE_COLORS[p.value] || { bg: '#F5F5F5', color: '#616161' };
        return (
          <Chip label={p.value} size="small"
            sx={{ fontSize: 11, fontWeight: 600, bgcolor: c.bg, color: c.color }} />
        );
      }
    },
    { field: 'refNo', headerName: 'Ref No.', width: 120, renderCell: (p) => <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{p.value}</Typography> },
    { field: 'itemCode', headerName: 'Item Code', width: 110, renderCell: (p) => <Typography sx={{ fontFamily: 'monospace', color: BLUE.dark, fontWeight: 700, fontSize: 12 }}>{p.value}</Typography> },
    { field: 'itemName', headerName: 'Item Name', flex: 1, minWidth: 180 },
    {
      field: 'warehouse', headerName: 'Warehouse', width: 150,
      renderCell: (p) => (
        <Chip label={p.value} size="small"
          sx={{ fontSize: 11, fontWeight: 600, bgcolor: '#EDE7F6', color: '#4527A0' }} />
      )
    },
    { field: 'batchNo', headerName: 'Batch No.', width: 110, renderCell: (p) => <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{p.value || '—'}</Typography> },
    {
      field: 'quantity', headerName: 'Qty', width: 90, type: 'number', align: 'right', headerAlign: 'right',
      renderCell: (p) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#C62828' }}>
          -{p.value.toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'totalValue', headerName: 'Value (₹)', width: 110, type: 'number', align: 'right', headerAlign: 'right',
      renderCell: (p) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          ₹{(p.value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      )
    },
    { field: 'customerName', headerName: 'Customer', width: 140, renderCell: (p) => p.value || '—' },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: (p) => {
        const c = STATUS_COLORS[p.value] || { bg: '#F5F5F5', color: '#616161', border: '#E0E0E0' };
        return (
          <Chip size="small" label={p.value}
            sx={{
              fontSize: 10, fontWeight: 700,
              bgcolor: c.bg, color: c.color, border: `1px solid ${c.border}`
            }} />
        );
      }
    },
    {
      field: 'actions', headerName: 'Action', width: 100, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="primary" onClick={() => handleEdit(p.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeleteClick(p.row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ], [items]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', p: 0 }}>
      {/* ── HEADER ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0D47A1', letterSpacing: -0.5 }}>
            Stock Outward Register
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Manage and record outward stock transactions such as Sales Deliveries, Project Supplies, and Damage Issues
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDF}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#EF5350', color: '#C62828', '&:hover': { borderColor: '#C62828', bgcolor: '#FFEBEE' } }}>
            PDF
          </Button>
          <Button variant="outlined" startIcon={<ExcelIcon />} onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#66BB6A', color: '#2E7D32', '&:hover': { borderColor: '#2E7D32', bgcolor: '#E8F5E9' } }}>
            Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: BLUE.main, px: 3, boxShadow: '0 4px 14px rgba(21,101,192,0.3)', '&:hover': { bgcolor: BLUE.dark } }}>
            New Outward
          </Button>
        </Stack>
      </Box>

      {/* ── FILTERS ── */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E0E0E0', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search Outward ID, item code, ref no, customer…" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
            ...(search && {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
                </InputAdornment>
              ),
            }),
          }}
          sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#FAFAFA' } }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Outward Type</InputLabel>
          <Select value={typeFilter} label="Outward Type" onChange={e => setTypeFilter(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="All">All Outward Types</MenuItem>
            {OUTWARD_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="All">All Status</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        {(search || typeFilter !== 'All' || statusFilter !== 'All') && (
          <Button size="small" startIcon={<RefreshIcon />}
            onClick={() => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); }}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#C62828' }}>
            Clear Filters
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {filtered.length} of {transactions.length} records
        </Typography>
      </Paper>

      {/* ── DATAGRID TABLE ── */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #E0E0E0', flex: 1, minHeight: 450 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#F5F8FF', borderBottom: '2px solid #E0E0E0' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: 12, color: '#0D47A1', textTransform: 'uppercase', letterSpacing: 0.5 },
            '& .MuiDataGrid-row': { transition: 'background-color 0.15s ease', '&:hover': { bgcolor: '#F5F9FF' } },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center' },
            '& .MuiDataGrid-footerContainer': { borderTop: '2px solid #E0E0E0' },
          }}
        />
      </Paper>

      {/* ── TRANSACTION FORM DIALOG (MODAL) ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: BLUE.dark, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <OutwardIcon sx={{ color: BLUE.main }} />
          {selectedItem ? 'Edit Stock Outward Record' : 'New Stock Outward Entry'}
        </DialogTitle>
        <Divider />
        <form onSubmit={handleFormSave}>
          <DialogContent sx={{ py: 3 }}>
            <Grid container spacing={2.5}>
              {/* Section 1: Transaction Info */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main, textTransform: 'uppercase', mb: 1.5 }}>
                  Transaction details
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Outward ID" size="small" fullWidth value={formData.id} disabled />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Date" size="small" type="date" fullWidth
                  value={formData.date} onChange={e => handleFormChange('date', e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Outward Type</InputLabel>
                  <Select value={formData.outwardType} label="Outward Type"
                    onChange={e => handleFormChange('outwardType', e.target.value)}>
                    {OUTWARD_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Reference No." size="small" fullWidth required placeholder="e.g. SD-2025-001"
                  value={formData.refNo} onChange={e => handleFormChange('refNo', e.target.value)} />
              </Grid>

              {/* Section 2: Item Info */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main, textTransform: 'uppercase', mb: 1.5 }}>
                  Item allocation
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={items}
                  getOptionLabel={(option) => `${option.id} — ${option.name}`}
                  value={items.find(i => i.id === formData.itemCode) || null}
                  onChange={handleItemSelect}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Item (Master List)" size="small" required placeholder="Choose item..." />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Warehouse</InputLabel>
                  <Select value={formData.warehouse} label="Warehouse"
                    onChange={e => handleFormChange('warehouse', e.target.value)}>
                    {WAREHOUSES.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Batch No." size="small" fullWidth placeholder="e.g. B2024-001"
                  value={formData.batchNo} onChange={e => handleFormChange('batchNo', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Item Code" size="small" fullWidth required disabled value={formData.itemCode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Item Name" size="small" fullWidth required disabled value={formData.itemName} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>UOM</InputLabel>
                  <Select value={formData.uom} label="UOM"
                    onChange={e => handleFormChange('uom', e.target.value)}>
                    {UOMS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* Section 3: Quantity & Value */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main, textTransform: 'uppercase', mb: 1.5 }}>
                  Quantity & Cost price
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Quantity" size="small" type="number" fullWidth required
                  value={formData.quantity} onChange={e => handleFormChange('quantity', e.target.value)}
                  InputProps={{ inputProps: { min: 1 } }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Cost Price (₹)" size="small" type="number" fullWidth
                  value={formData.costPrice} onChange={e => handleFormChange('costPrice', e.target.value)}
                  InputProps={{ inputProps: { min: 0, step: '0.01' } }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Total Value (₹)" size="small" fullWidth disabled
                  value={Number(formData.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  InputProps={{
                    style: { background: '#FFF5F5', color: '#C62828', fontWeight: 700 }
                  }} />
              </Grid>

              {/* Section 4: Customer & Remarks */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main, textTransform: 'uppercase', mb: 1.5 }}>
                  Customer & Reference
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Customer Name" size="small" fullWidth placeholder="e.g. Sanchin Industries"
                  value={formData.customerName} onChange={e => handleFormChange('customerName', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Customer PO" size="small" fullWidth placeholder="e.g. CPO-2025-0115"
                  value={formData.customerPO} onChange={e => handleFormChange('customerPO', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={formData.status} label="Status"
                    onChange={e => handleFormChange('status', e.target.value)}>
                    <MenuItem value="Draft">Draft</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks / Notes" size="small" fullWidth multiline rows={2} placeholder="Add transaction comments..."
                  value={formData.remarks} onChange={e => handleFormChange('remarks', e.target.value)} />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
            <Button variant="contained" type="submit" startIcon={<SaveIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, bgcolor: BLUE.main, '&:hover': { bgcolor: BLUE.dark } }}>
              {selectedItem ? 'Update Record' : 'Save Record'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#C62828', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> Delete Outward Record
        </DialogTitle>
        <DialogContent>
          {deleteConfirm && (
            <Typography>
              Are you sure you want to delete outward entry <strong>{deleteConfirm.id}</strong> ({deleteConfirm.itemName})?
              This will add back <strong>{deleteConfirm.quantity}</strong> units to the stock overview.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}
            sx={{ textTransform: 'none', fontWeight: 700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR ── */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" sx={{ fontWeight: 600 }}
          onClose={() => setSnack(p => ({ ...p, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StockOutward;

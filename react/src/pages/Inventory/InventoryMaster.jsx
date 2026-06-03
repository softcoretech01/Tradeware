import { FileSpreadsheet } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Paper, Typography, Button, IconButton, Chip, TextField,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Divider, Badge, Tab, Tabs, Stack,
  Card, CardContent, Avatar, Menu, ListItemIcon, ListItemText,
  LinearProgress, alpha, useTheme,
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Edit as EditIcon,
  Delete as DeleteIcon, FileDownload as ExportIcon,
  Inventory2 as InventoryIcon, Warning as WarningIcon,
  CheckCircle as CheckIcon, Cancel as CancelIcon,
  TrendingDown as LowStockIcon, RemoveCircle as DamagedIcon,
  BookmarkAdded as ReservedIcon, Assessment as AuditIcon,
  Tune as AdjustIcon, Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon, TableChart as ExcelIcon,
  MoreVert as MoreIcon, Visibility as ViewIcon,
  ThumbUp as ApproveIcon, ThumbDown as RejectIcon,
  LocalShipping as InwardIcon, CallMade as OutwardIcon,
  FilterList as FilterIcon, Close as CloseIcon,
  BarChart as ChartIcon, History as HistoryIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import {
  deleteInventory, adjustStock, updateApprovalStatus,
} from '../../store/inventorySlice';
import InventoryFormDialog from '../../components/InventoryFormDialog';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/* ──────────── THEME CONSTANTS ──────────── */
const BLUE = { main: '#1565C0', light: '#1976D2', dark: '#0D47A1', bg: '#E3F2FD' };
const STATUS_COLORS = {
  'In Stock': { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' },
  'Low Stock': { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
  'Out of Stock': { bg: '#FFEBEE', color: '#C62828', border: '#EF9A9A' },
  'Reserved': { bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
};
const APPROVAL_COLORS = {
  'Approved': { bg: '#E8F5E9', color: '#2E7D32' },
  'Pending': { bg: '#FFF8E1', color: '#F57F17' },
  'Rejected': { bg: '#FFEBEE', color: '#C62828' },
};

/* ──────────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────────── */
const InventoryMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { inventory, auditLog } = useSelector(s => s.inventory);

  /* ── UI State ── */
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState(0);

  /* ── Dialogs ── */
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustType, setAdjustType] = useState('inward');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [auditOpen, setAuditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [damagedGridOpen, setDamagedGridOpen] = useState(false);

  /* ── Snackbar ── */
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  /* ── Derived Data ── */
  const warehouses = useMemo(() => ['All', ...new Set(inventory.map(i => i.warehouse).filter(Boolean))], [inventory]);
  const categories = useMemo(() => ['All', ...new Set(inventory.map(i => i.category).filter(Boolean))], [inventory]);

  const stats = useMemo(() => ({
    total: inventory.reduce((s, i) => s + i.availableStock, 0),
    low: inventory.filter(i => i.stockStatus === 'Low Stock').length,
    outOfStock: inventory.filter(i => i.stockStatus === 'Out of Stock').length,
    damaged: inventory.reduce((s, i) => s + i.damagedStock, 0),
    reserved: inventory.reduce((s, i) => s + i.reservedStock, 0),
    expired: inventory.reduce((s, i) => s + (i.expiredStock || 0), 0),
    totalValue: inventory.reduce((s, i) => s + i.availableStock * i.costPrice, 0),
    items: inventory.length,
  }), [inventory]);

  const filtered = useMemo(() => {
    return inventory.filter(row => {
      if (warehouseFilter !== 'All' && row.warehouse !== warehouseFilter) return false;
      if (categoryFilter !== 'All' && row.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && row.stockStatus !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          (row.itemCode || '').toLowerCase().includes(s) ||
          (row.itemName || '').toLowerCase().includes(s) ||
          (row.batchNo || '').toLowerCase().includes(s) ||
          (row.category || '').toLowerCase().includes(s) ||
          (row.warehouse || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [inventory, search, warehouseFilter, categoryFilter, statusFilter]);

  const damagedItems = useMemo(() => inventory.filter(i => i.damagedStock > 0), [inventory]);

  /* ── Handlers ── */
  const handleAddNew = () => { setEditItem(null); setFormOpen(true); };
  const handleEdit = (row) => { setEditItem(row); setFormOpen(true); setAnchorEl(null); };
  const handleFormClose = () => { setFormOpen(false); setEditItem(null); };
  const handleFormSave = () => {
    showSnack(editItem ? 'Inventory record updated successfully' : 'New inventory record created');
    handleFormClose();
  };

  const handleDeleteClick = (row) => { setDeleteConfirm(row); setAnchorEl(null); };
  const handleDeleteConfirm = () => {
    dispatch(deleteInventory(deleteConfirm.id));
    showSnack('Inventory record deleted', 'info');
    setDeleteConfirm(null);
  };

  const handleAdjustOpen = (row) => {
    setAdjustItem(row);
    setAdjustType('inward');
    setAdjustQty('');
    setAdjustReason('');
    setAdjustOpen(true);
    setAnchorEl(null);
  };

  const handleAdjustSubmit = () => {
    if (!adjustQty || Number(adjustQty) <= 0) return;
    dispatch(adjustStock({
      id: adjustItem.id,
      adjustmentType: adjustType,
      quantity: Number(adjustQty),
      reason: adjustReason,
    }));
    showSnack(`Stock ${adjustType} of ${adjustQty} units applied`);
    setAdjustOpen(false);
  };

  const handleApproval = (row, status) => {
    dispatch(updateApprovalStatus({ id: row.id, status }));
    showSnack(`Item ${row.itemCode} ${status.toLowerCase()}`);
    setAnchorEl(null);
  };

  const handleMenuOpen = (e, row) => { setAnchorEl(e.currentTarget); setMenuRow(row); };

  /* ── Export ── */
  const handleExportExcel = useCallback(() => {
    import('xlsx').then(XLSX => {
      const data = filtered.map(r => ({
        'Item Code': r.itemCode, 'Item Name': r.itemName, 'Category': r.category,
        'Warehouse': r.warehouse, 'Batch No': r.batchNo, 'UOM': r.uom,
        'Opening Stock': r.openingStock, 'Inward Qty': r.inwardQty,
        'Outward Qty': r.outwardQty, 'Available Stock': r.availableStock,
        'Reserved Stock': r.reservedStock, 'Damaged Stock': r.damagedStock,
        'Expiry Date': r.expiryDate, 'Status': r.stockStatus,
        'Last Updated': dayjs(r.lastUpdated).format('DD/MM/YYYY HH:mm'),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      XLSX.writeFile(wb, `Inventory_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
      showSnack('Excel exported successfully');
    });
  }, [filtered]);

  const handleExportPDF = useCallback(() => {
    import('jspdf').then(jsPDFModule => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDFModule.default('l', 'mm', 'a4');
        doc.setFontSize(16);
        doc.setTextColor(21, 101, 192);
        doc.text('Inventory Report', 14, 15);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Generated: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 14, 22);

        const head = [['Item Code', 'Item Name', 'Category', 'Warehouse', 'Batch', 'UOM', 'Opening', 'Inward', 'Outward', 'Available', 'Reserved', 'Damaged', 'Status']];
        const body = filtered.map(r => [
          r.itemCode, r.itemName, r.category, r.warehouse, r.batchNo, r.uom,
          r.openingStock, r.inwardQty, r.outwardQty, r.availableStock,
          r.reservedStock, r.damagedStock, r.stockStatus,
        ]);

        doc.autoTable({
          head, body, startY: 28,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [21, 101, 192], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 248, 255] },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 12) {
              const val = data.cell.raw;
              if (val === 'Out of Stock') data.cell.styles.textColor = [198, 40, 40];
              else if (val === 'Low Stock') data.cell.styles.textColor = [230, 81, 0];
              else if (val === 'In Stock') data.cell.styles.textColor = [46, 125, 50];
            }
          },
        });

        doc.save(`Inventory_${dayjs().format('YYYYMMDD_HHmm')}.pdf`);
        showSnack('PDF exported successfully');
      });
    });
  }, [filtered]);

  /* ── DataGrid Columns ── */
  const columns = useMemo(() => [
    {
      field: 'itemCode', headerName: 'Item Code', width: 120,
      renderCell: (p) => (
        <Typography sx={{ fontFamily: '"Fira Code", monospace', fontWeight: 700, color: BLUE.main, fontSize: 13 }}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: 'itemName', headerName: 'Item Name', flex: 1, minWidth: 200,
      renderCell: (p) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p.value}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{p.row.supplierName}</Typography>
        </Box>
      ),
    },
    {
      field: 'category', headerName: 'Category', width: 120,
      renderCell: (p) => (
        <Chip label={p.value} size="small" variant="outlined"
          sx={{ fontSize: 11, fontWeight: 600, borderColor: '#90CAF9', color: BLUE.main, bgcolor: '#F5F9FF' }} />
      ),
    },

    {
      field: 'batchNo', headerName: 'Batch No', width: 120,
      renderCell: (p) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: '#6A1B9A', fontWeight: 600 }}>
          {p.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'uom', headerName: 'UOM', width: 70, align: 'center', headerAlign: 'center',
      renderCell: (p) => <Chip label={p.value} size="small" sx={{ fontSize: 10, fontWeight: 700, minWidth: 40 }} />,
    },
    {
      field: 'openingStock', headerName: 'Opening', width: 90, type: 'number', align: 'right', headerAlign: 'right',
      renderCell: (p) => <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{(p.value ?? 0).toLocaleString()}</Typography>,
    },
    {
      field: 'inwardQty', headerName: 'Inward', width: 85, type: 'number', align: 'right', headerAlign: 'right',
      renderCell: (p) => {
        const val = p.value ?? 0;
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: val > 0 ? '#2E7D32' : 'text.secondary' }}>
            {val > 0 ? `+${val.toLocaleString()}` : '0'}
          </Typography>
        );
      },
    },
    {
      field: 'outwardQty', headerName: 'Outward', width: 85, type: 'number', align: 'right', headerAlign: 'right',
      renderCell: (p) => {
        const val = p.value ?? 0;
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: val > 0 ? '#C62828' : 'text.secondary' }}>
            {val > 0 ? `-${val.toLocaleString()}` : '0'}
          </Typography>
        );
      },
    },
    {
      field: 'availableStock', headerName: 'Available', width: 100, type: 'number', align: 'right', headerAlign: 'right',
      renderCell: (p) => {
        const isLow = p.row.stockStatus === 'Low Stock';
        const isOut = p.row.stockStatus === 'Out of Stock';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {(isLow || isOut) && <WarningIcon sx={{ fontSize: 14, color: isOut ? '#C62828' : '#E65100' }} />}
            <Typography sx={{
              fontSize: 14, fontWeight: 800,
              color: isOut ? '#C62828' : isLow ? '#E65100' : '#2E7D32',
            }}>
              {(p.value ?? 0).toLocaleString()}
            </Typography>
          </Box>
        );
      },
    },

    {
      field: 'damagedStock', headerName: 'Damaged', width: 90, type: 'number', align: 'right', headerAlign: 'right',
      renderCell: (p) => {
        const val = p.value ?? 0;
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: val > 0 ? '#C62828' : 'text.secondary' }}>
            {val > 0 ? val.toLocaleString() : '—'}
          </Typography>
        );
      },
    },

    {
      field: 'stockStatus', headerName: 'Status', width: 120,
      renderCell: (p) => {
        const c = STATUS_COLORS[p.value] || STATUS_COLORS['In Stock'];
        return (
          <Chip size="small" label={p.value}
            sx={{
              fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
              bgcolor: c.bg, color: c.color, border: `1px solid ${c.border}`,
            }} />
        );
      },
    },


    {
      field: 'actions', headerName: 'Action', width: 70, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <IconButton size="small" onClick={(e) => handleMenuOpen(e, p.row)}>
          <MoreIcon fontSize="small" />
        </IconButton>
      ),
    },
  ], []);

  const damagedGridColumns = useMemo(() => [
    { field: 'itemCode', headerName: 'Item Code', width: 120, renderCell: (p) => <Typography sx={{ fontFamily: '"Fira Code", monospace', fontWeight: 700, color: BLUE.main, fontSize: 13 }}>{p.value}</Typography> },
    { field: 'itemName', headerName: 'Item Name', flex: 1, minWidth: 200, renderCell: (p) => <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{p.value}</Typography> },
    { field: 'availableStock', headerName: 'Available Stock', width: 140, type: 'number', align: 'right', headerAlign: 'right', renderCell: (p) => <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#2E7D32' }}>{(p.value ?? 0).toLocaleString()}</Typography> },
    { field: 'damagedStock', headerName: 'Damaged Stock', width: 140, type: 'number', align: 'right', headerAlign: 'right', renderCell: (p) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', width: '100%' }}><DamagedIcon sx={{ fontSize: 16, color: '#C62828' }} /><Typography sx={{ fontSize: 14, fontWeight: 800, color: '#C62828' }}>{(p.value ?? 0).toLocaleString()}</Typography></Box> },
  ], []);

  /* ──────────── RENDER ──────────── */
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', p: 0 }}>

      {/* ── HEADER ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0D47A1', letterSpacing: -0.5 }}>
            Inventory Management
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDF}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#EF5350', color: '#C62828', '&:hover': { borderColor: '#C62828', bgcolor: '#FFEBEE' } }}>
            PDF
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<FileSpreadsheet size={16} />} 
            onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#E8F5E9' }, borderRadius: 2 }}
          >
            Export Excel
          </Button>
        </Stack>
      </Box>

      {/* ── DASHBOARD CARDS ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        <DashboardCard
          title="Total Available Stock" value={stats.total.toLocaleString()}
          subtitle={`${stats.items} unique items`}
          icon={<InventoryIcon />} gradient="linear-gradient(135deg, #1565C0, #1976D2)"
          bgLight="#E3F2FD"
        />
        <DashboardCard
          title="Low / Out of Stock" value={stats.low + stats.outOfStock}
          subtitle={`${stats.low} low · ${stats.outOfStock} out`}
          icon={<LowStockIcon />} gradient="linear-gradient(135deg, #E65100, #F57C00)"
          bgLight="#FFF3E0" valueColor="#E65100"
        />
        <DashboardCard
          title="Damaged Stock" value={stats.damaged}
          subtitle={`${stats.expired} expired items`}
          icon={<DamagedIcon />} gradient="linear-gradient(135deg, #C62828, #E53935)"
          bgLight="#FFEBEE" valueColor="#C62828"
          onClick={() => setDamagedGridOpen(true)}
        />
      </Box>

      {/* ── TABS ── */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #E0E0E0' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 48 },
            '& .Mui-selected': { color: BLUE.main },
            '& .MuiTabs-indicator': { bgcolor: BLUE.main, height: 3, borderRadius: '3px 3px 0 0' },
          }}>
          <Tab icon={<InventoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Inventory List" />
        </Tabs>
      </Paper>

      {/* ── TAB: INVENTORY LIST ── */}
      {activeTab === 0 && (
        <>
          {/* Filter Bar */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E0E0E0', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small" placeholder="Search item code, name, batch…" value={search}
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

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category" onChange={e => setCategoryFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                {categories.map((c, idx) => <MenuItem key={`cat-${c}-${idx}`} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="In Stock">In Stock</MenuItem>
                <MenuItem value="Low Stock">Low Stock</MenuItem>
                <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                <MenuItem value="Reserved">Reserved</MenuItem>
              </Select>
            </FormControl>
            {(search || warehouseFilter !== 'All' || categoryFilter !== 'All' || statusFilter !== 'All') && (
              <Button size="small" startIcon={<RefreshIcon />}
                onClick={() => { setSearch(''); setWarehouseFilter('All'); setCategoryFilter('All'); setStatusFilter('All'); }}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#C62828' }}>
                Clear Filters
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {filtered.length} of {inventory.length} records
            </Typography>
          </Paper>

          {/* DataGrid */}
          <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #E0E0E0', flex: 1, minHeight: 500 }}>
            <DataGrid
              rows={filtered}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[10, 25, 50]}
              getRowClassName={(params) => {
                if (params.row.stockStatus === 'Out of Stock') return 'row-out-of-stock';
                if (params.row.stockStatus === 'Low Stock') return 'row-low-stock';
                return '';
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#F5F8FF',
                  borderBottom: '2px solid #E0E0E0',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700, fontSize: 12, color: '#0D47A1',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                },
                '& .MuiDataGrid-row': {
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: '#F5F9FF' },
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #F0F0F0',
                  display: 'flex', alignItems: 'center',
                },
                '& .row-out-of-stock': { bgcolor: '#FFF5F5', '&:hover': { bgcolor: '#FFEBEE !important' } },
                '& .row-low-stock': { bgcolor: '#FFFCF0', '&:hover': { bgcolor: '#FFF8E1 !important' } },
                '& .MuiDataGrid-footerContainer': { borderTop: '2px solid #E0E0E0' },
                '& .MuiTablePagination-root': { color: 'text.secondary' },
              }}
            />
          </Paper>
        </>
      )}



      {/* ── ACTION MENU ── */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}>
        <MenuItem onClick={() => handleEdit(menuRow)}>
          <ListItemIcon><EditIcon fontSize="small" sx={{ color: BLUE.main }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}>Edit Record</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAdjustOpen(menuRow)}>
          <ListItemIcon><AdjustIcon fontSize="small" sx={{ color: '#6A1B9A' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}>Stock Adjustment</ListItemText>
        </MenuItem>
        <Divider />
        {menuRow?.approvalStatus === 'Pending' && (
          <React.Fragment key="approval-actions">
            <MenuItem onClick={() => handleApproval(menuRow, 'Approved')}>
              <ListItemIcon><ApproveIcon fontSize="small" sx={{ color: '#2E7D32' }} /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}>Approve</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleApproval(menuRow, 'Rejected')}>
              <ListItemIcon><RejectIcon fontSize="small" sx={{ color: '#C62828' }} /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}>Reject</ListItemText>
            </MenuItem>
            <Divider />
          </React.Fragment>
        )}
        <MenuItem onClick={() => handleDeleteClick(menuRow)}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#C62828' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: '#C62828' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* ── FORM DIALOG ── */}
      <InventoryFormDialog
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        editItem={editItem}
      />

      {/* ── STOCK ADJUSTMENT DIALOG ── */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: BLUE.dark, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdjustIcon sx={{ color: '#6A1B9A' }} />
          Stock Adjustment
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {adjustItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Paper sx={{ p: 2, bgcolor: '#F5F8FF', borderRadius: 2, border: '1px solid #E3F2FD' }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>ADJUSTING STOCK FOR</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: BLUE.dark, mt: 0.5 }}>
                  {adjustItem.itemCode} — {adjustItem.itemName}
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  Current Available: <strong style={{ color: '#2E7D32' }}>{adjustItem.availableStock}</strong> {adjustItem.uom}
                </Typography>
              </Paper>

              <FormControl fullWidth size="small">
                <InputLabel>Adjustment Type</InputLabel>
                <Select value={adjustType} label="Adjustment Type" onChange={e => setAdjustType(e.target.value)}>
                  <MenuItem value="inward">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InwardIcon sx={{ fontSize: 18, color: '#2E7D32' }} /> Stock Inward
                    </Box>
                  </MenuItem>
                  <MenuItem value="outward">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <OutwardIcon sx={{ fontSize: 18, color: '#C62828' }} /> Stock Outward
                    </Box>
                  </MenuItem>
                  <MenuItem value="damaged">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DamagedIcon sx={{ fontSize: 18, color: '#E65100' }} /> Damaged Stock
                    </Box>
                  </MenuItem>
                  <MenuItem value="expired">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon sx={{ fontSize: 18, color: '#F57F17' }} /> Expired Stock
                    </Box>
                  </MenuItem>
                  <MenuItem value="physical">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdjustIcon sx={{ fontSize: 18, color: '#6A1B9A' }} /> Physical Count Correction
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Quantity" type="number" size="small" fullWidth
                value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                InputProps={{ inputProps: { min: 0 } }}
              />

              <TextField
                label="Reason / Remarks" size="small" fullWidth multiline rows={2}
                value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                placeholder="Enter reason for stock adjustment..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAdjustOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleAdjustSubmit} disabled={!adjustQty || Number(adjustQty) <= 0}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#6A1B9A', '&:hover': { bgcolor: '#4A148C' } }}>
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DELETE CONFIRMATION ── */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#C62828', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> Delete Inventory Record
        </DialogTitle>
        <DialogContent>
          {deleteConfirm && (
            <Typography>
              Are you sure you want to delete <strong>{deleteConfirm.itemCode}</strong> — {deleteConfirm.itemName}?
              This action cannot be undone.
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

      {/* ── DAMAGED GRID DIALOG ── */}
      <Dialog open={damagedGridOpen} onClose={() => setDamagedGridOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#C62828', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DamagedIcon /> Damaged Stock Items
          </Box>
          <IconButton onClick={() => setDamagedGridOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0, height: 400 }}>
          <DataGrid
            rows={damagedItems}
            columns={damagedGridColumns}
            pageSize={10}
            rowsPerPageOptions={[10, 25]}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#F5F8FF', borderBottom: '2px solid #E0E0E0' },
              '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: 12, color: '#0D47A1', textTransform: 'uppercase' },
              '& .MuiDataGrid-row:hover': { bgcolor: '#F5F9FF' },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center' }
            }}
          />
        </DialogContent>
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

/* ──────────── DASHBOARD CARD COMPONENT ──────────── */
const DashboardCard = ({ title, value, subtitle, icon, gradient, bgLight, valueColor, onClick }) => (
  <Paper elevation={0} onClick={onClick} sx={{
    p: 2.5, borderRadius: 3, border: '1px solid #E0E0E0',
    display: 'flex', alignItems: 'center', gap: 2,
    transition: 'all 0.3s ease',
    cursor: onClick ? 'pointer' : 'default',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' },
  }}>
    <Avatar sx={{
      width: 52, height: 52, background: gradient,
      boxShadow: `0 4px 16px ${bgLight}`,
    }}>
      {React.cloneElement(icon, { sx: { fontSize: 26, color: '#FFF' } })}
    </Avatar>
    <Box>
      <Typography sx={{ fontSize: 26, fontWeight: 800, color: valueColor || '#0D47A1', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.2 }}>
        {subtitle}
      </Typography>
    </Box>
  </Paper>
);

export default InventoryMaster;

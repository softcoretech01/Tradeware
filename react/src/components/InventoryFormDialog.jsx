import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Button,
  TextField, MenuItem, FormControl, InputLabel, Select, Typography,
  Tabs, Tab, Divider, Switch, FormControlLabel, Chip, Paper,
  InputAdornment, Grid, IconButton, Avatar,
} from '@mui/material';
import {
  Save as SaveIcon, Close as CloseIcon,
  Inventory2 as InventoryIcon, LocalShipping as InwardIcon,
  CallMade as OutwardIcon, Science as BatchIcon,
  Settings as SettingsIcon, Info as InfoIcon,
} from '@mui/icons-material';
import { addInventory, updateInventory } from '../store/inventorySlice';

const BLUE = { main: '#1565C0', dark: '#0D47A1', bg: '#E3F2FD' };

const INITIAL_FORM = {
  itemCode: '',
  itemName: '',
  category: 'Aluminium',
  warehouse: 'Main Warehouse',
  batchNo: '',
  uom: 'PCS',
  openingStock: 0,
  inwardQty: 0,
  outwardQty: 0,
  availableStock: 0,
  reservedStock: 0,
  damagedStock: 0,
  expiredStock: 0,
  expiryDate: '',
  stockStatus: 'In Stock',
  costPrice: 0,
  sellingPrice: 0,
  minStock: 0,
  reorderLevel: 0,
  supplierName: '',
  poReference: '',
  customerPO: '',
  lastInwardType: 'Purchase Receipt',
  lastOutwardType: '',
  lotNo: '',
  serialNo: '',
  approvalStatus: 'Pending',
  active: true,
  notes: '',
};

const InventoryFormDialog = ({ open, onClose, onSave, editItem }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState({});

  const isEdit = Boolean(editItem);

  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({ ...INITIAL_FORM, ...editItem });
      } else {
        setForm(INITIAL_FORM);
      }
      setActiveTab(0);
      setErrors({});
    }
  }, [open, editItem]);

  // Auto-calculate available stock & status
  useEffect(() => {
    const avail = Math.max(0, form.openingStock + form.inwardQty - form.outwardQty - form.reservedStock - form.damagedStock - form.expiredStock);
    let status = 'In Stock';
    if (avail <= 0 && form.reservedStock > 0) status = 'Reserved';
    else if (avail <= 0) status = 'Out of Stock';
    else if (avail <= form.minStock) status = 'Low Stock';

    setForm(prev => ({ ...prev, availableStock: avail, stockStatus: status }));
  }, [form.openingStock, form.inwardQty, form.outwardQty, form.reservedStock, form.damagedStock, form.expiredStock, form.minStock]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) || 0 : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.itemCode.trim()) errs.itemCode = 'Item code is required';
    if (!form.itemName.trim()) errs.itemName = 'Item name is required';
    if (form.openingStock < 0) errs.openingStock = 'Cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (isEdit) {
      dispatch(updateInventory(form));
    } else {
      dispatch(addInventory(form));
    }
    onSave();
  };

  const tabs = [
    { label: 'Basic Info', icon: <InfoIcon sx={{ fontSize: 18 }} /> },
    { label: 'Stock Details', icon: <InventoryIcon sx={{ fontSize: 18 }} /> },
    { label: 'Inward / Outward', icon: <InwardIcon sx={{ fontSize: 18 }} /> },
    { label: 'Batch & Tracking', icon: <BatchIcon sx={{ fontSize: 18 }} /> },
    { label: 'Settings', icon: <SettingsIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        bgcolor: '#F5F8FF', borderBottom: '1px solid #E0E0E0', py: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: BLUE.main, width: 40, height: 40 }}>
            <InventoryIcon />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: BLUE.dark }}>
              {isEdit ? 'Edit Inventory Record' : 'Add New Inventory'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {isEdit ? `Editing ${editItem.itemCode} — ${editItem.itemName}` : 'Fill in the details to create a new inventory entry'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #E0E0E0' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable"
          sx={{
            px: 2, minHeight: 44,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 12, minHeight: 44, py: 1 },
            '& .Mui-selected': { color: BLUE.main },
            '& .MuiTabs-indicator': { bgcolor: BLUE.main, height: 2.5 },
          }}>
          {tabs.map((tab, i) => (
            <Tab key={i} icon={tab.icon} iconPosition="start" label={tab.label} />
          ))}
        </Tabs>
      </Box>

      <DialogContent sx={{ py: 3, px: 3, minHeight: 380 }}>

        {/* ─── TAB 0: BASIC INFO ─── */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <SectionTitle>Item Identification</SectionTitle>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Item Code *" value={form.itemCode}
                  onChange={handleChange('itemCode')} disabled={isEdit}
                  error={!!errors.itemCode} helperText={errors.itemCode}
                  placeholder="e.g. ITM-0001" />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth size="small" label="Item Name *" value={form.itemName}
                  onChange={handleChange('itemName')}
                  error={!!errors.itemName} helperText={errors.itemName}
                  placeholder="Enter item name" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select value={form.category} label="Category" onChange={handleChange('category')}>
                    {['Aluminium', 'Glass', 'Hardware', 'Rubber', 'Sealants', 'Paint', 'Accessories', 'Other'].map(c =>
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Warehouse</InputLabel>
                  <Select value={form.warehouse} label="Warehouse" onChange={handleChange('warehouse')}>
                    {['Main Warehouse', 'Secondary Warehouse', 'Cold Storage', 'Transit Warehouse'].map(w =>
                      <MenuItem key={w} value={w}>{w}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>UOM</InputLabel>
                  <Select value={form.uom} label="UOM" onChange={handleChange('uom')}>
                    {['PCS', 'SET', 'KGS', 'MTR', 'SQM', 'LTR', 'BOX', 'NOS'].map(u =>
                      <MenuItem key={u} value={u}>{u}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <SectionTitle>Pricing & Supplier</SectionTitle>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Cost Price (₹)" type="number"
                  value={form.costPrice} onChange={handleChange('costPrice')}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Selling Price (₹)" type="number"
                  value={form.sellingPrice} onChange={handleChange('sellingPrice')}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Supplier Name"
                  value={form.supplierName} onChange={handleChange('supplierName')}
                  placeholder="Supplier name" />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ─── TAB 1: STOCK DETAILS ─── */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Stock summary badges */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
              <StockBadge label="Available" value={form.availableStock} color="#2E7D32" bg="#E8F5E9" />
              <StockBadge label="Reserved" value={form.reservedStock} color="#1565C0" bg="#E3F2FD" />
              <StockBadge label="Damaged" value={form.damagedStock} color="#C62828" bg="#FFEBEE" />
              <StockBadge label="Status" value={form.stockStatus}
                color={
                  form.stockStatus === 'In Stock' ? '#2E7D32'
                    : form.stockStatus === 'Low Stock' ? '#E65100'
                      : form.stockStatus === 'Out of Stock' ? '#C62828' : '#1565C0'
                }
                bg={
                  form.stockStatus === 'In Stock' ? '#E8F5E9'
                    : form.stockStatus === 'Low Stock' ? '#FFF3E0'
                      : form.stockStatus === 'Out of Stock' ? '#FFEBEE' : '#E3F2FD'
                }
                isText
              />
            </Box>

            <SectionTitle>Quantities</SectionTitle>
            <Grid container spacing={2.5}>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Opening Stock" type="number"
                  value={form.openingStock} onChange={handleChange('openingStock')}
                  error={!!errors.openingStock} helperText={errors.openingStock}
                  InputProps={{ inputProps: { min: 0 } }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Inward Qty" type="number"
                  value={form.inwardQty} onChange={handleChange('inwardQty')}
                  InputProps={{ inputProps: { min: 0 } }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Outward Qty" type="number"
                  value={form.outwardQty} onChange={handleChange('outwardQty')}
                  InputProps={{ inputProps: { min: 0 } }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Available Stock" type="number"
                  value={form.availableStock} disabled
                  sx={{ '& .MuiInputBase-root': { bgcolor: '#F0FDF4' } }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Reserved Stock" type="number"
                  value={form.reservedStock} onChange={handleChange('reservedStock')}
                  InputProps={{ inputProps: { min: 0 } }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Damaged Stock" type="number"
                  value={form.damagedStock} onChange={handleChange('damagedStock')}
                  InputProps={{ inputProps: { min: 0 } }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Expired Stock" type="number"
                  value={form.expiredStock} onChange={handleChange('expiredStock')}
                  InputProps={{ inputProps: { min: 0 } }} />
              </Grid>
            </Grid>

            <SectionTitle>Reorder Settings</SectionTitle>
            <Grid container spacing={2.5}>
              <Grid item xs={6} sm={4}>
                <TextField fullWidth size="small" label="Min Stock Level" type="number"
                  value={form.minStock} onChange={handleChange('minStock')}
                  InputProps={{ inputProps: { min: 0 } }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField fullWidth size="small" label="Reorder Level" type="number"
                  value={form.reorderLevel} onChange={handleChange('reorderLevel')}
                  InputProps={{ inputProps: { min: 0 } }} />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ─── TAB 2: INWARD / OUTWARD ─── */}
        {activeTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <SectionTitle icon={<InwardIcon sx={{ color: '#2E7D32', fontSize: 18 }} />}>
              <Chip label="INWARD" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, fontSize: 11, mr: 1 }} />
              Stock Inward Details
            </SectionTitle>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Last Inward Type</InputLabel>
                  <Select value={form.lastInwardType} label="Last Inward Type" onChange={handleChange('lastInwardType')}>
                    {['Purchase Receipt', 'Import Receipt', 'Stock Transfer', 'Opening Stock', 'Sales Return'].map(t =>
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="PO Reference"
                  value={form.poReference} onChange={handleChange('poReference')}
                  placeholder="e.g. PO-2025-0042" />
              </Grid>
            </Grid>

            <Paper sx={{ p: 2, bgcolor: '#FAFFF9', border: '1px solid #C8E6C9', borderRadius: 2 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#2E7D32', mb: 1 }}>Supported Inward Types</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['Purchase Receipt', 'Import Receipt', 'Stock Transfer', 'Opening Stock', 'Sales Return'].map(t =>
                  <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 600, borderColor: '#A5D6A7', color: '#2E7D32' }} />
                )}
              </Box>
            </Paper>

            <Divider sx={{ my: 1 }} />

            <SectionTitle icon={<OutwardIcon sx={{ color: '#C62828', fontSize: 18 }} />}>
              <Chip label="OUTWARD" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700, fontSize: 11, mr: 1 }} />
              Stock Outward Details
            </SectionTitle>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Last Outward Type</InputLabel>
                  <Select value={form.lastOutwardType} label="Last Outward Type" onChange={handleChange('lastOutwardType')}>
                    <MenuItem value="">None</MenuItem>
                    {['Sales Delivery', 'Project Supply', 'Sample Issue', 'Stock Transfer', 'Damage Issue'].map(t =>
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Customer PO"
                  value={form.customerPO} onChange={handleChange('customerPO')}
                  placeholder="e.g. CPO-2025-115" />
              </Grid>
            </Grid>

            <Paper sx={{ p: 2, bgcolor: '#FFF8F8', border: '1px solid #FFCDD2', borderRadius: 2 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#C62828', mb: 1 }}>Supported Outward Types</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['Sales Delivery', 'Project Supply', 'Sample Issue', 'Stock Transfer', 'Damage Issue'].map(t =>
                  <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 600, borderColor: '#EF9A9A', color: '#C62828' }} />
                )}
              </Box>
            </Paper>
          </Box>
        )}

        {/* ─── TAB 3: BATCH & TRACKING ─── */}
        {activeTab === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <SectionTitle>Batch & Lot Information</SectionTitle>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Batch No."
                  value={form.batchNo} onChange={handleChange('batchNo')}
                  placeholder="e.g. B2025-001" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Lot No."
                  value={form.lotNo} onChange={handleChange('lotNo')}
                  placeholder="e.g. LOT-2025-A01" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Serial No."
                  value={form.serialNo} onChange={handleChange('serialNo')}
                  placeholder="e.g. SN-001" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Expiry Date" type="date"
                  value={form.expiryDate} onChange={handleChange('expiryDate')}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ─── TAB 4: SETTINGS ─── */}
        {activeTab === 4 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <SectionTitle>Status & Approval</SectionTitle>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Approval Status</InputLabel>
                  <Select value={form.approvalStatus} label="Approval Status" onChange={handleChange('approvalStatus')}>
                    {['Pending', 'Approved', 'Rejected'].map(s =>
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch checked={form.active}
                      onChange={(e) => setForm(prev => ({ ...prev, active: e.target.checked }))}
                      color="primary" />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Active Status</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Enable/Disable this inventory record</Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>

            <SectionTitle>Notes</SectionTitle>
            <TextField fullWidth size="small" label="Notes / Remarks" multiline rows={3}
              value={form.notes} onChange={handleChange('notes')}
              placeholder="Add any notes about this inventory item..." />
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FAFAFA', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeTab > 0 && (
            <Button onClick={() => setActiveTab(activeTab - 1)}
              sx={{ textTransform: 'none', fontWeight: 600 }}>
              ← Previous
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
            Cancel
          </Button>
          {activeTab < tabs.length - 1 ? (
            <Button variant="contained" onClick={() => setActiveTab(activeTab + 1)}
              sx={{ textTransform: 'none', fontWeight: 700, bgcolor: BLUE.main, '&:hover': { bgcolor: BLUE.dark } }}>
              Next →
            </Button>
          ) : (
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSubmit}
              sx={{
                textTransform: 'none', fontWeight: 700, px: 3,
                bgcolor: BLUE.main,
                boxShadow: '0 4px 14px rgba(21,101,192,0.3)',
                '&:hover': { bgcolor: BLUE.dark },
              }}>
              {isEdit ? 'Update Record' : 'Save Record'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

/* ──────────── HELPER COMPONENTS ──────────── */
const SectionTitle = ({ children, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {icon}
    <Typography sx={{
      fontSize: 13, fontWeight: 700, color: '#1565C0',
      textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      {children}
    </Typography>
  </Box>
);

const StockBadge = ({ label, value, color, bg, isText }) => (
  <Paper elevation={0} sx={{
    p: 1.5, textAlign: 'center', borderRadius: 2,
    border: `1px solid ${bg}`, bgcolor: bg,
  }}>
    <Typography sx={{ fontSize: isText ? 14 : 22, fontWeight: 800, color, lineHeight: 1.2 }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </Typography>
    <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </Typography>
  </Paper>
);

export default InventoryFormDialog;

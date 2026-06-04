import { FileSpreadsheet } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Paper, Typography, Button, IconButton, Chip, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Divider, FormControl, InputLabel, Select, MenuItem,
  Stack, Avatar
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Close as CloseIcon,
  RemoveCircle as DamagedIcon, ArrowBack as ArrowBackIcon,
  TableChart as ExcelIcon, Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adjustStock } from '../../store/inventorySlice';
import { exportToExcel } from '../../utils/exportUtil';

const BLUE = { main: '#1565C0', light: '#1976D2', dark: '#0D47A1', bg: '#E3F2FD' };

const DamagedStock = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { inventory } = useSelector(s => s.inventory);

  const [search, setSearch] = useState('');
  
  // Dialog State
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [damageQty, setDamageQty] = useState('');
  const [reason, setReason] = useState('');

  // Edit Dialog State
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editItemId, setEditItemId] = useState('');
  const [editQty, setEditQty] = useState('');
  
  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // Filter damaged items
  const damagedItems = useMemo(() => {
    let items = inventory.filter(i => i.damagedStock > 0);
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(row => 
        (row.itemCode || '').toLowerCase().includes(s) ||
        (row.itemName || '').toLowerCase().includes(s)
      );
    }
    return items;
  }, [inventory, search]);

  const selectedItemDetails = useMemo(() => {
    return inventory.find(i => i.id === selectedItemId);
  }, [inventory, selectedItemId]);

  const handleOpenForm = () => {
    setSelectedItemId('');
    setDamageQty('');
    setReason('');
    setFormOpen(true);
  };

  const handleSaveDamage = () => {
    if (!selectedItemId || !damageQty || Number(damageQty) <= 0) {
      showSnack('Please select an item and enter a valid quantity.', 'error');
      return;
    }
    
    if (Number(damageQty) > (selectedItemDetails?.availableStock || 0)) {
      showSnack('Damaged quantity cannot exceed available stock.', 'error');
      return;
    }

    dispatch(adjustStock({
      id: selectedItemId,
      adjustmentType: 'Damaged',
      quantity: Number(damageQty),
      reason: reason || 'Marked as damaged'
    }));

    showSnack('Damaged stock logged successfully');
    setFormOpen(false);
  };

  const handleOpenEdit = (row) => {
    setEditItemId(row.id);
    setEditQty(row.damagedStock);
    setEditFormOpen(true);
  };

  const handleSaveEdit = () => {
    const item = inventory.find(i => i.id === editItemId);
    const newQty = Number(editQty);
    
    if (newQty < 0) {
      showSnack('Quantity cannot be negative.', 'error');
      return;
    }
    
    // Difference between new damaged qty and current damaged qty
    const diff = newQty - item.damagedStock;
    
    if (diff > item.availableStock) {
      showSnack('Cannot increase damaged stock beyond available stock.', 'error');
      return;
    }

    dispatch(adjustStock({
      id: editItemId,
      adjustmentType: 'Damaged',
      quantity: diff,
      reason: 'Edited damaged stock'
    }));

    showSnack('Damaged stock updated successfully');
    setEditFormOpen(false);
  };

  const handleExportExcel = () => {
    const data = damagedItems.map(item => ({
      'Item Code': item.itemCode,
      'Item Name': item.itemName,
      'Available Stock': item.availableStock,
      'Damaged Stock': item.damagedStock
    }));
    exportToExcel(data, 'Damaged_Stock', 'Damaged Stock Report');
  };

  const columns = useMemo(() => [
    {
      field: 'itemCode', headerName: 'Item Code', width: 130,
      renderCell: (p) => (
        <Typography sx={{ fontFamily: '"Fira Code", monospace', fontWeight: 700, color: BLUE.main, fontSize: 13 }}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: 'itemName', headerName: 'Item Name', flex: 1, minWidth: 200,
      renderCell: (p) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{p.value}</Typography>
      ),
    },
    {
      field: 'availableStock', headerName: 'Available Stock', width: 140, type: 'number', align: 'right', headerAlign: 'right',
      renderCell: (p) => (
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#2E7D32' }}>
          {(p.value ?? 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'damagedStock', headerName: 'Damaged Stock', width: 140, type: 'number', align: 'right', headerAlign: 'right',
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
          <DamagedIcon sx={{ fontSize: 16, color: '#C62828' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#C62828' }}>
            {(p.value ?? 0).toLocaleString()}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions', headerName: 'Action', width: 80, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <IconButton size="small" onClick={() => handleOpenEdit(p.row)} sx={{ color: '#1565C0' }}>
          <EditIcon fontSize="small" />
        </IconButton>
      )
    }
  ], []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', p: 1 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => navigate('/inventory-management')} sx={{ bgcolor: '#F5F5F5', '&:hover': { bgcolor: '#E0E0E0' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0D47A1', letterSpacing: -0.5 }}>
              Damaged Stock Items
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            startIcon={<FileSpreadsheet size={16} />} 
            onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#E8F5E9' }, borderRadius: 2 }}
          >
            Export Excel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenForm}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' }, borderRadius: 2 }}
          >
            New
          </Button>
        </Stack>
      </Box>

      {/* FILTER BAR */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E0E0E0', display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search By" value={search}
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
          sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#FAFAFA' } }}
        />
        <Box sx={{ flex: 1 }} />
      </Paper>

      {/* DATAGRID */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #E0E0E0', flex: 1, minHeight: 400 }}>
        <DataGrid
          rows={damagedItems}
          columns={columns}
          pageSize={15}
          rowsPerPageOptions={[15, 30, 50]}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
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
            }
          }}
        />
      </Paper>

      {/* LOG DAMAGE DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#C62828', display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <DamagedIcon /> Log Damaged Stock
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <FormControl fullWidth size="small">
              <InputLabel>Select Item</InputLabel>
              <Select
                value={selectedItemId}
                label="Select Item"
                onChange={(e) => setSelectedItemId(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {inventory.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.itemCode} — {item.itemName} ({item.warehouse})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedItemDetails && (
              <Box sx={{ p: 1.5, bgcolor: '#F5F9FF', borderRadius: 2, border: '1px solid #90CAF9' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0D47A1' }}>
                  Current Available Stock: <span style={{ color: '#2E7D32', fontSize: '15px' }}>{selectedItemDetails.availableStock.toLocaleString()}</span>
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#C62828', mt: 0.5 }}>
                  Current Damaged Stock: <span style={{ fontSize: '15px' }}>{selectedItemDetails.damagedStock.toLocaleString()}</span>
                </Typography>
              </Box>
            )}

            <TextField
              label="Damaged Quantity"
              type="number"
              size="small"
              fullWidth
              value={damageQty}
              onChange={(e) => setDamageQty(e.target.value)}
              disabled={!selectedItemId}
              InputProps={{ inputProps: { min: 1, max: selectedItemDetails?.availableStock || 0 } }}
            />

            <TextField
              label="Reason / Remarks"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Damaged during transit"
              disabled={!selectedItemId}
            />

          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveDamage} 
            disabled={!selectedItemId || !damageQty || Number(damageQty) <= 0}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT DAMAGE DIALOG */}
      <Dialog open={editFormOpen} onClose={() => setEditFormOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0D47A1', pb: 1 }}>
          Edit Damaged Quantity
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Total Damaged Quantity"
            type="number"
            size="small"
            fullWidth
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditFormOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEdit} 
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0A3375' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

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

export default DamagedStock;

import React from 'react';
import { 
  Box, 
  TextField, 
  MenuItem, 
  Button, 
  Stack, 
  InputAdornment 
} from '@mui/material';
import { Search, Download, Printer, RotateCcw } from 'lucide-react';

const FilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusChange, 
  statuses = [], 
  startDate, 
  onStartDateChange, 
  endDate, 
  onEndDateChange,
  onReset,
  onExport,
  onPrint
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 2, 
        backgroundColor: '#ffffff', 
        p: '16px 20px', 
        borderRadius: '8px', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      }}
    >
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ flexGrow: 1, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#64748b" />
              </InputAdornment>
            ),
          }}
          sx={{ 
            minWidth: '240px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              '&:hover fieldset': {
                borderColor: '#cbd5e1',
              },
            }
          }}
        />

        {statuses.length > 0 && (
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            sx={{ 
              minWidth: '150px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: '#ffffff',
              }
            }}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          size="small"
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />

        <TextField
          size="small"
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />

        {(searchTerm || (statusFilter && statusFilter !== 'All') || startDate || endDate) && (
          <Button 
            variant="text" 
            color="secondary" 
            onClick={onReset}
            startIcon={<RotateCcw size={16} />}
            sx={{ fontWeight: 600, fontSize: '13px', textTransform: 'none' }}
          >
            Reset
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={1.5}>
        {onExport && (
          <Button
            variant="outlined"
            onClick={onExport}
            startIcon={<Download size={16} />}
            sx={{ 
              borderColor: '#e2e8f0', 
              color: '#1e293b', 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                borderColor: '#cbd5e1'
              }
            }}
          >
            Export
          </Button>
        )}

        {onPrint && (
          <Button
            variant="outlined"
            onClick={onPrint}
            startIcon={<Printer size={16} />}
            sx={{ 
              borderColor: '#e2e8f0', 
              color: '#1e293b', 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                borderColor: '#cbd5e1'
              }
            }}
          >
            Print
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default FilterBar;

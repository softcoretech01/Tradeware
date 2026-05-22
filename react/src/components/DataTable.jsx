import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip
} from '@mui/material';
import { Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

// Helper to resolve nested object values (e.g., 'customer.name')
const getCellValue = (row, id) => {
  if (!id) return '';
  return id.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : '', row);
};

const DataTable = ({
  columns,
  rows = [],
  title = 'Report',
  actions = true,
  onRowClick,
  customActions,
  detailTitle = 'Row Details',
  renderDetails
}) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Reset details state when columns change (e.g. switching tabs)
  React.useEffect(() => {
    setSelectedRow(null);
    setDetailsOpen(false);
  }, [columns]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (row) => {
    setSelectedRow(row);
    setDetailsOpen(true);
  };

  // Sorting logic
  const descendingComparator = (a, b, orderBy) => {
    let valA = getCellValue(a, orderBy);
    let valB = getCellValue(b, orderBy);

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valB < valA) return -1;
    if (valB > valA) return 1;
    return 0;
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const sortedRows = orderBy
    ? stableSort(rows, getComparator(order, orderBy))
    : rows;

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Status badging helper
  const renderStatus = (val) => {
    if (!val) return '';
    const cleanVal = String(val).toLowerCase();
    let color = 'default';
    if (cleanVal.includes('pending') || cleanVal.includes('alert') || cleanVal.includes('low') || cleanVal.includes('slow')) {
      color = 'warning';
    } else if (cleanVal.includes('completed') || cleanVal.includes('active') || cleanVal.includes('fast') || cleanVal.includes('profitable')) {
      color = 'success';
    } else if (cleanVal.includes('delayed') || cleanVal.includes('overdue') || cleanVal.includes('critical')) {
      color = 'error';
    } else if (cleanVal.includes('received') || cleanVal.includes('shipped') || cleanVal.includes('inward')) {
      color = 'primary';
    }
    return <Chip label={val} color={color} size="small" variant="light" sx={{ fontWeight: 600, fontSize: '12px' }} />;
  };

  return (
    <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: 'none' }}>
      <Table sx={{ minWidth: 650 }} aria-label={title}>
        <TableHead sx={{ backgroundColor: '#f8fafc' }}>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.numeric ? 'right' : 'left'}
                sortDirection={orderBy === column.id ? order : false}
                sx={{
                  fontWeight: 600,
                  color: '#64748b',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  py: 1.5,
                  borderBottom: '1px solid #e2e8f0'
                }}
              >
                {column.sortable !== false ? (
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
            {actions && (
              <TableCell
                align="right"
                sx={{
                  fontWeight: 600,
                  color: '#64748b',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  py: 1.5,
                  borderBottom: '1px solid #e2e8f0',
                  width: '80px'
                }}
              >
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedRows.length > 0 ? (
            paginatedRows.map((row, index) => (
              <TableRow
                hover
                key={row.id || index}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                sx={{
                  '&:last-child td': { borderBottom: 0 },
                  '&:hover': { backgroundColor: '#f1f5f9' },
                  transition: 'background-color 0.2s'
                }}
              >
                {columns.map((column) => {
                  const cellValue = getCellValue(row, column.id);
                  return (
                    <TableCell
                      key={column.id}
                      align={column.numeric ? 'right' : 'left'}
                      sx={{
                        color: '#1e293b',
                        fontSize: '14px',
                        py: 1.75,
                        borderBottom: '1px solid #e2e8f0',
                        fontWeight: column.bold ? 600 : 400
                      }}
                    >
                      {column.renderCell ? (
                        column.renderCell(row)
                      ) : column.isStatus ? (
                        renderStatus(cellValue)
                      ) : (
                        cellValue
                      )}
                    </TableCell>
                  );
                })}
                {actions && (
                  <TableCell align="right" sx={{ py: 1.75, borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(row);
                          }}
                          sx={{
                            color: '#3b82f6',
                            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' }
                          }}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      {customActions && customActions(row)}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 6, color: '#64748b', fontStyle: 'italic' }}>
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: '1px solid #e2e8f0',
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            fontSize: '13px',
            color: '#64748b'
          }
        }}
      />

      {/* Row details popup */}
      <Dialog
        open={detailsOpen}
        onClose={() => { setDetailsOpen(false); setSelectedRow(null); }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a', fontSize: '18px', borderBottom: '1px solid #e2e8f0', pb: 2 }}>
          {detailTitle}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {detailsOpen && selectedRow && (
            renderDetails ? (
              renderDetails(selectedRow)
            ) : (
              <Grid container spacing={2}>
                {columns.map((col) => (
                  <Grid item xs={12} sm={6} key={col.id}>
                    <Box sx={{ borderBottom: '1px dashed #e2e8f0', pb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px' }}>
                        {col.label}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500, mt: 0.5 }}>
                        {col.renderCell ? col.renderCell(selectedRow) : String(getCellValue(selectedRow, col.id) ?? '')}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e2e8f0', pt: 2, px: 3 }}>
          <Button
            onClick={() => { setDetailsOpen(false); setSelectedRow(null); }}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: '#1e40af',
              color: '#ffffff',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#3b82f6' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
};

// Excel Export Utility
export const exportTableToExcel = (rows, columns, filename = 'report') => {
  // Format rows for excel (just key-value pairs of label: cellValue)
  const excelData = rows.map((row) => {
    const formattedRow = {};
    columns.forEach((col) => {
      // If a custom render exists, we check if we can stringify it, else just fetch raw value
      let value = getCellValue(row, col.id);
      formattedRow[col.label] = value !== null && value !== undefined ? value : '';
    });
    return formattedRow;
  });

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Print Utility
export const printTable = (rows, columns, title = 'ERP Report') => {
  const printWindow = window.open('', '_blank');
  
  const headersHtml = columns.map(col => `<th style="text-align: left; padding: 8px; border-bottom: 2px solid #000;">${col.label}</th>`).join('');
  
  const rowsHtml = rows.map(row => {
    const cellsHtml = columns.map(col => {
      const cellVal = getCellValue(row, col.id);
      return `<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${cellVal !== null && cellVal !== undefined ? cellVal : ''}</td>`;
    }).join('');
    return `<tr>${cellsHtml}</tr>`;
  }).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 20px; }
          h2 { color: #0f172a; margin-bottom: 5px; }
          .timestamp { font-size: 12px; color: #64748b; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-transform: uppercase; font-size: 11px; color: #475569; }
          td { font-size: 13px; color: #1e293b; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
        <table>
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export default DataTable;
export { getCellValue };

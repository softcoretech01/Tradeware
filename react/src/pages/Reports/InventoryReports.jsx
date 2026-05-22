import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import DataTable, { exportTableToExcel, printTable } from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import {
  currentStockData,
  batchWiseStockData,
  agingStockData,
  fastMovingItemsData,
  slowMovingItemsData,
  reorderReportData
} from '../../utils/mockReportsData';

const InventoryReports = () => {
  const [tabIndex, setTabIndex] = useState(0);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    handleResetFilters();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  // Define columns for each report
  const currentStockColumns = [
    { id: 'itemCode', label: 'Item Code', bold: true },
    { id: 'itemName', label: 'Item Name' },
    { id: 'category', label: 'Category' },
    { id: 'inwardQty', label: 'Inward Qty', numeric: true },
    { id: 'outwardQty', label: 'Outward Qty', numeric: true },
    { id: 'currentStock', label: 'Current Stock', numeric: true, bold: true },
    { id: 'reorderLevel', label: 'Reorder Level', numeric: true },
    { id: 'status', label: 'Status', isStatus: true }
  ];

  const batchWiseColumns = [
    { id: 'itemCode', label: 'Item Code', bold: true },
    { id: 'batchNo', label: 'Batch No' },
    { id: 'expiryDate', label: 'Expiry Date' },
    { id: 'inwardQty', label: 'Inward Qty', numeric: true },
    { id: 'outwardQty', label: 'Outward Qty', numeric: true },
    { id: 'stockQty', label: 'Stock Qty', numeric: true, bold: true },
    { id: 'location', label: 'Location' }
  ];

  const agingColumns = [
    { id: 'itemCode', label: 'Item Code', bold: true },
    { id: 'itemName', label: 'Item Name' },
    { id: 'batchNo', label: 'Batch No' },
    { id: 'receivedDate', label: 'Received Date' },
    { id: 'agingDays', label: 'Aging Days', numeric: true, bold: true },
    { id: 'stockQty', label: 'Stock Qty', numeric: true },
    { id: 'value', label: 'Value ($)', numeric: true, renderCell: (row) => `$${(row.value ?? 0).toLocaleString()}` }
  ];

  const fastMovingColumns = [
    { id: 'itemCode', label: 'Item Code', bold: true },
    { id: 'itemName', label: 'Item Name' },
    { id: 'salesQty', label: 'Sales Qty', numeric: true, bold: true },
    { id: 'turnoverRate', label: 'Turnover Rate' },
    { id: 'profitContribution', label: 'Profit Contribution ($)', numeric: true, renderCell: (row) => `$${(row.profitContribution ?? 0).toLocaleString()}` }
  ];

  const slowMovingColumns = [
    { id: 'itemCode', label: 'Item Code', bold: true },
    { id: 'itemName', label: 'Item Name' },
    { id: 'stockQty', label: 'Stock Qty', numeric: true, bold: true },
    { id: 'lastSoldDate', label: 'Last Sold Date' },
    { id: 'idleDays', label: 'Idle Days', numeric: true, bold: true },
    { id: 'value', label: 'Value ($)', numeric: true, renderCell: (row) => `$${(row.value ?? 0).toLocaleString()}` }
  ];

  const reorderColumns = [
    { id: 'itemCode', label: 'Item Code', bold: true },
    { id: 'itemName', label: 'Item Name' },
    { id: 'currentStock', label: 'Current Stock', numeric: true, bold: true },
    { id: 'reorderLevel', label: 'Reorder Level', numeric: true },
    { id: 'suggestedReorderQty', label: 'Suggested Reorder Qty', numeric: true },
    { id: 'supplier', label: 'Supplier' }
  ];

  // Map reports to tabs
  const reports = [
    {
      name: 'Current Stock',
      data: currentStockData,
      columns: currentStockColumns,
      statuses: ['Active', 'Low Stock Alert']
    },
    {
      name: 'Batch-wise Stock',
      data: batchWiseStockData,
      columns: batchWiseColumns,
      statuses: []
    },
    {
      name: 'Aging Stock',
      data: agingStockData,
      columns: agingColumns,
      statuses: []
    },
    {
      name: 'Fast Moving Items',
      data: fastMovingItemsData,
      columns: fastMovingColumns,
      statuses: []
    },
    {
      name: 'Slow Moving Items',
      data: slowMovingItemsData,
      columns: slowMovingColumns,
      statuses: []
    },
    {
      name: 'Reorder Report',
      data: reorderReportData,
      columns: reorderColumns,
      statuses: []
    }
  ];

  const currentReport = reports[tabIndex];

  // Client-side filtering logic mimicking SQL queries
  const getFilteredData = () => {
    let filtered = [...currentReport.data];

    // Search query filter ( itemName, itemCode, category )
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(row => 
        (row.itemName && row.itemName.toLowerCase().includes(q)) ||
        (row.itemCode && row.itemCode.toLowerCase().includes(q)) ||
        (row.category && row.category.toLowerCase().includes(q)) ||
        (row.location && row.location.toLowerCase().includes(q)) ||
        (row.supplier && row.supplier.toLowerCase().includes(q)) ||
        (row.batchNo && row.batchNo.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter(row => row.status === statusFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(row => {
        const dateVal = row.expiryDate || row.receivedDate || row.lastSoldDate;
        return dateVal ? dateVal >= startDate : true;
      });
    }
    if (endDate) {
      filtered = filtered.filter(row => {
        const dateVal = row.expiryDate || row.receivedDate || row.lastSoldDate;
        return dateVal ? dateVal <= endDate : true;
      });
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  const handleExport = () => {
    exportTableToExcel(filteredData, currentReport.columns, currentReport.name.replace(/\s+/g, '_'));
  };

  const handlePrint = () => {
    printTable(filteredData, currentReport.columns, currentReport.name);
  };

  return (
    <Box className="fade-in" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box className="module-header">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Inventory Reports
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Real-time insights on warehouse stock levels, batch distributions, and items velocity metrics.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: 'none' }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid #e2e8f0',
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              py: 2,
              minWidth: 'auto',
              mr: 3,
              color: '#64748b',
              '&.Mui-selected': {
                color: '#1e40af',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1e40af',
              height: '3px',
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          {reports.map((report, idx) => (
            <Tab key={idx} label={report.name} />
          ))}
        </Tabs>
      </Paper>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statuses={currentReport.statuses}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onReset={handleResetFilters}
        onExport={handleExport}
        onPrint={handlePrint}
      />

      <DataTable 
        columns={currentReport.columns} 
        rows={filteredData} 
        title={currentReport.name}
        detailTitle={`${currentReport.name} - Detailed View`}
      />
    </Box>
  );
};

export default InventoryReports;
export { InventoryReports };

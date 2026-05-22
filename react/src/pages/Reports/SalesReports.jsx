import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import DataTable, { exportTableToExcel, printTable } from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import {
  customerWiseSalesData,
  builderWiseSalesData,
  projectWiseSalesData,
  itemWiseProfitabilityData,
  pendingCustomerOrdersData
} from '../../utils/mockReportsData';

const SalesReports = () => {
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
  const customerWiseColumns = [
    { id: 'customerName', label: 'Customer Name', bold: true },
    { id: 'totalOrders', label: 'Total Orders', numeric: true },
    { id: 'salesVolume', label: 'Sales Volume', numeric: true },
    { id: 'totalRevenue', label: 'Total Revenue ($)', numeric: true, renderCell: (row) => `$${(row.totalRevenue ?? 0).toLocaleString()}` },
    { id: 'avgOrderValue', label: 'Avg Order Value ($)', numeric: true, renderCell: (row) => `$${(row.avgOrderValue ?? 0).toLocaleString()}` }
  ];

  const builderWiseColumns = [
    { id: 'builderName', label: 'Builder Name', bold: true },
    { id: 'projects', label: 'Projects Count', numeric: true },
    { id: 'totalSales', label: 'Total Sales ($)', numeric: true, renderCell: (row) => `$${(row.totalSales ?? 0).toLocaleString()}` },
    { id: 'pendingPayments', label: 'Pending Payments ($)', numeric: true, renderCell: (row) => `$${(row.pendingPayments ?? 0).toLocaleString()}` },
    { id: 'commissionPaid', label: 'Commission Paid ($)', numeric: true, renderCell: (row) => `$${(row.commissionPaid ?? 0).toLocaleString()}` }
  ];

  const projectWiseColumns = [
    { id: 'projectName', label: 'Project Name', bold: true },
    { id: 'location', label: 'Location' },
    { id: 'totalSales', label: 'Total Sales ($)', numeric: true, renderCell: (row) => `$${(row.totalSales ?? 0).toLocaleString()}` },
    { id: 'deliveredQty', label: 'Delivered Qty', numeric: true },
    { id: 'projectStatus', label: 'Status', isStatus: true }
  ];

  const profitabilityColumns = [
    { id: 'itemName', label: 'Item Name', bold: true },
    { id: 'landedCost', label: 'Landed Cost ($)', numeric: true, renderCell: (row) => `$${(row.landedCost ?? 0).toFixed(2)}` },
    { id: 'sellingPrice', label: 'Selling Price ($)', numeric: true, renderCell: (row) => `$${(row.sellingPrice ?? 0).toFixed(2)}` },
    { id: 'profit', label: 'Profit/Unit ($)', numeric: true, bold: true, renderCell: (row) => `$${(row.profit ?? 0).toFixed(2)}` },
    { id: 'marginPercent', label: 'Margin (%)', numeric: true, renderCell: (row) => `${(row.marginPercent ?? 0)}%` },
    { id: 'salesQty', label: 'Sales Qty', numeric: true },
    { id: 'totalProfit', label: 'Total Profit ($)', numeric: true, bold: true, renderCell: (row) => `$${(row.totalProfit ?? 0).toLocaleString()}` }
  ];

  const pendingOrdersColumns = [
    { id: 'orderNo', label: 'Order No', bold: true },
    { id: 'date', label: 'Order Date' },
    { id: 'customer', label: 'Customer' },
    { id: 'orderedQty', label: 'Ordered Qty', numeric: true },
    { id: 'deliveredQty', label: 'Delivered Qty', numeric: true },
    { id: 'pendingQty', label: 'Pending Qty', numeric: true, bold: true },
    { id: 'status', label: 'Status', isStatus: true }
  ];

  // Map reports to tabs
  const reports = [
    {
      name: 'Customer-wise Sales',
      data: customerWiseSalesData,
      columns: customerWiseColumns,
      statuses: []
    },
    {
      name: 'Builder-wise Sales',
      data: builderWiseSalesData,
      columns: builderWiseColumns,
      statuses: []
    },
    {
      name: 'Project-wise Sales',
      data: projectWiseSalesData,
      columns: projectWiseColumns,
      statuses: ['Active', 'Completed']
    },
    {
      name: 'Item profitability',
      data: itemWiseProfitabilityData,
      columns: profitabilityColumns,
      statuses: []
    },
    {
      name: 'Pending Orders',
      data: pendingCustomerOrdersData,
      columns: pendingOrdersColumns,
      statuses: ['Pending Delivery', 'Completed']
    }
  ];

  const currentReport = reports[tabIndex];

  // Client-side filtering logic mimicking SQL queries
  const getFilteredData = () => {
    let filtered = [...currentReport.data];

    // Search query filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(row => 
        (row.customerName && row.customerName.toLowerCase().includes(q)) ||
        (row.customer && row.customer.toLowerCase().includes(q)) ||
        (row.builderName && row.builderName.toLowerCase().includes(q)) ||
        (row.projectName && row.projectName.toLowerCase().includes(q)) ||
        (row.itemName && row.itemName.toLowerCase().includes(q)) ||
        (row.orderNo && row.orderNo.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter(row => (row.projectStatus || row.status) === statusFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(row => {
        const dateVal = row.date;
        return dateVal ? dateVal >= startDate : true;
      });
    }
    if (endDate) {
      filtered = filtered.filter(row => {
        const dateVal = row.date;
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
            Sales Reports
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Analyze builder, customer, and project sales, monitor overall product profitability, and track pending customer orders.
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

export default SalesReports;
export { SalesReports };

import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import DataTable, { exportTableToExcel, printTable } from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import {
  pendingPOData,
  grnData,
  supplierPerformanceData
} from '../../utils/mockReportsData';

const PurchaseReports = () => {
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
  const pendingPOColumns = [
    { id: 'poNo', label: 'PO No', bold: true },
    { id: 'date', label: 'Order Date' },
    { id: 'supplier', label: 'Supplier' },
    { id: 'orderedQty', label: 'Ordered Qty', numeric: true },
    { id: 'deliveredQty', label: 'Delivered Qty', numeric: true },
    { id: 'pendingQty', label: 'Pending Qty', numeric: true, bold: true },
    { id: 'expectedDelivery', label: 'Expected Delivery' }
  ];

  const grnColumns = [
    { id: 'grnNo', label: 'GRN No', bold: true },
    { id: 'grnDate', label: 'GRN Date' },
    { id: 'poNo', label: 'PO No' },
    { id: 'supplier', label: 'Supplier' },
    { id: 'receivedQty', label: 'Received Qty', numeric: true },
    { id: 'acceptedQty', label: 'Accepted Qty', numeric: true, bold: true },
    { id: 'rejectedQty', label: 'Rejected Qty', numeric: true },
    { id: 'status', label: 'Status', isStatus: true }
  ];

  const supplierPerformanceColumns = [
    { id: 'supplierName', label: 'Supplier Name', bold: true },
    { id: 'onTimeDelivery', label: 'On-Time Delivery (%)', numeric: true, renderCell: (row) => `${(row.onTimeDelivery ?? 0)}%` },
    { id: 'qualityRating', label: 'Quality Rating', numeric: true, renderCell: (row) => `${(row.qualityRating ?? 0)} / 5.0` },
    { id: 'returnRate', label: 'Return Rate (%)', numeric: true, renderCell: (row) => `${(row.returnRate ?? 0)}%` },
    { id: 'leadTime', label: 'Lead Time (Days)', numeric: true }
  ];

  // Map reports to tabs
  const reports = [
    {
      name: 'Pending PO Report',
      data: pendingPOData,
      columns: pendingPOColumns,
      statuses: []
    },
    {
      name: 'GRN Report',
      data: grnData,
      columns: grnColumns,
      statuses: ['Received', 'Completed']
    },
    {
      name: 'Supplier Performance',
      data: supplierPerformanceData,
      columns: supplierPerformanceColumns,
      statuses: []
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
        (row.supplier && row.supplier.toLowerCase().includes(q)) ||
        (row.supplierName && row.supplierName.toLowerCase().includes(q)) ||
        (row.poNo && row.poNo.toLowerCase().includes(q)) ||
        (row.grnNo && row.grnNo.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter(row => row.status === statusFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(row => {
        const dateVal = row.date || row.grnDate;
        return dateVal ? dateVal >= startDate : true;
      });
    }
    if (endDate) {
      filtered = filtered.filter(row => {
        const dateVal = row.date || row.grnDate;
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
            Purchase Reports
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Monitor outstanding purchase orders, goods receipt notes (GRN) and evaluate supplier performance ratings.
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

export default PurchaseReports;
export { PurchaseReports };

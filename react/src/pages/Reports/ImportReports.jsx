import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import DataTable, { exportTableToExcel, printTable } from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import {
  shipmentCostAnalysisData,
  landedCostReportData,
  importBatchProfitabilityData
} from '../../utils/mockReportsData';

const ImportReports = () => {
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
  const shipmentCostColumns = [
    { id: 'shipmentNo', label: 'Shipment No', bold: true },
    { id: 'description', label: 'Description' },
    { id: 'customDuty', label: 'Custom Duty ($)', numeric: true, renderCell: (row) => `$${(row.customDuty ?? 0).toLocaleString()}` },
    { id: 'freight', label: 'Freight ($)', numeric: true, renderCell: (row) => `$${(row.freight ?? 0).toLocaleString()}` },
    { id: 'insurance', label: 'Insurance ($)', numeric: true, renderCell: (row) => `$${(row.insurance ?? 0).toLocaleString()}` },
    { id: 'handling', label: 'Handling Charges ($)', numeric: true, renderCell: (row) => `$${(row.handling ?? 0).toLocaleString()}` },
    { id: 'totalImportCost', label: 'Total Import Cost ($)', numeric: true, bold: true, renderCell: (row) => `$${(row.totalImportCost ?? 0).toLocaleString()}` }
  ];

  const landedCostColumns = [
    { id: 'itemName', label: 'Item Name', bold: true },
    { id: 'importBatch', label: 'Import Batch' },
    { id: 'purchaseCost', label: 'Purchase Cost ($)', numeric: true, renderCell: (row) => `$${(row.purchaseCost ?? 0).toFixed(2)}` },
    { id: 'shareExpenses', label: 'Allocated Expenses ($)', numeric: true, renderCell: (row) => `$${(row.shareExpenses ?? 0).toFixed(2)}` },
    { id: 'landedCost', label: 'Landed Cost ($)', numeric: true, bold: true, renderCell: (row) => `$${(row.landedCost ?? 0).toFixed(2)}` }
  ];

  const profitabilityColumns = [
    { id: 'batchNo', label: 'Batch No', bold: true },
    { id: 'landedCost', label: 'Landed Cost ($)', numeric: true, renderCell: (row) => `$${(row.landedCost ?? 0).toFixed(2)}` },
    { id: 'sellingPrice', label: 'Selling Price ($)', numeric: true, renderCell: (row) => `$${(row.sellingPrice ?? 0).toFixed(2)}` },
    { id: 'profit', label: 'Profit/Unit ($)', numeric: true, renderCell: (row) => `$${(row.profit ?? 0).toFixed(2)}` },
    { id: 'marginPercent', label: 'Margin (%)', numeric: true, renderCell: (row) => `${(row.marginPercent ?? 0)}%` },
    { id: 'quantity', label: 'Quantity Imported', numeric: true },
    { id: 'totalProfit', label: 'Total Profit ($)', numeric: true, bold: true, renderCell: (row) => `$${(row.totalProfit ?? 0).toLocaleString()}` }
  ];

  // Map reports to tabs
  const reports = [
    {
      name: 'Shipment Cost Analysis',
      data: shipmentCostAnalysisData,
      columns: shipmentCostColumns,
      statuses: []
    },
    {
      name: 'Landed Cost Report',
      data: landedCostReportData,
      columns: landedCostColumns,
      statuses: []
    },
    {
      name: 'Import Batch Profitability',
      data: importBatchProfitabilityData,
      columns: profitabilityColumns,
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
        (row.shipmentNo && row.shipmentNo.toLowerCase().includes(q)) ||
        (row.description && row.description.toLowerCase().includes(q)) ||
        (row.itemName && row.itemName.toLowerCase().includes(q)) ||
        (row.importBatch && row.importBatch.toLowerCase().includes(q)) ||
        (row.batchNo && row.batchNo.toLowerCase().includes(q))
      );
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
            Import Reports
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Track total shipment expenses, allocate landed costs to imported items, and calculate batch margins.
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

export default ImportReports;
export { ImportReports };

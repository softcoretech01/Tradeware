import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Card, CardContent, Grid, Typography, Box, Alert, AlertTitle,
  LinearProgress, Chip, Button, FormControl, Select, MenuItem, Tooltip
} from '@mui/material';
import {
  Calendar, Clock, ShieldAlert, FileSpreadsheet, FileText, Search,
  BarChart2, Info
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const GREEN = { main: '#15803D', light: '#22C55E', bg: '#DCFCE7' };
const RED = { main: '#B91C1C', light: '#EF4444', bg: '#FEE2E2' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

const BatchAgingAnalysis = () => {
  const batches = useSelector(state => state.batchImport.batches);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [agingFilter, setAgingFilter] = useState('All'); // All, 0-30, 31-60, 61-90, 91+
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Stable Anchor Date for Calculations
  const ANCHOR_DATE = useMemo(() => new Date('2026-05-21'), []);

  // Compute aging details for each batch
  const batchAgingDetails = useMemo(() => {
    return batches.map(batch => {
      const mfg = new Date(batch.mfgDate);
      const exp = new Date(batch.expiryDate);
      
      // Calculate age (days since manufacturing)
      const ageDiff = ANCHOR_DATE - mfg;
      const ageDays = Math.max(0, Math.floor(ageDiff / (1000 * 60 * 60 * 24)));
      
      // Calculate days to expiry
      const expDiff = exp - ANCHOR_DATE;
      const daysToExpiry = Math.floor(expDiff / (1000 * 60 * 60 * 24));

      let ageBucket = '91+ Days';
      if (ageDays <= 30) ageBucket = '0-30 Days';
      else if (ageDays <= 60) ageBucket = '31-60 Days';
      else if (ageDays <= 90) ageBucket = '61-90 Days';

      return {
        ...batch,
        ageDays,
        daysToExpiry,
        ageBucket
      };
    });
  }, [batches, ANCHOR_DATE]);

  // Aggregate stats
  const statistics = useMemo(() => {
    let totalQty = 0;
    let b1 = 0; // 0-30
    let b2 = 0; // 31-60
    let b3 = 0; // 61-90
    let b4 = 0; // 91+
    
    const nearExpiry = [];

    batchAgingDetails.forEach(b => {
      totalQty += b.qty;
      if (b.ageBucket === '0-30 Days') b1 += b.qty;
      else if (b.ageBucket === '31-60 Days') b2 += b.qty;
      else if (b.ageBucket === '61-90 Days') b3 += b.qty;
      else b4 += b.qty;

      // Expiry danger tracking (less than 60 days to expiry, and not already expired/quarantined)
      if (b.daysToExpiry <= 60 && b.status === 'Available' && b.qty > 0) {
        nearExpiry.push(b);
      }
    });

    return {
      totalQty,
      buckets: {
        '0-30 Days': { qty: b1, percent: totalQty ? (b1 / totalQty) * 100 : 0 },
        '31-60 Days': { qty: b2, percent: totalQty ? (b2 / totalQty) * 100 : 0 },
        '61-90 Days': { qty: b3, percent: totalQty ? (b3 / totalQty) * 100 : 0 },
        '91+ Days': { qty: b4, percent: totalQty ? (b4 / totalQty) * 100 : 0 }
      },
      nearExpiry
    };
  }, [batchAgingDetails]);

  // Filtering
  const filteredBatches = useMemo(() => {
    return batchAgingDetails.filter(b => {
      const matchSearch = 
        b.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchAging = agingFilter === 'All' || b.ageBucket === agingFilter;

      return matchSearch && matchAging;
    });
  }, [batchAgingDetails, searchTerm, agingFilter]);

  // Pagination
  const paginatedBatches = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBatches.slice(startIndex, startIndex + pageSize);
  }, [filteredBatches, currentPage]);

  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1;

  // Expiry alerts styling
  const getExpiryAlertTag = (days) => {
    if (days <= 0) {
      return <Chip label="EXPIRED" size="small" style={{ backgroundColor: RED.bg, color: RED.main, fontWeight: 700 }} />;
    } else if (days <= 30) {
      return <Chip label={`Critical (${days}d left)`} size="small" style={{ backgroundColor: RED.bg, color: RED.main, fontWeight: 700 }} />;
    } else if (days <= 60) {
      return <Chip label={`Warning (${days}d left)`} size="small" style={{ backgroundColor: AMBER.bg, color: AMBER.main, fontWeight: 700 }} />;
    } else {
      return <Chip label={`${days} days left`} size="small" style={{ backgroundColor: GREEN.bg, color: GREEN.main }} />;
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredBatches.map(b => ({
      'Batch No': b.batchNo,
      'Item Code': b.itemCode,
      'Item Name': b.itemName,
      'Available Qty': b.qty,
      'Mfg Date': b.mfgDate,
      'Age (Days)': b.ageDays,
      'Age Bucket': b.ageBucket,
      'Expiry Date': b.expiryDate,
      'Days to Expiry': b.daysToExpiry,
      'Warehouse': b.warehouse,
      'Status': b.status
    }));
    exportToExcel(data, `Batch_Aging_Analysis_${new Date().toISOString().split('T')[0]}`, 'Aging Analysis');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'batchNo', headerName: 'Batch No' },
      { field: 'itemCode', headerName: 'Item Code' },
      { field: 'itemName', headerName: 'Item Name' },
      { field: 'qty', headerName: 'Qty' },
      { field: 'ageDays', headerName: 'Age (Days)' },
      { field: 'ageBucket', headerName: 'Age Category' },
      { field: 'daysToExpiry', headerName: 'Days to Expiry' },
      { field: 'status', headerName: 'Status' }
    ];
    exportToPDF(cols, filteredBatches, `Batch_Aging_Analysis_${new Date().toISOString().split('T')[0]}`, 'Batch Stock Aging Report');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Batch Stock Aging Analysis
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Track product storage duration, identify slow-moving batches, and proactively mitigate expiration write-offs.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={handleExportExcel}
            startIcon={<FileSpreadsheet size={18} />}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: BLUE.light, color: BLUE.light }}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportPDF}
            startIcon={<FileText size={18} />}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: BLUE.light, color: BLUE.light }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* SUMMARY ANALYSIS CARDS */}
      <Grid container spacing={3}>
        {/* Progress distribution */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart2 size={18} style={{ color: BLUE.main }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Inventory Age Distribution Summary (Total Stock: {statistics.totalQty} units)
              </Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {Object.entries(statistics.buckets).map(([bucket, data]) => (
                <Box key={bucket}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{bucket}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{data.qty}</strong> units ({data.percent.toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={data.percent}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: SLATE.bg,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 
                          bucket === '0-30 Days' ? GREEN.main :
                          bucket === '31-60 Days' ? BLUE.light :
                          bucket === '61-90 Days' ? AMBER.main : RED.main
                      }
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Expiry alerts */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ height: '100%', borderColor: statistics.nearExpiry.length > 0 ? RED.light : 'inherit' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShieldAlert size={18} style={{ color: statistics.nearExpiry.length > 0 ? RED.main : SLATE.main }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Shelf-Life Near-Expiry Alerts (Under 60 Days)
              </Typography>
            </Box>
            <CardContent sx={{ height: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {statistics.nearExpiry.length > 0 ? (
                statistics.nearExpiry.map(b => (
                  <Alert
                    key={b.batchNo}
                    severity={b.daysToExpiry <= 30 ? "error" : "warning"}
                    icon={<Clock size={16} />}
                    sx={{ py: 0.5 }}
                  >
                    <strong>{b.batchNo}</strong> - {b.itemName}
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      Expiring in <strong>{b.daysToExpiry}</strong> days (on {b.expiryDate}) | Available Stock: {b.qty} units
                    </div>
                  </Alert>
                ))
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No active batches are expiring within 60 days. Good job!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTER PANEL */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by batch, code, or product name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-selects">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={agingFilter}
              onChange={(e) => { setAgingFilter(e.target.value); setCurrentPage(1); }}
              displayEmpty
            >
              <MenuItem value="All">All Storage Ages</MenuItem>
              <MenuItem value="0-30 Days">0-30 Days (Fresh)</MenuItem>
              <MenuItem value="31-60 Days">31-60 Days</MenuItem>
              <MenuItem value="61-90 Days">61-90 Days (Slow)</MenuItem>
              <MenuItem value="91+ Days">91+ Days (Dead Stock)</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {/* AGING DATA GRID */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Batch No</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Available Qty</th>
              <th>Mfg Date</th>
              <th>Storage Duration</th>
              <th>Age Bucket</th>
              <th>Expiry Date</th>
              <th>Days to Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBatches.length > 0 ? (
              paginatedBatches.map(b => {
                const isDead = b.ageDays > 90;
                return (
                  <tr key={b.batchNo} style={{ backgroundColor: isDead ? 'rgba(239, 68, 68, 0.02)' : 'inherit' }}>
                    <td className="bold-cell">{b.batchNo}</td>
                    <td>{b.itemCode}</td>
                    <td>{b.itemName}</td>
                    <td className="bold-cell">{b.qty} units</td>
                    <td>{b.mfgDate}</td>
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Clock size={14} style={{ color: BLUE.light }} />
                        <strong>{b.ageDays}</strong> days
                      </Box>
                    </td>
                    <td>
                      <Chip
                        label={b.ageBucket}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          backgroundColor:
                            b.ageBucket === '0-30 Days' ? GREEN.bg :
                            b.ageBucket === '31-60 Days' ? BLUE.bg :
                            b.ageBucket === '61-90 Days' ? AMBER.bg : RED.bg,
                          color:
                            b.ageBucket === '0-30 Days' ? GREEN.main :
                            b.ageBucket === '31-60 Days' ? BLUE.light :
                            b.ageBucket === '61-90 Days' ? AMBER.main : RED.main
                        }}
                      />
                    </td>
                    <td>{b.expiryDate}</td>
                    <td>{getExpiryAlertTag(b.daysToExpiry)}</td>
                    <td>
                      <Chip
                        label={b.status}
                        size="small"
                        variant="outlined"
                        style={{
                          borderColor:
                            b.status === 'Available' ? GREEN.main :
                            b.status === 'Quarantined' ? AMBER.main : RED.main,
                          color:
                            b.status === 'Available' ? GREEN.main :
                            b.status === 'Quarantined' ? AMBER.main : RED.main,
                          fontWeight: 600
                        }}
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="table-empty">
                  No batch analysis records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Showing Page {currentPage} of {totalPages} ({filteredBatches.length} total items)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              sx={{ textTransform: 'none' }}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default BatchAgingAnalysis;

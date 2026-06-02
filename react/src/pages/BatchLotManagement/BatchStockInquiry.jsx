import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Card, CardContent, Grid, Typography, Box, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, Divider, Alert, AlertTitle, Paper
} from '@mui/material';
import {
  Search, FileSpreadsheet, FileText, Sparkles, CheckCircle2,
  AlertCircle, ArrowRight, Layers, HelpCircle
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const GREEN = { main: '#15803D', light: '#22C55E', bg: '#DCFCE7' };
const RED = { main: '#B91C1C', light: '#EF4444', bg: '#FEE2E2' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

const BatchStockInquiry = () => {
  const batches = useSelector(state => state.batchImport.batches);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // FIFO Tool States
  const [fifoItemCode, setFifoItemCode] = useState('');
  const [fifoReqQty, setFifoReqQty] = useState('');
  const [fifoCalculation, setFifoCalculation] = useState(null);

  // Unique list of items for FIFO tool
  const uniqueItems = useMemo(() => {
    const itemMap = new Map();
    batches.forEach(b => {
      if (!itemMap.has(b.itemCode)) {
        itemMap.set(b.itemCode, b.itemName);
      }
    });
    return Array.from(itemMap.entries()).map(([code, name]) => ({ code, name }));
  }, [batches]);

  // Set default FIFO item
  React.useEffect(() => {
    if (uniqueItems.length > 0 && !fifoItemCode) {
      setFifoItemCode(uniqueItems[0].code);
    }
  }, [uniqueItems, fifoItemCode]);

  // Filtering for grid
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchSearch =
        b.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchWarehouse = warehouseFilter === 'All' || b.warehouse === warehouseFilter;
      return matchSearch && matchWarehouse;
    });
  }, [batches, searchTerm, warehouseFilter]);

  // Pagination
  const paginatedBatches = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBatches.slice(startIndex, startIndex + pageSize);
  }, [filteredBatches, currentPage]);

  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1;

  // Calculate FIFO Allocation
  const calculateFIFO = () => {
    const reqQty = Number(fifoReqQty);
    if (!fifoItemCode || isNaN(reqQty) || reqQty <= 0) {
      setFifoCalculation(null);
      return;
    }

    // Filter available batches for this item, sorted by sequence or mfg date (First In First Out)
    // First: Available status batches. Sort by sequence (ascending) or mfgDate
    const itemBatches = batches
      .filter(b => b.itemCode === fifoItemCode && b.status === 'Available' && b.qty > 0)
      .sort((a, b) => {
        // Sort by expiry date (FEFO/FIFO) or sequence. Let's do sequence then mfg date
        if (a.sequence !== b.sequence) return a.sequence - b.sequence;
        return new Date(a.mfgDate) - new Date(b.mfgDate);
      });

    let remaining = reqQty;
    const allocations = [];

    for (let batch of itemBatches) {
      if (remaining <= 0) break;

      const allocated = Math.min(batch.qty, remaining);
      remaining -= allocated;

      allocations.push({
        batchNo: batch.batchNo,
        warehouse: batch.warehouse,
        available: batch.qty,
        allocated: allocated,
        sequence: batch.sequence,
        expiryDate: batch.expiryDate,
        fullyUsed: allocated === batch.qty
      });
    }

    setFifoCalculation({
      requestedQty: reqQty,
      allocatedQty: reqQty - remaining,
      shortageQty: remaining,
      allocations: allocations,
      isFullyAllocated: remaining === 0
    });
  };

  // Reset calculations
  const clearFIFO = () => {
    setFifoReqQty('');
    setFifoCalculation(null);
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredBatches.map(b => ({
      'Batch No': b.batchNo,
      'Item Code': b.itemCode,
      'Item Name': b.itemName,
      'Warehouse': b.warehouse,
      'Stock Qty': b.qty,
      'Landed Unit Cost (INR)': b.landedUnitCost,
      'Selling Price': b.finalSellingPrice,
      'Mfg Date': b.mfgDate,
      'Expiry Date': b.expiryDate,
      'Days to Expire': Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
      'Status': b.status
    }));
    exportToExcel(data, `Batch_Stock_Inquiry_${new Date().toISOString().split('T')[0]}`, 'Batch Stock');
  };

  const handleExportPDF = () => {
    const cols = [
      { field: 'batchNo', headerName: 'Batch No' },
      { field: 'itemCode', headerName: 'Item Code' },
      { field: 'itemName', headerName: 'Item Name' },
      { field: 'warehouse', headerName: 'Warehouse' },
      { field: 'qty', headerName: 'Stock Qty' },
      { field: 'finalSellingPrice', headerName: 'Selling Price' },
      { field: 'expiryDate', headerName: 'Expiry Date' },
      { field: 'daysToExpiry', headerName: 'Days to Expire' },
      { field: 'status', headerName: 'Status' }
    ];
    exportToPDF(cols, filteredBatches, `Batch_Stock_Inquiry_${new Date().toISOString().split('T')[0]}`, 'Batch Stock Inquiry Report');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Batch Stock Inquiry
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Query warehouse batch stock availability, and check sequence routing for FIFO stock dispatches.
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

      {/* FIFO VALIDATION CHECKS WIDGET */}
      <Card variant="outlined" sx={{ border: `1px solid ${BLUE.light}`, boxShadow: '0px 4px 20px rgba(59, 130, 246, 0.08)' }}>
        <Box sx={{ p: 2, backgroundColor: BLUE.bg, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #dbeafe' }}>
          <Sparkles size={20} style={{ color: BLUE.main }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: BLUE.main }}>
            FIFO Stock Issue Allocation Tool (Verification Checker)
          </Typography>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Specify an item and desired quantity to verify which batches must be dispatched first, respecting the inventory FIFO queue rules.
                </Typography>
                
                <FormControl fullWidth>
                  <InputLabel id="fifo-item-label">Select Item to Dispatch</InputLabel>
                  <Select
                    labelId="fifo-item-label"
                    value={fifoItemCode}
                    label="Select Item to Dispatch"
                    onChange={(e) => setFifoItemCode(e.target.value)}
                  >
                    {uniqueItems.map(item => (
                      <MenuItem key={item.code} value={item.code}>
                        {item.name} ({item.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Enter Required Qty"
                  type="number"
                  placeholder="e.g. 800"
                  value={fifoReqQty}
                  onChange={(e) => setFifoReqQty(e.target.value)}
                />

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={calculateFIFO}
                    disabled={!fifoReqQty || fifoReqQty <= 0}
                    sx={{ backgroundColor: BLUE.main, fontWeight: 600, py: 1.2 }}
                  >
                    Run FIFO Checker
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={clearFIFO}
                    sx={{ color: SLATE.main, borderColor: SLATE.light }}
                  >
                    Reset
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* FIFO Calculation Results Panel */}
            <Grid item xs={12} md={7} sx={{ borderLeft: { md: `1px solid ${SLATE.light}` }, pl: { md: 4 } }}>
              {fifoCalculation ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Allocation Simulation Result
                  </Typography>

                  {fifoCalculation.isFullyAllocated ? (
                    <Alert icon={<CheckCircle2 size={20} />} severity="success" sx={{ mb: 3 }}>
                      <AlertTitle sx={{ fontWeight: 700 }}>Allocation Success</AlertTitle>
                      Total request of <strong>{fifoCalculation.requestedQty}</strong> is fully matched by available FIFO batch stock.
                    </Alert>
                  ) : (
                    <Alert icon={<AlertCircle size={20} />} severity="warning" sx={{ mb: 3 }}>
                      <AlertTitle sx={{ fontWeight: 700 }}>Stock Shortage</AlertTitle>
                      Allocated <strong>{fifoCalculation.allocatedQty}</strong> units. Shortage of <strong>{fifoCalculation.shortageQty}</strong> units detected!
                    </Alert>
                  )}

                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: BLUE.dark }}>
                    FIFO Release Routing Sequence:
                  </Typography>

                  {fifoCalculation.allocations.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {fifoCalculation.allocations.map((alloc, idx) => (
                        <Paper
                          key={alloc.batchNo}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderColor: alloc.fullyUsed ? GREEN.main : BLUE.light,
                            backgroundColor: alloc.fullyUsed ? GREEN.bg : BLUE.bg
                          }}
                        >
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={4}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip label={`Step ${idx + 1}`} size="small" color="primary" sx={{ height: 18, fontSize: '10px' }} />
                                {alloc.batchNo}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Exp: {alloc.expiryDate}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary" block>
                                Batch Stock: <strong>{alloc.available}</strong>
                              </Typography>
                              <Typography variant="caption" color="text.secondary" block>
                                Bin: {alloc.warehouse}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: alloc.fullyUsed ? GREEN.main : BLUE.main }}>
                                Allocate: {alloc.allocated}
                              </Typography>
                              {alloc.fullyUsed && (
                                <Typography variant="caption" sx={{ color: GREEN.main, fontWeight: 600, display: 'block' }}>
                                  [Fully Depleted]
                                </Typography>
                              )}
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      No available stock batches found for this item.
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 4, color: SLATE.light }}>
                  <HelpCircle size={48} strokeWidth={1} />
                  <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                    FIFO calculation results will display here.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Select an item, input a quantity, and click Run FIFO.
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* FILTER PANEL FOR GRID */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Filter batch grid by number, code, name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-selects">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={warehouseFilter}
              onChange={(e) => { setWarehouseFilter(e.target.value); setCurrentPage(1); }}
              displayEmpty
            >
              <MenuItem value="All">All Warehouse Locations</MenuItem>
              <MenuItem value="Main Warehouse">Main Warehouse</MenuItem>
              <MenuItem value="Hold Warehouse">Hold Warehouse</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {/* BATCH STOCK GRID */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Batch No</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Warehouse</th>
              <th>Available Stock</th>
              <th>Landed Unit Cost</th>
              <th>Selling Price</th>
              <th>Expiry Date</th>
              <th>Days to Expire</th>
              <th>QC Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBatches.length > 0 ? (
              paginatedBatches.map(b => {
                const daysToExpiry = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                <tr key={b.batchNo}>
                  <td className="bold-cell">{b.batchNo}</td>
                  <td>{b.itemCode}</td>
                  <td>{b.itemName}</td>
                  <td>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Layers size={14} style={{ color: BLUE.light }} />
                      {b.warehouse}
                    </Box>
                  </td>
                  <td className="bold-cell">{b.qty} units</td>
                  <td>₹{b.landedUnitCost?.toFixed(2)}</td>
                  <td>₹{b.finalSellingPrice?.toFixed(2)}</td>
                  <td>{b.expiryDate}</td>
                  <td style={{ color: daysToExpiry < 0 ? RED.main : (daysToExpiry <= 60 ? AMBER.main : 'inherit'), fontWeight: daysToExpiry <= 60 ? 700 : 400 }}>
                    {daysToExpiry < 0 ? 'Expired' : `${daysToExpiry} days`}
                  </td>
                  <td>
                    {b.status === 'Available' ? (
                      <Chip label="Approved / Active" size="small" style={{ backgroundColor: GREEN.bg, color: GREEN.main, fontWeight: 600 }} />
                    ) : b.status === 'On Hold' ? (
                      <Chip label="QC Locked / On Hold" size="small" style={{ backgroundColor: AMBER.bg, color: AMBER.main, fontWeight: 600 }} />
                    ) : (
                      <Chip label="Expired" size="small" style={{ backgroundColor: RED.bg, color: RED.main, fontWeight: 600 }} />
                    )}
                  </td>
                </tr>
              )})
            ) : (
              <tr>
                <td colSpan={9} className="table-empty">
                  No batch stock records found.
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

export default BatchStockInquiry;

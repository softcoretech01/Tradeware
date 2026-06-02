import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, TrendingUp, Clock, AlertCircle, ArrowUpRight, Search as SearchIcon, X as CancelIcon
} from 'lucide-react';
import { 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Table, TableBody, TableCell, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, TextField, IconButton
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [detailsPopup, setDetailsPopup] = useState(null);
  const [salesPersonFilter, setSalesPersonFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [currencyFilter, setCurrencyFilter] = useState('All');

  const [appliedSalesPersonFilter, setAppliedSalesPersonFilter] = useState('All');
  const [appliedCustomerFilter, setAppliedCustomerFilter] = useState('All');
  const [appliedSupplierFilter, setAppliedSupplierFilter] = useState('All');
  const [appliedCurrencyFilter, setAppliedCurrencyFilter] = useState('All');

  // Load ERP data from store
  let { 
    purchaseOrders = [], salesOrders = []
  } = useSelector(state => state.erp);

  // Add mock data for testing filters
  salesOrders = [
    ...salesOrders,
    {
      id: 'SO-001',
      soNumber: 'SO-001',
      customerName: 'Global Tech Industries',
      date: new Date().toISOString(),
      salesPerson: 'kabilesh',
      status: 'Pending',
      invoiceGenerated: false,
      items: [{ orderedQty: 50, unitPrice: 200 }]
    },
    {
      id: 'SO-002',
      soNumber: 'SO-002',
      customerName: 'Acme Corp',
      date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
      salesPerson: 'sachin',
      status: 'Pending',
      invoiceGenerated: false,
      items: [{ orderedQty: 120, unitPrice: 50 }]
    },
    {
      id: 'SO-003',
      soNumber: 'SO-003',
      customerName: 'Stark Enterprises',
      date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
      salesPerson: 'kabilesh',
      status: 'Pending',
      invoiceGenerated: false,
      items: [{ orderedQty: 10, unitPrice: 5000 }]
    }
  ];

  purchaseOrders = [
    ...purchaseOrders,
    {
      id: 'PO-MOCK-1',
      poNumber: 'PO-MOCK-1',
      supplierName: 'Alpha Supplies',
      date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
      status: 'Pending',
      items: [{ orderedQty: 200, unitPrice: 15 }]
    }
  ];

  const inventory = useSelector(state => state.inventory?.inventory || []);

  const uniqueCustomers = useMemo(() => {
    const customers = salesOrders.map(o => o.customerName).filter(Boolean);
    return ['All', ...new Set(customers)];
  }, [salesOrders]);

  const uniqueSuppliers = useMemo(() => {
    const suppliers = purchaseOrders.map(o => o.supplierName).filter(Boolean);
    return ['All', ...new Set(suppliers)];
  }, [purchaseOrders]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Date Filter State
  const defaultTo = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  }, []);

  const [filterFrom, setFilterFrom] = useState(defaultFrom);
  const [filterTo, setFilterTo] = useState(defaultTo);
  const [appliedFilterFrom, setAppliedFilterFrom] = useState(defaultFrom);
  const [appliedFilterTo, setAppliedFilterTo] = useState(defaultTo);

  const handleSearch = () => {
    setAppliedFilterFrom(filterFrom);
    setAppliedFilterTo(filterTo);
  };

  const handleCancel = () => {
    setFilterFrom(defaultFrom);
    setFilterTo(defaultTo);
    setAppliedFilterFrom(defaultFrom);
    setAppliedFilterTo(defaultTo);
  };

  // Filtered ERP data
  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter(so => {
      if (!so.date && !so.createdAt) return true;
      const soDate = new Date(so.date || so.createdAt);
      const from = new Date(appliedFilterFrom);
      const to = new Date(appliedFilterTo);
      to.setHours(23, 59, 59, 999);
      return soDate >= from && soDate <= to;
    });
  }, [salesOrders, appliedFilterFrom, appliedFilterTo]);

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      if (!po.date && !po.createdAt) return true;
      const poDate = new Date(po.date || po.createdAt);
      const from = new Date(appliedFilterFrom);
      const to = new Date(appliedFilterTo);
      to.setHours(23, 59, 59, 999);
      return poDate >= from && poDate <= to;
    });
  }, [purchaseOrders, appliedFilterFrom, appliedFilterTo]);

  // 1. Gross Sales Order Value
  const totalSales = useMemo(() => {
    return filteredSalesOrders.reduce((sum, so) => {
      const soVal = so.items.reduce((iSum, item) => iSum + (item.orderedQty * item.unitPrice), 0);
      return sum + soVal;
    }, 0);
  }, [filteredSalesOrders]);

  // 2. Gross Purchase Commitments
  const totalPurchases = useMemo(() => {
    return filteredPurchaseOrders.reduce((sum, po) => {
      const poVal = po.items.reduce((iSum, item) => iSum + (item.orderedQty * item.unitPrice), 0);
      return sum + poVal;
    }, 0);
  }, [filteredPurchaseOrders]);

  // 3. Yet To Bill (Sales Orders that do not have an invoice generated yet)
  const yetToBillOrders = useMemo(() => {
    return filteredSalesOrders.filter(so => !so.invoiceGenerated);
  }, [filteredSalesOrders]);

  const totalYetToBill = useMemo(() => {
    return yetToBillOrders.reduce((sum, so) => {
      const soVal = so.items.reduce((iSum, item) => iSum + (item.orderedQty * item.unitPrice), 0);
      return sum + soVal;
    }, 0);
  }, [yetToBillOrders]);

  // 4. Low Stock Items (Stock <= Min Stock or status is 'Low Stock' or 'Out of Stock')
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => 
      item.availableStock <= item.minStock || 
      item.status === 'Low Stock' || 
      item.status === 'Out of Stock'
    );
  }, [inventory]);

  return (
    <div className="dashboard-container fade-in">
      
      {/* Date Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>From Date:</label>
          <DatePicker 
            selected={filterFrom ? new Date(filterFrom) : null}
            onChange={(date) => {
              if (date) {
                const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                setFilterFrom(formattedDate);
              } else {
                setFilterFrom('');
              }
            }}
            customInput={<TextField size="small" variant="outlined" sx={{ minWidth: 160 }} />}
            dateFormat="dd/MMM/yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </div>
        <div className="filter-group">
          <label>To Date:</label>
          <DatePicker 
            selected={filterTo ? new Date(filterTo) : null}
            onChange={(date) => {
              if (date) {
                const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                setFilterTo(formattedDate);
              } else {
                setFilterTo('');
              }
            }}
            customInput={<TextField size="small" variant="outlined" sx={{ minWidth: 160 }} />}
            dateFormat="dd/MMM/yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </div>
        <div className="filter-actions" style={{ marginLeft: 0, gap: '8px' }}>
          <IconButton color="success" onClick={handleSearch} title="Search" sx={{ border: '1px solid currentColor', borderRadius: '8px', padding: '8px' }}>
            <SearchIcon />
          </IconButton>
          <IconButton color="error" onClick={handleCancel} title="Cancel" sx={{ border: '1px solid currentColor', borderRadius: '8px', padding: '8px' }}>
            <CancelIcon />
          </IconButton>
        </div>
      </div>

      {/* 3 KPI Cards at the top */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => { setDetailsPopup('sales'); setSalesPersonFilter('All'); }} style={{ cursor: 'pointer' }} title="Click to view sales details">
          <div className="kpi-icon-wrapper sales">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label" style={{ textDecoration: 'underline', color: '#2563eb' }}>Sales</span>
            <span className="kpi-value">₹{totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => { setDetailsPopup('purchases'); setSalesPersonFilter('All'); }} style={{ cursor: 'pointer' }} title="Click to view purchase details">
          <div className="kpi-icon-wrapper purchase">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label" style={{ textDecoration: 'underline', color: '#475569' }}>Purchases</span>
            <span className="kpi-value">₹{totalPurchases.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => { setDetailsPopup('yetToBill'); setSalesPersonFilter('All'); }} style={{ cursor: 'pointer' }} title="Click to view pending bills details">
          <div className="kpi-icon-wrapper yet-to-bill">
            <Clock size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label" style={{ textDecoration: 'underline', color: '#d97706' }}>Yet To Bill (Outstanding)</span>
            <span className="kpi-value">₹{totalYetToBill.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      {/* Low Stock Items Panel below the KPIs */}
      <div className="chart-panel">
        <div className="panel-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: '#ef4444' }} /> Low Stock Items
          </h3>
        </div>
        <div className="list-container">
          {lowStockItems.length === 0 ? (
            <div className="empty-state">
              <p>All stock levels are optimal.</p>
            </div>
          ) : (
            <table className="erp-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Available</th>
                  <th>Min Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(item => (
                  <tr key={item.id}>
                    <td className="bold-cell">{item.itemCode}</td>
                    <td>{item.itemName}</td>
                    <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{item.availableStock}</td>
                    <td>{item.minStock}</td>
                    <td>
                      <Chip 
                        label={item.status} 
                        color={item.status === 'Out of Stock' ? 'error' : 'warning'} 
                        size="small" 
                        sx={{ height: '20px', fontSize: '10px' }} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Popup */}
      <Dialog 
        open={!!detailsPopup} 
        onClose={() => setDetailsPopup(null)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh'
          }
        }}
      >
        <DialogTitle>
          {detailsPopup === 'sales' ? 'Sales' : 
           detailsPopup === 'purchases' ? 'Purchases' : 
           'Yet To Bill (Pending Bills)'}
        </DialogTitle>
        <DialogContent dividers>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {detailsPopup === 'yetToBill' && (
              <FormControl size="small" style={{ minWidth: 220 }}>
                <InputLabel>Filter by Sales Person</InputLabel>
                <Select
                  value={salesPersonFilter}
                  label="Filter by Sales Person"
                  onChange={(e) => setSalesPersonFilter(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="kabilesh">kabilesh</MenuItem>
                  <MenuItem value="sachin">sachin</MenuItem>
                </Select>
              </FormControl>
            )}
            {detailsPopup === 'sales' && (
              <FormControl size="small" style={{ minWidth: 220 }}>
                <InputLabel>Filter by Customer</InputLabel>
                <Select
                  value={customerFilter}
                  label="Filter by Customer"
                  onChange={(e) => setCustomerFilter(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  {uniqueCustomers.filter(c => c !== 'All').map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {detailsPopup === 'purchases' && (
              <>
                <FormControl size="small" style={{ minWidth: 220 }}>
                  <InputLabel>Filter by Supplier</InputLabel>
                  <Select
                    value={supplierFilter}
                    label="Filter by Supplier"
                    onChange={(e) => setSupplierFilter(e.target.value)}
                  >
                    <MenuItem value="All">All</MenuItem>
                    {uniqueSuppliers.filter(s => s !== 'All').map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" style={{ minWidth: 220 }}>
                  <InputLabel>Filter by Currency</InputLabel>
                  <Select
                    value={currencyFilter}
                    label="Filter by Currency"
                    onChange={(e) => setCurrencyFilter(e.target.value)}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="INR">INR (₹)</MenuItem>
                    <MenuItem value="USD">USD ($)</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
            <IconButton color="success" onClick={() => {
              setAppliedSalesPersonFilter(salesPersonFilter);
              setAppliedCustomerFilter(customerFilter);
              setAppliedSupplierFilter(supplierFilter);
              setAppliedCurrencyFilter(currencyFilter);
            }} sx={{ border: '1px solid currentColor', borderRadius: '8px', padding: '6px' }} title="Search">
              <SearchIcon size={18} />
            </IconButton>
            <IconButton color="error" onClick={() => {
              setSalesPersonFilter('All');
              setCustomerFilter('All');
              setSupplierFilter('All');
              setCurrencyFilter('All');
              setAppliedSalesPersonFilter('All');
              setAppliedCustomerFilter('All');
              setAppliedSupplierFilter('All');
              setAppliedCurrencyFilter('All');
            }} sx={{ border: '1px solid currentColor', borderRadius: '8px', padding: '6px' }} title="Cancel">
              <CancelIcon size={18} />
            </IconButton>
          </div>
          <Table size="small" sx={{ 
            '& thead th': { backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: '600' },
            '& tbody tr:nth-of-type(even)': { backgroundColor: '#f8fafc' },
            '& tbody tr:hover': { backgroundColor: '#f1f5f9' },
            border: '1px solid #cbd5e1'
          }}>
            <TableHead>
              <TableRow>
                {detailsPopup === 'yetToBill' && <TableCell><b>Sales Person</b></TableCell>}
                <TableCell><b>{detailsPopup === 'purchases' ? 'PO Number' : 'SO No'}</b></TableCell>
                <TableCell><b>{detailsPopup === 'yetToBill' ? 'SO Date' : 'Date'}</b></TableCell>
                <TableCell><b>{detailsPopup === 'purchases' ? 'Supplier' : 'Customer Name'}</b></TableCell>
                <TableCell align="right"><b>Value</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(detailsPopup === 'sales' ? filteredSalesOrders : 
                detailsPopup === 'purchases' ? filteredPurchaseOrders : 
                yetToBillOrders)
                .filter(order => {
                  if (detailsPopup === 'yetToBill') {
                    if (appliedSalesPersonFilter !== 'All') {
                      const person = order.salesPerson || order.createdBy || 'Admin';
                      if (person !== appliedSalesPersonFilter) return false;
                    }
                  } else if (detailsPopup === 'sales') {
                    if (appliedCustomerFilter !== 'All' && order.customerName !== appliedCustomerFilter) return false;
                  } else if (detailsPopup === 'purchases') {
                    if (appliedSupplierFilter !== 'All' && order.supplierName !== appliedSupplierFilter) return false;
                    if (appliedCurrencyFilter !== 'All') {
                      const curr = order.currency || 'INR'; // Assuming default INR if not specified
                      if (curr !== appliedCurrencyFilter) return false;
                    }
                  }
                  return true;
                })
                .map(order => {
                const orderValue = order.items.reduce((sum, item) => sum + (item.orderedQty * item.unitPrice), 0);
                return (
                  <TableRow key={order.id || order.poNumber || order.soNumber}>
                    {detailsPopup === 'yetToBill' && <TableCell>{order.salesPerson || order.createdBy || 'Admin'}</TableCell>}
                    <TableCell>{detailsPopup === 'purchases' ? (order.poNumber || order.id) : (order.soNumber || order.id)}</TableCell>
                    <TableCell>{formatDate(order.date || order.createdAt)}</TableCell>
                    <TableCell>{detailsPopup === 'purchases' ? order.supplierName : order.customerName}</TableCell>
                    <TableCell align="right">
                      ₹{orderValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(detailsPopup === 'sales' ? filteredSalesOrders : 
                detailsPopup === 'purchases' ? filteredPurchaseOrders : 
                yetToBillOrders)
                .filter(order => {
                  if (detailsPopup === 'yetToBill') {
                    if (appliedSalesPersonFilter !== 'All') {
                      const person = order.salesPerson || order.createdBy || 'Admin';
                      if (person !== appliedSalesPersonFilter) return false;
                    }
                  } else if (detailsPopup === 'sales') {
                    if (appliedCustomerFilter !== 'All' && order.customerName !== appliedCustomerFilter) return false;
                  } else if (detailsPopup === 'purchases') {
                    if (appliedSupplierFilter !== 'All' && order.supplierName !== appliedSupplierFilter) return false;
                    if (appliedCurrencyFilter !== 'All') {
                      const curr = order.currency || 'INR'; // Assuming default INR if not specified
                      if (curr !== appliedCurrencyFilter) return false;
                    }
                  }
                  return true;
                }).length === 0 && (
                <TableRow>
                  <TableCell colSpan={detailsPopup === 'yetToBill' ? 5 : 4} align="center" style={{ padding: '20px', color: '#666' }}>
                    No records found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsPopup(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <style jsx="true">{`
        .dashboard-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          gap: 20px;
          background: var(--surface);
          padding: 16px 20px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-group label {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-main);
        }

        .filter-input {
          padding: 10px 16px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 15px;
          color: var(--text-main);
          outline: none;
          min-width: 180px;
        }

        .filter-actions {
          display: flex;
          gap: 12px;
          margin-left: auto;
        }

        @media (max-width: 768px) {
          .filter-bar {
            flex-direction: column;
            align-items: flex-start;
          }
          .filter-actions {
            margin-left: 0;
            width: 100%;
            justify-content: flex-end;
          }
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        .kpi-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
          cursor: default;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kpi-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--primary-light);
        }

        .kpi-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-icon-wrapper.sales { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
        .kpi-icon-wrapper.purchase { background: rgba(71, 85, 105, 0.1); color: #475569; }
        .kpi-icon-wrapper.yet-to-bill { background: rgba(245, 158, 11, 0.1); color: #d97706; }

        .kpi-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .kpi-label {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .kpi-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-main);
          margin: 4px 0;
        }

        .kpi-trend {
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .kpi-trend.positive { color: var(--accent); }
        .kpi-subtext { font-size: 12px; color: var(--text-muted); }

        .chart-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }

        .panel-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-main);
          margin: 0;
        }

        .badge-count {
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-light);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .list-container {
          overflow-y: auto;
          max-height: 320px;
        }

        .empty-state {
          padding: 20px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        /* React DatePicker Custom Blue Theme (from screenshot) */
        .react-datepicker {
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
          font-family: inherit !important;
          border-radius: 6px !important;
          overflow: hidden !important;
        }
        .react-datepicker__header {
          background-color: #3b82f6 !important;
          border-bottom: none !important;
          padding-top: 12px !important;
          padding-bottom: 8px !important;
        }
        .react-datepicker__current-month,
        .react-datepicker__day-name,
        .react-datepicker-year-header {
          color: white !important;
          font-weight: 600 !important;
        }
        .react-datepicker__day-name {
          font-size: 14px !important;
          text-transform: capitalize !important;
        }
        .react-datepicker__month-read-view--down-arrow,
        .react-datepicker__year-read-view--down-arrow {
          border-color: white !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: white !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #3b82f6 !important;
          border-radius: 50% !important;
          color: white !important;
        }
        .react-datepicker__day {
          border-radius: 50% !important;
          width: 2rem !important;
          line-height: 2rem !important;
          font-size: 14px !important;
        }
        .react-datepicker__day:hover {
          background-color: #e0f2fe !important;
          border-radius: 50% !important;
        }
        .react-datepicker__month-select, .react-datepicker__year-select {
          background-color: transparent !important;
          color: white !important;
          border: none !important;
          font-size: 18px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          outline: none !important;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          padding: 0 4px !important;
        }
        .react-datepicker__month-select option, .react-datepicker__year-select option {
          color: black !important;
          background: white !important;
        }
        .react-datepicker__header__dropdown {
          margin-bottom: 12px !important;
        }
        
        .react-datepicker-wrapper input {
          font-family: inherit !important;
          font-weight: 500 !important;
          color: #0f172a !important;
          border-radius: 10px !important;
          border: 1px solid #cbd5e1 !important;
          padding: 10px 14px !important;
          transition: all 0.3s ease !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important;
          background: #f8fafc !important;
          cursor: pointer !important;
          width: 100%;
        }
        .react-datepicker-wrapper input:hover {
          border-color: #94a3b8 !important;
        }
        .react-datepicker-wrapper input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
          background: white !important;
          outline: none !important;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

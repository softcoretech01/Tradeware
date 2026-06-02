import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, TrendingUp, Clock, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Table, TableBody, TableCell, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';

const Dashboard = () => {
  const navigate = useNavigate();
  const [detailsPopup, setDetailsPopup] = useState(null);
  const [salesPersonFilter, setSalesPersonFilter] = useState('All');

  // Load ERP data from store
  let { 
    purchaseOrders = [], salesOrders = []
  } = useSelector(state => state.erp);

  // Add mock data for testing filters
  salesOrders = [
    ...salesOrders,
    {
      id: 'SO-MOCK-1',
      soNumber: 'SO-MOCK-1',
      customerName: 'Global Tech Industries',
      date: new Date().toISOString(),
      salesPerson: 'kabilesh',
      status: 'Pending',
      invoiceGenerated: false,
      items: [{ orderedQty: 50, unitPrice: 200 }]
    },
    {
      id: 'SO-MOCK-2',
      soNumber: 'SO-MOCK-2',
      customerName: 'Acme Corp',
      date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
      salesPerson: 'sachin',
      status: 'Pending',
      invoiceGenerated: false,
      items: [{ orderedQty: 120, unitPrice: 50 }]
    },
    {
      id: 'SO-MOCK-3',
      soNumber: 'SO-MOCK-3',
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
          <input 
            type="date" 
            value={filterFrom} 
            onChange={(e) => setFilterFrom(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>To Date:</label>
          <input 
            type="date" 
            value={filterTo} 
            onChange={(e) => setFilterTo(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-actions">
          <Button variant="contained" color="primary" onClick={handleSearch} size="large">
            Search
          </Button>
          <Button variant="outlined" color="error" onClick={handleCancel} size="large">
            Cancel
          </Button>
        </div>
      </div>

      {/* 3 KPI Cards at the top */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => { setDetailsPopup('sales'); setSalesPersonFilter('All'); }} style={{ cursor: 'pointer' }} title="Click to view sales details">
          <div className="kpi-icon-wrapper sales">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label" style={{ textDecoration: 'underline', color: '#2563eb' }}>Gross Sales Order Value</span>
            <span className="kpi-value">${totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> Live gross sales value
            </span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => { setDetailsPopup('purchases'); setSalesPersonFilter('All'); }} style={{ cursor: 'pointer' }} title="Click to view purchase details">
          <div className="kpi-icon-wrapper purchase">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label" style={{ textDecoration: 'underline', color: '#475569' }}>Gross Purchase Commitment</span>
            <span className="kpi-value">${totalPurchases.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> Total active commitments
            </span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => { setDetailsPopup('yetToBill'); setSalesPersonFilter('All'); }} style={{ cursor: 'pointer' }} title="Click to view pending bills details">
          <div className="kpi-icon-wrapper yet-to-bill">
            <Clock size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label" style={{ textDecoration: 'underline', color: '#d97706' }}>Yet To Bill (Outstanding)</span>
            <span className="kpi-value">${totalYetToBill.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="kpi-subtext">{yetToBillOrders.length} sales orders pending invoice</span>
          </div>
        </div>
      </div>

      {/* Low Stock Items Panel below the KPIs */}
      <div className="chart-panel">
        <div className="panel-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: '#ef4444' }} /> Low Stock Items
          </h3>
          <span className="badge-count" style={{ background: '#fef2f2', color: '#ef4444' }}>{lowStockItems.length} Alerts</span>
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
                  <th>Warehouse</th>
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
                    <td>{item.warehouse}</td>
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
          {detailsPopup === 'sales' ? 'Gross Sales Orders Detail' : 
           detailsPopup === 'purchases' ? 'Gross Purchase Commitments Detail' : 
           'Yet To Bill (Pending Bills)'}
        </DialogTitle>
        <DialogContent dividers>
          {detailsPopup === 'yetToBill' && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            </div>
          )}
          <Table size="small" sx={{ 
            '& thead th': { backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: '600' },
            '& tbody tr:nth-of-type(even)': { backgroundColor: '#f8fafc' },
            '& tbody tr:hover': { backgroundColor: '#f1f5f9' },
            border: '1px solid #cbd5e1'
          }}>
            <TableHead>
              <TableRow>
                <TableCell><b>{detailsPopup === 'purchases' ? 'PO Number' : 'SO No'}</b></TableCell>
                <TableCell><b>{detailsPopup === 'yetToBill' ? 'SO Date' : 'Date'}</b></TableCell>
                <TableCell><b>{detailsPopup === 'purchases' ? 'Supplier' : 'Customer Name'}</b></TableCell>
                {detailsPopup !== 'yetToBill' && <TableCell><b>Status</b></TableCell>}
                <TableCell align="right"><b>Value</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(detailsPopup === 'sales' ? filteredSalesOrders : 
                detailsPopup === 'purchases' ? filteredPurchaseOrders : 
                yetToBillOrders)
                .filter(order => {
                  if (detailsPopup !== 'yetToBill') return true;
                  if (salesPersonFilter === 'All') return true;
                  const person = order.salesPerson || order.createdBy || 'Admin';
                  return person === salesPersonFilter;
                })
                .map(order => {
                const orderValue = order.items.reduce((sum, item) => sum + (item.orderedQty * item.unitPrice), 0);
                return (
                  <TableRow key={order.id || order.poNumber || order.soNumber}>
                    <TableCell>{detailsPopup === 'purchases' ? order.poNumber : order.soNumber}</TableCell>
                    <TableCell>{new Date(order.date || order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{detailsPopup === 'purchases' ? order.supplierName : order.customerName}</TableCell>
                    {detailsPopup !== 'yetToBill' && (
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={
                            order.status === 'Completed' || order.status === 'Delivered' ? 'success' : 
                            order.status === 'Pending' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell align="right">${orderValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                  </TableRow>
                );
              })}
              {(detailsPopup === 'sales' ? filteredSalesOrders : 
                detailsPopup === 'purchases' ? filteredPurchaseOrders : 
                yetToBillOrders)
                .filter(order => {
                  if (detailsPopup !== 'yetToBill') return true;
                  if (salesPersonFilter === 'All') return true;
                  const person = order.salesPerson || order.createdBy || 'Admin';
                  return person === salesPersonFilter;
                }).length === 0 && (
                <TableRow>
                  <TableCell colSpan={detailsPopup === 'yetToBill' ? 4 : 5} align="center" style={{ padding: '20px', color: '#666' }}>
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
      `}</style>
    </div>
  );
};

export default Dashboard;

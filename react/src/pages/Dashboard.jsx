import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, TrendingUp, Clock, RefreshCw, AlertCircle, Users, ArrowUpRight
} from 'lucide-react';
import { Chip } from '@mui/material';

const Dashboard = () => {
  const navigate = useNavigate();

  // Load ERP data from store
  const { 
    purchaseOrders = [], salesOrders = []
  } = useSelector(state => state.erp);

  const inventory = useSelector(state => state.inventory?.inventory || []);
  const customers = useSelector(state => state.customers?.customers || []);

  // 1. Gross Sales Order Value
  const totalSales = useMemo(() => {
    return salesOrders.reduce((sum, so) => {
      const soVal = so.items.reduce((iSum, item) => iSum + (item.orderedQty * item.unitPrice), 0);
      return sum + soVal;
    }, 0);
  }, [salesOrders]);

  // 2. Gross Purchase Commitments
  const totalPurchases = useMemo(() => {
    return purchaseOrders.reduce((sum, po) => {
      const poVal = po.items.reduce((iSum, item) => iSum + (item.orderedQty * item.unitPrice), 0);
      return sum + poVal;
    }, 0);
  }, [purchaseOrders]);

  // 3. Yet To Bill (Sales Orders that do not have an invoice generated yet)
  const yetToBillOrders = useMemo(() => {
    return salesOrders.filter(so => !so.invoiceGenerated);
  }, [salesOrders]);

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

  // 5. Customer Value and Volume Calculations
  const customerAnalysis = useMemo(() => {
    return customers.map(cust => {
      const custOrders = salesOrders.filter(so => so.customerName.toLowerCase() === cust.name.toLowerCase());
      const totalSpent = custOrders.reduce((sum, so) => {
        return sum + so.items.reduce((acc, item) => acc + (item.orderedQty * item.unitPrice), 0);
      }, 0);
      const orderCount = custOrders.length;
      return {
        id: cust.id,
        name: cust.name,
        creditLimit: cust.creditLimit,
        totalSpent,
        orderCount
      };
    });
  }, [customers, salesOrders]);

  // Low Value Customers: spent less than $5,000
  const lowValueCustomers = useMemo(() => {
    return customerAnalysis.filter(c => c.totalSpent < 5000);
  }, [customerAnalysis]);

  // Low Volume Customers: placed 0 or 1 order
  const lowVolumeCustomers = useMemo(() => {
    return customerAnalysis.filter(c => c.orderCount <= 1);
  }, [customerAnalysis]);

  // Mock monthly data for SVG Chart (Sales vs Purchases)
  const monthlyData = useMemo(() => {
    return [
      { month: 'Jan', sales: 12000, purchase: 9500 },
      { month: 'Feb', sales: 15000, purchase: 11000 },
      { month: 'Mar', sales: 18000, purchase: 14000 },
      { month: 'Apr', sales: 16500, purchase: 13000 },
      { month: 'May', sales: totalSales || 24000, purchase: totalPurchases || 16000 }
    ];
  }, [totalSales, totalPurchases]);

  // SVG Chart sizing
  const chartHeight = 200;
  const chartWidth = 500;
  const maxVal = 30000;

  return (
    <div className="dashboard-container fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h1>ERP Analytics Dashboard</h1>
          <p>Targeted overview of outstanding billing pipeline, stock alerts, purchase commitments, and customer segment analysis.</p>
        </div>
        <button className="refresh-btn" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper sales">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Gross Sales Order Value</span>
            <span className="kpi-value">${totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> Live gross sales value
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper purchase">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Gross Purchase Commitment</span>
            <span className="kpi-value">${totalPurchases.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> Total active commitments
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper yet-to-bill">
            <Clock size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Yet To Bill (Outstanding)</span>
            <span className="kpi-value">${totalYetToBill.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="kpi-subtext">{yetToBillOrders.length} sales orders pending invoice</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="dashboard-charts-grid">
        {/* Sales vs Purchase Flow Chart */}
        <div className="chart-panel">
          <div className="panel-header">
            <h3>Sales vs Purchase Flow (Monthly Trend)</h3>
            <div className="chart-legends">
              <div className="legend-item"><span className="legend-dot sales"></span> Sales</div>
              <div className="legend-item"><span className="legend-dot purchase"></span> Purchases</div>
            </div>
          </div>
          <div className="chart-body">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-chart">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = chartHeight - (ratio * (chartHeight - 40)) - 25;
                const val = Math.round(ratio * maxVal);
                return (
                  <g key={idx}>
                    <line x1="45" y1={y} x2={chartWidth - 10} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x="40" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                      ${val >= 1000 ? `${val / 1000}k` : val}
                    </text>
                  </g>
                );
              })}

              {monthlyData.map((d, idx) => {
                const xGroup = 65 + idx * 85;
                const barWidth = 24;
                const gap = 4;

                const salesHeight = (d.sales / maxVal) * (chartHeight - 40);
                const salesY = chartHeight - salesHeight - 25;

                const purchaseHeight = (d.purchase / maxVal) * (chartHeight - 40);
                const purchaseY = chartHeight - purchaseHeight - 25;

                return (
                  <g key={idx}>
                    <rect 
                      x={xGroup} 
                      y={salesY} 
                      width={barWidth} 
                      height={salesHeight} 
                      fill="url(#salesGrad)" 
                      rx="4"
                      className="chart-bar"
                    />
                    <rect 
                      x={xGroup + barWidth + gap} 
                      y={purchaseY} 
                      width={barWidth} 
                      height={purchaseHeight} 
                      fill="url(#purchaseGrad)" 
                      rx="4"
                      className="chart-bar"
                    />
                    <text x={xGroup + barWidth} y={chartHeight - 5} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="500">
                      {d.month}
                    </text>
                  </g>
                );
              })}

              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Builder-wise Supply Analytics */}
        <div className="chart-panel">
          <div className="panel-header">
            <h3>Builder-wise Supply Volume (Pcs)</h3>
          </div>
          <div className="chart-body" style={{ padding: '10px 0', width: '100%' }}>
            <svg viewBox="0 0 500 200" className="svg-chart" style={{ width: '100%' }}>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const x = 120 + ratio * 350;
                const val = Math.round(ratio * 120);
                return (
                  <g key={idx}>
                    <line x1={x} y1="20" x2={x} y2="160" stroke="#f1f5f9" strokeWidth="1" />
                    <text x={x} y="175" textAnchor="middle" fontSize="9" fill="#94a3b8">
                      {val}
                    </text>
                  </g>
                );
              })}

              {[
                { name: 'Ace Builders', qty: 100 },
                { name: 'Woodlands Const', qty: 80 },
                { name: 'Apex Projects', qty: 45 }
              ].map((builder, idx) => {
                const y = 30 + idx * 45;
                const barHeight = 18;
                const barWidth = (builder.qty / 120) * 350;

                return (
                  <g key={idx}>
                    <text x="110" y={y + 12} textAnchor="end" fontSize="10" fill="#64748b" fontWeight="500">
                      {builder.name}
                    </text>
                    <rect
                      x="120"
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="url(#builderGrad)"
                      rx="3"
                      className="chart-bar"
                    />
                    <text x={120 + barWidth + 6} y={y + 12} fontSize="10" fill="#1e293b" fontWeight="600">
                      {builder.qty}
                    </text>
                  </g>
                );
              })}

              <defs>
                <linearGradient id="builderGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Dynamic Inventory & Billing Analysis */}
      <div className="dashboard-charts-grid" style={{ marginTop: '12px' }}>
        {/* Low Stock Items Panel */}
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

        {/* Yet To Bill Sales Orders */}
        <div className="chart-panel">
          <div className="panel-header">
            <h3>Yet To Bill (Sales Orders pending Billing)</h3>
            <span className="badge-count" style={{ background: '#fef3c7', color: '#d97706' }}>{yetToBillOrders.length} Pending</span>
          </div>
          <div className="list-container">
            {yetToBillOrders.length === 0 ? (
              <div className="empty-state">
                <p>No outstanding bills pending.</p>
              </div>
            ) : (
              <table className="erp-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>SO Number</th>
                    <th>Customer Name</th>
                    <th>Order Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {yetToBillOrders.map(so => {
                    const amt = so.items.reduce((sum, item) => sum + (item.orderedQty * item.unitPrice), 0);
                    return (
                      <tr key={so.id}>
                        <td className="bold-cell">{so.id}</td>
                        <td className="bold-cell">{so.customerName}</td>
                        <td>{so.date}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${amt.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Customer Segmentation Analysis */}
      <div className="dashboard-charts-grid" style={{ marginTop: '12px' }}>
        {/* Low Value Customers */}
        <div className="chart-panel">
          <div className="panel-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: '#4b5563' }} /> Low Value Customers
            </h3>
            <span className="badge-count" style={{ background: '#f3f4f6', color: '#4b5563' }}>Spent &lt; $5k</span>
          </div>
          <div className="list-container">
            {lowValueCustomers.length === 0 ? (
              <div className="empty-state">
                <p>No customers fall in this bracket.</p>
              </div>
            ) : (
              <table className="erp-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Cust ID</th>
                    <th>Customer Name</th>
                    <th style={{ textAlign: 'right' }}>Credit Limit</th>
                    <th style={{ textAlign: 'right' }}>Total Trade (INR/USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {lowValueCustomers.map(cust => (
                    <tr key={cust.id}>
                      <td className="bold-cell">{cust.id}</td>
                      <td className="bold-cell">{cust.name}</td>
                      <td style={{ textAlign: 'right' }}>${cust.creditLimit?.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#b91c1c', fontWeight: 'bold' }}>${cust.totalSpent?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Volume Customers */}
        <div className="chart-panel">
          <div className="panel-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: '#4b5563' }} /> Low Volume Customers
            </h3>
            <span className="badge-count" style={{ background: '#f3f4f6', color: '#4b5563' }}>&le; 1 Order</span>
          </div>
          <div className="list-container">
            {lowVolumeCustomers.length === 0 ? (
              <div className="empty-state">
                <p>No customers fall in this bracket.</p>
              </div>
            ) : (
              <table className="erp-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Cust ID</th>
                    <th>Customer Name</th>
                    <th style={{ textAlign: 'right' }}>Credit Limit</th>
                    <th style={{ textAlign: 'right' }}>Order Count</th>
                  </tr>
                </thead>
                <tbody>
                  {lowVolumeCustomers.map(cust => (
                    <tr key={cust.id}>
                      <td className="bold-cell">{cust.id}</td>
                      <td className="bold-cell">{cust.name}</td>
                      <td style={{ textAlign: 'right' }}>${cust.creditLimit?.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#b91c1c', fontWeight: 'bold' }}>{cust.orderCount} Order(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .dashboard-container {
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .welcome-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          padding: 24px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        .welcome-banner h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .welcome-banner p {
          font-size: 14px;
          opacity: 0.9;
          max-width: 600px;
        }

        .refresh-btn {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
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

        .dashboard-charts-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 20px;
        }

        @media (max-width: 900px) {
          .dashboard-charts-grid {
            grid-template-columns: 1fr;
          }
        }

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
        }

        .chart-legends {
          display: flex;
          gap: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.sales { background: #3b82f6; }
        .legend-dot.purchase { background: #64748b; }

        .chart-body {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px 0;
        }

        .svg-chart {
          width: 100%;
          height: auto;
          max-height: 220px;
        }

        .chart-bar {
          transition: opacity 0.2s;
          cursor: pointer;
        }

        .chart-bar:hover {
          opacity: 0.85;
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

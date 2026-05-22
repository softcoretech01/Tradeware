import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, ShoppingCart, TrendingUp, Users, 
  ArrowUpRight, AlertCircle, Clock, CheckCircle2, XCircle,
  PlusCircle, RefreshCw, Layers, ShieldCheck, DollarSign,
  Truck
} from 'lucide-react';
import { 
  approveRequisition, 
  approvePurchaseOrder, 
  approveQuotation 
} from '../store/erpSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Load ERP data from store
  const { 
    requisitions, purchaseOrders, quotations, salesOrders, grns,
    deliveryChallans = [], materialIssues = [], approvalRequests = [], documents = [] 
  } = useSelector(state => state.erp);

  // Compute live KPIs
  const pendingPRsCount = requisitions.filter(r => r.status === 'Pending Approval').length;
  const pendingPOCount = purchaseOrders.filter(p => p.status === 'Pending Approval').length;
  const activeQuotationsCount = quotations.filter(q => q.status === 'Sent').length;
  
  // Compute delivery KPIs
  const totalDeliveriesCount = deliveryChallans.length;
  const pendingDeliveriesCount = deliveryChallans.filter(d => d.status === 'Draft').length;
  const inTransitDeliveriesCount = deliveryChallans.filter(d => d.status === 'In Transit' || d.status === 'Dispatched').length;
  const deliveredOrdersCount = deliveryChallans.filter(d => d.status === 'Delivered').length;
  
  // Total Purchases Value
  const totalPurchases = purchaseOrders.reduce((sum, po) => {
    const poVal = po.items.reduce((iSum, item) => iSum + (item.orderedQty * item.unitPrice), 0);
    return sum + poVal;
  }, 0);

  // Total Sales Value (from invoices or customer POs)
  const totalSales = salesOrders.reduce((sum, so) => {
    const soVal = so.items.reduce((iSum, item) => iSum + (item.orderedQty * item.unitPrice), 0);
    return sum + soVal;
  }, 0);

  // Combine approvals needed
  const pendingApprovals = [
    ...requisitions.filter(r => r.status === 'Pending Approval').map(r => ({ ...r, type: 'Requisition', desc: `PR by ${r.requester} (${r.department})` })),
    ...purchaseOrders.filter(p => p.status === 'Pending Approval').map(p => ({ ...p, type: 'Purchase Order', desc: `PO to ${p.supplierName}` })),
    ...quotations.filter(q => q.status === 'Draft' || q.status === 'Sent').map(q => ({ ...q, type: 'Quotation', desc: `Quote to ${q.customerName}` }))
  ].slice(0, 5); // Limit to 5

  const handleApprove = (item) => {
    if (item.type === 'Requisition') {
      dispatch(approveRequisition({ id: item.id, status: 'Approved', approvedBy: 'Admin Manager' }));
    } else if (item.type === 'Purchase Order') {
      dispatch(approvePurchaseOrder({ id: item.id, status: 'Approved', approvedBy: 'Admin Manager' }));
    } else if (item.type === 'Quotation') {
      dispatch(approveQuotation({ id: item.id, status: 'Accepted' }));
    }
  };

  const handleReject = (item) => {
    if (item.type === 'Requisition') {
      dispatch(approveRequisition({ id: item.id, status: 'Rejected', approvedBy: 'Admin Manager' }));
    } else if (item.type === 'Purchase Order') {
      dispatch(approvePurchaseOrder({ id: item.id, status: 'Rejected', approvedBy: 'Admin Manager' }));
    } else if (item.type === 'Quotation') {
      dispatch(approveQuotation({ id: item.id, status: 'Rejected' }));
    }
  };

  // Mock monthly data for SVG Chart (Sales vs Purchases)
  const monthlyData = [
    { month: 'Jan', sales: 12000, purchase: 9500 },
    { month: 'Feb', sales: 15000, purchase: 11000 },
    { month: 'Mar', sales: 18000, purchase: 14000 },
    { month: 'Apr', sales: 16500, purchase: 13000 },
    { month: 'May', sales: totalSales || 24000, purchase: totalPurchases || 16000 }
  ];

  // SVG Chart sizing
  const chartHeight = 200;
  const chartWidth = 500;
  const maxVal = 30000;

  return (
    <div className="dashboard-container fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h1>ERP Overview Dashboard</h1>
          <p>Real-time analytics, workflow approvals, and transaction tracking across purchase and sales cycles.</p>
        </div>
        <button className="refresh-btn" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate('/sales-orders/sales-order-management')}>
          <div className="kpi-icon-wrapper sales">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Gross Sales Order Value</span>
            <span className="kpi-value">${totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> +12.4% vs last month
            </span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/purchase-management/purchase-order')}>
          <div className="kpi-icon-wrapper purchase">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Gross Purchase Commitments</span>
            <span className="kpi-value">${totalPurchases.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="kpi-trend negative">
              <ArrowUpRight size={14} /> +4.2% procurement cost
            </span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/purchase-management/purchase-requisition')}>
          <div className="kpi-icon-wrapper pending-pr">
            <Clock size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Pending Requisitions</span>
            <span className="kpi-value">{pendingPRsCount}</span>
            <span className="kpi-subtext">Requires procurement review</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/sales-orders/quotation-management')}>
          <div className="kpi-icon-wrapper active-qt">
            <FileText size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Open Quotations</span>
            <span className="kpi-value">{activeQuotationsCount}</span>
            <span className="kpi-subtext">Awaiting customer confirmation</span>
          </div>
        </div>
      </div>

      {/* Delivery & Dispatch KPI Cards Grid */}
      <div style={{ marginTop: '24px', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary)' }}>Delivery & Dispatch Metrics</h2>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate('/delivery-dispatch/delivery-challan')}>
          <div className="kpi-icon-wrapper sales" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
            <Truck size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Delivery Challans</span>
            <span className="kpi-value">{totalDeliveriesCount}</span>
            <span className="kpi-subtext">Issued challan vouchers</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/delivery-dispatch/dispatch-tracking')}>
          <div className="kpi-icon-wrapper pending-pr" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Pending Dispatches</span>
            <span className="kpi-value">{pendingDeliveriesCount}</span>
            <span className="kpi-subtext">Awaiting vehicle assignment</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/delivery-dispatch/dispatch-tracking')}>
          <div className="kpi-icon-wrapper active-qt" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
            <RefreshCw size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">In-Transit Shipments</span>
            <span className="kpi-value">{inTransitDeliveriesCount}</span>
            <span className="kpi-subtext">En route to customer sites</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/delivery-dispatch/delivery-challan')}>
          <div className="kpi-icon-wrapper active-qt" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Completed Deliveries</span>
            <span className="kpi-value">{deliveredOrdersCount}</span>
            <span className="kpi-subtext">Delivered & confirmed</span>
          </div>
        </div>
      </div>

      {/* Security & Document Auditing Metrics */}
      <div style={{ marginTop: '24px', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary)' }}>Security & Document Auditing</h2>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate('/user-roles-approval/approval-workflows')}>
          <div className="kpi-icon-wrapper pending-pr" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Pending Approvals</span>
            <span className="kpi-value">{approvalRequests.filter(r => r.status === 'Pending').length}</span>
            <span className="kpi-subtext">Needs signature verification</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/user-roles-approval/approval-workflows')}>
          <div className="kpi-icon-wrapper active-qt" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Approved Transactions</span>
            <span className="kpi-value">{approvalRequests.filter(r => r.status === 'Approved').length}</span>
            <span className="kpi-subtext">Successfully passed validation</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/user-roles-approval/approval-workflows')}>
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Rejected Requests</span>
            <span className="kpi-value">{approvalRequests.filter(r => r.status === 'Rejected').length}</span>
            <span className="kpi-subtext">Failed validation checks</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/document-management/document-management')}>
          <div className="kpi-icon-wrapper sales" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
            <FileText size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Stored Documents</span>
            <span className="kpi-value">{documents.length}</span>
            <span className="kpi-subtext">Attached pdf/dwg files</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Pipeline Grid */}
      <div className="dashboard-charts-grid">
        {/* Sales vs Purchases Chart */}
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
              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = chartHeight - (ratio * (chartHeight - 40)) - 25;
                const val = Math.round(ratio * maxVal);
                return (
                  <g key={idx}>
                    <line x1="40" y1={y} x2={chartWidth - 10} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                      ${val >= 1000 ? `${val / 1000}k` : val}
                    </text>
                  </g>
                );
              })}

              {/* Bar charts rendering */}
              {monthlyData.map((d, idx) => {
                const xGroup = 60 + idx * 85;
                const barWidth = 24;
                const gap = 4;

                const salesHeight = (d.sales / maxVal) * (chartHeight - 40);
                const salesY = chartHeight - salesHeight - 25;

                const purchaseHeight = (d.purchase / maxVal) * (chartHeight - 40);
                const purchaseY = chartHeight - purchaseHeight - 25;

                return (
                  <g key={idx}>
                    {/* Sales Bar */}
                    <rect 
                      x={xGroup} 
                      y={salesY} 
                      width={barWidth} 
                      height={salesHeight} 
                      fill="url(#salesGrad)" 
                      rx="4"
                      className="chart-bar"
                    />
                    {/* Purchase Bar */}
                    <rect 
                      x={xGroup + barWidth + gap} 
                      y={purchaseY} 
                      width={barWidth} 
                      height={purchaseHeight} 
                      fill="url(#purchaseGrad)" 
                      rx="4"
                      className="chart-bar"
                    />
                    {/* Month Label */}
                    <text x={xGroup + barWidth} y={chartHeight - 5} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="500">
                      {d.month}
                    </text>
                  </g>
                );
              })}

              {/* Gradients */}
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

        {/* Pending Approvals Workflow */}
        <div className="approvals-panel">
          <div className="panel-header">
            <h3>Approval Queue</h3>
            <span className="badge-count">{pendingPRsCount + pendingPOCount} pending actions</span>
          </div>
          <div className="approval-list">
            {pendingApprovals.length === 0 ? (
              <div className="empty-state">
                <ShieldCheck size={40} className="empty-icon" />
                <p>All items approved! No pending requests in queue.</p>
              </div>
            ) : (
              pendingApprovals.map((item) => (
                <div key={item.id} className="approval-item">
                  <div className="approval-info">
                    <div className="approval-title-row">
                      <span className="approval-type">{item.type}</span>
                      <span className="approval-id">{item.id}</span>
                    </div>
                    <span className="approval-desc">{item.desc}</span>
                    <span className="approval-date">Submitted: {item.date}</span>
                  </div>
                  <div className="approval-actions">
                    <button className="approve-btn" onClick={() => handleApprove(item)} title="Approve">
                      <CheckCircle2 size={18} />
                    </button>
                    <button className="reject-btn" onClick={() => handleReject(item)} title="Reject">
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delivery Analytics Charts */}
      <div className="dashboard-charts-grid" style={{ marginTop: '24px' }}>
        {/* Vehicle Utilization Summary */}
        <div className="chart-panel">
          <div className="panel-header">
            <h3>Vehicle Utilization Summary</h3>
            <span className="badge-count" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: 'none', padding: '4px 8px' }}>Active Fleet</span>
          </div>
          <div className="chart-body" style={{ flexDirection: 'column', gap: '16px', alignItems: 'stretch', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '10px 0' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justify: 'center' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="3.5"
                  />
                  <path
                    strokeDasharray={`${((inTransitDeliveriesCount || 1) / 8) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{Math.round(((inTransitDeliveriesCount || 1) / 8) * 100)}%</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Active</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></span>
                  <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>In Transit: <strong>{inTransitDeliveriesCount}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                  <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>Available: <strong>{Math.max(0, 8 - inTransitDeliveriesCount)}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                  <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>Active Drivers: <strong>{8}</strong></span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>10-ton Trucks (4 fleet)</span>
                  <span>{inTransitDeliveriesCount > 0 ? '1 Active' : '0 Active'}</span>
                </div>
                <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: inTransitDeliveriesCount > 0 ? '25%' : '0%', height: '100%', background: '#3b82f6', borderRadius: '2px' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>3-ton Vans (4 fleet)</span>
                  <span>{inTransitDeliveriesCount > 1 ? '1 Active' : '0 Active'}</span>
                </div>
                <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: inTransitDeliveriesCount > 1 ? '25%' : '0%', height: '100%', background: '#10b981', borderRadius: '2px' }}></div>
                </div>
              </div>
            </div>
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

      {/* Security & Access Analytics */}
      <div className="dashboard-charts-grid" style={{ marginTop: '24px' }}>
        {/* User Access Distribution by Role */}
        <div className="chart-panel">
          <div className="panel-header">
            <h3>User Role Access Distribution</h3>
            <span className="badge-count" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: 'none', padding: '4px 8px' }}>Active Users</span>
          </div>
          <div className="chart-body" style={{ justifyContent: 'space-around', alignItems: 'center', width: '100%', padding: '10px 0' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="17 83" strokeDashoffset="25" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#d97706" strokeWidth="4" strokeDasharray="17 83" strokeDashoffset="8" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#059669" strokeWidth="4" strokeDasharray="17 83" strokeDashoffset="91" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="17 83" strokeDashoffset="74" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ec4899" strokeWidth="4" strokeDasharray="17 83" strokeDashoffset="57" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#64748b" strokeWidth="4" strokeDasharray="17 83" strokeDashoffset="40" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> Admin (1)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }}></span> Purchase (1)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span> Warehouse (1)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></span> Sales (1)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }}></span> Accounts (1)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748b' }}></span> Management (1)</div>
            </div>
          </div>
        </div>

        {/* Security & Document Logs (Audit Trail) */}
        <div className="approvals-panel">
          <div className="panel-header">
            <h3>Recent Audit Activities</h3>
            <span className="badge-count" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: 'none' }}>Live Trail</span>
          </div>
          <div className="approval-list">
            {[
              ...approvalRequests.map(req => ({
                id: req.id,
                title: `${req.type} - ${req.status}`,
                desc: req.details,
                date: req.requestDate,
                badge: req.status === 'Approved' ? 'success' : req.status === 'Pending' ? 'warning' : 'error'
              })),
              ...documents.map(doc => ({
                id: doc.id,
                title: `Doc Uploaded - ${doc.category}`,
                desc: `${doc.name} (v${doc.version}) by ${doc.uploadedBy}`,
                date: doc.uploadDate,
                badge: 'info'
              }))
            ]
            .sort((a,b) => b.date.localeCompare(a.date))
            .slice(0, 5)
            .map((log, idx) => (
              <div key={idx} className="approval-item" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: log.badge === 'success' ? '#10b981' : log.badge === 'warning' ? '#d97706' : log.badge === 'error' ? '#ef4444' : '#2563eb',
                      background: log.badge === 'success' ? 'rgba(16, 185, 129, 0.08)' : log.badge === 'warning' ? 'rgba(245, 158, 11, 0.08)' : log.badge === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {log.title}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.date}</span>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '2px' }}>{log.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Workflows */}
      <div className="quick-actions-section">
        <h3>Create New Transactions</h3>
        <div className="actions-grid">
          <div className="action-button-card" onClick={() => navigate('/purchase-management/purchase-requisition?create=true')}>
            <PlusCircle size={20} />
            <div>
              <h4>New Requisition</h4>
              <p>Request item purchase</p>
            </div>
          </div>
          <div className="action-button-card" onClick={() => navigate('/purchase-management/purchase-order?create=true')}>
            <PlusCircle size={20} />
            <div>
              <h4>New Purchase Order</h4>
              <p>Draft order with vendor</p>
            </div>
          </div>
          <div className="action-button-card" onClick={() => navigate('/sales-orders/sales-enquiry?create=true')}>
            <PlusCircle size={20} />
            <div>
              <h4>New Sales Enquiry</h4>
              <p>Log incoming lead</p>
            </div>
          </div>
          <div className="action-button-card" onClick={() => navigate('/sales-orders/quotation-management?create=true')}>
            <PlusCircle size={20} />
            <div>
              <h4>New Quotation</h4>
              <p>Draft quotation for deal</p>
            </div>
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
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
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
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kpi-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
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
        .kpi-icon-wrapper.pending-pr { background: rgba(245, 158, 11, 0.1); color: #d97706; }
        .kpi-icon-wrapper.active-qt { background: rgba(16, 185, 129, 0.1); color: #059669; }

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
        .kpi-trend.negative { color: var(--danger); }
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

        .chart-panel, .approvals-panel {
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
          font-size: 16px;
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

        .approval-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .approval-item {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .approval-item:hover {
          border-color: #cbd5e1;
          transform: translateX(2px);
        }

        .approval-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .approval-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .approval-type {
          font-size: 11px;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          background: rgba(30, 64, 175, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .approval-id {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-main);
        }

        .approval-desc {
          font-size: 13px;
          color: var(--text-main);
        }

        .approval-date {
          font-size: 11px;
          color: var(--text-muted);
        }

        .approval-actions {
          display: flex;
          gap: 6px;
        }

        .approve-btn, .reject-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .approve-btn {
          color: var(--accent);
          background: rgba(16, 185, 129, 0.1);
        }

        .approve-btn:hover {
          background: var(--accent);
          color: white;
        }

        .reject-btn {
          color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
        }

        .reject-btn:hover {
          background: var(--danger);
          color: white;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          text-align: center;
          color: var(--text-muted);
          gap: 12px;
        }

        .empty-icon {
          color: var(--accent);
        }

        .quick-actions-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .quick-actions-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-main);
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .action-button-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--shadow-sm);
        }

        .action-button-card:hover {
          border-color: var(--primary-light);
          background: rgba(59, 130, 246, 0.02);
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }

        .action-button-card h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 2px;
        }

        .action-button-card p {
          font-size: 12px;
          color: var(--text-muted);
        }

        .action-button-card svg {
          color: var(--primary-light);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

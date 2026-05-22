import React from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Stack, 
  Divider 
} from '@mui/material';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  AlertTriangle, 
  BarChart3, 
  ShoppingBag,
  Award
} from 'lucide-react';

import DashboardCard from '../../components/DashboardCard';

import {
  currentStockData,
  supplierPerformanceData,
  pendingCustomerOrdersData,
  fastMovingItemsData
} from '../../utils/mockReportsData';

const ReportsDashboards = () => {


  // Extract counts and values for cards
  const dailySalesVal = "$12,450";
  const currentStockVal = "$345,800";
  
  // Pending Qty
  const pendingDeliveriesCount = pendingCustomerOrdersData.filter(o => o.status !== 'Completed').length;
  
  // Low Stock Alert Count
  const lowStockAlertCount = currentStockData.filter(i => i.status === 'Low Stock Alert').length;
  
  const monthlyRevenueVal = "$184,200";

  const renderDashboard = () => (
    <Box className="fade-in" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Metrics Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <DashboardCard
            title="Daily Sales"
            value={dailySalesVal}
            icon={<TrendingUp size={20} />}
            color="#3b82f6"
            badgeText="+12.4%"
            badgeColor="success"
            subtitle="from yesterday"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <DashboardCard
            title="Current Stock Value"
            value={currentStockVal}
            icon={<Package size={20} />}
            color="#1e40af"
            subtitle="Across 3 warehouses"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <DashboardCard
            title="Pending Deliveries"
            value={`${pendingDeliveriesCount} Orders`}
            icon={<Truck size={20} />}
            color="#ef4444"
            badgeText="Attention Required"
            badgeColor="error"
            subtitle="Requires dispatch confirmation"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <DashboardCard
            title="Low Stock Alerts"
            value={`${lowStockAlertCount} Items`}
            icon={<AlertTriangle size={20} />}
            color="#f59e0b"
            badgeText={`${lowStockAlertCount} Critical`}
            badgeColor="error"
            subtitle="Below safety threshold"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <DashboardCard
            title="Monthly Revenue"
            value={monthlyRevenueVal}
            icon={<BarChart3 size={20} />}
            color="#10b981"
            badgeText="+8.2%"
            badgeColor="success"
            subtitle="v/s previous month"
          />
        </Grid>
      </Grid>

      {/* Overview summaries side by side */}
      <Grid container spacing={3}>
        {/* Left column: Low Stock Items & Top Fast Movers */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Low stock alerts panel */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <AlertTriangle color="#f59e0b" size={22} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Critical Low Stock Alerts
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {currentStockData.filter(i => i.status === 'Low Stock Alert').map(item => (
                    <Box 
                      key={item.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 1.5,
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '8px'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {item.itemName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Code: {item.itemCode} | Reorder Level: {item.reorderLevel}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ef4444' }}>
                          {item.currentStock} in stock
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Needs Replenishment
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Fast Moving items panel */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Award color="#10b981" size={22} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Top Fast Moving Items
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {fastMovingItemsData.slice(0, 3).map((item, idx) => (
                    <Box 
                      key={item.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 1.5,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                          sx={{ 
                            width: 28, 
                            height: 28, 
                            borderRadius: '50%', 
                            backgroundColor: '#eff6ff', 
                            color: '#1e40af', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px'
                          }}
                        >
                          #{idx + 1}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {item.itemName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Turnover Rate: {item.turnoverRate}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10b981' }}>
                          {item.salesQty.toLocaleString()} units sold
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Contrib: ${item.profitContribution.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right column: Supplier KPIs & Pending Orders List */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Supplier KPIs */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Award color="#1e40af" size={22} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Supplier Delivery Performance
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {supplierPerformanceData.slice(0, 3).map(supplier => (
                    <Box 
                      key={supplier.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 1.5,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {supplier.supplierName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Lead Time: {supplier.leadTime} Days | Return Rate: {supplier.returnRate}%
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af' }}>
                          {supplier.onTimeDelivery}% On-Time
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Rating: {supplier.qualityRating}/5.0
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Pending Deliveries */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <ShoppingBag color="#ef4444" size={22} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Pending Customer Orders
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {pendingCustomerOrdersData.filter(o => o.status !== 'Completed').map(order => (
                    <Box 
                      key={order.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 1.5,
                        backgroundColor: 'rgba(239, 68, 68, 0.03)',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        borderRadius: '8px'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {order.orderNo} ({order.customer})
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Ordered Qty: {order.orderedQty} | Delivered: {order.deliveredQty}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ef4444' }}>
                          {order.pendingQty} Pending
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Ordered: {order.date}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', minHeight: '100%', py: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ERP Reports & Dashboards
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#64748b', mt: 0.5 }}>
            Central console for monitoring operations, analyzing sales margins, imports, inventory status and logistics.
          </Typography>
        </Box>
      </Box>

      {/* Active Tab Screen */}
      <Box sx={{ mt: 1 }}>
        {renderDashboard()}
      </Box>
    </Box>
  );
};

export default ReportsDashboards;
export { ReportsDashboards };

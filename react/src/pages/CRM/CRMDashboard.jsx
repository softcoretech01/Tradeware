import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Grid, Box, LinearProgress, Chip } from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, Calendar, TrendingUp, UserCheck, FileText,
  Clock, ArrowRight, AlertCircle, Phone, Video, Mail
} from 'lucide-react';
import { completeFollowup } from '../../store/crmSlice';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

const CRMDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Selectors
  const leads = useSelector(state => state.crm.leads);
  const opportunities = useSelector(state => state.crm.opportunities);
  const followups = useSelector(state => state.crm.followups);
  const complaints = useSelector(state => state.crm.complaints);
  const quotations = useSelector(state => state.erp.quotations);

  // Computations
  const totalLeads = leads.length;
  const pendingFollowupsCount = followups.filter(f => f.status === 'Pending').length;
  const openOpportunities = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost');
  const openOpportunitiesCount = openOpportunities.length;
  const convertedCustomersCount = leads.filter(l => l.status === 'Converted').length;
  
  // Pending Quotations (Draft, Sent, Revised)
  const pendingQuotationsCount = quotations.filter(q => ['Draft', 'Sent', 'Revised'].includes(q.status)).length;
  const totalPipelineValue = openOpportunities.reduce((sum, o) => sum + o.value, 0);

  // Chart 1: Lead Distribution
  const leadStatuses = ['New', 'Contacted', 'Follow-up', 'Converted', 'Lost'];
  const leadData = leadStatuses.map(status => ({
    name: status,
    value: leads.filter(l => l.status === status).length
  }));

  // Chart 2: Opportunities Pipeline by Stage
  const stages = ['Qualification', 'Proposal', 'Negotiation', 'Won'];
  const stageData = stages.map(stage => ({
    name: stage,
    value: opportunities.filter(o => o.stage === stage).length,
    amount: opportunities.filter(o => o.stage === stage).reduce((sum, o) => sum + o.value, 0)
  }));

  const upcomingFollowups = followups
    .filter(f => f.status === 'Pending')
    .slice(0, 4);

  const activeComplaints = complaints
    .filter(c => c.status !== 'Resolved' && c.status !== 'Closed')
    .slice(0, 3);

  const handleQuickCompleteFollowup = (id) => {
    dispatch(completeFollowup({ id, notes: 'Follow-up completed via CRM Dashboard quick action.' }));
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>CRM Dashboard</h2>
          <p className="subtitle">Real-time leads overview, opportunity pipelines, follow-ups, and customer tickets.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => navigate('/crm-module/lead-management')}>
            Manage Leads <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">TOTAL LEADS</Typography>
                <Users color="#3b82f6" size={20} />
              </Box>
              <Typography variant="h4" fontWeight="700" sx={{ mt: 1.5 }}>{totalLeads}</Typography>
              <Box display="flex" alignItems="center" mt={1} gap={0.5}>
                <TrendingUp size={14} color="#10b981" />
                <Typography variant="caption" color="#10b981" fontWeight="600">+12% this month</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">PENDING FOLLOW-UPS</Typography>
                <Calendar color="#f59e0b" size={20} />
              </Box>
              <Typography variant="h4" fontWeight="700" sx={{ mt: 1.5 }} color={pendingFollowupsCount > 0 ? "warning.main" : "text.primary"}>
                {pendingFollowupsCount}
              </Typography>
              <Box display="flex" alignItems="center" mt={1} gap={0.5}>
                <Clock size={14} color="#f59e0b" />
                <Typography variant="caption" color="var(--text-muted)">Requires follow-up action</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">OPEN OPPORTUNITIES</Typography>
                <TrendingUp color="#10b981" size={20} />
              </Box>
              <Typography variant="h4" fontWeight="700" sx={{ mt: 1.5 }}>{openOpportunitiesCount}</Typography>
              <Box display="flex" alignItems="center" mt={1} gap={0.5}>
                <Typography variant="caption" color="var(--text-muted)">Est. Value: </Typography>
                <Typography variant="caption" fontWeight="700" color="#10b981">${totalPipelineValue.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">CONVERTED CUSTOMERS</Typography>
                <UserCheck color="#8b5cf6" size={20} />
              </Box>
              <Typography variant="h4" fontWeight="700" sx={{ mt: 1.5 }}>{convertedCustomersCount}</Typography>
              <Box display="flex" alignItems="center" mt={1} gap={0.5}>
                <LinearProgress 
                  variant="determinate" 
                  value={totalLeads ? (convertedCustomersCount / totalLeads) * 100 : 0} 
                  sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#8b5cf6' } }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">PENDING QUOTATIONS</Typography>
                <FileText color="#64748b" size={20} />
              </Box>
              <Typography variant="h4" fontWeight="700" sx={{ mt: 1.5 }}>{pendingQuotationsCount}</Typography>
              <Box display="flex" alignItems="center" mt={1} gap={0.5}>
                <Clock size={14} color="#64748b" />
                <Typography variant="caption" color="var(--text-muted)">Awaiting client sign-off</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <div className="grid-card" style={{ padding: '24px' }}>
            <Typography variant="h6" fontWeight="600" color="var(--secondary)" mb={2}>Leads Sales Funnel</Typography>
            <Box height={320}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip formatter={(value) => [`${value} Leads`, 'Count']} />
                  <Bar dataKey="value" fill="var(--primary-light)" radius={[4, 4, 0, 0]} barSize={40}>
                    {leadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </div>
        </Grid>

        <Grid item xs={12} md={5}>
          <div className="grid-card" style={{ padding: '24px' }}>
            <Typography variant="h6" fontWeight="600" color="var(--secondary)" mb={2}>Opportunities Value by Stage</Typography>
            <Box height={320}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="name"
                  >
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Estimated Value']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </div>
        </Grid>
      </Grid>

      {/* Widgets Section */}
      <Grid container spacing={3}>
        {/* Urgent Follow-ups */}
        <Grid item xs={12} md={7}>
          <div className="grid-card" style={{ padding: '24px' }}>
            <Typography variant="h6" fontWeight="600" color="var(--secondary)" mb={2}>Urgent Follow-ups</Typography>
            {upcomingFollowups.length === 0 ? (
              <Box py={6} textAlign="center" color="var(--text-muted)" fontStyle="italic">
                No pending follow-ups scheduled. Good job!
              </Box>
            ) : (
              <table className="erp-table" style={{ border: 'none' }}>
                <thead>
                  <tr style={{ background: 'transparent' }}>
                    <th style={{ paddingLeft: 0 }}>Target / Contact</th>
                    <th>Type</th>
                    <th>Due Time</th>
                    <th>Action Notes</th>
                    <th className="actions-column">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingFollowups.map(f => (
                    <tr key={f.id} style={{ background: 'transparent' }}>
                      <td style={{ paddingLeft: 0 }} className="bold-cell">
                        <div>{f.entityName}</div>
                        <Typography variant="caption" color="var(--text-muted)">{f.entityType} ID: {f.entityId}</Typography>
                      </td>
                      <td>
                        <Box display="flex" alignItems="center" gap={1}>
                          {f.type === 'Call' && <Phone size={14} color="#3b82f6" />}
                          {f.type === 'Meeting' && <Video size={14} color="#10b981" />}
                          {f.type === 'Email' && <Mail size={14} color="#f59e0b" />}
                          <span>{f.type}</span>
                        </Box>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(f.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td>
                        <span style={{ display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.notes}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '12px' }} 
                          onClick={() => handleQuickCompleteFollowup(f.id)}
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => navigate('/crm-module/follow-up-tracking')}>
                View All Follow-ups
              </button>
            </Box>
          </div>
        </Grid>

        {/* Complaints Widget */}
        <Grid item xs={12} md={5}>
          <div className="grid-card" style={{ padding: '24px' }}>
            <Typography variant="h6" fontWeight="600" color="var(--secondary)" mb={2}>Active Customer Tickets</Typography>
            {activeComplaints.length === 0 ? (
              <Box py={6} textAlign="center" color="var(--text-muted)" fontStyle="italic">
                No active complaints registered.
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {activeComplaints.map(c => (
                  <Box 
                    key={c.id} 
                    p={1.5} 
                    border="1px solid var(--border)" 
                    borderRadius="var(--radius)"
                    bgcolor="var(--background)"
                    display="flex"
                    flexDirection="column"
                    gap={1}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <span className="bold-cell" style={{ fontSize: '13px' }}>{c.id}: {c.subject}</span>
                      <Chip 
                        label={c.priority} 
                        color={c.priority === 'High' ? 'error' : c.priority === 'Medium' ? 'warning' : 'default'} 
                        size="small" 
                        sx={{ height: 20, fontSize: '11px' }}
                      />
                    </Box>
                    <Typography variant="caption" color="var(--text-muted)">
                      <strong>Customer:</strong> {c.customerName}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Typography variant="caption" color="var(--text-muted)">
                        <strong>Status:</strong> <span style={{ color: '#f59e0b', fontWeight: 600 }}>{c.status}</span>
                      </Typography>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '2px 6px', fontSize: '11px' }}
                        onClick={() => navigate('/crm-module/complaint-management')}
                      >
                        Inspect
                      </button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => navigate('/crm-module/complaint-management')}>
                Go to Ticket Board
              </button>
            </Box>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default CRMDashboard;

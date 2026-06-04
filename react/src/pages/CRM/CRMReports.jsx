import { formatDate } from '../../utils/dateUtils';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Tabs, Tab, Box, Typography, Chip, Grid, Card, CardContent } from '@mui/material';
import { 
  FileSpreadsheet, FileText, ChevronRight, TrendingUp, Calendar, AlertCircle
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';


const CRMReports = () => {
  // Selectors
  const leads = useSelector(state => state.crm.leads);
  const opportunities = useSelector(state => state.crm.opportunities);
  const followups = useSelector(state => state.crm.followups);
  const complaints = useSelector(state => state.crm.complaints);
  const usersList = useSelector(state => state.erp.users);
  const salesTeam = usersList.filter(u => u.role === 'Sales Team' || u.role === 'Admin');

  // Local States
  const [activeTab, setActiveTab] = useState(0);

  // --- Lead Conversion Calculations ---
  const sources = ['Website', 'Referral', 'Cold Call', 'Exhibition', 'Social Media'];
  const leadReportData = sources.map(src => {
    const srcLeads = leads.filter(l => l.source === src);
    const total = srcLeads.length;
    const contacted = srcLeads.filter(l => ['Contacted', 'Follow-up', 'Converted'].includes(l.status)).length;
    const converted = srcLeads.filter(l => l.status === 'Converted').length;
    const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
    return { source: src, total, contacted, converted, rate: parseFloat(rate) };
  });

  const overallTotalLeads = leads.length;
  const overallConverted = leads.filter(l => l.status === 'Converted').length;
  const overallConvRate = overallTotalLeads > 0 ? ((overallConverted / overallTotalLeads) * 100).toFixed(1) : '0.0';

  // --- Pending Follow-ups Report ---
  const pendingFollowupsReport = followups
    .filter(f => f.status === 'Pending')
    .map(f => {
      // Find salesperson associated with lead
      let salesperson = 'N/A';
      if (f.entityType === 'Lead') {
        const lead = leads.find(l => l.id === f.entityId);
        if (lead) {
          salesperson = salesTeam.find(u => u.id === lead.assignedSalesperson)?.name || lead.assignedSalesperson;
        }
      } else if (f.entityType === 'Opportunity') {
        const opp = opportunities.find(o => o.id === f.entityId);
        if (opp) {
          salesperson = salesTeam.find(u => u.id === opp.assignedSalesperson)?.name || opp.assignedSalesperson;
        }
      }
      return {
        ...f,
        salesperson
      };
    });

  // --- Opportunity Forecast ---
  const opportunityReportData = opportunities.map(o => {
    const salespersonName = salesTeam.find(u => u.id === o.assignedSalesperson)?.name || o.assignedSalesperson;
    return {
      id: o.id,
      customerName: o.customerName,
      value: o.value,
      stage: o.stage,
      closeDate: o.expectedClosingDate,
      salesperson: salespersonName
    };
  }).sort((a, b) => new Date(a.closeDate) - new Date(b.closeDate));

  const totalForecastValue = opportunityReportData
    .filter(o => o.stage !== 'Lost')
    .reduce((sum, o) => sum + o.value, 0);

  // --- Complaints Performance ---
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;
  const highPriorityCount = complaints.filter(c => c.priority === 'High' && c.status !== 'Resolved').length;

  // --- Export Actions ---
  const handleExportExcel = () => {
    if (activeTab === 0) {
      const formatted = leadReportData.map(d => ({
        'Source Channel': d.source,
        'Total Leads': d.total,
        'Leads Contacted': d.contacted,
        'Leads Converted': d.converted,
        'Conversion Rate (%)': d.rate
      }));
      exportToExcel(formatted, 'CRM_Lead_Conversion_Report', 'Conversion');
    } else if (activeTab === 1) {
      const formatted = pendingFollowupsReport.map(f => ({
        'Task ID': f.id,
        'Prospect Name': f.entityName,
        'Module': f.entityType,
        'Reference ID': f.entityId,
        'Type': f.type,
        'Scheduled Time': new Date(f.dateTime).toLocaleString(),
        'Assigned Rep': f.salesperson,
        'Agenda Notes': f.notes
      }));
      exportToExcel(formatted, 'CRM_Pending_Followups_Report', 'Followups');
    } else if (activeTab === 2) {
      const formatted = opportunityReportData.map(o => ({
        'Opportunity ID': o.id,
        'Customer Name': o.customerName,
        'Expected Value ($)': o.value,
        'Stage': o.stage,
        'Close Date Target': o.closeDate,
        'Executive Rep': o.salesperson
      }));
      exportToExcel(formatted, 'CRM_Opportunity_Pipeline_Report', 'Pipeline');
    } else if (activeTab === 3) {
      const formatted = complaints.map(c => ({
        'Ticket ID': c.id,
        'Customer Name': c.customerName,
        'Subject': c.subject,
        'Priority': c.priority,
        'Status': c.status,
        'Date Logged': c.dateLogged,
        'Date Resolved': c.dateResolved || 'N/A',
        'Resolution Summary': c.resolutionNotes || 'N/A'
      }));
      exportToExcel(formatted, 'CRM_Complaints_Audit_Report', 'Complaints');
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 0) {
      const cols = [
        { field: 'source', headerName: 'Source Channel' },
        { field: 'total', headerName: 'Total Leads' },
        { field: 'contacted', headerName: 'Leads Contacted' },
        { field: 'converted', headerName: 'Leads Converted' },
        { field: 'rate', headerName: 'Conversion Rate (%)' }
      ];
      exportToPDF(cols, leadReportData, 'CRM_Lead_Conversion_Report', 'Lead Conversion Funnel Report');
    } else if (activeTab === 1) {
      const cols = [
        { field: 'id', headerName: 'Task ID' },
        { field: 'entityName', headerName: 'Prospect Name' },
        { field: 'type', headerName: 'Mode' },
        { field: 'dateTime', headerName: 'Scheduled Time' },
        { field: 'salesperson', headerName: 'Assigned Salesperson' }
      ];
      exportToPDF(cols, pendingFollowupsReport, 'CRM_Pending_Followups_Report', 'CRM Overdue & Pending Follow-ups Report');
    } else if (activeTab === 2) {
      const cols = [
        { field: 'id', headerName: 'Opp ID' },
        { field: 'customerName', headerName: 'Prospect Name' },
        { field: 'value', headerName: 'Expected Value ($)' },
        { field: 'stage', headerName: 'Stage' },
        { field: 'closeDate', headerName: 'Close Target Date' },
        { field: 'salesperson', headerName: 'Assigned Rep' }
      ];
      exportToPDF(cols, opportunityReportData, 'CRM_Opportunity_Pipeline_Report', 'Opportunity Sales Forecast Pipeline Report');
    } else if (activeTab === 3) {
      const cols = [
        { field: 'id', headerName: 'Ticket ID' },
        { field: 'customerName', headerName: 'Customer' },
        { field: 'subject', headerName: 'Subject Issue' },
        { field: 'priority', headerName: 'Priority' },
        { field: 'status', headerName: 'Ticket Status' },
        { field: 'dateLogged', headerName: 'Date Logged' }
      ];
      exportToPDF(cols, complaints, 'CRM_Complaints_Audit_Report', 'CRM Customer Complaint Tickets Report');
    }
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>CRM Reports & Analytics</h2>
          <p className="subtitle">Execute custom sales pipeline audits, track conversion metrics, forecast closing opportunities, and audit customer tickets.</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="outlined" 
            startIcon={<FileSpreadsheet size={16} />} 
            onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#E8F5E9' }, borderRadius: 2 }}
          >
            Export Excel
          </Button>
          <button className="btn-secondary" onClick={handleExportPDF}>
            <FileText size={16} /> Print PDF
          </button>
        </div>
      </div>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
            <Tab label="Lead Conversion Report" />
            <Tab label="Pending Follow-up Report" />
            <Tab label="Opportunity Forecast" />
            <Tab label="Complaint Audit" />
          </Tabs>
        </Box>

        {/* Tab 0: Lead Conversion Report */}
        {activeTab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent>
                    <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">TOTAL LEADS ACQUIRED</Typography>
                    <Typography variant="h4" fontWeight="700" sx={{ mt: 1 }}>{overallTotalLeads}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent>
                    <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">LEADS CONVERTED</Typography>
                    <Typography variant="h4" fontWeight="700" color="success.main" sx={{ mt: 1 }}>{overallConverted}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent>
                    <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">CONVERSION RATE</Typography>
                    <Typography variant="h4" fontWeight="700" color="primary.main" sx={{ mt: 1 }}>{overallConvRate}%</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <div className="grid-card">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Source Channel</th>
                    <th>Total Prospects</th>
                    <th>Prospects Contacted</th>
                    <th>Conversions (Won)</th>
                    <th>Conversion Rate (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {leadReportData.map(d => (
                    <tr key={d.source}>
                      <td className="bold-cell">{d.source}</td>
                      <td>{d.total}</td>
                      <td>{d.contacted}</td>
                      <td>
                        <Chip label={d.converted} color="success" size="small" variant="light" />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{d.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 1: Pending Follow-up Report */}
        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', p: '12px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 'var(--radius)' }}>
              <AlertCircle size={20} color="#f59e0b" />
              <span style={{ fontSize: '13px', color: '#b45309', fontWeight: 600 }}>
                A total of {pendingFollowupsReport.length} customer follow-up actions require attention.
              </span>
            </div>

            <div className="grid-card">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Prospect Name</th>
                    <th>Module</th>
                    <th>Target ID</th>
                    <th>Follow-up Mode</th>
                    <th>Scheduled Date & Time</th>
                    <th>Assigned Rep</th>
                    <th>Agenda Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFollowupsReport.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="table-empty">No pending follow-ups scheduled.</td>
                    </tr>
                  ) : (
                    pendingFollowupsReport.map(f => (
                      <tr key={f.id}>
                        <td className="bold-cell">{f.id}</td>
                        <td style={{ fontWeight: 600 }}>{f.entityName}</td>
                        <td>{f.entityType}</td>
                        <td>{f.entityId}</td>
                        <td>{f.type}</td>
                        <td>{new Date(f.dateTime).toLocaleString()}</td>
                        <td>{f.salesperson}</td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Opportunity Forecast */}
        {activeTab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent>
                    <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">EXPECTED FORECAST VALUE</Typography>
                    <Typography variant="h4" fontWeight="700" color="primary.main" sx={{ mt: 1 }}>
                      ${totalForecastValue.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent>
                    <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">TOTAL FORECAST DEALS</Typography>
                    <Typography variant="h4" fontWeight="700" sx={{ mt: 1 }}>
                      {opportunityReportData.filter(o => o.stage !== 'Lost').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <div className="grid-card">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Opp ID</th>
                    <th>Customer Name</th>
                    <th>Pipeline Stage</th>
                    <th>Expected Closing Date</th>
                    <th>Assigned Representative</th>
                    <th>Deal Value ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunityReportData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="table-empty">No opportunities logged.</td>
                    </tr>
                  ) : (
                    opportunityReportData.map(o => (
                      <tr key={o.id}>
                        <td className="bold-cell">{o.id}</td>
                        <td style={{ fontWeight: 600 }}>{o.customerName}</td>
                        <td>
                          <Chip 
                            label={o.stage} 
                            color={o.stage === 'Won' ? 'success' : o.stage === 'Lost' ? 'error' : 'primary'} 
                            size="small" 
                          />
                        </td>
                        <td>{formatDate(o.closeDate)}</td>
                        <td>{o.salesperson}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                          ${o.value?.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Complaint Audit */}
        {activeTab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent>
                    <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">TOTAL COMPLAINTS LOGGED</Typography>
                    <Typography variant="h4" fontWeight="700" sx={{ mt: 1 }}>{totalComplaints}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent>
                    <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">RESOLVED PERFORMANCE</Typography>
                    <Typography variant="h4" fontWeight="700" color="success.main" sx={{ mt: 1 }}>{resolvedComplaints}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent>
                    <Typography color="var(--text-muted)" variant="subtitle2" fontWeight="600">UNRESOLVED URGENT (HIGH)</Typography>
                    <Typography variant="h4" fontWeight="700" color="error.main" sx={{ mt: 1 }}>{highPriorityCount}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <div className="grid-card">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Customer Name</th>
                    <th>Subject Issue</th>
                    <th>Priority</th>
                    <th>Date Logged</th>
                    <th>Resolved Date</th>
                    <th>Ticket Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-empty">No complaint tickets logged.</td>
                    </tr>
                  ) : (
                    complaints.map(c => (
                      <tr key={c.id}>
                        <td className="bold-cell">{c.id}</td>
                        <td style={{ fontWeight: 600 }}>{c.customerName}</td>
                        <td>{c.subject}</td>
                        <td>
                          <Chip 
                            label={c.priority} 
                            color={c.priority === 'High' ? 'error' : c.priority === 'Medium' ? 'warning' : 'default'} 
                            size="small" 
                          />
                        </td>
                        <td>{c.dateLogged}</td>
                        <td>{c.dateResolved || 'Pending'}</td>
                        <td>
                          <Chip 
                            label={c.status} 
                            color={c.status === 'Resolved' ? 'success' : 'primary'} 
                            size="small" 
                            variant="outlined"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Box>
    </div>
  );
};

export default CRMReports;

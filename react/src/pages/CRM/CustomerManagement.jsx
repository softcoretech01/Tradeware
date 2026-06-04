import { formatDate } from '../../utils/dateUtils';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Chip, Tooltip, IconButton, Tab, Tabs, Box
} from '@mui/material';
import { 
  Search, Eye, Phone, Mail, MapPin, BadgePercent, 
  History, ShoppingBag, FileText, CheckCircle2, FileSpreadsheet
} from 'lucide-react';
import { exportToExcel } from '../../utils/exportUtil';


const CustomerManagement = () => {
  // Redux Selectors
  const customers = useSelector(state => state.customers.customers);
  const salesEnquiries = useSelector(state => state.erp.salesEnquiries);
  const quotations = useSelector(state => state.erp.quotations);
  const salesOrders = useSelector(state => state.erp.salesOrders);
  const opportunities = useSelector(state => state.crm.opportunities);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleOpenDetails = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab(0);
    setDetailOpen(true);
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter ? c.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Compile Customer History
  const getCustomerHistory = (custId, custName) => {
    const enquiries = salesEnquiries.filter(e => e.customerId === custId || e.customerName === custName);
    const quotes = quotations.filter(q => q.customerId === custId || q.customerName === custName);
    const orders = salesOrders.filter(o => o.customerName === custName);
    const customerOpps = opportunities.filter(o => o.leadId === custId || o.customerName === custName);

    // Flat map into a structured historical timeline
    const timeline = [
      ...enquiries.map(e => ({
        date: e.date,
        type: 'Enquiry',
        ref: e.id,
        details: `${e.items.length} items requested via ${e.source}.`,
        status: e.status,
        value: e.items.reduce((sum, item) => sum + (item.qty * item.targetPrice), 0)
      })),
      ...quotes.map(q => ({
        date: q.date,
        type: 'Quotation',
        ref: q.id,
        details: `Quoted with terms ${q.paymentTerms}. Version: v${q.revision}`,
        status: q.status,
        value: q.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0)
      })),
      ...orders.map(o => ({
        date: o.date,
        type: 'Sales Order',
        ref: o.id,
        details: `Order processed from Warehouse ${o.warehouse}. Delivery: ${o.deliveryStatus}`,
        status: o.invoiceGenerated ? 'Invoiced' : 'Pending Invoice',
        value: o.items.reduce((sum, item) => sum + (item.orderedQty * item.unitPrice), 0)
      })),
      ...customerOpps.map(opp => ({
        date: opp.expectedClosingDate,
        type: 'Opportunity',
        ref: opp.id,
        details: `Sales deal stage: ${opp.stage}. notes: ${opp.notes}`,
        status: opp.stage,
        value: opp.value
      }))
    ];

    // Sort by date descending
    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleExportExcel = () => {
    const data = filteredCustomers.map(c => ({
      'Customer ID': c.id,
      'Company Name': c.name,
      'Email': c.email,
      'Phone': c.phone,
      'Customer Type': c.type,
      'Status': c.active ? 'Active' : 'Inactive',
      'Price Category': c.priceCategory,
      'Payment Terms': c.paymentTerms,
      'Credit Limit ($)': c.creditLimit,
      'GSTIN': c.gstDetails?.gstin || 'N/A',
      'Address': `${c.billingAddress?.line1}, ${c.billingAddress?.line2 || ''}, ${c.billingAddress?.city}, ${c.billingAddress?.zip}`
    }));
    exportToExcel(data, 'CRM_Customer_Database', 'Customers');
  };

  const currentHistory = selectedCustomer 
    ? getCustomerHistory(selectedCustomer.id, selectedCustomer.name) 
    : [];

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Customer Management</h2>
          <p className="subtitle">Explore active customer profiles, inspect key contact roles, tax settings, and audit their historical transaction trails.</p>
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
        </div>
      </div>

      {/* Filter Panel */}
      <div className="filter-panel">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, Company, Phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Contractors">Contractors</option>
            <option value="Dealers">Dealers</option>
            <option value="House Owners">House Owners</option>
            <option value="Corporate">Corporate</option>
          </select>
        </div>
      </div>

      {/* Customer Grid Table */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Category</th>
              <th>Pricing Mode</th>
              <th className="text-right">Credit Limit</th>
              <th>Terms</th>
              <th>Contact Phone</th>
              <th>Tax Status</th>
              <th className="actions-column">Profile</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan="9" className="table-empty">No customers found.</td>
              </tr>
            ) : (
              paginatedCustomers.map(c => (
                <tr key={c.id}>
                  <td className="bold-cell ">{c.id}</td>
                  <td style={{ fontWeight: 600 }} >{c.name}</td>
                  <td>
                    <Chip label={c.type} variant="outlined" size="small" />
                  </td>
                  <td  className="text-right">{c.priceCategory}</td>
                  <td className="text-right" style={{ fontWeight: 600 }}>${c.creditLimit?.toLocaleString()}</td>
                  <td >{c.paymentTerms}</td>
                  <td >{c.phone}</td>
                  <td>
                    {c.gstDetails?.gstin ? (
                      <Chip label="GST Registered" color="success" size="small" variant="light" sx={{ height: '22px' }} />
                    ) : (
                      <Chip label="Unregistered" size="small" variant="light" sx={{ height: '22px' }} />
                    )}
                  </td>
                  <td className="actions-cell">
                    <Tooltip title="View Full Customer History & details">
                      <IconButton size="small" color="primary" onClick={() => handleOpenDetails(c)}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Custom Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
            <button 
              className="btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '13px' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Page {currentPage} of {totalPages}</span>
            <button 
              className="btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '13px' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* CUSTOMER PROFILE DETAIL DIALOG */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          Customer Profile Explorer: {selectedCustomer?.name} ({selectedCustomer?.id})
        </DialogTitle>
        <DialogContent dividers>
          {selectedCustomer && (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
                  <Tab icon={<Eye size={16} style={{ marginRight: '6px' }} />} iconPosition="start" label="General Info & Address" />
                  <Tab icon={<History size={16} style={{ marginRight: '6px' }} />} iconPosition="start" label="Interaction History" />
                </Tabs>
              </Box>

              {/* Tab 0: Details & Addresses */}
              {activeTab === 0 && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Grid details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Customer Configs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>Client Settings</h4>
                      <div className="view-detail-row">
                        <strong>Credit Limit:</strong> <span>${selectedCustomer.creditLimit?.toLocaleString()}</span>
                      </div>
                      <div className="view-detail-row">
                        <strong>Payment Terms:</strong> <span>{selectedCustomer.paymentTerms}</span>
                      </div>
                      <div className="view-detail-row">
                        <strong>Price Category:</strong> <span>{selectedCustomer.priceCategory}</span>
                      </div>
                      <div className="view-detail-row">
                        <strong>Email Address:</strong> <span>{selectedCustomer.email}</span>
                      </div>
                      <div className="view-detail-row">
                        <strong>Registered Phone:</strong> <span>{selectedCustomer.phone}</span>
                      </div>
                    </div>

                    {/* Tax configuration */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>Tax & GST Settings</h4>
                      <div className="view-detail-row">
                        <strong>Registration Type:</strong> <span>{selectedCustomer.gstDetails?.regType || 'Unregistered'}</span>
                      </div>
                      <div className="view-detail-row">
                        <strong>GSTIN / VAT No:</strong> <span>{selectedCustomer.gstDetails?.gstin || 'N/A'}</span>
                      </div>
                      <div className="view-detail-row">
                        <strong>State Tax Code:</strong> <span>{selectedCustomer.gstDetails?.stateCode || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '10px' }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', background: 'var(--background)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--secondary)', fontWeight: 600 }}>
                        <MapPin size={16} /> Billing Address
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                        {selectedCustomer.billingAddress?.line1}<br />
                        {selectedCustomer.billingAddress?.line2 && <>{selectedCustomer.billingAddress.line2}<br /></>}
                        {selectedCustomer.billingAddress?.city}, {selectedCustomer.billingAddress?.state} {selectedCustomer.billingAddress?.zip}
                      </div>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', background: 'var(--background)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--secondary)', fontWeight: 600 }}>
                        <MapPin size={16} /> Shipping Address
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                        {selectedCustomer.shippingAddress?.line1}<br />
                        {selectedCustomer.shippingAddress?.line2 && <>{selectedCustomer.shippingAddress.line2}<br /></>}
                        {selectedCustomer.shippingAddress?.city}, {selectedCustomer.shippingAddress?.state} {selectedCustomer.shippingAddress?.zip}
                      </div>
                    </div>
                  </div>

                  {/* Contact Persons */}
                  <div style={{ marginTop: '10px' }}>
                    <h4 style={{ color: 'var(--secondary)', marginBottom: '10px' }}>Key Contact Persons</h4>
                    {selectedCustomer.contactPersons?.length === 0 ? (
                      <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-muted)' }}>No contact person registered.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                        {selectedCustomer.contactPersons?.map((cp, idx) => (
                          <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', background: 'var(--surface)' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{cp.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{cp.designation}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '2px' }}>
                              <Phone size={12} color="var(--text-muted)" /> {cp.phone}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                              <Mail size={12} color="var(--text-muted)" /> {cp.email}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 1: Transaction and CRM History timeline */}
              {activeTab === 1 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: 'var(--secondary)', marginBottom: '16px' }}>Timeline Activity Feed</h4>
                  {currentHistory.length === 0 ? (
                    <Box py={6} textAlign="center" color="var(--text-muted)" fontStyle="italic">
                      No sales history or active opportunity logged for this customer.
                    </Box>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid var(--border)', paddingLeft: '20px', marginLeft: '10px' }}>
                      {currentHistory.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          {/* Timeline dot */}
                          <div style={{ 
                            position: 'absolute', 
                            left: '-29px', 
                            top: '4px', 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%', 
                            background: item.type === 'Sales Order' ? '#10b981' : item.type === 'Quotation' ? '#3b82f6' : item.type === 'Opportunity' ? '#8b5cf6' : '#f59e0b',
                            border: '3px solid #fff',
                            boxShadow: 'var(--shadow-sm)'
                          }} />
                          
                          {/* Feed Box */}
                          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px', background: 'var(--background)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '13px' }}>{item.type} : {item.ref}</span>
                                <Chip label={item.status} size="small" sx={{ height: '18px', fontSize: '10px' }} />
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(item.date)}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>{item.details}</div>
                            {item.value > 0 && (
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginTop: '6px' }}>
                                Deal Value: ${item.value.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)} color="primary">Close Explorer</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;

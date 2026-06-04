import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  leads: [
    {
      id: 'LEAD-001',
      name: 'TechCorp Systems',
      contactPerson: 'Alex Mercer',
      email: 'alex@techcorp.com',
      phone: '98221144',
      source: 'Website',
      status: 'New',
      assignedSalesperson: 'usr004', // Sachin
      followUpDate: '2026-05-29',
      notes: 'Interested in bulk inventory systems integration.',
      opportunityValue: 12000,
      createdDate: '2026-05-20'
    },
    {
      id: 'LEAD-002',
      name: 'BioMed Solutions',
      contactPerson: 'Sarah Connor',
      email: 'sconnor@biomed.com',
      phone: '91112223',
      source: 'Referral',
      status: 'Contacted',
      assignedSalesperson: 'usr004', // Sachin
      followUpDate: '2026-05-28',
      notes: 'Requested product catalog and pricing sheet.',
      opportunityValue: 25000,
      createdDate: '2026-05-18'
    },
    {
      id: 'LEAD-003',
      name: 'Apex Infrastructure',
      contactPerson: 'Bruce Wayne',
      email: 'bwayne@apex.com',
      phone: '87654321',
      source: 'Exhibition',
      status: 'Follow-up',
      assignedSalesperson: 'usr001', // Admin User
      followUpDate: '2026-05-26',
      notes: 'Discussed high volume purchase at Expo. Needs customized proposal.',
      opportunityValue: 45000,
      createdDate: '2026-05-12'
    },
    {
      id: 'LEAD-004',
      name: 'Delta Logistics',
      contactPerson: 'Ellen Ripley',
      email: 'ripley@delta.com',
      phone: '98761234',
      source: 'Cold Call',
      status: 'Converted',
      assignedSalesperson: 'usr004', // Sachin
      followUpDate: '2026-05-25',
      notes: 'Qualified. Converted to Opportunity and active negotiation.',
      opportunityValue: 18000,
      createdDate: '2026-05-08'
    },
    {
      id: 'LEAD-005',
      name: 'Zenith Manufacturing',
      contactPerson: 'Peter Parker',
      email: 'peter@zenith.com',
      phone: '81234567',
      source: 'Social Media',
      status: 'Lost',
      assignedSalesperson: 'usr004', // Sachin
      followUpDate: '2026-05-02',
      notes: 'Lead lost. Budget mismatch.',
      opportunityValue: 30000,
      createdDate: '2026-05-02'
    }
  ],
  opportunities: [
    {
      id: 'OPP-001',
      leadId: 'LEAD-004',
      customerName: 'Delta Logistics',
      value: 18000,
      stage: 'Proposal',
      expectedClosingDate: '2026-06-15',
      assignedSalesperson: 'usr004', // Sachin
      notes: 'Quotation sent. Customer is currently reviewing legal/payment terms.'
    },
    {
      id: 'OPP-002',
      leadId: 'LEAD-001',
      customerName: 'TechCorp Systems',
      value: 12000,
      stage: 'Qualification',
      expectedClosingDate: '2026-07-01',
      assignedSalesperson: 'usr004', // Sachin
      notes: 'Identifying detailed requirements for piston items.'
    },
    {
      id: 'OPP-003',
      leadId: 'CUST-1',
      customerName: 'ACE FIRE ENGINEERING PTE LTD',
      value: 35000,
      stage: 'Negotiation',
      expectedClosingDate: '2026-06-10',
      assignedSalesperson: 'usr001', // Admin User
      notes: 'Negotiating discount margins on bulk order.'
    },
    {
      id: 'OPP-004',
      leadId: 'LEAD-003',
      customerName: 'Apex Infrastructure',
      value: 45000,
      stage: 'Won',
      expectedClosingDate: '2026-05-24',
      assignedSalesperson: 'usr001', // Admin User
      notes: 'Deal closed. Sales order created.'
    }
  ],
  followups: [
    {
      id: 'FOL-001',
      entityType: 'Lead',
      entityId: 'LEAD-003',
      entityName: 'Apex Infrastructure',
      type: 'Meeting',
      dateTime: '2026-05-26T10:00',
      notes: 'Discuss proposal revisions and custom sizes.',
      status: 'Pending'
    },
    {
      id: 'FOL-002',
      entityType: 'Opportunity',
      entityId: 'OPP-001',
      entityName: 'Delta Logistics',
      type: 'Call',
      dateTime: '2026-05-25T15:30',
      notes: 'Follow up on quotation feedback and delivery terms.',
      status: 'Pending'
    },
    {
      id: 'FOL-003',
      entityType: 'Lead',
      entityId: 'LEAD-002',
      entityName: 'BioMed Solutions',
      type: 'Email',
      dateTime: '2026-05-28T09:00',
      notes: 'Send introduction deck and industrial parts brochure.',
      status: 'Pending'
    },
    {
      id: 'FOL-004',
      entityType: 'Lead',
      entityId: 'LEAD-004',
      entityName: 'Delta Logistics',
      type: 'Call',
      dateTime: '2026-05-22T14:00',
      notes: 'Qualifying call completed. Customer requests immediate quote.',
      status: 'Completed'
    }
  ],
  complaints: [
    {
      id: 'CMP-001',
      customerId: 'CUST-1',
      customerName: 'ACE FIRE ENGINEERING PTE LTD',
      subject: 'Delivery Delay on DC-2026-001',
      description: 'Customer complained that 5 pieces of Pin Piston Sanchin 120 were rejected due to surface scratches and the delivery was delayed by a day.',
      priority: 'High',
      status: 'Resolved',
      resolutionNotes: 'Sent replacement items via special dispatch on vehicle YC-5678-B.',
      dateLogged: '2026-05-16',
      dateResolved: '2026-05-17'
    },
    {
      id: 'CMP-002',
      customerId: 'CUST-2',
      customerName: 'AIR LIQUIDE SINGAPORE PTE LTD',
      subject: 'Incorrect Invoice Rates',
      description: 'The unit prices listed in invoice INV-2026-001 did not reflect the agreed distributor markup.',
      priority: 'Medium',
      status: 'In Progress',
      resolutionNotes: '',
      dateLogged: '2026-05-24',
      dateResolved: null
    },
    {
      id: 'CMP-003',
      customerId: 'CUST-3',
      customerName: 'AKHUN SERVICE',
      subject: 'Part number mismatch',
      description: 'Received Oil Seal Kit with different dimensions than ordered.',
      priority: 'Low',
      status: 'Open',
      resolutionNotes: '',
      dateLogged: '2026-05-25',
      dateResolved: null
    }
  ],
  existingLeadsFollowups: {
    'CUST-1': {
      date: '2026-06-01',
      details: 'Called customer to discuss new requirements',
      nextAction: 'Send updated catalog',
      nextFollowUpDate: '2026-06-10'
    }
  }
};

export const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    addLead: (state, action) => {
      state.leads.unshift(action.payload);
    },
    updateLead: (state, action) => {
      const idx = state.leads.findIndex(l => l.id === action.payload.id);
      if (idx !== -1) {
        state.leads[idx] = action.payload;
      }
    },
    deleteLead: (state, action) => {
      state.leads = state.leads.filter(l => l.id !== action.payload);
    },
    addOpportunity: (state, action) => {
      state.opportunities.unshift(action.payload);
    },
    updateOpportunity: (state, action) => {
      const idx = state.opportunities.findIndex(o => o.id === action.payload.id);
      if (idx !== -1) {
        state.opportunities[idx] = action.payload;
      }
    },
    deleteOpportunity: (state, action) => {
      state.opportunities = state.opportunities.filter(o => o.id !== action.payload);
    },
    addFollowup: (state, action) => {
      state.followups.unshift(action.payload);
    },
    updateFollowup: (state, action) => {
      const idx = state.followups.findIndex(f => f.id === action.payload.id);
      if (idx !== -1) {
        state.followups[idx] = action.payload;
      }
    },
    deleteFollowup: (state, action) => {
      state.followups = state.followups.filter(f => f.id !== action.payload);
    },
    completeFollowup: (state, action) => {
      const { id, notes } = action.payload;
      const f = state.followups.find(f => f.id === id);
      if (f) {
        f.status = 'Completed';
        if (notes) {
          f.notes = notes;
        }
      }
    },
    addComplaint: (state, action) => {
      state.complaints.unshift(action.payload);
    },
    updateComplaint: (state, action) => {
      const idx = state.complaints.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) {
        state.complaints[idx] = action.payload;
      }
    },
    resolveComplaint: (state, action) => {
      const { id, resolutionNotes } = action.payload;
      const c = state.complaints.find(c => c.id === id);
      if (c) {
        c.status = 'Resolved';
        c.resolutionNotes = resolutionNotes;
        c.dateResolved = new Date().toISOString().split('T')[0];
      }
    },
    updateExistingLeadFollowup: (state, action) => {
      const { customerId, data } = action.payload;
      state.existingLeadsFollowups[customerId] = data;
    }
  }
});

export const {
  addLead, updateLead, deleteLead,
  addOpportunity, updateOpportunity, deleteOpportunity,
  addFollowup, updateFollowup, deleteFollowup, completeFollowup,
  addComplaint, updateComplaint, resolveComplaint,
  updateExistingLeadFollowup
} = crmSlice.actions;

export default crmSlice.reducer;

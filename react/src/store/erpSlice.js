import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  requisitions: [
    {
      id: 'PR-2026-001',
      date: '2026-05-10',
      requester: 'Alice Smith',
      department: 'Production',
      priority: 'High',
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', qty: 50, uom: 'pcs', unitPrice: 12.5 }
      ],
      remarks: 'Required for scheduled conveyor maintenance.',
      status: 'Approved',
      approvedBy: 'John Manager',
      approvalDate: '2026-05-11'
    },
    {
      id: 'PR-2026-002',
      date: '2026-05-18',
      requester: 'Bob Jones',
      department: 'R&D',
      priority: 'Medium',
      items: [
        { itemId: 'ITM05315', name: 'Stang Piston Sanchin 120', qty: 20, uom: 'pcs', unitPrice: 24.0 }
      ],
      remarks: 'Prototype testing materials.',
      status: 'Pending Approval',
      approvedBy: null,
      approvalDate: null
    },
    {
      id: 'PR-2026-003',
      date: '2026-05-20',
      requester: 'Carol White',
      department: 'Maintenance',
      priority: 'Low',
      items: [
        { itemId: 'ITM05312', name: 'Oil Seal Kit Sanchin 120', qty: 10, uom: 'kits', unitPrice: 8.5 }
      ],
      remarks: 'Restocking inventory buffers.',
      status: 'Draft',
      approvedBy: null,
      approvalDate: null
    }
  ],
  purchaseOrders: [
    {
      id: 'PO-2026-001',
      prRef: 'PR-2026-001',
      date: '2026-05-12',
      supplierId: 'SUPP-1',
      supplierName: 'GLOBAL STEEL INDUSTRIES',
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', orderedQty: 50, receivedQty: 30, unitPrice: 12.5, pendingQty: 20 }
      ],
      paymentTerms: 'Net 60',
      isBlanket: true,
      blanketDetails: {
        contractValue: 50000,
        validity: '2026-12-31',
        releases: [
          { date: '2026-05-15', qty: 30, released: true },
          { date: '2026-06-15', qty: 20, released: false }
        ]
      },
      deliverySchedules: [
        { date: '2026-05-15', qty: 30 },
        { date: '2026-06-15', qty: 20 }
      ],
      status: 'Approved',
      deliveryStatus: 'Partially Received',
      approvedBy: 'Admin User',
      approvalDate: '2026-05-12'
    },
    {
      id: 'PO-2026-002',
      prRef: '',
      date: '2026-05-19',
      supplierId: 'SUPP-2',
      supplierName: 'SINGAPORE HARDWARE SUPPLIES',
      items: [
        { itemId: 'ITM05315', name: 'Stang Piston Sanchin 120', orderedQty: 100, receivedQty: 0, unitPrice: 22.0, pendingQty: 100 }
      ],
      paymentTerms: 'COD',
      isBlanket: false,
      blanketDetails: null,
      deliverySchedules: [
        { date: '2026-06-01', qty: 100 }
      ],
      status: 'Pending Approval',
      deliveryStatus: 'Pending',
      approvedBy: null,
      approvalDate: null
    }
  ],
  grns: [
    {
      id: 'GRN-2026-001',
      poRef: 'PO-2026-001',
      date: '2026-05-15',
      supplierName: 'GLOBAL STEEL INDUSTRIES',
      receivedItems: [
        {
          itemId: 'ITM05316',
          name: 'Pin Piston Sanchin 120',
          orderedQty: 50,
          receivedQty: 30,
          acceptedQty: 25,
          rejectedQty: 5,
          pendingQty: 20,
          batches: [
            { batchNo: 'BAT-PIN-9921', mfgDate: '2026-04-10', expiryDate: '2029-04-10', qty: 30 }
          ],
          warehouse: 'WH-MAIN-RACK2',
          qcStatus: 'Passed', // Passed, Failed, Pending QC
          qcInspector: 'Sam Inspector',
          qcRemarks: '5 pcs rejected due to surface scratches. 25 approved.'
        }
      ],
      status: 'QC Completed'
    }
  ],
  purchaseReturns: [
    {
      id: 'RET-2026-001',
      grnRef: 'GRN-2026-001',
      date: '2026-05-16',
      supplierName: 'GLOBAL STEEL INDUSTRIES',
      returnedItems: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', returnedQty: 5, reason: 'Surface scratches and micro-cracks' }
      ],
      debitNoteGenerated: true,
      debitNoteDetails: {
        id: 'DN-2026-001',
        amount: 62.5,
        taxAmount: 11.25,
        total: 73.75,
        date: '2026-05-16'
      }
    }
  ],
  salesEnquiries: [
    {
      id: 'ENQ-2026-001',
      date: '2026-05-05',
      customerId: 'CUST-1',
      customerName: 'ACE FIRE ENGINEERING PTE LTD',
      source: 'Email',
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', qty: 100, targetPrice: 15.0 }
      ],
      status: 'Converted',
      remarks: 'Customer requested quick delivery window.'
    },
    {
      id: 'ENQ-2026-002',
      date: '2026-05-19',
      customerId: 'CUST-2',
      customerName: 'AIR LIQUIDE SINGAPORE PTE LTD',
      source: 'Call',
      items: [
        { itemId: 'ITM05315', name: 'Stang Piston Sanchin 120', qty: 40, targetPrice: 28.0 }
      ],
      status: 'Active',
      remarks: 'Needs quotation for Woodlands project.'
    }
  ],
  quotations: [
    {
      id: 'QT-2026-001',
      enqRef: 'ENQ-2026-001',
      date: '2026-05-06',
      customerId: 'CUST-1',
      customerName: 'ACE FIRE ENGINEERING PTE LTD',
      priceCategory: 'Wholesale',
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', qty: 100, basePrice: 12.5, unitPrice: 15.0, markupPct: 20 }
      ],
      validity: '2026-06-06',
      paymentTerms: 'Net 30',
      revision: 1,
      revisionHistory: [
        {
          revision: 0,
          date: '2026-05-05',
          items: [{ itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', qty: 100, basePrice: 12.5, unitPrice: 16.0, markupPct: 28 }],
          total: 1600
        }
      ],
      status: 'Accepted',
      remarks: 'Price negotiated and finalized.'
    },
    {
      id: 'QT-2026-002',
      enqRef: 'ENQ-2026-002',
      date: '2026-05-20',
      customerId: 'CUST-2',
      customerName: 'AIR LIQUIDE SINGAPORE PTE LTD',
      priceCategory: 'Distributor',
      items: [
        { itemId: 'ITM05315', name: 'Stang Piston Sanchin 120', qty: 40, basePrice: 24.0, unitPrice: 27.6, markupPct: 15 }
      ],
      validity: '2026-06-20',
      paymentTerms: 'Net 60',
      revision: 0,
      revisionHistory: [],
      status: 'Sent',
      remarks: 'Sent standard distributor rate list.'
    }
  ],
  customerPOs: [
    {
      id: 'CPO-2026-001',
      qtRef: 'QT-2026-001',
      customerName: 'ACE FIRE ENGINEERING PTE LTD',
      customerPoRef: 'ACE-PO-9921',
      date: '2026-05-08',
      amount: 1500,
      deliverySchedules: [
        { date: '2026-05-25', qty: 100 }
      ],
      paymentTerms: 'Net 30',
      uploadedDocName: 'ace_po_9921_signed.pdf'
    }
  ],
  salesOrders: [
    {
      id: 'SO-2026-001',
      cpoRef: 'CPO-2026-001',
      customerName: 'ACE FIRE ENGINEERING PTE LTD',
      date: '2026-05-09',
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', orderedQty: 100, suppliedQty: 80, unitPrice: 15.0, pendingQty: 20 }
      ],
      warehouse: 'WH-MAIN-RACK2',
      deliveryStatus: 'Partially Shipped',
      deliverySchedule: '2026-05-25',
      invoiceGenerated: true,
      invoiceDetails: {
        id: 'INV-2026-001',
        amount: 1200,
        taxAmount: 216,
        total: 1416,
        date: '2026-05-25'
      }
    }
  ],
  deliveryChallans: [
    {
      id: 'DC-2026-001',
      soRef: 'SO-2026-001',
      cpoRef: 'CPO-2026-001',
      customerName: 'ACE FIRE ENGINEERING PTE LTD',
      builderName: 'Ace Builders',
      siteLocation: 'Woodlands Site',
      date: '2026-05-15',
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', orderedQty: 100, deliveredQty: 80, pendingQty: 20, warehouseBin: 'Rack A-01' }
      ],
      deliveryLocation: '10 Ubi Crescent, #05-24 Ubi Techpark, Singapore 408564',
      vehicleNo: 'XB-1234-A',
      vehicleType: '10-ton Truck',
      driverName: 'John Doe',
      driverContact: '+65 9123 4567',
      status: 'Delivered',
      dispatchDate: '2026-05-15',
      deliveryDate: '2026-05-15',
      trackingTimeline: [
        { status: 'Draft', timestamp: '2026-05-15, 09:00:00 AM', remarks: 'Delivery Challan Draft created.' },
        { status: 'Dispatched', timestamp: '2026-05-15, 10:15:00 AM', remarks: 'Vehicle assigned and dispatched from Warehouse.' },
        { status: 'In Transit', timestamp: '2026-05-15, 11:00:00 AM', remarks: 'Carrier en route on Central Expressway.' },
        { status: 'Delivered', timestamp: '2026-05-15, 11:45:00 AM', remarks: 'Delivered successfully. Acknowledged by supervisor Keith.' }
      ]
    },
    {
      id: 'DC-2026-002',
      soRef: 'SO-2026-001',
      cpoRef: 'CPO-2026-001',
      customerName: 'ACE FIRE ENGINEERING PTE LTD',
      builderName: 'Ace Builders',
      siteLocation: 'Changi Airport T5 Site',
      date: '2026-05-21',
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', orderedQty: 20, deliveredQty: 20, pendingQty: 0, warehouseBin: 'Bin B-101' }
      ],
      deliveryLocation: 'Changi Airport T5 Project Depot, Singapore',
      vehicleNo: 'YC-5678-B',
      vehicleType: '3-ton Van',
      driverName: 'Robert Tan',
      driverContact: '+65 8234 5678',
      status: 'In Transit',
      dispatchDate: '2026-05-21',
      deliveryDate: null,
      trackingTimeline: [
        { status: 'Draft', timestamp: '2026-05-21, 08:30:00 AM', remarks: 'Challan created for remaining pending balance.' },
        { status: 'Dispatched', timestamp: '2026-05-21, 09:45:00 AM', remarks: 'Dispatched for Changi Site.' },
        { status: 'In Transit', timestamp: '2026-05-21, 10:30:00 AM', remarks: 'Cargo passing Changi Coast Road.' }
      ]
    }
  ],
  materialIssues: [
    {
      id: 'MIT-2026-001',
      builderName: 'Ace Builders',
      siteLocation: 'Woodlands Site',
      dcRef: 'DC-2026-001',
      date: '2026-05-15',
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', issuedQty: 50, uom: 'pcs' }
      ],
      issuedBy: 'Supervisor Bob',
      status: 'Issued'
    },
    {
      id: 'MIT-2026-002',
      builderName: 'Woodlands Construction',
      siteLocation: 'Changi Airport T5 Site',
      dcRef: 'DC-2026-002',
      date: '2026-05-21',
      items: [
        { itemId: 'ITM05316', name: 'Pin Piston Sanchin 120', issuedQty: 20, uom: 'pcs' }
      ],
      issuedBy: 'Supervisor Keith',
      status: 'Issued'
    }
  ],
  currentUser: null,
  users: [
    { id: 'usr001', name: 'Admin User', role: 'Admin', email: 'admin@tradeware.com', status: 'Active' },
    { id: 'usr002', name: 'Super Admin', role: 'Admin', email: 'sconnor@tradeware.com', status: 'Active' },
    { id: 'usr003', name: 'Kabilesh', role: 'Warehouse Team', email: 'jbond@tradeware.com', status: 'Active' },
    { id: 'usr004', name: 'Sachin', role: 'Sales Team', email: 'lskywalker@tradeware.com', status: 'Active' },
    { id: 'usr005', name: 'Tharma', role: 'Accounts Team', email: 'hgranger@tradeware.com', status: 'Active' },
    { id: 'usr006', name: 'Kaviya', role: 'Management', email: 'tstark@tradeware.com', status: 'Active' }
  ],
  rolesPermissions: {
    'Admin': {
      'Dashboard': { read: true, write: true, approve: true },
      'Masters': { read: true, write: true, approve: true },
      'Inventory Management': { read: true, write: true, approve: true },
      'Purchase Management': { read: true, write: true, approve: true },
      'Sales & Orders': { read: true, write: true, approve: true },
      'Batch & Lot Management': { read: true, write: true, approve: true },
      'Import Management': { read: true, write: true, approve: true },
      'Pricing Management': { read: true, write: true, approve: true },
      'Delivery & Dispatch': { read: true, write: true, approve: true },
      'Accounts Integration': { read: true, write: true, approve: true },
      'Reports & Dashboards': { read: true, write: true, approve: true },
      'User Roles & Approval': { read: true, write: true, approve: true },
      'Document Management': { read: true, write: true, approve: true }
    },
    'Purchase Team': {
      'Dashboard': { read: true, write: false, approve: false },
      'Masters': { read: true, write: false, approve: false },
      'Inventory Management': { read: true, write: false, approve: false },
      'Purchase Management': { read: true, write: true, approve: false },
      'Sales & Orders': { read: false, write: false, approve: false },
      'Batch & Lot Management': { read: true, write: false, approve: false },
      'Import Management': { read: true, write: false, approve: false },
      'Pricing Management': { read: false, write: false, approve: false },
      'Delivery & Dispatch': { read: false, write: false, approve: false },
      'Accounts Integration': { read: false, write: false, approve: false },
      'Reports & Dashboards': { read: true, write: false, approve: false },
      'User Roles & Approval': { read: false, write: false, approve: false },
      'Document Management': { read: true, write: true, approve: false }
    },
    'Warehouse Team': {
      'Dashboard': { read: true, write: false, approve: false },
      'Masters': { read: true, write: false, approve: false },
      'Inventory Management': { read: true, write: true, approve: false },
      'Purchase Management': { read: true, write: false, approve: false },
      'Sales & Orders': { read: false, write: false, approve: false },
      'Batch & Lot Management': { read: true, write: true, approve: false },
      'Import Management': { read: false, write: false, approve: false },
      'Pricing Management': { read: false, write: false, approve: false },
      'Delivery & Dispatch': { read: true, write: true, approve: false },
      'Accounts Integration': { read: false, write: false, approve: false },
      'Reports & Dashboards': { read: true, write: false, approve: false },
      'User Roles & Approval': { read: false, write: false, approve: false },
      'Document Management': { read: true, write: true, approve: false }
    },
    'Sales Team': {
      'Dashboard': { read: true, write: false, approve: false },
      'Masters': { read: true, write: false, approve: false },
      'Inventory Management': { read: true, write: false, approve: false },
      'Purchase Management': { read: false, write: false, approve: false },
      'Sales & Orders': { read: true, write: true, approve: false },
      'Batch & Lot Management': { read: false, write: false, approve: false },
      'Import Management': { read: false, write: false, approve: false },
      'Pricing Management': { read: true, write: false, approve: false },
      'Delivery & Dispatch': { read: true, write: false, approve: false },
      'Accounts Integration': { read: false, write: false, approve: false },
      'Reports & Dashboards': { read: true, write: false, approve: false },
      'User Roles & Approval': { read: false, write: false, approve: false },
      'Document Management': { read: true, write: true, approve: false }
    },
    'Accounts Team': {
      'Dashboard': { read: true, write: false, approve: false },
      'Masters': { read: true, write: false, approve: false },
      'Inventory Management': { read: false, write: false, approve: false },
      'Purchase Management': { read: true, write: false, approve: false },
      'Sales & Orders': { read: true, write: false, approve: false },
      'Batch & Lot Management': { read: false, write: false, approve: false },
      'Import Management': { read: true, write: false, approve: false },
      'Pricing Management': { read: true, write: true, approve: false },
      'Delivery & Dispatch': { read: false, write: false, approve: false },
      'Accounts Integration': { read: true, write: true, approve: false },
      'Reports & Dashboards': { read: true, write: false, approve: false },
      'User Roles & Approval': { read: false, write: false, approve: false },
      'Document Management': { read: true, write: true, approve: false }
    },
    'Management': {
      'Dashboard': { read: true, write: false, approve: true },
      'Masters': { read: true, write: false, approve: false },
      'Inventory Management': { read: true, write: false, approve: false },
      'Purchase Management': { read: true, write: false, approve: true },
      'Sales & Orders': { read: true, write: false, approve: true },
      'Batch & Lot Management': { read: true, write: false, approve: false },
      'Import Management': { read: true, write: false, approve: false },
      'Pricing Management': { read: true, write: false, approve: true },
      'Delivery & Dispatch': { read: true, write: false, approve: true },
      'Accounts Integration': { read: true, write: false, approve: true },
      'Reports & Dashboards': { read: true, write: false, approve: false },
      'User Roles & Approval': { read: true, write: false, approve: true },
      'Document Management': { read: true, write: true, approve: true }
    }
  },
  workflows: [
    { id: 'WF-001', name: 'Purchase Order Approval Threshold', condition: 'PO Amount > $10,000', approverRole: 'Management', status: 'Active' },
    { id: 'WF-002', name: 'Sales Order Below Margin Approval', condition: 'Gross Margin < 15%', approverRole: 'Management', status: 'Active' },
    { id: 'WF-003', name: 'Quotation Discount Approval', condition: 'Discount > 10%', approverRole: 'Management', status: 'Active' },
    { id: 'WF-004', name: 'Blanket PO Release Approval', condition: 'Always Required', approverRole: 'Management', status: 'Inactive' }
  ],
  approvalRequests: [
    {
      id: 'APR-2026-001',
      module: 'Purchase Management',
      type: 'PO Limit Approval',
      referenceId: 'PO-2026-002',
      requestedBy: 'Sarah Connor',
      requestDate: '2026-05-19',
      details: 'Purchase Order for SINGAPORE HARDWARE SUPPLIES. Amount: $2,200.00. (Threshold: > $10,000)',
      status: 'Pending',
      remarks: '',
      history: [
        { status: 'Submitted', timestamp: '2026-05-19 14:30:00', user: 'Sarah Connor', remarks: 'Submitted PO for approval' }
      ]
    },
    {
      id: 'APR-2026-002',
      module: 'Sales & Orders',
      type: 'Discount Approval',
      referenceId: 'QT-2026-001',
      requestedBy: 'Luke Skywalker',
      requestDate: '2026-05-05',
      details: 'Quotation for ACE FIRE ENGINEERING. Discount of 12% applied (Threshold: > 10%)',
      status: 'Approved',
      remarks: 'Discount approved since they are a long-term customer.',
      history: [
        { status: 'Submitted', timestamp: '2026-05-05 10:15:00', user: 'Luke Skywalker', remarks: 'Requested discount for closing the deal.' },
        { status: 'Approved', timestamp: '2026-05-06 09:30:00', user: 'Tony Stark', remarks: 'Discount approved since they are a long-term customer.' }
      ]
    },
    {
      id: 'APR-2026-003',
      module: 'Sales & Orders',
      type: 'Selling Below Margin',
      referenceId: 'SO-2026-001',
      requestedBy: 'Luke Skywalker',
      requestDate: '2026-05-09',
      details: 'Sales Order for ACE FIRE ENGINEERING. Gross Margin: 11% (Threshold: < 15%)',
      status: 'Approved',
      remarks: 'Margin approved to offset high inventory costs.',
      history: [
        { status: 'Submitted', timestamp: '2026-05-09 11:00:00', user: 'Luke Skywalker', remarks: 'Requested margin approval' },
        { status: 'Approved', timestamp: '2026-05-09 15:30:00', user: 'Tony Stark', remarks: 'Margin approved to offset high inventory costs.' }
      ]
    }
  ],
  documents: [
    {
      id: 'DOC-2026-001',
      name: 'ace_po_9921_signed.pdf',
      category: 'Customer PO',
      uploadedBy: 'Luke Skywalker',
      uploadDate: '2026-05-08',
      size: '1.2 MB',
      version: 1,
      linkedTransaction: 'CPO-2026-001',
      history: [
        { version: 1, date: '2026-05-08', user: 'Luke Skywalker', action: 'Uploaded initial customer PO' }
      ]
    },
    {
      id: 'DOC-2026-002',
      name: 'invoice_inv_2026_001.pdf',
      category: 'Invoice',
      uploadedBy: 'Hermione Granger',
      uploadDate: '2026-05-25',
      size: '850 KB',
      version: 1,
      linkedTransaction: 'INV-2026-001',
      history: [
        { version: 1, date: '2026-05-25', user: 'Hermione Granger', action: 'Generated invoice copy' }
      ]
    },
    {
      id: 'DOC-2026-003',
      name: 'drawing_pin_piston_120.dwg',
      category: 'Product Drawing',
      uploadedBy: 'James Bond',
      uploadDate: '2026-05-12',
      size: '4.5 MB',
      version: 2,
      linkedTransaction: 'ITM05316',
      history: [
        { version: 1, date: '2026-05-10', user: 'James Bond', action: 'Uploaded draft drawing' },
        { version: 2, date: '2026-05-12', user: 'James Bond', action: 'Uploaded revision with surface tolerance' }
      ]
    }
  ]
};

const erpSlice = createSlice({
  name: 'erp',
  initialState,
  reducers: {
    // PR Reducers
    addRequisition: (state, action) => {
      state.requisitions.unshift(action.payload);
    },
    updateRequisition: (state, action) => {
      const idx = state.requisitions.findIndex(pr => pr.id === action.payload.id);
      if (idx !== -1) {
        state.requisitions[idx] = action.payload;
      }
    },
    approveRequisition: (state, action) => {
      const pr = state.requisitions.find(pr => pr.id === action.payload.id);
      if (pr) {
        pr.status = action.payload.status; // Approved or Rejected
        pr.approvedBy = action.payload.approvedBy || 'Manager';
        pr.approvalDate = new Date().toISOString().split('T')[0];
      }
    },
    deleteRequisition: (state, action) => {
      state.requisitions = state.requisitions.filter(pr => pr.id !== action.payload);
    },

    // PO Reducers
    addPurchaseOrder: (state, action) => {
      state.purchaseOrders.unshift(action.payload);
    },
    updatePurchaseOrder: (state, action) => {
      const idx = state.purchaseOrders.findIndex(po => po.id === action.payload.id);
      if (idx !== -1) {
        state.purchaseOrders[idx] = action.payload;
      }
    },
    approvePurchaseOrder: (state, action) => {
      const po = state.purchaseOrders.find(po => po.id === action.payload.id);
      if (po) {
        po.status = action.payload.status;
        po.approvedBy = action.payload.approvedBy || 'Admin';
        po.approvalDate = new Date().toISOString().split('T')[0];
      }
    },
    updatePODeliveryQty: (state, action) => {
      const { poId, itemId, receivedQty } = action.payload;
      const po = state.purchaseOrders.find(p => p.id === poId);
      if (po) {
        const item = po.items.find(i => i.itemId === itemId);
        if (item) {
          item.receivedQty = (item.receivedQty || 0) + receivedQty;
          item.pendingQty = Math.max(0, item.orderedQty - item.receivedQty);
        }
        const allReceived = po.items.every(i => i.pendingQty === 0);
        const anyReceived = po.items.some(i => i.receivedQty > 0);
        if (allReceived) {
          po.deliveryStatus = 'Fully Received';
        } else if (anyReceived) {
          po.deliveryStatus = 'Partially Received';
        } else {
          po.deliveryStatus = 'Pending';
        }
      }
    },
    deletePurchaseOrder: (state, action) => {
      state.purchaseOrders = state.purchaseOrders.filter(po => po.id !== action.payload);
    },

    // GRN Reducers
    addGRN: (state, action) => {
      state.grns.unshift(action.payload);
    },
    updateGRNQC: (state, action) => {
      const { grnId, itemId, qcStatus, acceptedQty, rejectedQty, qcInspector, qcRemarks } = action.payload;
      const grn = state.grns.find(g => g.id === grnId);
      if (grn) {
        const item = grn.receivedItems.find(i => i.itemId === itemId);
        if (item) {
          item.qcStatus = qcStatus;
          item.acceptedQty = acceptedQty;
          item.rejectedQty = rejectedQty;
          item.qcInspector = qcInspector;
          item.qcRemarks = qcRemarks;
        }
        grn.status = 'QC Completed';
      }
    },
    deleteGRN: (state, action) => {
      state.grns = state.grns.filter(g => g.id !== action.payload);
    },

    // Purchase Return Reducers
    addPurchaseReturn: (state, action) => {
      state.purchaseReturns.unshift(action.payload);
    },
    generateDebitNote: (state, action) => {
      const { returnId, debitNoteId, amount, taxAmount, total } = action.payload;
      const ret = state.purchaseReturns.find(r => r.id === returnId);
      if (ret) {
        ret.debitNoteGenerated = true;
        ret.debitNoteDetails = {
          id: debitNoteId,
          amount,
          taxAmount,
          total,
          date: new Date().toISOString().split('T')[0]
        };
      }
    },
    deletePurchaseReturn: (state, action) => {
      state.purchaseReturns = state.purchaseReturns.filter(r => r.id !== action.payload);
    },

    // Sales Enquiry Reducers
    addSalesEnquiry: (state, action) => {
      state.salesEnquiries.unshift(action.payload);
    },
    updateSalesEnquiry: (state, action) => {
      const idx = state.salesEnquiries.findIndex(se => se.id === action.payload.id);
      if (idx !== -1) {
        state.salesEnquiries[idx] = action.payload;
      }
    },
    convertEnquiry: (state, action) => {
      const se = state.salesEnquiries.find(se => se.id === action.payload);
      if (se) se.status = 'Converted';
    },
    deleteSalesEnquiry: (state, action) => {
      state.salesEnquiries = state.salesEnquiries.filter(se => se.id !== action.payload);
    },

    // Quotation Reducers
    addQuotation: (state, action) => {
      state.quotations.unshift(action.payload);
    },
    updateQuotation: (state, action) => {
      const idx = state.quotations.findIndex(q => q.id === action.payload.id);
      if (idx !== -1) {
        state.quotations[idx] = action.payload;
      }
    },
    reviseQuotation: (state, action) => {
      const { id, items, remarks } = action.payload;
      const q = state.quotations.find(q => q.id === id);
      if (q) {
        const total = q.items.reduce((acc, curr) => acc + (curr.qty * curr.unitPrice), 0);
        q.revisionHistory.unshift({
          revision: q.revision,
          date: q.date,
          items: q.items,
          total
        });
        q.revision += 1;
        q.date = new Date().toISOString().split('T')[0];
        q.items = items;
        q.remarks = remarks;
        q.status = 'Revised';
      }
    },
    approveQuotation: (state, action) => {
      const q = state.quotations.find(q => q.id === action.payload.id);
      if (q) {
        q.status = action.payload.status; // Accepted or Rejected
      }
    },
    deleteQuotation: (state, action) => {
      state.quotations = state.quotations.filter(q => q.id !== action.payload);
    },

    // Customer PO Reducers
    addCustomerPO: (state, action) => {
      state.customerPOs.unshift(action.payload);
    },
    deleteCustomerPO: (state, action) => {
      state.customerPOs = state.customerPOs.filter(cpo => cpo.id !== action.payload);
    },

    // Sales Order Reducers
    addSalesOrder: (state, action) => {
      state.salesOrders.unshift(action.payload);
    },
    updateSalesOrder: (state, action) => {
      const idx = state.salesOrders.findIndex(so => so.id === action.payload.id);
      if (idx !== -1) {
        state.salesOrders[idx] = action.payload;
      }
    },
    updateSODeliveryQty: (state, action) => {
      const { soId, itemId, suppliedQty } = action.payload;
      const so = state.salesOrders.find(s => s.id === soId);
      if (so) {
        const item = so.items.find(i => i.itemId === itemId);
        if (item) {
          item.suppliedQty = (item.suppliedQty || 0) + suppliedQty;
          item.pendingQty = Math.max(0, item.orderedQty - item.suppliedQty);
        }
        const allSupplied = so.items.every(i => i.pendingQty === 0);
        const anySupplied = so.items.some(i => i.suppliedQty > 0);
        if (allSupplied) {
          so.deliveryStatus = 'Fully Shipped';
        } else if (anySupplied) {
          so.deliveryStatus = 'Partially Shipped';
        } else {
          so.deliveryStatus = 'Pending';
        }
      }
    },
    generateInvoice: (state, action) => {
      const { soId, invoiceId, amount, taxAmount, total } = action.payload;
      const so = state.salesOrders.find(s => s.id === soId);
      if (so) {
        so.invoiceGenerated = true;
        so.invoiceDetails = {
          id: invoiceId,
          amount,
          taxAmount,
          total,
          date: new Date().toISOString().split('T')[0]
        };
      }
    },
    deleteSalesOrder: (state, action) => {
      state.salesOrders = state.salesOrders.filter(so => so.id !== action.payload);
    },
    addDeliveryChallan: (state, action) => {
      state.deliveryChallans.unshift(action.payload);
      // Update Sales Order item delivery quantities
      const { soRef, items } = action.payload;
      if (soRef) {
        const so = state.salesOrders.find(s => s.id === soRef);
        if (so) {
          items.forEach(itm => {
            const soItem = so.items.find(i => i.itemId === itm.itemId);
            if (soItem) {
              soItem.suppliedQty = (soItem.suppliedQty || 0) + itm.deliveredQty;
              soItem.pendingQty = Math.max(0, soItem.orderedQty - soItem.suppliedQty);
            }
          });
          // Update delivery status of Sales Order
          const allSupplied = so.items.every(i => i.pendingQty === 0);
          const anySupplied = so.items.some(i => i.suppliedQty > 0);
          if (allSupplied) {
            so.deliveryStatus = 'Fully Shipped';
          } else if (anySupplied) {
            so.deliveryStatus = 'Partially Shipped';
          } else {
            so.deliveryStatus = 'Pending';
          }
        }
      }
    },
    updateDeliveryChallan: (state, action) => {
      const idx = state.deliveryChallans.findIndex(dc => dc.id === action.payload.id);
      if (idx !== -1) {
        state.deliveryChallans[idx] = action.payload;
      }
    },
    deleteDeliveryChallan: (state, action) => {
      const dc = state.deliveryChallans.find(d => d.id === action.payload);
      if (dc && dc.soRef) {
        const so = state.salesOrders.find(s => s.id === dc.soRef);
        if (so) {
          dc.items.forEach(itm => {
            const soItem = so.items.find(i => i.itemId === itm.itemId);
            if (soItem) {
              soItem.suppliedQty = Math.max(0, (soItem.suppliedQty || 0) - itm.deliveredQty);
              soItem.pendingQty = Math.max(0, soItem.orderedQty - soItem.suppliedQty);
            }
          });
          const allSupplied = so.items.every(i => i.pendingQty === 0);
          const anySupplied = so.items.some(i => i.suppliedQty > 0);
          if (allSupplied) {
            so.deliveryStatus = 'Fully Shipped';
          } else if (anySupplied) {
            so.deliveryStatus = 'Partially Shipped';
          } else {
            so.deliveryStatus = 'Pending';
          }
        }
      }
      state.deliveryChallans = state.deliveryChallans.filter(dc => dc.id !== action.payload);
    },
    updateDispatchStatus: (state, action) => {
      const { id, status, remarks } = action.payload;
      const dc = state.deliveryChallans.find(d => d.id === id);
      if (dc) {
        dc.status = status;
        if (status === 'Dispatched') {
          dc.dispatchDate = new Date().toISOString().split('T')[0];
        } else if (status === 'Delivered') {
          dc.deliveryDate = new Date().toISOString().split('T')[0];
        }
        if (!dc.trackingTimeline) {
          dc.trackingTimeline = [];
        }
        dc.trackingTimeline.push({
          status,
          timestamp: new Date().toLocaleString(),
          remarks: remarks || `Status updated to ${status}`
        });
      }
    },
    addMaterialIssue: (state, action) => {
      state.materialIssues.unshift(action.payload);
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    addUser: (state, action) => {
      state.users.push(action.payload);
    },
    updateUser: (state, action) => {
      const idx = state.users.findIndex(u => u.id === action.payload.id);
      if (idx !== -1) {
        state.users[idx] = action.payload;
      }
    },
    updatePermissions: (state, action) => {
      state.rolesPermissions = action.payload;
    },
    addWorkflow: (state, action) => {
      state.workflows.unshift(action.payload);
    },
    updateWorkflow: (state, action) => {
      const idx = state.workflows.findIndex(w => w.id === action.payload.id);
      if (idx !== -1) {
        state.workflows[idx] = action.payload;
      }
    },
    processApproval: (state, action) => {
      const { id, decision, remarks, user } = action.payload;
      const req = state.approvalRequests.find(r => r.id === id);
      if (req) {
        req.status = decision;
        req.remarks = remarks;
        req.history.push({
          status: decision,
          timestamp: new Date().toLocaleString(),
          user: user || 'Approver',
          remarks
        });

        // Also update the source transaction if applicable
        if (req.type === 'PO Limit Approval' && req.referenceId) {
          const po = state.purchaseOrders.find(p => p.id === req.referenceId);
          if (po) {
            po.status = decision === 'Approved' ? 'Approved' : 'Rejected';
          }
        }
        if (req.type === 'Discount Approval' && req.referenceId) {
          const q = state.quotations.find(q => q.id === req.referenceId);
          if (q) {
            q.status = decision === 'Approved' ? 'Accepted' : 'Rejected';
          }
        }
        if (req.type === 'Selling Below Margin' && req.referenceId) {
          const so = state.salesOrders.find(s => s.id === req.referenceId);
          if (so) {
            so.deliveryStatus = decision === 'Approved' ? 'Pending' : 'Rejected';
          }
        }
      }
    },
    uploadDocument: (state, action) => {
      const doc = action.payload;
      const existing = state.documents.find(d => d.name === doc.name);
      if (existing) {
        existing.version += 1;
        existing.uploadDate = new Date().toISOString().split('T')[0];
        existing.size = doc.size || '1.0 MB';
        existing.uploadedBy = doc.uploadedBy;
        existing.history.unshift({
          version: existing.version,
          date: existing.uploadDate,
          user: doc.uploadedBy,
          action: doc.remarks || `Uploaded revision v${existing.version}`
        });
      } else {
        state.documents.unshift({
          ...doc,
          id: doc.id || `DOC-2026-00${state.documents.length + 1}`,
          version: 1,
          uploadDate: new Date().toISOString().split('T')[0],
          history: [
            { version: 1, date: new Date().toISOString().split('T')[0], user: doc.uploadedBy, action: doc.remarks || 'Uploaded initial version' }
          ]
        });
      }
    },
    deleteDocument: (state, action) => {
      state.documents = state.documents.filter(d => d.id !== action.payload);
    },
    addApprovalRequest: (state, action) => {
      state.approvalRequests.unshift(action.payload);
    }
  }
});

export const {
  addRequisition, updateRequisition, approveRequisition, deleteRequisition,
  addPurchaseOrder, updatePurchaseOrder, approvePurchaseOrder, updatePODeliveryQty, deletePurchaseOrder,
  addGRN, updateGRNQC, deleteGRN,
  addPurchaseReturn, generateDebitNote, deletePurchaseReturn,
  addSalesEnquiry, updateSalesEnquiry, convertEnquiry, deleteSalesEnquiry,
  addQuotation, updateQuotation, reviseQuotation, approveQuotation, deleteQuotation,
  addCustomerPO, deleteCustomerPO,
  addSalesOrder, updateSalesOrder, updateSODeliveryQty, generateInvoice, deleteSalesOrder,
  addDeliveryChallan, updateDeliveryChallan, deleteDeliveryChallan, updateDispatchStatus, addMaterialIssue,
  setCurrentUser, addUser, updateUser, updatePermissions, addWorkflow, updateWorkflow, processApproval, uploadDocument, deleteDocument, addApprovalRequest
} = erpSlice.actions;

export default erpSlice.reducer;

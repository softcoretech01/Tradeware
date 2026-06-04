import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  importPOs: [
    {
      id: 'IPO-2026-001',
      date: '2026-04-05',
      supplierName: 'GLOBAL STEEL INDUSTRIES',
      currency: 'USD',
      exchangeRate: 83.5,
      items: [
        { itemCode: 'ITM05316', itemName: 'Pin Piston Sanchin 120', qty: 2000, fcyUnitPrice: 5.2 }
      ],
      totalFCY: 10400,
      totalLCY: 868400,
      status: 'Shipped', // Draft, Ordered, Shipped, Cleared
      paymentTerms: 'Net 60'
    },
    {
      id: 'IPO-2026-002',
      date: '2026-05-10',
      supplierName: 'EUROPEAN VALVE SYSTEMS GMBH',
      currency: 'EUR',
      exchangeRate: 90.2,
      items: [
        { itemCode: 'ITM05315', itemName: 'Stang Piston Sanchin 120', qty: 500, fcyUnitPrice: 12.5 }
      ],
      totalFCY: 6250,
      totalLCY: 563750,
      status: 'Ordered',
      paymentTerms: 'COD'
    },
    {
      id: 'IPO-2026-003',
      date: '2026-04-20',
      supplierName: 'GLOBAL STEEL INDUSTRIES',
      currency: 'USD',
      exchangeRate: 83.5,
      items: [
        { itemCode: 'ITM05314', itemName: 'Pin Piston Sanchin 120', qty: 1000, fcyUnitPrice: 5.0 }
      ],
      totalFCY: 5000,
      totalLCY: 417500,
      status: 'Cleared',
      paymentTerms: 'Net 30'
    }
  ],
  shipments: [
    {
      id: 'SH-2026-001',
      poNo: 'IPO-2026-001',
      supplierName: 'Global Extrusions Corp',
      containerNo: 'MSKU9981240',
      blNo: 'BL-9921008',
      departureDate: '2026-04-10',
      eta: '2026-05-25',
      status: 'In Transit', // In Transit, Customs Clearance, Cleared, Arrived
      billOfEntryNo: '',
      customsDuty: 0,
      freightCharges: 0,
      handlingCharges: 0,
      insuranceCost: 0,
      currency: 'USD',
      exchangeRate: 83.5,
      items: [
        { itemCode: 'ITM-0001', itemName: 'Aluminium Profile AS-100', qty: 2000, fcyUnitPrice: 5.2 }
      ]
    },
    {
      id: 'SH-2026-002',
      poNo: 'IPO-2026-003',
      supplierName: 'Aero Logistics Co',
      containerNo: 'HLXU8871021',
      blNo: 'BL-7744319',
      departureDate: '2026-05-02',
      eta: '2026-05-20',
      status: 'Customs Clearance',
      billOfEntryNo: 'BOE-992120-A',
      customsDuty: 35000,
      freightCharges: 15000,
      handlingCharges: 4000,
      insuranceCost: 2000,
      currency: 'USD',
      exchangeRate: 83.5,
      items: [
        { itemCode: 'ITM-0001', itemName: 'Aluminium Profile AS-100', qty: 1000, fcyUnitPrice: 5.0 }
      ]
    },
    {
      id: 'SH-2026-003',
      poNo: 'IPO-2026-004',
      supplierName: 'Mega Hardware Supplies',
      containerNo: 'TGHU1234567',
      blNo: 'BL-8888888',
      departureDate: '2026-05-15',
      eta: '2026-06-01',
      status: 'Customs Clearance',
      billOfEntryNo: 'BOE-111111-B',
      customsDuty: 15000,
      freightCharges: 8000,
      handlingCharges: 2000,
      packingCharges: 1000,
      agingCharges: 500,
      insuranceCost: 1000,
      currency: 'USD',
      exchangeRate: 83.5,
      items: [
        { itemCode: 'ITM-0010', itemName: 'Steel Bracket A', qty: 1000, fcyUnitPrice: 2.5 },
        { itemCode: 'ITM-0011', itemName: 'Steel Bracket B', qty: 800, fcyUnitPrice: 3.0 },
        { itemCode: 'ITM-0012', itemName: 'Steel Bracket C', qty: 500, fcyUnitPrice: 4.5 },
        { itemCode: 'ITM-0013', itemName: 'Screws Pack (100pcs)', qty: 2000, fcyUnitPrice: 1.0 },
        { itemCode: 'ITM-0014', itemName: 'Bolts Pack (50pcs)', qty: 1500, fcyUnitPrice: 1.5 },
        { itemCode: 'ITM-0015', itemName: 'Washers Pack (200pcs)', qty: 3000, fcyUnitPrice: 0.5 },
        { itemCode: 'ITM-0016', itemName: 'Aluminium Handle', qty: 400, fcyUnitPrice: 5.0 },
        { itemCode: 'ITM-0017', itemName: 'Rubber Grip', qty: 400, fcyUnitPrice: 1.2 },
        { itemCode: 'ITM-0018', itemName: 'Steel Hinge', qty: 1200, fcyUnitPrice: 2.0 },
        { itemCode: 'ITM-0019', itemName: 'Plastic Cap', qty: 5000, fcyUnitPrice: 0.2 }
      ]
    }
  ],
  batches: [
    {
      batchNo: 'B2026-001',
      itemCode: 'ITM-0001',
      itemName: 'Aluminium Profile AS-100',
      qty: 500,
      initialQty: 500,
      mfgDate: '2026-03-01',
      expiryDate: '2028-03-01',
      landedUnitCost: 418.00,
      finalSellingPrice: 580.00,
      marginPercent: 27.9,
      status: 'Available', // Available, On Hold, Expired
      warehouse: 'Main Warehouse',
      sequence: 1,
      poReference: 'IPO-2026-001',
      shipmentRef: 'SH-2026-001'
    },
    {
      batchNo: 'B2026-002',
      itemCode: 'ITM-0001',
      itemName: 'Aluminium Profile AS-100',
      qty: 800,
      initialQty: 1000,
      mfgDate: '2026-04-01',
      expiryDate: '2028-04-01',
      landedUnitCost: 432.00,
      finalSellingPrice: 610.00,
      marginPercent: 29.2,
      status: 'Available',
      warehouse: 'Main Warehouse',
      sequence: 2,
      poReference: 'IPO-2026-001',
      shipmentRef: 'SH-2026-001'
    },
    {
      batchNo: 'B2026-003',
      itemCode: 'ITM-0002',
      itemName: 'Tempered Glass 10mm Clear',
      qty: 200,
      initialQty: 250,
      mfgDate: '2025-12-15',
      expiryDate: '2026-06-15',
      landedUnitCost: 1100.00,
      finalSellingPrice: 1650.00,
      marginPercent: 33.3,
      status: 'Available',
      warehouse: 'Main Warehouse',
      sequence: 1,
      poReference: 'IPO-2026-002',
      shipmentRef: ''
    },
    {
      batchNo: 'B2026-004',
      itemCode: 'ITM-0002',
      itemName: 'Tempered Glass 10mm Clear',
      qty: 300,
      initialQty: 300,
      mfgDate: '2026-01-10',
      expiryDate: '2026-07-10',
      landedUnitCost: 1150.00,
      finalSellingPrice: 1720.00,
      marginPercent: 33.1,
      status: 'Available',
      warehouse: 'Main Warehouse',
      sequence: 2,
      poReference: 'IPO-2026-002',
      shipmentRef: ''
    },
    {
      batchNo: 'B2026-005',
      itemCode: 'ITM-0003',
      itemName: 'EPDM Rubber Gasket',
      qty: 1000,
      initialQty: 1000,
      mfgDate: '2026-02-15',
      expiryDate: '2026-08-15',
      landedUnitCost: 45.00,
      finalSellingPrice: 52.00,
      marginPercent: 13.5,
      status: 'On Hold',
      warehouse: 'Hold Warehouse',
      sequence: 1,
      poReference: 'IPO-2026-003',
      shipmentRef: 'SH-2026-002'
    },
    {
      batchNo: 'B2026-006',
      itemCode: 'ITM-0001',
      itemName: 'Aluminium Profile AS-100',
      qty: 150,
      initialQty: 150,
      mfgDate: '2024-05-10',
      expiryDate: '2025-05-10',
      landedUnitCost: 390.00,
      finalSellingPrice: 550.00,
      marginPercent: 29.1,
      status: 'Expired',
      warehouse: 'Hold Warehouse',
      sequence: 3,
      poReference: '',
      shipmentRef: ''
    }
  ],
  marginApprovals: [
    {
      id: 'LMA-2026-001',
      batchNo: 'B2026-005',
      itemCode: 'ITM-0003',
      itemName: 'EPDM Rubber Gasket',
      requestedPrice: 48.00,
      costPrice: 45.00,
      marginPercent: 6.25,
      customerName: 'Ace Builders',
      salesRepresentative: 'Sarah Connor',
      status: 'Pending',
      remarks: 'Customer requests 8% discount for bulk warehouse dispatch.'
    }
  ]
};

const batchImportSlice = createSlice({
  name: 'batchImport',
  initialState,
  reducers: {
    addImportPO: (state, action) => {
      state.importPOs.unshift(action.payload);
    },
    updateImportPO: (state, action) => {
      const index = state.importPOs.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.importPOs[index] = action.payload;
      }
    },
    deleteImportPO: (state, action) => {
      state.importPOs = state.importPOs.filter(p => p.id !== action.payload);
    },
    updateImportPOStatus: (state, action) => {
      const { id, status } = action.payload;
      const po = state.importPOs.find(p => p.id === id);
      if (po) po.status = status;
    },
    addShipment: (state, action) => {
      state.shipments.unshift(action.payload);
      // Link the PO status
      const po = state.importPOs.find(p => p.id === action.payload.poNo);
      if (po) po.status = 'Shipped';
    },
    updateShipmentStatus: (state, action) => {
      const { id, status, billOfEntryNo } = action.payload;
      const sh = state.shipments.find(s => s.id === id);
      if (sh) {
        sh.status = status;
        if (billOfEntryNo) sh.billOfEntryNo = billOfEntryNo;
      }
    },
    addLandedCosts: (state, action) => {
      const { id, customsDuty, freightCharges, handlingCharges, insuranceCost } = action.payload;
      const sh = state.shipments.find(s => s.id === id);
      if (sh) {
        sh.customsDuty = Number(customsDuty);
        sh.freightCharges = Number(freightCharges);
        sh.handlingCharges = Number(handlingCharges);
        sh.insuranceCost = Number(insuranceCost);
        sh.status = 'Arrived';

        const po = state.importPOs.find(p => p.id === sh.poNo);
        if (po) po.status = 'Cleared';
      }
    },
    addBatches: (state, action) => {
      // action.payload is an array of batches
      state.batches.push(...action.payload);
    },
    updateBatchStatus: (state, action) => {
      const { batchNo, status, warehouse, expiryDate } = action.payload;
      const bt = state.batches.find(b => b.batchNo === batchNo);
      if (bt) {
        if (status) bt.status = status;
        if (warehouse) bt.warehouse = warehouse;
        if (expiryDate) bt.expiryDate = expiryDate;
      }
    },
    updateBatchPricing: (state, action) => {
      const { batchNo, finalSellingPrice, marginPercent } = action.payload;
      const bt = state.batches.find(b => b.batchNo === batchNo);
      if (bt) {
        bt.finalSellingPrice = Number(finalSellingPrice);
        bt.marginPercent = Number(marginPercent);
      }
    },
    addMarginApprovalRequest: (state, action) => {
      state.marginApprovals.unshift(action.payload);
    },
    approveMarginRequest: (state, action) => {
      const { id } = action.payload;
      const req = state.marginApprovals.find(r => r.id === id);
      if (req) {
        req.status = 'Approved';
        // Apply selling price back to batch
        const bt = state.batches.find(b => b.batchNo === req.batchNo);
        if (bt) {
          bt.finalSellingPrice = req.requestedPrice;
          bt.marginPercent = req.marginPercent;
        }
      }
    },
    rejectMarginRequest: (state, action) => {
      const { id } = action.payload;
      const req = state.marginApprovals.find(r => r.id === id);
      if (req) req.status = 'Rejected';
    }
  }
});

export const {
  addImportPO,
  updateImportPO,
  deleteImportPO,
  updateImportPOStatus,
  addShipment,
  updateShipmentStatus,
  addLandedCosts,
  addBatches,
  updateBatchStatus,
  updateBatchPricing,
  addMarginApprovalRequest,
  approveMarginRequest,
  rejectMarginRequest
} = batchImportSlice.actions;

export default batchImportSlice.reducer;

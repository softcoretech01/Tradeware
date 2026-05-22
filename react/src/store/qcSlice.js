import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inspections: [
    {
      id: 'QC-2026-001',
      date: '2026-05-15',
      grnNo: 'GRN-2026-001',
      batchNo: 'BAT-PIN-9921',
      supplierName: 'GLOBAL STEEL INDUSTRIES',
      itemCode: 'ITM05316',
      itemName: 'Pin Piston Sanchin 120',
      qtyReceived: 30,
      acceptedQty: 25,
      rejectedQty: 5,
      qcStatus: 'Approved', // Pending Inspection, Under Inspection, Approved, Rejected, Rework Required, Hold
      inspectorName: 'Sam Inspector',
      remarks: '5 pcs rejected due to surface scratches. 25 approved.',
      approvalStatus: 'Approved', // Pending, Approved, Rejected
      stage: 'Incoming', // Incoming, Production, Dispatch
      checklist: [
        { name: 'Surface Polishing & Scratches Check', range: 'Visual (Zero Scratch)', value: 'Minor scratches on 5 pcs', status: 'Pass', mandatory: true },
        { name: 'Inner Diameter (12.0mm - 12.2mm)', range: '12.0mm - 12.2mm', value: '12.1mm', status: 'Pass', mandatory: true },
        { name: 'Length (45.0mm +/- 0.1mm)', range: '45.0mm +/- 0.1mm', value: '45.05mm', status: 'Pass', mandatory: true }
      ],
      attachments: []
    },
    {
      id: 'QC-2026-002',
      date: '2026-05-20',
      grnNo: 'GRN-2026-002',
      batchNo: 'BAT-GASK-8822',
      supplierName: 'Sealmax Industries',
      itemCode: 'ITM-0004',
      itemName: 'EPDM Rubber Gasket',
      qtyReceived: 100,
      acceptedQty: 0,
      rejectedQty: 100,
      qcStatus: 'Rejected',
      inspectorName: 'Alice Inspector',
      remarks: 'Failed elongation test. Material cracks on stretch.',
      approvalStatus: 'Rejected',
      stage: 'Incoming',
      checklist: [
        { name: 'Hardness check', range: 'Shore A 60-70', value: '65 Shore A', status: 'Pass', mandatory: true },
        { name: 'Elongation test', range: '>150%', value: '110% (cracking)', status: 'Fail', mandatory: true },
        { name: 'Thickness check', range: '5.0mm +/- 0.2mm', value: '5.1mm', status: 'Pass', mandatory: true }
      ],
      attachments: []
    },
    {
      id: 'QC-2026-003',
      date: '2026-05-21',
      grnNo: 'GRN-2026-003',
      batchNo: 'BAT-ALUM-4455',
      supplierName: 'AluSpec Solutions',
      itemCode: 'ITM-0001',
      itemName: 'Aluminium Extrusion Section',
      qtyReceived: 50,
      acceptedQty: 48,
      rejectedQty: 2,
      qcStatus: 'Under Inspection',
      inspectorName: 'Bob Inspector',
      remarks: 'Checking bending parameters and weight.',
      approvalStatus: 'Pending',
      stage: 'Incoming',
      checklist: [
        { name: 'Dimensional Width', range: '50mm +/- 0.5mm', value: '50.1mm', status: 'Pass', mandatory: true },
        { name: 'Length (6000mm)', range: '6000mm +/- 5mm', value: '5998mm', status: 'Pass', mandatory: true },
        { name: 'Surface Anodization', range: 'Anodized (No spots)', value: '2 pcs have minor acid spots', status: 'Fail', mandatory: false }
      ],
      attachments: []
    },
    // Production QC mock data
    {
      id: 'QC-PROD-001',
      date: '2026-05-18',
      grnNo: 'PROD-2026-B1',
      batchNo: 'BATCH-PB-901',
      supplierName: 'Internal Production Line A',
      itemCode: 'ITM05315',
      itemName: 'Stang Piston Sanchin 120',
      qtyReceived: 200,
      acceptedQty: 195,
      rejectedQty: 5,
      qcStatus: 'Approved',
      inspectorName: 'Plant Supervisor',
      remarks: 'Machine 4 alignment was off slightly for 5 pcs. Rework generated.',
      approvalStatus: 'Approved',
      stage: 'Production',
      checklist: [
        { name: 'Thread Pitch check', range: '1.25mm', value: '1.25mm', status: 'Pass', mandatory: true },
        { name: 'Tensile Strength check', range: '>350 MPa', value: '380 MPa', status: 'Pass', mandatory: true }
      ],
      attachments: [],
      machineNo: 'CNC-04',
      reworkQty: 5
    },
    // Dispatch QC mock data
    {
      id: 'QC-DISP-001',
      date: '2026-05-20',
      grnNo: 'DC-2026-880',
      batchNo: 'BAT-PIN-9921',
      supplierName: 'Sales Dispatch (Customer: Ace Engineering)',
      itemCode: 'ITM05316',
      itemName: 'Pin Piston Sanchin 120',
      qtyReceived: 25,
      acceptedQty: 25,
      rejectedQty: 0,
      qcStatus: 'Approved',
      inspectorName: 'Warehouse Manager',
      remarks: 'Packing is secure, delivery labels matching customer order PO.',
      approvalStatus: 'Approved',
      stage: 'Dispatch',
      checklist: [
        { name: 'Customs Packing Check', range: 'Double layer wrapped', value: 'Double layer wrapped', status: 'Pass', mandatory: true },
        { name: 'Labeling & Part No verification', range: 'Matches invoice details', value: 'Matches invoice details', status: 'Pass', mandatory: true }
      ],
      attachments: []
    }
  ],
  checklists: [
    {
      id: 'CK-001',
      name: 'Aluminium Section Check',
      stage: 'Incoming',
      parameters: [
        { name: 'Thickness Check', range: '2.0mm - 2.5mm', mandatory: true },
        { name: 'Surface Finish', range: 'Zero Scratch / Clean', mandatory: true },
        { name: 'Length Accuracy', range: '+/- 1mm', mandatory: true },
        { name: 'Weight per Meter', range: '1.2kg - 1.4kg', mandatory: false }
      ]
    },
    {
      id: 'CK-002',
      name: 'Rubber Gasket Parameters',
      stage: 'Incoming',
      parameters: [
        { name: 'Hardness check', range: 'Shore A 60-70', mandatory: true },
        { name: 'Elongation test', range: '>150%', mandatory: true },
        { name: 'Thickness check', range: '5.0mm +/- 0.2mm', mandatory: true }
      ]
    },
    {
      id: 'CK-003',
      name: 'CNC Thread Checks',
      stage: 'Production',
      parameters: [
        { name: 'Thread Pitch check', range: '1.25mm', mandatory: true },
        { name: 'Tensile Strength check', range: '>350 MPa', mandatory: true }
      ]
    }
  ],
  ncrs: [
    {
      id: 'NCR-2026-001',
      inspectionId: 'QC-2026-002',
      itemCode: 'ITM-0004',
      itemName: 'EPDM Rubber Gasket',
      supplierName: 'Sealmax Industries',
      defectCategory: 'Material Defect / Hardness Fail',
      rootCause: 'Sulfur compound formulation error in extrusion line, causing poor elastomeric extension.',
      correctiveAction: 'Generate immediate Supplier Return. Demand supplier replacement batch.',
      preventiveAction: 'Require material certificate of conformance (CoC) with every raw material supply shipment.',
      department: 'Purchase / Quality Assurance',
      status: 'Open' // Open, Closed
    }
  ]
};

const qcSlice = createSlice({
  name: 'qc',
  initialState,
  reducers: {
    addInspection: (state, action) => {
      state.inspections.unshift(action.payload);
    },
    updateInspection: (state, action) => {
      const idx = state.inspections.findIndex(ins => ins.id === action.payload.id);
      if (idx !== -1) {
        state.inspections[idx] = { ...state.inspections[idx], ...action.payload };
      }
    },
    deleteInspection: (state, action) => {
      state.inspections = state.inspections.filter(ins => ins.id !== action.payload);
    },
    addNCR: (state, action) => {
      state.ncrs.unshift(action.payload);
    },
    updateNCR: (state, action) => {
      const idx = state.ncrs.findIndex(ncr => ncr.id === action.payload.id);
      if (idx !== -1) {
        state.ncrs[idx] = { ...state.ncrs[idx], ...action.payload };
      }
    },
    addChecklist: (state, action) => {
      state.checklists.push(action.payload);
    },
    updateChecklist: (state, action) => {
      const idx = state.checklists.findIndex(ck => ck.id === action.payload.id);
      if (idx !== -1) {
        state.checklists[idx] = action.payload;
      }
    },
    approveInspection: (state, action) => {
      const idx = state.inspections.findIndex(ins => ins.id === action.payload.id);
      if (idx !== -1) {
        state.inspections[idx].qcStatus = 'Approved';
        state.inspections[idx].approvalStatus = 'Approved';
        if (action.payload.inspectorName) {
          state.inspections[idx].inspectorName = action.payload.inspectorName;
        }
      }
    },
    rejectInspection: (state, action) => {
      const idx = state.inspections.findIndex(ins => ins.id === action.payload.id);
      if (idx !== -1) {
        state.inspections[idx].qcStatus = 'Rejected';
        state.inspections[idx].approvalStatus = 'Rejected';
        if (action.payload.inspectorName) {
          state.inspections[idx].inspectorName = action.payload.inspectorName;
        }
      }
    }
  }
});

export const {
  addInspection,
  updateInspection,
  deleteInspection,
  addNCR,
  updateNCR,
  addChecklist,
  updateChecklist,
  approveInspection,
  rejectInspection
} = qcSlice.actions;

export default qcSlice.reducer;

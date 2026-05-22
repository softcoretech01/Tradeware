import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  adjustments: [
    {
      id: 'SA-0001',
      date: '2025-01-17',
      adjustmentType: 'Physical Correction',
      refNo: 'ADJ-2025-001',
      itemCode: 'ITM05316',
      itemName: 'Pin Piston Sanchin 120',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-001',
      uom: 'PCS',
      currentStock: 500,
      adjustedStock: 495,
      difference: -5,
      reason: 'Physical count mismatch found during audit',
      status: 'Approved',
      createdBy: 'Manager',
      approvedBy: 'Admin',
      createdAt: '2025-01-17T10:00:00',
    },
    {
      id: 'SA-0002',
      date: '2025-01-15',
      adjustmentType: 'Damaged Stock',
      refNo: 'ADJ-2025-002',
      itemCode: 'ITM05315',
      itemName: 'Stang Piston Sanchin 120',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-002',
      uom: 'PCS',
      currentStock: 200,
      adjustedStock: 195,
      difference: -5,
      reason: 'Items damaged during transport from loading dock',
      status: 'Approved',
      createdBy: 'Supervisor',
      approvedBy: 'Manager',
      createdAt: '2025-01-15T14:30:00',
    },
    {
      id: 'SA-0003',
      date: '2025-01-13',
      adjustmentType: 'Expired Stock',
      refNo: 'ADJ-2025-003',
      itemCode: 'ITM05312',
      itemName: 'Oil Seal Kit Sanchin 120',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-004',
      uom: 'SET',
      currentStock: 25,
      adjustedStock: 20,
      difference: -5,
      reason: 'Batch expired on 2024-12-31, removed from saleable stock',
      status: 'Approved',
      createdBy: 'Supervisor',
      approvedBy: 'Admin',
      createdAt: '2025-01-13T09:00:00',
    },
    {
      id: 'SA-0004',
      date: '2025-01-18',
      adjustmentType: 'Physical Correction',
      refNo: 'ADJ-2025-004',
      itemCode: 'ITM05313',
      itemName: 'Stang Piston Sanchin 120',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-008',
      uom: 'PCS',
      currentStock: 300,
      adjustedStock: 310,
      difference: 10,
      reason: 'Found additional units during warehouse reorganization',
      status: 'Pending',
      createdBy: 'Supervisor',
      approvedBy: '',
      createdAt: '2025-01-18T16:00:00',
    },
  ],
}

export const stockAdjustmentSlice = createSlice({
  name: 'stockAdjustment',
  initialState,
  reducers: {
    addAdjustment: (state, action) => {
      state.adjustments.unshift(action.payload)
    },
    updateAdjustment: (state, action) => {
      const idx = state.adjustments.findIndex(a => a.id === action.payload.id)
      if (idx !== -1) state.adjustments[idx] = action.payload
    },
    deleteAdjustment: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload
      state.adjustments = state.adjustments.filter(a => a.id !== id)
    },
    approveAdjustment: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload
      const adj = state.adjustments.find(a => a.id === id)
      if (adj) { adj.status = 'Approved'; adj.approvedBy = 'Admin' }
    },
    rejectAdjustment: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload
      const adj = state.adjustments.find(a => a.id === id)
      if (adj) { adj.status = 'Rejected'; adj.approvedBy = 'Admin' }
    },
  },
})

export const { addAdjustment, updateAdjustment, deleteAdjustment, approveAdjustment, rejectAdjustment } = stockAdjustmentSlice.actions
export default stockAdjustmentSlice.reducer

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  transactions: [
    {
      id: 'SO-0001',
      date: '2025-01-16',
      outwardType: 'Sales Delivery',
      refNo: 'SD-2025-001',
      itemCode: 'ITM05316',
      itemName: 'Pin Piston Sanchin 120',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-001',
      uom: 'PCS',
      quantity: 50,
      costPrice: 120.00,
      totalValue: 6000.00,
      customerName: 'ABC Engineering Ltd',
      customerPO: 'CPO-2025-115',
      remarks: 'Delivered to customer site',
      status: 'Completed',
      createdBy: 'Admin',
      createdAt: '2025-01-16T10:00:00',
    },
    {
      id: 'SO-0002',
      date: '2025-01-14',
      outwardType: 'Project Supply',
      refNo: 'PS-2025-001',
      itemCode: 'ITM05315',
      itemName: 'Stang Piston Sanchin 120',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-002',
      uom: 'PCS',
      quantity: 30,
      costPrice: 350.00,
      totalValue: 10500.00,
      customerName: 'XYZ Construction',
      customerPO: 'CPO-2025-109',
      remarks: 'Issued for Greenfield project Phase 2',
      status: 'Completed',
      createdBy: 'Admin',
      createdAt: '2025-01-14T15:30:00',
    },
    {
      id: 'SO-0003',
      date: '2025-01-13',
      outwardType: 'Sample Issue',
      refNo: 'SAM-2025-001',
      itemCode: 'ITM05309',
      itemName: 'Selendang Ban 1000-20 KR Malaysia',
      warehouse: 'Secondary Warehouse',
      batchNo: 'B2024-005',
      uom: 'PCS',
      quantity: 2,
      costPrice: 2200.00,
      totalValue: 4400.00,
      customerName: 'Demo Customer Pvt Ltd',
      customerPO: '',
      remarks: 'Sample for quality evaluation',
      status: 'Completed',
      createdBy: 'Supervisor',
      createdAt: '2025-01-13T11:00:00',
    },
    {
      id: 'SO-0004',
      date: '2025-01-11',
      outwardType: 'Stock Transfer',
      refNo: 'ST-OUT-2025-001',
      itemCode: 'ITM05308',
      itemName: 'Selendang Ban 750-16 KR Malaysia',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-006',
      uom: 'PCS',
      quantity: 20,
      costPrice: 1800.00,
      totalValue: 36000.00,
      customerName: '',
      customerPO: '',
      remarks: 'Transfer to Secondary Warehouse',
      status: 'Completed',
      createdBy: 'Manager',
      createdAt: '2025-01-11T09:00:00',
    },
    {
      id: 'SO-0005',
      date: '2025-01-09',
      outwardType: 'Damage Issue',
      refNo: 'DI-2025-001',
      itemCode: 'ITM05313',
      itemName: 'Stang Piston Sanchin 120',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-008',
      uom: 'PCS',
      quantity: 10,
      costPrice: 350.00,
      totalValue: 3500.00,
      customerName: '',
      customerPO: '',
      remarks: 'Damaged during warehouse handling',
      status: 'Completed',
      createdBy: 'Supervisor',
      createdAt: '2025-01-09T16:45:00',
    },
  ],
}

export const stockOutwardSlice = createSlice({
  name: 'stockOutward',
  initialState,
  reducers: {
    addStockOutward: (state, action) => {
      state.transactions.unshift(action.payload)
    },
    updateStockOutward: (state, action) => {
      const transaction = action.payload.newTransaction || action.payload
      const idx = state.transactions.findIndex(t => t.id === transaction.id)
      if (idx !== -1) state.transactions[idx] = transaction
    },
    deleteStockOutward: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload
      state.transactions = state.transactions.filter(t => t.id !== id)
    },
  },
})

export const { addStockOutward, updateStockOutward, deleteStockOutward } = stockOutwardSlice.actions
export default stockOutwardSlice.reducer

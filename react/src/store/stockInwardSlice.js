import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  transactions: [
    {
      id: 'SI-0001',
      date: '2025-01-15',
      inwardType: 'Purchase Receipt',
      refNo: 'PR-2025-001',
      itemCode: 'ITM05316',
      itemName: 'Pin Piston Sanchin 120',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-001',
      uom: 'PCS',
      quantity: 200,
      costPrice: 120.00,
      totalValue: 24000.00,
      supplierName: 'Sanchin Industries',
      poReference: 'PO-2025-0042',
      remarks: 'Regular stock replenishment',
      status: 'Completed',
      createdBy: 'Admin',
      createdAt: '2025-01-15T10:30:00',
    },
    {
      id: 'SI-0002',
      date: '2025-01-12',
      inwardType: 'Import Receipt',
      refNo: 'IR-2025-001',
      itemCode: 'ITM05315',
      itemName: 'Stang Piston Sanchin 120',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-002',
      uom: 'PCS',
      quantity: 100,
      costPrice: 350.00,
      totalValue: 35000.00,
      supplierName: 'Overseas Trading Co',
      poReference: 'PO-2025-0038',
      remarks: 'Import from Japan via sea freight',
      status: 'Completed',
      createdBy: 'Admin',
      createdAt: '2025-01-12T14:20:00',
    },
    {
      id: 'SI-0003',
      date: '2025-01-10',
      inwardType: 'Stock Transfer',
      refNo: 'ST-2025-001',
      itemCode: 'ITM05310',
      itemName: 'Selendang Ban 1100-20 KR Malaysia',
      warehouse: 'Secondary Warehouse',
      batchNo: 'B2024-003',
      uom: 'PCS',
      quantity: 15,
      costPrice: 2500.00,
      totalValue: 37500.00,
      supplierName: '',
      poReference: '',
      remarks: 'Transfer from Main Warehouse',
      status: 'Completed',
      createdBy: 'Manager',
      createdAt: '2025-01-10T09:15:00',
    },
    {
      id: 'SI-0004',
      date: '2025-01-08',
      inwardType: 'Opening Stock',
      refNo: 'OS-2025-001',
      itemCode: 'ITM05308',
      itemName: 'Selendang Ban 750-16 KR Malaysia',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-006',
      uom: 'PCS',
      quantity: 120,
      costPrice: 1800.00,
      totalValue: 216000.00,
      supplierName: '',
      poReference: '',
      remarks: 'Opening stock entry for new financial year',
      status: 'Completed',
      createdBy: 'Admin',
      createdAt: '2025-01-08T08:00:00',
    },
    {
      id: 'SI-0005',
      date: '2025-01-14',
      inwardType: 'Sales Return',
      refNo: 'SR-2025-001',
      itemCode: 'ITM05309',
      itemName: 'Selendang Ban 1000-20 KR Malaysia',
      warehouse: 'Secondary Warehouse',
      batchNo: 'B2024-005',
      uom: 'PCS',
      quantity: 10,
      costPrice: 2200.00,
      totalValue: 22000.00,
      supplierName: '',
      poReference: 'CPO-2025-098',
      remarks: 'Customer returned defective items',
      status: 'Completed',
      createdBy: 'Supervisor',
      createdAt: '2025-01-14T11:00:00',
    },
  ],
}

export const stockInwardSlice = createSlice({
  name: 'stockInward',
  initialState,
  reducers: {
    addStockInward: (state, action) => {
      state.transactions.unshift(action.payload)
    },
    updateStockInward: (state, action) => {
      const transaction = action.payload.newTransaction || action.payload
      const idx = state.transactions.findIndex(t => t.id === transaction.id)
      if (idx !== -1) state.transactions[idx] = transaction
    },
    deleteStockInward: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload
      state.transactions = state.transactions.filter(t => t.id !== id)
    },
  },
})

export const { addStockInward, updateStockInward, deleteStockInward } = stockInwardSlice.actions
export default stockInwardSlice.reducer

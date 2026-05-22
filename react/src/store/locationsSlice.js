import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  warehouses: [
    {
      id: 'WH001',
      name: 'SINGAPORE CENTRAL WAREHOUSE',
      address: '10 Changi South Lane, Singapore 486123',
      manager: 'Alex Tan',
      phone: '6591234567',
      active: true,
      racks: ['Rack A-01', 'Rack A-02', 'Bin B-101', 'Bin B-102'],
      stockTracking: [
        { itemCode: 'ITM05316', itemName: 'Pin Piston Sanchin 120', rackBin: 'Rack A-01', qty: 250 },
        { itemCode: 'ITM05315', itemName: 'Stang Piston Sanchin 120', rackBin: 'Bin B-101', qty: 180 }
      ]
    },
    {
      id: 'WH002',
      name: 'JURONG EAST DEPOT',
      address: '50 Jurong Gateway Road, Singapore 608518',
      manager: 'Sarah Lim',
      phone: '6598765432',
      active: true,
      racks: ['Rack C-01', 'Rack C-02', 'Bin D-201'],
      stockTracking: [
        { itemCode: 'ITM05314', itemName: 'Pin Piston Sanchin 120', rackBin: 'Rack C-01', qty: 120 },
        { itemCode: 'ITM05312', itemName: 'Oil Seal Kit Sanchin 120', rackBin: 'Bin D-201', qty: 400 }
      ]
    },
    {
      id: 'WH003',
      name: 'WOODLANDS DISTRIBUTION HUB',
      address: '12 Woodlands Loop, Singapore 738283',
      manager: 'Rafi Ahmed',
      phone: '6595556666',
      active: true,
      racks: ['Rack W-1', 'Bin W-102'],
      stockTracking: [
        { itemCode: 'ITM05310', itemName: 'Selendang Ban 1100-20 KR Malaysia', rackBin: 'Rack W-1', qty: 95 }
      ]
    }
  ],
  loading: false,
  error: null
}

export const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    addWarehouse: (state, action) => {
      state.warehouses.unshift(action.payload)
    },
    updateWarehouse: (state, action) => {
      const index = state.warehouses.findIndex(w => w.id === action.payload.id)
      if (index !== -1) {
        state.warehouses[index] = action.payload
      }
    },
    toggleWarehouseStatus: (state, action) => {
      const warehouse = state.warehouses.find(w => w.id === action.payload)
      if (warehouse) warehouse.active = !warehouse.active
    },
    deleteWarehouse: (state, action) => {
      state.warehouses = state.warehouses.filter(w => w.id !== action.payload)
    }
  }
})

export const { addWarehouse, updateWarehouse, toggleWarehouseStatus, deleteWarehouse } = locationsSlice.actions
export default locationsSlice.reducer

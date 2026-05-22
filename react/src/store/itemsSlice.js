import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [
    { id: 'ITM05316', name: 'Pin Piston Sanchin 120', group: 'GENERAL', category: 'GENERAL', brand: 'Sanchin', uom: 'PCS', active: true, standardPrice: 125, buildersPrice: 110, dealersPrice: 100, contractorsPrice: 115, houseOwnersPrice: 120 },
    { id: 'ITM05315', name: 'Stang Piston Sanchin 120', group: 'GENERAL', category: 'GENERAL', brand: 'Sanchin', uom: 'PCS', active: true, standardPrice: 240, buildersPrice: 210, dealersPrice: 195, contractorsPrice: 220, houseOwnersPrice: 230 },
    { id: 'ITM05314', name: 'Pin Piston Sanchin 120', group: 'GENERAL', category: 'GENERAL', brand: 'Sanchin', uom: 'PCS', active: true, standardPrice: 125, buildersPrice: 110, dealersPrice: 100, contractorsPrice: 115, houseOwnersPrice: 120 },
    { id: 'ITM05313', name: 'Stang Piston Sanchin 120', group: 'GENERAL', category: 'GENERAL', brand: 'Sanchin', uom: 'PCS', active: true, standardPrice: 240, buildersPrice: 210, dealersPrice: 195, contractorsPrice: 220, houseOwnersPrice: 230 },
    { id: 'ITM05312', name: 'Oil Seal Kit Sanchin 120', group: 'GENERAL', category: 'GENERAL', brand: 'Sanchin', uom: 'SET', active: true, standardPrice: 85, buildersPrice: 75, dealersPrice: 70, contractorsPrice: 78, houseOwnersPrice: 82 },
    { id: 'ITM05311', name: 'Biaya Jasa Konsultasi Pajak Tahunan', group: 'OTHER', category: 'Service', brand: 'TaxConsult', uom: 'SET', active: true, standardPrice: 1500, buildersPrice: 1500, dealersPrice: 1500, contractorsPrice: 1500, houseOwnersPrice: 1500 },
    { id: 'ITM05310', name: 'Selendang Ban 1100-20 KR Malaysia', group: 'VEHICLE', category: 'VEHICLE TIRE', brand: 'KR Malaysia', uom: 'PCS', active: true, standardPrice: 320, buildersPrice: 290, dealersPrice: 270, contractorsPrice: 300, houseOwnersPrice: 310 },
    { id: 'ITM05309', name: 'Selendang Ban 1000-20 KR Malaysia', group: 'VEHICLE', category: 'VEHICLE TIRE', brand: 'KR Malaysia', uom: 'PCS', active: true, standardPrice: 280, buildersPrice: 250, dealersPrice: 230, contractorsPrice: 260, houseOwnersPrice: 270 },
    { id: 'ITM05308', name: 'Selendang Ban 750-16 KR Malaysia', group: 'VEHICLE', category: 'VEHICLE TIRE', brand: 'KR Malaysia', uom: 'PCS', active: true, standardPrice: 220, buildersPrice: 190, dealersPrice: 180, contractorsPrice: 200, houseOwnersPrice: 210 },
  ],
  loading: false,
  error: null,
}

export const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    addItem: (state, action) => {
      state.items.unshift(action.payload)
    },
    updateItem: (state, action) => {
      const index = state.items.findIndex(i => i.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    toggleItemStatus: (state, action) => {
      const item = state.items.find(i => i.id === action.payload)
      if (item) item.active = !item.active
    },
    deleteItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload)
    },
  },
})

export const { addItem, updateItem, toggleItemStatus, deleteItem } = itemsSlice.actions
export default itemsSlice.reducer

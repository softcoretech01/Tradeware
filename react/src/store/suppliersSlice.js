import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  suppliers: [
    {
      id: 'SUPP-1',
      name: 'GLOBAL STEEL INDUSTRIES',
      email: 'sales@globalsteel.com',
      phone: '6588771122',
      type: 'Import vendors',
      currency: 'USD',
      leadTime: '30',
      active: true,
      taxDetails: {
        taxId: 'US-887766554',
        regType: 'Registered',
        taxRate: '18'
      },
      paymentTerms: 'Net 60',
      importDetails: {
        licenseNo: 'IMP-ST-99882',
        incoterms: 'FOB',
        portLoading: 'Shanghai Port',
        portDischarge: 'Singapore PSA',
        shippingLine: 'Maersk Line'
      }
    },
    {
      id: 'SUPP-2',
      name: 'SINGAPORE HARDWARE SUPPLIES',
      email: 'order@singhardware.sg',
      phone: '6567778888',
      type: 'Local suppliers',
      currency: 'SGD',
      leadTime: '3',
      active: true,
      taxDetails: {
        taxId: '22BBBBB3333C1Z5',
        regType: 'Registered',
        taxRate: '9'
      },
      paymentTerms: 'COD',
      importDetails: {
        licenseNo: '',
        incoterms: 'EXW',
        portLoading: '',
        portDischarge: '',
        shippingLine: ''
      }
    },
    {
      id: 'SUPP-3',
      name: 'EUROPEAN VALVE SYSTEMS GMBH',
      email: 'info@eurovalves.de',
      phone: '4989123456',
      type: 'Overseas suppliers',
      currency: 'EUR',
      leadTime: '15',
      active: true,
      taxDetails: {
        taxId: 'DE123456789',
        regType: 'VAT Registered',
        taxRate: '0'
      },
      paymentTerms: 'Net 30',
      importDetails: {
        licenseNo: 'IMP-EU-55441',
        incoterms: 'CIF',
        portLoading: 'Hamburg Port',
        portDischarge: 'Singapore PSA',
        shippingLine: 'CMA CGM'
      }
    }
  ],
  loading: false,
  error: null
}

export const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {
    addSupplier: (state, action) => {
      state.suppliers.unshift(action.payload)
    },
    updateSupplier: (state, action) => {
      const index = state.suppliers.findIndex(s => s.id === action.payload.id)
      if (index !== -1) {
        state.suppliers[index] = action.payload
      }
    },
    toggleSupplierStatus: (state, action) => {
      const supplier = state.suppliers.find(s => s.id === action.payload)
      if (supplier) supplier.active = !supplier.active
    },
    deleteSupplier: (state, action) => {
      state.suppliers = state.suppliers.filter(s => s.id !== action.payload)
    }
  }
})

export const { addSupplier, updateSupplier, toggleSupplierStatus, deleteSupplier } = suppliersSlice.actions
export default suppliersSlice.reducer

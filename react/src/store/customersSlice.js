import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  customers: [
    {
      id: 'CUST-1',
      name: 'ACE FIRE ENGINEERING PTE LTD',
      email: 'contact@acefire.com',
      phone: '65432109',
      type: 'Contractors',
      active: true,
      billingAddress: {
        line1: '10 Ubi Crescent',
        line2: '#05-24 Ubi Techpark',
        city: 'Singapore',
        state: 'Singapore',
        zip: '408564'
      },
      shippingAddress: {
        line1: '10 Ubi Crescent',
        line2: '#05-24 Ubi Techpark',
        city: 'Singapore',
        state: 'Singapore',
        zip: '408564'
      },
      gstDetails: {
        gstin: '22AAAAA1111A1Z1',
        stateCode: '22',
        regType: 'Registered'
      },
      creditLimit: 50000,
      paymentTerms: 'Net 30',
      priceCategory: 'Wholesale',
      contactPersons: [
        { name: 'John Doe', designation: 'Project Manager', phone: '98765432', email: 'john@acefire.com' }
      ],
      projects: [
        { name: 'Changi Airport T5 Fire System', location: 'Changi', description: 'Fire alarm and sprinkler systems installation', value: '250000' }
      ]
    },
    {
      id: 'CUST-2',
      name: 'AIR LIQUIDE SINGAPORE PTE LTD',
      email: 'Martius@btg.com',
      phone: '5555555555',
      type: 'Dealers',
      active: true,
      billingAddress: {
        line1: '20 Woodlands Loop',
        line2: '',
        city: 'Singapore',
        state: 'Singapore',
        zip: '738321'
      },
      shippingAddress: {
        line1: '20 Woodlands Loop',
        line2: '',
        city: 'Singapore',
        state: 'Singapore',
        zip: '738321'
      },
      gstDetails: {
        gstin: '29BBBBB2222B2Z2',
        stateCode: '29',
        regType: 'Registered'
      },
      creditLimit: 150000,
      paymentTerms: 'Net 60',
      priceCategory: 'Distributor',
      contactPersons: [
        { name: 'Martius Tan', designation: 'Procurement Specialist', phone: '5555555555', email: 'Martius@btg.com' }
      ],
      projects: [
        { name: 'Woodlands Gas Pipeline Expansion', location: 'Woodlands', description: 'High pressure gas piping supply', value: '500000' }
      ]
    },
    {
      id: 'CUST-3',
      name: 'AKHUN SERVICE',
      email: 'support@akhun.com',
      phone: '88123456',
      type: 'House Owners',
      active: true,
      billingAddress: {
        line1: 'Block 123 Jurong East St 13',
        line2: '#10-45',
        city: 'Singapore',
        state: 'Singapore',
        zip: '600123'
      },
      shippingAddress: {
        line1: 'Block 123 Jurong East St 13',
        line2: '#10-45',
        city: 'Singapore',
        state: 'Singapore',
        zip: '600123'
      },
      gstDetails: {
        gstin: '',
        stateCode: '',
        regType: 'Unregistered'
      },
      creditLimit: 5000,
      paymentTerms: 'COD',
      priceCategory: 'Retail',
      contactPersons: [
        { name: 'Akhun Ali', designation: 'Owner', phone: '88123456', email: 'support@akhun.com' }
      ],
      projects: []
    }
  ],
  loading: false,
  error: null
}

export const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    addCustomer: (state, action) => {
      state.customers.unshift(action.payload)
    },
    updateCustomer: (state, action) => {
      const index = state.customers.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.customers[index] = action.payload
      }
    },
    toggleCustomerStatus: (state, action) => {
      const customer = state.customers.find(c => c.id === action.payload)
      if (customer) customer.active = !customer.active
    },
    deleteCustomer: (state, action) => {
      state.customers = state.customers.filter(c => c.id !== action.payload)
    }
  }
})

export const { addCustomer, updateCustomer, toggleCustomerStatus, deleteCustomer } = customersSlice.actions
export default customersSlice.reducer

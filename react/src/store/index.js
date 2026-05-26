import { configureStore } from '@reduxjs/toolkit'
import itemsReducer from './itemsSlice'
import customersReducer from './customersSlice'
import suppliersReducer from './suppliersSlice'
import locationsReducer from './locationsSlice'
import inventoryReducer from './inventorySlice'
import stockInwardReducer from './stockInwardSlice'
import stockOutwardReducer from './stockOutwardSlice'
import stockAdjustmentReducer from './stockAdjustmentSlice'
import erpReducer from './erpSlice'
import qcReducer from './qcSlice'
import batchImportReducer from './batchImportSlice'
import crmReducer from './crmSlice'
import financeReducer from './financeSlice'

export const store = configureStore({
  reducer: {
    items: itemsReducer,
    customers: customersReducer,
    suppliers: suppliersReducer,
    locations: locationsReducer,
    inventory: inventoryReducer,
    stockInward: stockInwardReducer,
    stockOutward: stockOutwardReducer,
    stockAdjustment: stockAdjustmentReducer,
    erp: erpReducer,
    qc: qcReducer,
    batchImport: batchImportReducer,
    crm: crmReducer,
    finance: financeReducer,
  },
})

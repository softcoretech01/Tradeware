import { createSlice } from '@reduxjs/toolkit'
import { addStockInward, updateStockInward, deleteStockInward } from './stockInwardSlice'
import { addStockOutward, updateStockOutward, deleteStockOutward } from './stockOutwardSlice'
import { addAdjustment, approveAdjustment, deleteAdjustment } from './stockAdjustmentSlice'

const initialState = {
  inventory: [
    {
      id: 'INV-0001',
      itemCode: 'ITM05316',
      itemName: 'Pin Piston Sanchin 120',
      category: 'Hardware',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-001',
      totalStock: 500,
      reservedStock: 50,
      availableStock: 450,
      damagedStock: 0,
      uom: 'PCS',
      minStock: 100,
      reorderLevel: 150,
      lastInwardDate: '2024-12-15',
      lastOutwardDate: '2025-01-10',
      lastInwardType: 'Purchase Receipt',
      costPrice: 120.00,
      status: 'In Stock',
      approvalStatus: 'Approved',
      active: true,
    },
    {
      id: 'INV-0002',
      itemCode: 'ITM05315',
      itemName: 'Stang Piston Sanchin 120',
      category: 'Hardware',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-002',
      totalStock: 200,
      reservedStock: 30,
      availableStock: 170,
      damagedStock: 5,
      uom: 'PCS',
      minStock: 50,
      reorderLevel: 80,
      lastInwardDate: '2024-11-20',
      lastOutwardDate: '2025-01-05',
      lastInwardType: 'Import Receipt',
      costPrice: 350.00,
      status: 'In Stock',
      approvalStatus: 'Approved',
      active: true,
    },
    {
      id: 'INV-0003',
      itemCode: 'ITM05310',
      itemName: 'Selendang Ban 1100-20 KR Malaysia',
      category: 'Rubber',
      warehouse: 'Secondary Warehouse',
      batchNo: 'B2024-003',
      totalStock: 15,
      reservedStock: 10,
      availableStock: 5,
      damagedStock: 2,
      uom: 'PCS',
      minStock: 20,
      reorderLevel: 30,
      lastInwardDate: '2024-10-08',
      lastOutwardDate: '2025-01-12',
      lastInwardType: 'Stock Transfer',
      costPrice: 2500.00,
      status: 'Low Stock',
      approvalStatus: 'Pending',
      active: true,
    },
    {
      id: 'INV-0004',
      itemCode: 'ITM05312',
      itemName: 'Oil Seal Kit Sanchin 120',
      category: 'Hardware',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-004',
      totalStock: 0,
      reservedStock: 0,
      availableStock: 0,
      damagedStock: 0,
      uom: 'SET',
      minStock: 25,
      reorderLevel: 40,
      lastInwardDate: '2024-08-22',
      lastOutwardDate: '2024-12-30',
      lastInwardType: 'Purchase Receipt',
      costPrice: 180.00,
      status: 'Out of Stock',
      approvalStatus: 'Approved',
      active: true,
    },
    {
      id: 'INV-0005',
      itemCode: 'ITM05309',
      itemName: 'Selendang Ban 1000-20 KR Malaysia',
      category: 'Rubber',
      warehouse: 'Secondary Warehouse',
      batchNo: 'B2024-005',
      totalStock: 80,
      reservedStock: 20,
      availableStock: 60,
      damagedStock: 3,
      uom: 'PCS',
      minStock: 15,
      reorderLevel: 25,
      lastInwardDate: '2025-01-02',
      lastOutwardDate: '2025-01-14',
      lastInwardType: 'Sales Return',
      costPrice: 2200.00,
      status: 'In Stock',
      approvalStatus: 'Approved',
      active: true,
    },
    {
      id: 'INV-0006',
      itemCode: 'ITM05308',
      itemName: 'Selendang Ban 750-16 KR Malaysia',
      category: 'Rubber',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-006',
      totalStock: 120,
      reservedStock: 0,
      availableStock: 120,
      damagedStock: 0,
      uom: 'PCS',
      minStock: 30,
      reorderLevel: 50,
      lastInwardDate: '2025-01-08',
      lastOutwardDate: '2025-01-11',
      lastInwardType: 'Opening Stock',
      costPrice: 1800.00,
      status: 'In Stock',
      approvalStatus: 'Approved',
      active: true,
    },
    {
      id: 'INV-0007',
      itemCode: 'ITM05314',
      itemName: 'Pin Piston Sanchin 120',
      category: 'Hardware',
      warehouse: 'Secondary Warehouse',
      batchNo: 'B2024-007',
      totalStock: 45,
      reservedStock: 45,
      availableStock: 0,
      damagedStock: 0,
      uom: 'PCS',
      minStock: 50,
      reorderLevel: 75,
      lastInwardDate: '2024-12-28',
      lastOutwardDate: '2025-01-09',
      lastInwardType: 'Purchase Receipt',
      costPrice: 120.00,
      status: 'Reserved',
      approvalStatus: 'Pending',
      active: true,
    },
    {
      id: 'INV-0008',
      itemCode: 'ITM05313',
      itemName: 'Stang Piston Sanchin 120',
      category: 'Hardware',
      warehouse: 'Main Warehouse',
      batchNo: 'B2024-008',
      totalStock: 300,
      reservedStock: 100,
      availableStock: 200,
      damagedStock: 10,
      uom: 'PCS',
      minStock: 60,
      reorderLevel: 100,
      lastInwardDate: '2025-01-06',
      lastOutwardDate: '2025-01-13',
      lastInwardType: 'Import Receipt',
      costPrice: 350.00,
      status: 'In Stock',
      approvalStatus: 'Approved',
      active: true,
    },
  ],
  auditLog: [
    {
      id: 'AUD-0001',
      action: 'Created',
      itemCode: 'ITM05316',
      details: 'Initial inventory record created via opening stock import',
      oldValue: '0',
      newValue: '500',
      timestamp: '2025-01-08T10:30:00.000Z',
      user: 'System Admin',
    },
    {
      id: 'AUD-0002',
      action: 'Stock Adjustment',
      itemCode: 'ITM05315',
      details: 'Damaged stock adjustment of 5 units',
      oldValue: '0',
      newValue: '5',
      timestamp: '2025-01-10T14:15:00.000Z',
      user: 'Inventory Manager',
    },
    {
      id: 'AUD-0003',
      action: 'Approval',
      itemCode: 'ITM05310',
      details: 'Item approval request submitted',
      oldValue: 'N/A',
      newValue: 'Pending',
      timestamp: '2025-01-12T09:00:00.000Z',
      user: 'Luke Skywalker',
    }
  ],
  loading: false,
  error: null,
}

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addInventory: (state, action) => {
      const newItem = {
        ...action.payload,
        approvalStatus: action.payload.approvalStatus || 'Pending',
      }
      state.inventory.unshift(newItem)
      state.auditLog.unshift({
        id: `AUD-${Date.now()}`,
        action: 'Created',
        itemCode: newItem.itemCode,
        details: `Inventory record created: ${newItem.itemName}`,
        oldValue: 'N/A',
        newValue: newItem.totalStock.toString(),
        timestamp: new Date().toISOString(),
        user: 'Admin',
      })
    },
    updateInventory: (state, action) => {
      const index = state.inventory.findIndex(i => i.id === action.payload.id)
      if (index !== -1) {
        const oldItem = state.inventory[index]
        state.inventory[index] = { ...oldItem, ...action.payload }
        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: 'Updated',
          itemCode: action.payload.itemCode || oldItem.itemCode,
          details: `Inventory record updated`,
          oldValue: oldItem.totalStock.toString(),
          newValue: (action.payload.totalStock !== undefined ? action.payload.totalStock : oldItem.totalStock).toString(),
          timestamp: new Date().toISOString(),
          user: 'Admin',
        })
      }
    },
    toggleInventoryStatus: (state, action) => {
      const inv = state.inventory.find(i => i.id === action.payload)
      if (inv) {
        inv.active = !inv.active
        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: 'Status Change',
          itemCode: inv.itemCode,
          details: `Inventory status toggled to ${inv.active ? 'Active' : 'Inactive'}`,
          oldValue: (!inv.active).toString(),
          newValue: inv.active.toString(),
          timestamp: new Date().toISOString(),
          user: 'Admin',
        })
      }
    },
    deleteInventory: (state, action) => {
      const inv = state.inventory.find(i => i.id === action.payload)
      if (inv) {
        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: 'Deleted',
          itemCode: inv.itemCode,
          details: `Inventory record deleted: ${inv.itemName}`,
          oldValue: inv.totalStock.toString(),
          newValue: 'Deleted',
          timestamp: new Date().toISOString(),
          user: 'Admin',
        })
        state.inventory = state.inventory.filter(i => i.id !== action.payload)
      }
    },
    adjustStock: (state, action) => {
      const { id, adjustmentType, quantity, reason } = action.payload
      const inv = state.inventory.find(i => i.id === id)
      if (inv) {
        const oldVal = inv.totalStock
        if (adjustmentType === 'Physical Correction') {
          inv.totalStock = quantity
          inv.availableStock = quantity - inv.reservedStock - inv.damagedStock
        } else if (adjustmentType === 'Damaged') {
          inv.damagedStock += quantity
          inv.availableStock -= quantity
        } else if (adjustmentType === 'Expired') {
          inv.totalStock -= quantity
          inv.availableStock -= quantity
        } else if (adjustmentType === 'inward') {
          inv.totalStock += quantity
          inv.availableStock += quantity
        } else if (adjustmentType === 'outward') {
          inv.totalStock -= quantity
          inv.availableStock -= quantity
        }
        // Update status
        if (inv.availableStock <= 0 && inv.reservedStock > 0) inv.status = 'Reserved'
        else if (inv.totalStock <= 0) inv.status = 'Out of Stock'
        else if (inv.availableStock <= inv.minStock) inv.status = 'Low Stock'
        else inv.status = 'In Stock'

        // Log audit
        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: adjustmentType === 'inward' ? 'Stock Inward' : adjustmentType === 'outward' ? 'Stock Outward' : adjustmentType,
          itemCode: inv.itemCode,
          details: `Stock adjustment: ${reason || 'No reason provided'}`,
          oldValue: oldVal.toString(),
          newValue: inv.totalStock.toString(),
          timestamp: new Date().toISOString(),
          user: 'Admin',
        })
      }
    },
    updateApprovalStatus: (state, action) => {
      const { id, status } = action.payload
      const inv = state.inventory.find(i => i.id === id)
      if (inv) {
        const oldStatus = inv.approvalStatus || 'Pending'
        inv.approvalStatus = status
        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: 'Approval',
          itemCode: inv.itemCode,
          details: `Approval status changed to ${status}`,
          oldValue: oldStatus,
          newValue: status,
          timestamp: new Date().toISOString(),
          user: 'Admin',
        })
      }
    },
  },
  extraReducers: (builder) => {
    const findOrCreateInventoryItem = (state, itemCode, itemName, warehouse, uom) => {
      let inv = state.inventory.find(i => i.itemCode === itemCode && i.warehouse === warehouse);
      if (!inv) {
        inv = {
          id: `INV-${String(Date.now() + Math.random()).slice(-4)}`,
          itemCode,
          itemName,
          category: 'Hardware',
          warehouse,
          batchNo: '',
          totalStock: 0,
          reservedStock: 0,
          availableStock: 0,
          damagedStock: 0,
          uom: uom || 'PCS',
          minStock: 50,
          reorderLevel: 80,
          lastInwardDate: null,
          lastOutwardDate: null,
          lastInwardType: null,
          costPrice: 0,
          status: 'In Stock',
          approvalStatus: 'Approved',
          active: true,
        };
        state.inventory.unshift(inv);
      }
      return inv;
    };

    const updateItemStatus = (inv) => {
      if (inv.availableStock <= 0 && inv.reservedStock > 0) inv.status = 'Reserved';
      else if (inv.totalStock <= 0) inv.status = 'Out of Stock';
      else if (inv.availableStock <= inv.minStock) inv.status = 'Low Stock';
      else inv.status = 'In Stock';
    };

    // ── STOCK INWARD SYNCHRONIZATION ──
    builder.addCase(addStockInward, (state, action) => {
      const tx = action.payload;
      if (tx.status === 'Completed') {
        const inv = findOrCreateInventoryItem(state, tx.itemCode, tx.itemName, tx.warehouse, tx.uom);
        const oldVal = inv.totalStock;
        inv.totalStock += tx.quantity;
        inv.availableStock += tx.quantity;
        if (tx.costPrice) inv.costPrice = Number(tx.costPrice);
        inv.lastInwardDate = tx.date;
        inv.lastInwardType = tx.inwardType;
        updateItemStatus(inv);
        
        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: 'Stock Inward',
          itemCode: inv.itemCode,
          details: `Inward transaction ${tx.id} (${tx.inwardType}) processed. Ref: ${tx.refNo}`,
          oldValue: oldVal.toString(),
          newValue: inv.totalStock.toString(),
          timestamp: new Date().toISOString(),
          user: tx.createdBy || 'Admin',
        });
      }
    });

    builder.addCase(updateStockInward, (state, action) => {
      const { oldTransaction, newTransaction } = action.payload;
      if (!oldTransaction || !newTransaction) return;

      // 1. Revert old transaction if it was Completed
      if (oldTransaction.status === 'Completed') {
        const oldInv = state.inventory.find(i => i.itemCode === oldTransaction.itemCode && i.warehouse === oldTransaction.warehouse);
        if (oldInv) {
          oldInv.totalStock -= oldTransaction.quantity;
          oldInv.availableStock -= oldTransaction.quantity;
          updateItemStatus(oldInv);
        }
      }

      // 2. Apply new transaction if it is Completed
      if (newTransaction.status === 'Completed') {
        const inv = findOrCreateInventoryItem(state, newTransaction.itemCode, newTransaction.itemName, newTransaction.warehouse, newTransaction.uom);
        const oldVal = inv.totalStock;
        inv.totalStock += newTransaction.quantity;
        inv.availableStock += newTransaction.quantity;
        if (newTransaction.costPrice) inv.costPrice = Number(newTransaction.costPrice);
        inv.lastInwardDate = newTransaction.date;
        inv.lastInwardType = newTransaction.inwardType;
        updateItemStatus(inv);

        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: 'Stock Inward Edit',
          itemCode: inv.itemCode,
          details: `Inward transaction ${newTransaction.id} edited. Ref: ${newTransaction.refNo}`,
          oldValue: oldVal.toString(),
          newValue: inv.totalStock.toString(),
          timestamp: new Date().toISOString(),
          user: newTransaction.createdBy || 'Admin',
        });
      }
    });

    builder.addCase(deleteStockInward, (state, action) => {
      const tx = action.payload;
      if (tx && tx.status === 'Completed') {
        const inv = state.inventory.find(i => i.itemCode === tx.itemCode && i.warehouse === tx.warehouse);
        if (inv) {
          const oldVal = inv.totalStock;
          inv.totalStock -= tx.quantity;
          inv.availableStock -= tx.quantity;
          updateItemStatus(inv);

          state.auditLog.unshift({
            id: `AUD-${Date.now()}`,
            action: 'Stock Inward Delete',
            itemCode: inv.itemCode,
            details: `Inward transaction ${tx.id} deleted. Ref: ${tx.refNo}`,
            oldValue: oldVal.toString(),
            newValue: inv.totalStock.toString(),
            timestamp: new Date().toISOString(),
            user: 'Admin',
          });
        }
      }
    });

    // ── STOCK OUTWARD SYNCHRONIZATION ──
    builder.addCase(addStockOutward, (state, action) => {
      const tx = action.payload;
      if (tx.status === 'Completed') {
        const inv = findOrCreateInventoryItem(state, tx.itemCode, tx.itemName, tx.warehouse, tx.uom);
        const oldVal = inv.totalStock;
        inv.totalStock -= tx.quantity;
        inv.availableStock -= tx.quantity;
        inv.lastOutwardDate = tx.date;
        updateItemStatus(inv);

        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: 'Stock Outward',
          itemCode: inv.itemCode,
          details: `Outward transaction ${tx.id} (${tx.outwardType}) processed. Ref: ${tx.refNo}`,
          oldValue: oldVal.toString(),
          newValue: inv.totalStock.toString(),
          timestamp: new Date().toISOString(),
          user: tx.createdBy || 'Admin',
        });
      }
    });

    builder.addCase(updateStockOutward, (state, action) => {
      const { oldTransaction, newTransaction } = action.payload;
      if (!oldTransaction || !newTransaction) return;

      // 1. Revert old transaction if it was Completed
      if (oldTransaction.status === 'Completed') {
        const oldInv = state.inventory.find(i => i.itemCode === oldTransaction.itemCode && i.warehouse === oldTransaction.warehouse);
        if (oldInv) {
          oldInv.totalStock += oldTransaction.quantity;
          oldInv.availableStock += oldTransaction.quantity;
          updateItemStatus(oldInv);
        }
      }

      // 2. Apply new transaction if it is Completed
      if (newTransaction.status === 'Completed') {
        const inv = findOrCreateInventoryItem(state, newTransaction.itemCode, newTransaction.itemName, newTransaction.warehouse, newTransaction.uom);
        const oldVal = inv.totalStock;
        inv.totalStock -= newTransaction.quantity;
        inv.availableStock -= newTransaction.quantity;
        inv.lastOutwardDate = newTransaction.date;
        updateItemStatus(inv);

        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: 'Stock Outward Edit',
          itemCode: inv.itemCode,
          details: `Outward transaction ${newTransaction.id} edited. Ref: ${newTransaction.refNo}`,
          oldValue: oldVal.toString(),
          newValue: inv.totalStock.toString(),
          timestamp: new Date().toISOString(),
          user: newTransaction.createdBy || 'Admin',
        });
      }
    });

    builder.addCase(deleteStockOutward, (state, action) => {
      const tx = action.payload;
      if (tx && tx.status === 'Completed') {
        const inv = state.inventory.find(i => i.itemCode === tx.itemCode && i.warehouse === tx.warehouse);
        if (inv) {
          const oldVal = inv.totalStock;
          inv.totalStock += tx.quantity;
          inv.availableStock += tx.quantity;
          updateItemStatus(inv);

          state.auditLog.unshift({
            id: `AUD-${Date.now()}`,
            action: 'Stock Outward Delete',
            itemCode: inv.itemCode,
            details: `Outward transaction ${tx.id} deleted. Ref: ${tx.refNo}`,
            oldValue: oldVal.toString(),
            newValue: inv.totalStock.toString(),
            timestamp: new Date().toISOString(),
            user: 'Admin',
          });
        }
      }
    });

    // ── STOCK ADJUSTMENT SYNCHRONIZATION ──
    builder.addCase(addAdjustment, (state, action) => {
      const adj = action.payload;
      if (adj.status === 'Approved') {
        const inv = findOrCreateInventoryItem(state, adj.itemCode, adj.itemName, adj.warehouse, adj.uom);
        const oldVal = inv.totalStock;

        if (adj.adjustmentType === 'Physical Correction') {
          inv.totalStock = adj.adjustedStock;
          inv.availableStock = adj.adjustedStock - inv.reservedStock - inv.damagedStock;
        } else if (adj.adjustmentType === 'Damaged Stock') {
          inv.damagedStock += Math.abs(adj.difference);
          inv.availableStock += adj.difference;
        } else if (adj.adjustmentType === 'Expired Stock') {
          inv.totalStock += adj.difference;
          inv.availableStock += adj.difference;
        }
        updateItemStatus(inv);

        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: adj.adjustmentType,
          itemCode: inv.itemCode,
          details: `Adjustment ${adj.id} applied: ${adj.reason}`,
          oldValue: oldVal.toString(),
          newValue: inv.totalStock.toString(),
          timestamp: new Date().toISOString(),
          user: adj.createdBy || 'Admin',
        });
      }
    });

    builder.addCase(approveAdjustment, (state, action) => {
      const adj = action.payload;
      if (adj && typeof adj === 'object') {
        const inv = findOrCreateInventoryItem(state, adj.itemCode, adj.itemName, adj.warehouse, adj.uom);
        const oldVal = inv.totalStock;

        if (adj.adjustmentType === 'Physical Correction') {
          inv.totalStock = adj.adjustedStock;
          inv.availableStock = adj.adjustedStock - inv.reservedStock - inv.damagedStock;
        } else if (adj.adjustmentType === 'Damaged Stock') {
          inv.damagedStock += Math.abs(adj.difference);
          inv.availableStock += adj.difference;
        } else if (adj.adjustmentType === 'Expired Stock') {
          inv.totalStock += adj.difference;
          inv.availableStock += adj.difference;
        }
        updateItemStatus(inv);

        state.auditLog.unshift({
          id: `AUD-${Date.now()}`,
          action: adj.adjustmentType,
          itemCode: inv.itemCode,
          details: `Adjustment ${adj.id} approved: ${adj.reason}`,
          oldValue: oldVal.toString(),
          newValue: inv.totalStock.toString(),
          timestamp: new Date().toISOString(),
          user: 'Admin',
        });
      }
    });

    builder.addCase(deleteAdjustment, (state, action) => {
      const adj = action.payload;
      if (adj && typeof adj === 'object' && adj.status === 'Approved') {
        const inv = state.inventory.find(i => i.itemCode === adj.itemCode && i.warehouse === adj.warehouse);
        if (inv) {
          const oldVal = inv.totalStock;
          if (adj.adjustmentType === 'Physical Correction') {
            // Can't easily revert physical count correction without old values, but leave as is
          } else if (adj.adjustmentType === 'Damaged Stock') {
            inv.damagedStock -= Math.abs(adj.difference);
            inv.availableStock -= adj.difference;
          } else if (adj.adjustmentType === 'Expired Stock') {
            inv.totalStock -= adj.difference;
            inv.availableStock -= adj.difference;
          }
          updateItemStatus(inv);

          state.auditLog.unshift({
            id: `AUD-${Date.now()}`,
            action: 'Adjustment Revert',
            itemCode: inv.itemCode,
            details: `Adjustment ${adj.id} deleted. Reverted stock changes.`,
            oldValue: oldVal.toString(),
            newValue: inv.totalStock.toString(),
            timestamp: new Date().toISOString(),
            user: 'Admin',
          });
        }
      }
    });
  },
})

export const {
  addInventory,
  updateInventory,
  toggleInventoryStatus,
  deleteInventory,
  adjustStock,
  updateApprovalStatus
} = inventorySlice.actions

export default inventorySlice.reducer

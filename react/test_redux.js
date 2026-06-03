import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer, { adjustStock } from './src/store/inventorySlice.js';

const store = configureStore({
  reducer: {
    inventory: inventoryReducer
  }
});

console.log("Initial damaged items:", store.getState().inventory.inventory.filter(i => i.damagedStock > 0).length);

// Try to adjust stock for an item with 0 damage (INV-0001)
store.dispatch(adjustStock({
  id: 'INV-0001',
  adjustmentType: 'Damaged',
  quantity: 5,
  reason: 'Test damage'
}));

console.log("After dispatch damaged items:", store.getState().inventory.inventory.filter(i => i.damagedStock > 0).length);
const invItem = store.getState().inventory.inventory.find(i => i.id === 'INV-0001');
console.log("Damaged stock for INV-0001:", invItem.damagedStock);

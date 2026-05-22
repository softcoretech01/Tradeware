// Mock data for ERP Reports & Dashboards

// Current Date helper
const getDaysAgoDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// --- Inventory Reports ---
export const currentStockData = [
  { id: 1, itemCode: 'ITM-001', itemName: 'Steel Rebar 12mm', category: 'Raw Materials', inwardQty: 5000, outwardQty: 3200, reorderLevel: 2000, status: 'Active' },
  { id: 2, itemCode: 'ITM-002', itemName: 'Cement OPC 53 Grade', category: 'Raw Materials', inwardQty: 10000, outwardQty: 8500, reorderLevel: 3000, status: 'Low Stock Alert' },
  { id: 3, itemCode: 'ITM-003', itemName: 'Electrical Wire 2.5sqmm', category: 'Electrical', inwardQty: 2500, outwardQty: 1200, reorderLevel: 800, status: 'Active' },
  { id: 4, itemCode: 'ITM-004', itemName: 'PVC Pipes 4 inch', category: 'Plumbing', inwardQty: 1500, outwardQty: 1450, reorderLevel: 500, status: 'Low Stock Alert' },
  { id: 5, itemCode: 'ITM-005', itemName: 'Ceramic Floor Tiles', category: 'Finishing', inwardQty: 4000, outwardQty: 2000, reorderLevel: 1000, status: 'Active' },
  { id: 6, itemCode: 'ITM-006', itemName: 'Paint Emulsion White', category: 'Finishing', inwardQty: 800, outwardQty: 750, reorderLevel: 200, status: 'Active' }
].map(item => ({
  ...item,
  currentStock: item.inwardQty - item.outwardQty,
  status: (item.inwardQty - item.outwardQty) <= item.reorderLevel ? 'Low Stock Alert' : 'Active'
}));

export const batchWiseStockData = [
  { id: 1, itemCode: 'ITM-001', batchNo: 'BAT-ST-001', expiryDate: '2028-12-31', inwardQty: 2000, outwardQty: 1200, location: 'Warehouse A' },
  { id: 2, itemCode: 'ITM-001', batchNo: 'BAT-ST-002', expiryDate: '2029-06-30', inwardQty: 3000, outwardQty: 2000, location: 'Warehouse B' },
  { id: 3, itemCode: 'ITM-002', batchNo: 'BAT-CM-089', expiryDate: '2026-08-15', inwardQty: 5000, outwardQty: 4200, location: 'Warehouse A' },
  { id: 4, itemCode: 'ITM-002', batchNo: 'BAT-CM-090', expiryDate: '2026-10-20', inwardQty: 5000, outwardQty: 4300, location: 'Warehouse C' },
  { id: 5, itemCode: 'ITM-003', batchNo: 'BAT-EL-112', expiryDate: '2031-01-01', inwardQty: 2500, outwardQty: 1200, location: 'Warehouse B' }
].map(batch => ({
  ...batch,
  stockQty: batch.inwardQty - batch.outwardQty
}));

export const agingStockData = [
  { id: 1, itemCode: 'ITM-002', itemName: 'Cement OPC 53 Grade', batchNo: 'BAT-CM-089', receivedDate: getDaysAgoDate(120), unitValue: 7.50 },
  { id: 2, itemCode: 'ITM-004', itemName: 'PVC Pipes 4 inch', batchNo: 'BAT-PL-045', receivedDate: getDaysAgoDate(95), unitValue: 15.00 },
  { id: 3, itemCode: 'ITM-006', itemName: 'Paint Emulsion White', batchNo: 'BAT-FN-101', receivedDate: getDaysAgoDate(65), unitValue: 45.00 },
  { id: 4, itemCode: 'ITM-001', itemName: 'Steel Rebar 12mm', batchNo: 'BAT-ST-001', receivedDate: getDaysAgoDate(40), unitValue: 55.00 },
  { id: 5, itemCode: 'ITM-005', itemName: 'Ceramic Floor Tiles', batchNo: 'BAT-FN-055', receivedDate: getDaysAgoDate(15), unitValue: 22.50 }
].map(item => {
  const stockQty = item.id === 1 ? 800 : item.id === 2 ? 50 : item.id === 3 ? 50 : item.id === 4 ? 800 : 2000;
  const days = Math.floor((new Date() - new Date(item.receivedDate)) / (1000 * 60 * 60 * 24));
  return {
    ...item,
    stockQty,
    agingDays: days,
    value: stockQty * item.unitValue
  };
});

export const fastMovingItemsData = [
  { id: 1, itemCode: 'ITM-001', itemName: 'Steel Rebar 12mm', salesQty: 4500, turnoverRate: '8.5x', profitContribution: 22500 },
  { id: 2, itemCode: 'ITM-002', itemName: 'Cement OPC 53 Grade', salesQty: 8200, turnoverRate: '12.1x', profitContribution: 16400 },
  { id: 3, itemCode: 'ITM-005', itemName: 'Ceramic Floor Tiles', salesQty: 2100, turnoverRate: '6.2x', profitContribution: 14700 },
  { id: 4, itemCode: 'ITM-003', itemName: 'Electrical Wire 2.5sqmm', salesQty: 1800, turnoverRate: '5.8x', profitContribution: 9000 }
];

export const slowMovingItemsData = [
  { id: 1, itemCode: 'ITM-006', itemName: 'Paint Emulsion White', stockQty: 50, lastSoldDate: getDaysAgoDate(45), unitValue: 45.00 },
  { id: 2, itemCode: 'ITM-004', itemName: 'PVC Pipes 4 inch', stockQty: 50, lastSoldDate: getDaysAgoDate(38), unitValue: 15.00 }
].map(item => {
  const idleDays = Math.floor((new Date() - new Date(item.lastSoldDate)) / (1000 * 60 * 60 * 24));
  return {
    ...item,
    idleDays,
    value: item.stockQty * item.unitValue
  };
});

export const reorderReportData = [
  { id: 1, itemCode: 'ITM-002', itemName: 'Cement OPC 53 Grade', currentStock: 1500, reorderLevel: 3000, suggestedReorderQty: 5000, supplier: 'UltraTech Cement Ltd' },
  { id: 2, itemCode: 'ITM-004', itemName: 'PVC Pipes 4 inch', currentStock: 50, reorderLevel: 500, suggestedReorderQty: 1000, supplier: 'Supreme Industries' }
];


// --- Purchase Reports ---
export const pendingPOData = [
  { id: 1, poNo: 'PO-2026-001', date: getDaysAgoDate(15), supplier: 'UltraTech Cement Ltd', orderedQty: 5000, deliveredQty: 3000, expectedDelivery: getDaysAgoDate(-2) },
  { id: 2, poNo: 'PO-2026-002', date: getDaysAgoDate(10), supplier: 'Tata Steel Ltd', orderedQty: 2000, deliveredQty: 0, expectedDelivery: getDaysAgoDate(-5) },
  { id: 3, poNo: 'PO-2026-003', date: getDaysAgoDate(4), supplier: 'Havells India Ltd', orderedQty: 1000, deliveredQty: 800, expectedDelivery: getDaysAgoDate(-1) }
].map(po => ({
  ...po,
  pendingQty: po.orderedQty - po.deliveredQty
}));

export const grnData = [
  { id: 1, grnNo: 'GRN-2026-044', grnDate: getDaysAgoDate(2), poNo: 'PO-2026-001', supplier: 'UltraTech Cement Ltd', receivedQty: 3000, acceptedQty: 2950, rejectedQty: 50, status: 'Received' },
  { id: 2, grnNo: 'GRN-2026-045', grnDate: getDaysAgoDate(1), poNo: 'PO-2026-003', supplier: 'Havells India Ltd', receivedQty: 800, acceptedQty: 800, rejectedQty: 0, status: 'Completed' }
];

export const supplierPerformanceData = [
  { id: 1, supplierName: 'UltraTech Cement Ltd', onTimeDelivery: 92.5, qualityRating: 4.8, returnRate: 1.0, leadTime: 4 },
  { id: 2, supplierName: 'Tata Steel Ltd', onTimeDelivery: 88.0, qualityRating: 4.9, returnRate: 0.5, leadTime: 6 },
  { id: 3, supplierName: 'Havells India Ltd', onTimeDelivery: 96.0, qualityRating: 4.7, returnRate: 1.5, leadTime: 3 },
  { id: 4, supplierName: 'Supreme Industries', onTimeDelivery: 94.0, qualityRating: 4.5, returnRate: 2.0, leadTime: 5 }
];


// --- Sales Reports ---
export const customerWiseSalesData = [
  { id: 1, customerName: 'Skyline Builders & Developers', totalOrders: 14, salesVolume: 12000, totalRevenue: 185000, avgOrderValue: 13214 },
  { id: 2, customerName: 'Greenfield Infra Projects', totalOrders: 8, salesVolume: 6500, totalRevenue: 98000, avgOrderValue: 12250 },
  { id: 3, customerName: 'Apex Construction Group', totalOrders: 19, salesVolume: 22000, totalRevenue: 340000, avgOrderValue: 17894 },
  { id: 4, customerName: 'Elite Residency Corp', totalOrders: 5, salesVolume: 4200, totalRevenue: 64000, avgOrderValue: 12800 }
];

export const builderWiseSalesData = [
  { id: 1, builderName: 'Skyline Builders', projects: 3, totalSales: 185000, pendingPayments: 45000, commissionPaid: 3700 },
  { id: 2, builderName: 'Greenfield Infra', projects: 2, totalSales: 98000, pendingPayments: 12000, commissionPaid: 1960 },
  { id: 3, builderName: 'Apex Construction', projects: 5, totalSales: 340000, pendingPayments: 85000, commissionPaid: 6800 }
];

export const projectWiseSalesData = [
  { id: 1, projectName: 'Skyline Heights Phase 1', location: 'Downtown Metro', totalSales: 110000, deliveredQty: 7500, projectStatus: 'Active' },
  { id: 2, projectName: 'Greenfield Smart City', location: 'East Extension', totalSales: 98000, deliveredQty: 6500, projectStatus: 'Active' },
  { id: 3, projectName: 'Apex Business Center', location: 'Commercial Hub', totalSales: 210000, deliveredQty: 14000, projectStatus: 'Active' },
  { id: 4, projectName: 'Skyline Luxury Villas', location: 'Hillside Orchards', totalSales: 75000, deliveredQty: 4500, projectStatus: 'Completed' }
];

export const itemWiseProfitabilityData = [
  { id: 1, itemName: 'Steel Rebar 12mm', landedCost: 45.00, sellingPrice: 55.00, salesQty: 4500 },
  { id: 2, itemName: 'Cement OPC 53 Grade', landedCost: 6.20, sellingPrice: 8.00, salesQty: 8200 },
  { id: 3, itemName: 'Ceramic Floor Tiles', landedCost: 15.50, sellingPrice: 22.50, salesQty: 2100 },
  { id: 4, itemName: 'Electrical Wire 2.5sqmm', landedCost: 38.00, sellingPrice: 48.00, salesQty: 1800 }
].map(item => {
  const profit = item.sellingPrice - item.landedCost;
  return {
    ...item,
    profit,
    marginPercent: parseFloat(((profit / item.landedCost) * 100).toFixed(2)),
    totalProfit: profit * item.salesQty
  };
});

export const pendingCustomerOrdersData = [
  { id: 1, orderNo: 'SO-2026-101', date: getDaysAgoDate(8), customer: 'Skyline Builders & Developers', orderedQty: 5000, deliveredQty: 3200, status: 'Pending Delivery' },
  { id: 2, orderNo: 'SO-2026-102', date: getDaysAgoDate(5), customer: 'Apex Construction Group', orderedQty: 3000, deliveredQty: 1000, status: 'Pending Delivery' },
  { id: 3, orderNo: 'SO-2026-103', date: getDaysAgoDate(2), customer: 'Greenfield Infra Projects', orderedQty: 1500, deliveredQty: 1500, status: 'Completed' }
].map(order => ({
  ...order,
  pendingQty: order.orderedQty - order.deliveredQty,
  status: (order.orderedQty - order.deliveredQty) > 0 ? 'Pending Delivery' : 'Completed'
}));


// --- Import Reports ---
export const shipmentCostAnalysisData = [
  { id: 1, shipmentNo: 'SHP-2026-01', customDuty: 12500, freight: 8400, insurance: 1200, handling: 950, description: 'Steel import from Japan' },
  { id: 2, shipmentNo: 'SHP-2026-02', customDuty: 5400, freight: 3200, insurance: 600, handling: 400, description: 'Electrical wires batch A' },
  { id: 3, shipmentNo: 'SHP-2026-03', customDuty: 18200, freight: 12600, insurance: 2100, handling: 1500, description: 'Ceramic tiles from Italy' }
].map(ship => ({
  ...ship,
  totalImportCost: ship.customDuty + ship.freight + ship.insurance + ship.handling
}));

export const landedCostReportData = [
  { id: 1, itemName: 'Imported Steel Rods', importBatch: 'IMP-ST-88', purchaseCost: 42.00, shareExpenses: 6.80 },
  { id: 2, itemName: 'Premium Ceramic Tiles', importBatch: 'IMP-TL-92', purchaseCost: 14.20, shareExpenses: 4.10 },
  { id: 3, itemName: 'Heavy Duty Copper Wires', importBatch: 'IMP-WR-05', purchaseCost: 35.00, shareExpenses: 5.50 }
].map(item => ({
  ...item,
  landedCost: item.purchaseCost + item.shareExpenses
}));

export const importBatchProfitabilityData = [
  { id: 1, batchNo: 'IMP-ST-88', landedCost: 48.80, sellingPrice: 65.00, quantity: 2000 },
  { id: 2, batchNo: 'IMP-TL-92', landedCost: 18.30, sellingPrice: 28.00, quantity: 5000 },
  { id: 3, batchNo: 'IMP-WR-05', landedCost: 40.50, sellingPrice: 58.00, quantity: 1500 }
].map(batch => {
  const profit = batch.sellingPrice - batch.landedCost;
  return {
    ...batch,
    profit,
    marginPercent: parseFloat(((profit / batch.landedCost) * 100).toFixed(2)),
    totalProfit: profit * batch.quantity
  };
});

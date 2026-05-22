import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentUser } from './store/erpSlice';
import Layout from './components/Layout';
import Items from './pages/Masters/Items';
import Customers from './pages/Masters/Customers';
import Suppliers from './pages/Masters/Suppliers';
import LocationMaster from './pages/Masters/LocationMaster';
import InventoryMaster from './pages/Inventory/InventoryMaster';
import StockInward from './pages/Inventory/StockInward';
import StockOutward from './pages/Inventory/StockOutward';
import StockAdjustment from './pages/Inventory/StockAdjustment';
import Login from './pages/Login';

// New ERP Pages
import Dashboard from './pages/Dashboard';
import PurchaseRequisition from './pages/PurchaseManagement/PurchaseRequisition';
import PurchaseOrder from './pages/PurchaseManagement/PurchaseOrder';
import GoodsReceiptNote from './pages/PurchaseManagement/GoodsReceiptNote';
import PurchaseReturn from './pages/PurchaseManagement/PurchaseReturn';
import QualityControl from './pages/PurchaseManagement/QualityControl';
import SalesEnquiry from './pages/SalesManagement/SalesEnquiry';
import QuotationManagement from './pages/SalesManagement/QuotationManagement';
import CustomerPO from './pages/SalesManagement/CustomerPO';
import SalesOrder from './pages/SalesManagement/SalesOrder';
import DeliveryChallan from './pages/DeliveryDispatch/DeliveryChallan';
import DispatchTracking from './pages/DeliveryDispatch/DispatchTracking';
import MaterialIssueTracking from './pages/DeliveryDispatch/MaterialIssueTracking';

// Security and Doc management pages
import RolesPermissions from './pages/UserRoles/RolesPermissions';
import ApprovalWorkflows from './pages/UserRoles/ApprovalWorkflows';
import DocumentManagement from './pages/Documents/DocumentManagement';

// Batch & Lot Management Pages
import BatchMaintenance from './pages/BatchLotManagement/BatchMaintenance';
import BatchStockInquiry from './pages/BatchLotManagement/BatchStockInquiry';
import BatchAgingAnalysis from './pages/BatchLotManagement/BatchAgingAnalysis';

// Import Management Pages
import ImportPurchase from './pages/ImportManagement/ImportPurchase';
import ShipmentTracking from './pages/ImportManagement/ShipmentTracking';
import LandedCost from './pages/ImportManagement/LandedCost';
import SellingPrice from './pages/ImportManagement/SellingPrice';
import PricingManagement from './pages/PricingManagement/PricingManagement';
import ReportsDashboards from './pages/Reports/ReportsDashboards';
import InventoryReports from './pages/Reports/InventoryReports';
import PurchaseReports from './pages/Reports/PurchaseReports';
import SalesReports from './pages/Reports/SalesReports';
import ImportReports from './pages/Reports/ImportReports';

const App = () => {
  const currentUser = useSelector(state => state.erp.currentUser);
  const dispatch = useDispatch();

  const handleLogin = (userObj) => {
    dispatch(setCurrentUser(userObj));
  };

  const handleLogout = () => {
    dispatch(setCurrentUser(null));
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={
          currentUser ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
        } />

        <Route path="/*" element={
          currentUser ? (
            <Layout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Masters */}
                <Route path="/masters/items" element={<Items />} />
                <Route path="/masters/customers" element={<Customers />} />
                <Route path="/masters/suppliers" element={<Suppliers />} />
                <Route path="/masters/warehouse" element={<LocationMaster />} />
                <Route path="/masters/*" element={<div className="placeholder">Master Submodule</div>} />

                {/* Inventory */}
                <Route path="/inventory-management/stock-overview" element={<InventoryMaster />} />
                <Route path="/inventory-management/stock-inward" element={<StockInward />} />
                <Route path="/inventory-management/stock-outward" element={<StockOutward />} />
                <Route path="/inventory-management/stock-adjustment" element={<StockAdjustment />} />
                <Route path="/inventory-management" element={<InventoryMaster />} />

                {/* Purchase Management */}
                <Route path="/purchase-management/purchase-requisition" element={<PurchaseRequisition />} />
                <Route path="/purchase-management/purchase-order" element={<PurchaseOrder />} />
                <Route path="/purchase-management/grn" element={<GoodsReceiptNote />} />
                <Route path="/purchase-management/purchase-return" element={<PurchaseReturn />} />
                <Route path="/purchase-management/quality-control" element={<QualityControl />} />

                {/* Sales & Orders */}
                <Route path="/sales-orders/sales-enquiry" element={<SalesEnquiry />} />
                <Route path="/sales-orders/quotation-management" element={<QuotationManagement />} />
                <Route path="/sales-orders/customer-po-management" element={<CustomerPO />} />
                <Route path="/sales-orders/sales-order-management" element={<SalesOrder />} />

                {/* Delivery & Dispatch */}
                <Route path="/delivery-dispatch/delivery-challan" element={<DeliveryChallan />} />
                <Route path="/delivery-dispatch/dispatch-tracking" element={<DispatchTracking />} />
                <Route path="/delivery-dispatch/material-issue-tracking" element={<MaterialIssueTracking />} />

                {/* Batch & Lot Management */}
                <Route path="/batch-lot-management/batch-maintenance" element={<BatchMaintenance />} />
                <Route path="/batch-lot-management/batch-stock-inquiry" element={<BatchStockInquiry />} />
                <Route path="/batch-lot-management/batch-aging-analysis" element={<BatchAgingAnalysis />} />

                {/* Import Management */}
                <Route path="/import-management/import-purchase-management" element={<ImportPurchase />} />
                <Route path="/import-management/shipment-tracking" element={<ShipmentTracking />} />
                <Route path="/import-management/landed-cost-calculation" element={<LandedCost />} />
                <Route path="/import-management/selling-price-finalization" element={<SellingPrice />} />

                {/* Pricing Management */}
                <Route path="/pricing-management" element={<PricingManagement />} />
                {/* Reports & Dashboards */}
                <Route path="/reports-dashboards" element={<ReportsDashboards />} />
                <Route path="/reports-dashboards/overview-dashboard" element={<ReportsDashboards />} />
                <Route path="/reports-dashboards/inventory-reports" element={<InventoryReports />} />
                <Route path="/reports-dashboards/purchase-reports" element={<PurchaseReports />} />
                <Route path="/reports-dashboards/sales-reports" element={<SalesReports />} />
                <Route path="/reports-dashboards/import-reports" element={<ImportReports />} />

                {/* User Roles */}
                <Route path="/user-roles-approval/roles-permissions" element={<RolesPermissions />} />
                <Route path="/user-roles-approval/approval-workflows" element={<ApprovalWorkflows />} />

                {/* Documents */}
                <Route path="/document-management/document-management" element={<DocumentManagement />} />

                <Route path="*" element={<div className="placeholder">Coming Soon</div>} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>

      <style jsx="true">{`
        .placeholder {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: var(--text-muted);
          font-weight: 500;
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px dashed var(--border);
        }
      `}</style>
    </Router>
  );
};

export default App;

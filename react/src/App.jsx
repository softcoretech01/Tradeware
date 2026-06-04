import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentUser } from './store/erpSlice';
import Layout from './components/Layout';
import Items from './pages/Masters/Items';
import Customers from './pages/Masters/Customers';
import Suppliers from './pages/Masters/Suppliers';
import InventoryMaster from './pages/Inventory/InventoryMaster';
import DamagedStock from './pages/Inventory/DamagedStock';
import Login from './pages/Login';

// New ERP Pages
import Dashboard from './pages/Dashboard';
import PurchaseRequisition from './pages/PurchaseManagement/PurchaseRequisition';
import PurchaseOrder from './pages/PurchaseManagement/PurchaseOrder';
import GoodsReceiptNote from './pages/PurchaseManagement/GoodsReceiptNote';
import PurchaseReturn from './pages/PurchaseManagement/PurchaseReturn';
import LandedCostCalculation from './pages/PurchaseManagement/LandedCostCalculation';
import SalesOrder from './pages/SalesManagement/SalesOrder';
import Invoice from './pages/SalesManagement/Invoice';

// Security and Doc management pages
import RolesPermissions from './pages/UserRoles/RolesPermissions';
import DocumentManagement from './pages/Documents/DocumentManagement';

// Batch & Lot Management Pages
import BatchMaintenance from './pages/BatchLotManagement/BatchMaintenance';
import BatchStockInquiry from './pages/BatchLotManagement/BatchStockInquiry';
import BatchAgingAnalysis from './pages/BatchLotManagement/BatchAgingAnalysis';

// Import Management Pages
import ImportPurchase from './pages/ImportManagement/ImportPurchase';
// import ShipmentTracking from './pages/ImportManagement/ShipmentTracking';
import LandedCost from './pages/ImportManagement/LandedCost';
import SellingPrice from './pages/ImportManagement/SellingPrice';

// CRM Pages
import CRMDashboard from './pages/CRM/CRMDashboard';
import LeadManagement from './pages/CRM/LeadManagement';
import CustomerManagement from './pages/CRM/CustomerManagement';
import FollowUpTracking from './pages/CRM/FollowUpTracking';
import CRMSalesEnquiry from './pages/CRM/CRMSalesEnquiry';
import ExistingLeads from './pages/CRM/ExistingLeads';

// Account Integration Pages

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
                <Route path="/masters/*" element={<div className="placeholder">Master Submodule</div>} />

                {/* Inventory */}
                <Route path="/inventory-management/stock-overview" element={<InventoryMaster />} />
                <Route path="/inventory-management/damages" element={<DamagedStock />} />
                <Route path="/inventory-management" element={<InventoryMaster />} />

                {/* Purchase Management */}
                <Route path="/purchase-management/purchase-requisition" element={<PurchaseRequisition />} />
                <Route path="/purchase-management/purchase-order" element={<PurchaseOrder />} />
                <Route path="/purchase-management/grn" element={<GoodsReceiptNote />} />
                <Route path="/purchase-management/purchase-return" element={<PurchaseReturn />} />
                <Route path="/purchase-management/landed-cost-calculation" element={<LandedCostCalculation />} />

                {/* Sales & Orders */}
                <Route path="/sales-orders/sales-order" element={<SalesOrder />} />
                <Route path="/sales-orders/invoice" element={<Invoice />} />

                {/* CRM Module Routes */}
                <Route path="/crm-module/crm-dashboard" element={<CRMDashboard />} />
                <Route path="/crm-module/lead-management" element={<LeadManagement />} />
                <Route path="/crm-module/existing-leads" element={<ExistingLeads />} />
                <Route path="/crm-module/customer-management" element={<CustomerManagement />} />
                <Route path="/crm-module/follow-up-tracking" element={<FollowUpTracking />} />
                <Route path="/crm-module/sales-enquiry" element={<CRMSalesEnquiry />} />



                {/* Batch & Lot Management */}
                <Route path="/batch-lot-management/batch-maintenance" element={<BatchMaintenance />} />
                <Route path="/batch-lot-management/batch-stock-inquiry" element={<BatchStockInquiry />} />
                <Route path="/batch-lot-management/batch-aging-analysis" element={<BatchAgingAnalysis />} />

                {/* Import Management */}
                <Route path="/import-management/import-purchase-management" element={<ImportPurchase />} />
                {/* <Route path="/import-management/shipment-tracking" element={<ShipmentTracking />} /> */}
                <Route path="/import-management/landed-cost-calculation" element={<LandedCost />} />
                <Route path="/import-management/selling-price-finalization" element={<SellingPrice />} />

                {/* Reports & Dashboards */}

                {/* User Roles */}
                <Route path="/user-roles-approval/roles-permissions" element={<RolesPermissions />} />

                {/* Documents */}
                <Route path="/document-management/document-management" element={<DocumentManagement />} />

                {/* Account Integration Routes */}

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

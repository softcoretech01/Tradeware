import React, { useState } from 'react';
import {
  LayoutDashboard, Box, Layers, Globe, ShoppingCart,
  FileText, Tag, Truck, Calculator, BarChart3,
  Users, Paperclip, ChevronDown, ChevronRight,
  Menu, X, Warehouse, HeartHandshake
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState(['Masters', 'Purchase Management', 'Sales & Orders', 'CRM Module', 'User Roles & Approval', 'Document Management', 'Account Integration']);
  const location = useLocation();

  const toggleMenu = (name) => {
    setOpenMenus(prev =>
      prev.includes(name)
        ? prev.filter(m => m !== name)
        : [...prev, name]
    );
  };

  const currentUser = useSelector(state => state.erp.currentUser);
  const rolesPermissions = useSelector(state => state.erp.rolesPermissions);
  const activeRole = currentUser?.role || 'Admin';

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, to: '/dashboard' },
    {
      name: 'Masters',
      icon: <Box size={20} />,
      subItems: ['Items', 'Customers', 'Suppliers'],
    },
    { name: 'Purchase Management', icon: <ShoppingCart size={20} />, subItems: ['Purchase Requisition', 'Purchase Order', 'GRN', 'Purchase Return', 'Landed Cost Calculation'] },
    { name: 'Import Management', icon: <Globe size={20} />, subItems: ['Import Purchase Management', /* 'Shipment Tracking', */ 'Landed Cost Calculation', 'Selling Price Finalization'] },
    { name: 'Batch & Lot Management', icon: <Tag size={20} />, subItems: ['Batch Maintenance', 'Batch Stock Inquiry', 'Batch Aging Analysis'] },
    { name: 'Inventory Management', icon: <Layers size={20} />, subItems: ['Stock Overview', 'Damages'] },
    { name: 'Sales & Orders', icon: <FileText size={20} />, subItems: ['Sales Order', 'Invoice'] },
    {
      name: 'CRM Module',
      icon: <HeartHandshake size={20} />,
      subItems: ['CRM Dashboard', 'Lead Management', 'Customer Management', 'Follow-up Tracking', 'Sales Enquiry']
    },

    /* {
      name: 'Account Integration',
      icon: <Calculator size={20} />,
      subItems: ['AP Book', 'AR Book', 'AR Book DO', 'Bank Book', 'Bank Book Entries', 'Cash Book', 'Cash Book Entry', 'Overdraft', 'PC Book', 'Petty Cash']
    }, */
    /* {
      name: 'Reports & Dashboards',
      icon: <BarChart3 size={20} />,
      subItems: ['Overview Dashboard', 'Inventory Reports', 'Purchase Reports', 'Sales Reports', 'Import Reports']
    }, */
    { name: 'User Roles & Approval', icon: <Users size={20} />, subItems: ['Roles & Permissions'] },
    { name: 'Document Management', icon: <Paperclip size={20} />, subItems: ['Document Management'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    const permissions = rolesPermissions?.[activeRole];
    if (permissions && permissions[item.name] !== undefined) {
      return permissions[item.name].read;
    }
    return true;
  });

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-box" style={{ background: '#ffffff', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="TradeWare Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>TradeWare ERP</span>
            {currentUser?.company && (
              <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 'bold', marginTop: '2px', lineHeight: '1.2' }}>
                {currentUser.company}
              </span>
            )}
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <div key={item.name} className="menu-group">
            {item.to ? (
              <Link
                to={item.to}
                className={`menu-item ${location.pathname === item.to ? 'active-item' : ''}`}
              >
                <div className="menu-item-content">
                  {item.icon}
                  {!collapsed && <span>{item.name}</span>}
                </div>
              </Link>
            ) : (
              <div
                className={`menu-item ${openMenus.includes(item.name) ? 'open' : ''}`}
                onClick={() => item.subItems && toggleMenu(item.name)}
              >
                <div className="menu-item-content">
                  {item.icon}
                  {!collapsed && <span>{item.name}</span>}
                </div>
                {item.subItems && !collapsed && (
                  openMenus.includes(item.name) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
              </div>
            )}

            {item.subItems && openMenus.includes(item.name) && !collapsed && (
              <div className="submenu">
                {item.subItems.map(sub => {
                  const itemPath = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const subPath = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const fullPath = `/${itemPath}/${subPath}`;
                  return (
                    <Link
                      key={sub}
                      to={fullPath}
                      className={`submenu-item ${location.pathname === fullPath ? 'active' : ''}`}
                    >
                      {sub}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Version Badge */}
      {!collapsed && (
        <div className="sidebar-version">
          <span className="version-dot" />
          <span>v 1.0.0</span>
        </div>
      )}

      <style jsx="true">{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: #344a6b;
          color: white;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          z-index: 100;
          border-right: 1px solid rgba(0, 0, 0, 0.1);
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar-logo {
          height: var(--header-height);
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
        }

        .logo-box {
          background: var(--primary);
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }

        .sidebar-logo span {
          font-weight: 600;
          font-size: 18px;
          white-space: nowrap;
          color: white;
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 0;
          overflow-y: auto;
        }

        .menu-item {
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s;
          color: #cbd5e1;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: white;
        }

        .menu-item.active-item {
          color: white;
          background: rgba(255, 255, 255, 0.12);
          border-right: 3px solid #60a5fa;
          font-weight: 500;
        }

        .menu-item.open {
          color: white;
        }

        .menu-item-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .submenu {
          background: rgba(0, 0, 0, 0.15);
          padding: 5px 0;
        }

        .submenu-item {
          padding: 10px 20px 10px 52px;
          display: block;
          font-size: 14px;
          color: #cbd5e1;
          transition: all 0.2s;
        }

        .submenu-item:hover, .submenu-item.active {
          color: white;
          background: rgba(255, 255, 255, 0.08);
        }

        .submenu-item.active {
          border-right: 3px solid #60a5fa;
          font-weight: 500;
        }

        .sidebar-version {
          position: sticky;
          bottom: 0;
          padding: 10px 20px;
          background: rgba(0, 0, 0, 0.15);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.04em;
          user-select: none;
        }

        .version-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #60a5fa;
          flex-shrink: 0;
          box-shadow: 0 0 5px rgba(96, 165, 250, 0.6);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;

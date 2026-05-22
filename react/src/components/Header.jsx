import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, LogOut, Settings } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentUser } from '../store/erpSlice';
import { Menu, MenuItem } from '@mui/material';

const Header = ({ onLogout }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.erp.currentUser);
  const users = useSelector(state => state.erp.users);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRoleSelect = (selectedUser) => {
    dispatch(setCurrentUser(selectedUser));
    handleClose();
  };
  
  // Dynamic Breadcrumbs Formatter
  const formatBreadcrumb = (str) => {
    if (!str) return '';
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  
  let parentName = 'Master';
  let activeName = 'Items';

  if (pathParts.length >= 2) {
    let pName = formatBreadcrumb(pathParts[0]);
    if (pName === 'Masters') pName = 'Master'; // Maintain user legacy 'Master' singular
    parentName = pName;
    activeName = formatBreadcrumb(pathParts[1]);
  } else if (pathParts.length === 1) {
    parentName = 'Home';
    activeName = formatBreadcrumb(pathParts[0]);
  }

  return (
    <header className="header">
      <div className="header-left">
        <div className="breadcrumbs">
          <span className="breadcrumb-item">{parentName}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active">{activeName}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="icon-btn"><Bell size={20} /></button>
          <button className="icon-btn"><Settings size={20} /></button>
        </div>

        <div className="user-profile" onClick={handleClick} style={{ cursor: 'pointer' }}>
          <div className="user-info">
            <span className="user-name">Welcome, {currentUser?.name || 'User'}</span>
            <span className="user-role" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              {currentUser?.role || 'Staff'} ▾
            </span>
          </div>
          <div className="user-avatar">
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
        </div>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            elevation: 3,
            style: {
              width: '260px',
              borderRadius: '12px',
              marginTop: '8px'
            }
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              SWITCH ROLE
            </span>
            <span style={{ fontSize: '11px', color: '#999' }}>
              Test permission access in real-time
            </span>
          </div>
          {users.map((u) => (
            <MenuItem 
              key={u.id} 
              selected={u.role === currentUser?.role}
              onClick={() => handleRoleSelect(u)}
              style={{
                padding: '10px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '2px'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>{u.name}</span>
              <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{u.role}</span>
            </MenuItem>
          ))}
          <MenuItem 
            onClick={() => { handleClose(); onLogout(); }} 
            style={{ 
              borderTop: '1px solid #eee', 
              color: '#d32f2f',
              padding: '12px 16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <LogOut size={16} /> Sign Out
          </MenuItem>
        </Menu>
      </div>

      <style jsx="true">{`
        .header {
          height: var(--header-height);
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .breadcrumb-item {
          color: var(--text-muted);
        }

        .breadcrumb-item.active {
          color: var(--primary);
          font-weight: 600;
        }

        .breadcrumb-separator {
          color: var(--border);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: var(--background);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: 20px;
          gap: 8px;
          color: var(--text-muted);
        }

        .search-bar input {
          border: none;
          background: none;
          outline: none;
          width: 180px;
          font-size: 14px;
        }

        .icon-btn {
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .icon-btn:hover {
          color: var(--primary);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 32px;
          border-left: 1px solid var(--border);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
        }

        .user-role {
          font-size: 12px;
          color: var(--text-muted);
        }

        .logout-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .logout-btn:hover {
          transform: scale(1.1);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </header>
  );
};

export default Header;

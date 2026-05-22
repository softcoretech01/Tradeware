import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header user={user} onLogout={onLogout} />
        <main className="page-wrapper">
          {children}
        </main>
      </div>

      <style jsx="true">{`
        .app-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .page-wrapper {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default Layout;

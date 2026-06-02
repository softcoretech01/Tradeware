import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('admin123');
  const [company, setCompany] = useState('Ritzy');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const users = useSelector(state => state.erp.users);

  const handleSubmit = (e) => {
    e.preventDefault();
    const foundUser = users.find(
      u => u.name.toLowerCase() === username.toLowerCase() || u.role.toLowerCase() === username.toLowerCase()
    );
    if (foundUser && password === 'admin123') {
      onLogin({ ...foundUser, company });
      navigate('/dashboard');
    } else if (username.toLowerCase() === 'admin' && password === 'admin123') {
      const adminUser = users.find(u => u.role === 'Admin');
      onLogin({ ...adminUser, company });
      navigate('/dashboard');
    } else {
      setError('Invalid username or password. (Hint: Use user names or roles, e.g. "Admin" or "Sarah Connor" with password "admin123")');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <div className="login-header">
          <div className="login-logo" style={{ background: '#ffffff', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="TradeWare Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1>TradeWare ERP</h1>
          <p>Powering Smart Trading Operations</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label>Company</label>
            <div className="input-wrapper">
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="company-select"
              >
                <option value="Ritzy">Ritzy</option>
                <option value="Ritzy Trade">Ritzy Trade</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Username</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn">
            <LogIn size={18} />
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 Trade Wave ERP. All rights reserved.</p>
        </div>
      </div>

      <style jsx="true">{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 20px;
        }

        .login-card {
          background: white;
          width: 100%;
          max-width: 420px;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          background: var(--primary);
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          color: white;
          margin: 0 auto 16px;
          box-shadow: 0 10px 15px -3px rgba(30, 64, 175, 0.3);
        }

        .login-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--secondary);
          margin-bottom: 8px;
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #b91c1c;
          padding: 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .input-wrapper input, .input-wrapper select {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid var(--border);
          border-radius: 8px;
          outline: none;
          font-size: 14px;
          transition: all 0.2s;
        }

        .input-wrapper select.company-select {
          padding-left: 12px;
          background: white;
          cursor: pointer;
        }

        .input-wrapper input:focus, .input-wrapper select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
        }

        .login-btn {
          background: var(--primary);
          color: white;
          padding: 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
          transition: all 0.2s;
        }

        .login-btn:hover {
          background: #1e3a8a;
          transform: translateY(-1px);
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default Login;

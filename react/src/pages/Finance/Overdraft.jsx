import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateOverdraftLine, addOverdraftLine } from '../../store/financeSlice';
import { 
  Landmark, AlertTriangle, CreditCard, Check, Settings, ShieldAlert, Plus
} from 'lucide-react';

const Overdraft = () => {
  const dispatch = useDispatch();
  const overdrafts = useSelector(state => state.finance.overdrafts);
  const bankAccounts = useSelector(state => state.finance.bankAccounts);

  // Form states
  const [selectedODId, setSelectedODId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);

  // Fields
  const [bankAccountId, setBankAccountId] = useState('');
  const [limit, setLimit] = useState('');
  const [drawdown, setDrawdown] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [interestMethod, setInterestMethod] = useState('Daily Balance Method');
  const [status, setStatus] = useState('Active');

  const handleEdit = (od) => {
    setSelectedODId(od.id);
    setBankAccountId(od.bankAccountId);
    setLimit(od.limit);
    setDrawdown(od.drawdown);
    setInterestRate(od.interestRate);
    setInterestMethod(od.interestMethod);
    setStatus(od.status);
    setEditMode(true);
    setAddMode(false);
  };

  const handleOpenAdd = () => {
    setBankAccountId(bankAccounts[0]?.id || '');
    setLimit('');
    setDrawdown('0');
    setInterestRate('');
    setInterestMethod('Daily Balance Method');
    setStatus('Active');
    setAddMode(true);
    setEditMode(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!limit || Number(limit) <= 0 || !interestRate || Number(interestRate) <= 0) {
      alert("Please enter valid positive overdraft limits and interest rates.");
      return;
    }

    if (editMode) {
      dispatch(updateOverdraftLine({
        id: selectedODId,
        limit: Number(limit),
        drawdown: Number(drawdown),
        interestRate: Number(interestRate),
        interestMethod,
        status
      }));
      setEditMode(false);
      alert("Overdraft line settings updated successfully!");
    } else if (addMode) {
      // Check if already exists
      const exists = overdrafts.some(o => o.bankAccountId === bankAccountId);
      if (exists) {
        alert("An overdraft configuration already exists for this bank account.");
        return;
      }

      dispatch(addOverdraftLine({
        bankAccountId,
        limit: Number(limit),
        drawdown: Number(drawdown),
        interestRate: Number(interestRate),
        interestMethod,
        status
      }));
      setAddMode(false);
      alert("New bank overdraft facility registered successfully!");
    }
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Bank Overdraft Lines Monitor</h2>
          <span className="subtitle">Configure drawing limits, track drawdown status, interest calculation schedules, and overdraft lines</span>
        </div>
        {!addMode && !editMode && (
          <div className="header-actions">
            <button className="btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> New</button>
          </div>
        )}
      </div>

      <div className="layout-split">
        {/* List of active facilities */}
        <div className="list-panel">
          <div className="grid-cards-vertical">
            {overdrafts.map((od) => {
              const percentage = Math.min(100, Math.round((od.drawdown / od.limit) * 100));
              const isWarning = percentage >= 80;
              return (
                <div key={od.id} className={`od-card ${od.status === 'Inactive' ? 'inactive' : ''}`}>
                  <div className="od-card-header">
                    <div>
                      <h4 className="bank-title"><Landmark size={18} className="text-muted" style={{ marginRight: '6px' }} /> {od.bankName}</h4>
                      <span className="account-num">{od.accountNumber}</span>
                    </div>
                    <span className={`status-badge ${od.status.toLowerCase()}`}>
                      {od.status}
                    </span>
                  </div>

                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Drawdown Utilization</span>
                      <strong style={{ color: isWarning ? 'var(--danger)' : 'var(--text-main)' }}>
                        {percentage}% Used
                      </strong>
                    </div>
                    <div className="progress-bg">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: isWarning ? 'var(--danger)' : 'var(--primary)' 
                        }} 
                      />
                    </div>
                    <div className="progress-footer">
                      <span>Draw: SGD {od.drawdown.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span>Limit: SGD {od.limit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="details-grid-od">
                    <div className="od-detail-item">
                      <span>Interest Rate</span>
                      <strong>{od.interestRate.toFixed(2)}% p.a.</strong>
                    </div>
                    <div className="od-detail-item">
                      <span>Calculation Method</span>
                      <strong style={{ fontSize: '12px' }}>{od.interestMethod}</strong>
                    </div>
                  </div>

                  {isWarning && (
                    <div className="warning-callout">
                      <ShieldAlert size={16} />
                      <span>Warning: Limit utilization exceeds 80%. Drawdown restriction active.</span>
                    </div>
                  )}

                  <div className="card-actions-od">
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => handleEdit(od)}>
                      <Settings size={14} /> Configure Line
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configuration Form */}
        {(editMode || addMode) && (
          <div className="form-panel fade-in">
            <div className="form-card-od">
              <h3 className="card-title-od">
                {editMode ? "Configure Overdraft Line Settings" : "Register New Overdraft Line"}
              </h3>
              <form onSubmit={handleSave} className="od-form">
                {addMode && (
                  <div className="field-group">
                    <label>Select Bank Account</label>
                    <select 
                      value={bankAccountId} 
                      onChange={(e) => setBankAccountId(e.target.value)}
                      className="table-select"
                    >
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} ({b.currency})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="field-group" style={{ marginTop: '12px' }}>
                  <label>Overdraft Limit Amount (SGD)</label>
                  <input 
                    type="number" 
                    value={limit} 
                    onChange={(e) => setLimit(e.target.value)} 
                    placeholder="0.00"
                    className="table-input"
                  />
                </div>

                <div className="field-group" style={{ marginTop: '12px' }}>
                  <label>Current Drawdown Amount (SGD)</label>
                  <input 
                    type="number" 
                    value={drawdown} 
                    onChange={(e) => setDrawdown(e.target.value)} 
                    placeholder="0.00"
                    className="table-input"
                    disabled={addMode} // Defaults to 0 on new lines
                  />
                </div>

                <div className="field-group" style={{ marginTop: '12px' }}>
                  <label>Overdraft Interest Rate (% p.a.)</label>
                  <input 
                    type="number" 
                    value={interestRate} 
                    onChange={(e) => setInterestRate(e.target.value)} 
                    placeholder="e.g. 5.5"
                    step="0.01"
                    className="table-input"
                  />
                </div>

                <div className="field-group" style={{ marginTop: '12px' }}>
                  <label>Interest Calculation Method</label>
                  <select 
                    value={interestMethod} 
                    onChange={(e) => setInterestMethod(e.target.value)} 
                    className="table-select"
                  >
                    <option value="Daily Balance Method">Daily Balance Method (Recommended)</option>
                    <option value="Average Monthly Balance">Average Monthly Balance</option>
                    <option value="Ending Monthly Balance">Ending Monthly Balance</option>
                  </select>
                </div>

                <div className="field-group" style={{ marginTop: '12px' }}>
                  <label>Facility Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)} 
                    className="table-select"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-actions-od" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setEditMode(false); setAddMode(false); }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: 'var(--primary)' }}><Check size={16} /> Save Facility Config</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Styled JSX */}
      <style jsx="true">{`
        .layout-split {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
          align-items: start;
        }

        .grid-cards-vertical {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .od-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          box-shadow: var(--shadow-sm);
          transition: border-color 0.2s;
        }

        .od-card:hover {
          border-color: #cbd5e1;
        }

        .od-card.inactive {
          opacity: 0.6;
        }

        .od-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .bank-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--secondary);
          margin: 0 0 2px 0;
          display: flex;
          align-items: center;
        }

        .account-num {
          font-size: 12px;
          color: var(--text-muted);
        }

        .status-badge {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .status-badge.active {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--accent);
        }

        .status-badge.inactive {
          background-color: rgba(100, 116, 139, 0.1);
          color: var(--text-muted);
        }

        .progress-section {
          margin-bottom: 16px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
          color: var(--text-main);
        }

        .progress-bg {
          height: 8px;
          background-color: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .progress-footer {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .details-grid-od {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: var(--background);
          padding: 10px 14px;
          border-radius: 6px;
          margin-bottom: 14px;
        }

        .od-detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .od-detail-item span {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
        }

        .od-detail-item strong {
          font-size: 13px;
          color: var(--secondary);
        }

        .warning-callout {
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          color: #b45309;
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          margin-bottom: 14px;
        }

        .card-actions-od {
          display: flex;
          justify-content: flex-end;
        }

        .form-card-od {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow);
        }

        .card-title-od {
          font-size: 15px;
          font-weight: 700;
          color: var(--secondary);
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-group label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .form-actions-od {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};

export default Overdraft;

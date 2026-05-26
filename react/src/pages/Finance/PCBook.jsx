import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Download, TrendingDown, Wallet, Check
} from 'lucide-react';

const PCBook = () => {
  const pettyCashTransactions = useSelector(state => state.finance.pettyCashTransactions);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fixed opening balance mock
  const openingBalance = 2000.00;

  // Process rows with opening/ending balances
  const processedTransactions = React.useMemo(() => {
    // Sort transactions oldest to newest to compute running balance
    const sorted = [...pettyCashTransactions]
      .filter(t => t.status === 'Approved')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let currentBalance = openingBalance;
    const withRunningBal = sorted.map(t => {
      const balanceBefore = currentBalance;
      currentBalance -= t.amount;
      return {
        ...t,
        openingBalance: balanceBefore,
        endingBalance: currentBalance
      };
    });

    // Apply filters and reverse back to newest first
    return withRunningBal.filter(t => {
      if (departmentFilter && t.department !== departmentFilter) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (searchQuery &&
        !t.requester.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.purpose.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.slipNo.toLowerCase().includes(searchQuery.toLowerCase())
      ) return false;
      return true;
    }).reverse();
  }, [pettyCashTransactions, departmentFilter, dateFrom, dateTo, searchQuery]);

  // Totals calculations
  const totals = React.useMemo(() => {
    const totalSpent = processedTransactions.reduce((acc, t) => acc + t.amount, 0);
    return {
      opening: openingBalance,
      spent: totalSpent,
      ending: openingBalance - totalSpent
    };
  }, [processedTransactions]);

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Slip No,Date,Requester,Department,Category,Purpose,Opening Balance,Amount Spent,Ending Balance\n";

    processedTransactions.forEach(row => {
      csvContent += `${row.slipNo},${row.date},"${row.requester}",${row.department},${row.category},"${row.purpose}",${row.openingBalance.toFixed(2)},${row.amount.toFixed(2)},${row.endingBalance.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Petty_Cash_Book_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="module-container fade-in">
      {/* Header */}
      <div className="module-header">
        <div>
          <h2>Petty Cash (PC) Book</h2>
          <span className="subtitle">Report ledger tracking petty cash slip disbursements, department distributions, and drawer replenishment balances</span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportCSV}>Export CSV</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid-pc">
        <div className="pc-card-stat">
          <div className="stat-icon-wrapper blue">
            <Wallet size={24} />
          </div>
          <div className="stat-meta">
            <span>Counter Opening Balance</span>
            <strong>SGD {totals.opening.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div className="pc-card-stat">
          <div className="stat-icon-wrapper orange">
            <TrendingDown size={24} />
          </div>
          <div className="stat-meta">
            <span>Total PC Disbursements</span>
            <strong style={{ color: 'var(--danger)' }}>SGD {totals.spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div className="pc-card-stat">
          <div className="stat-icon-wrapper green">
            <Check size={24} />
          </div>
          <div className="stat-meta">
            <span>Counter Remaining Balance</span>
            <strong style={{ color: 'var(--accent)' }}>SGD {totals.ending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Filter Section — two-row layout: inputs top-left, Export button bottom-right */}
      <div className="filter-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
        {/* Row 1: Filter inputs — left aligned */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>From</label>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="styled-text-input"
              style={{ width: '145px', height: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>To</label>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="styled-text-input"
              style={{ width: '145px', height: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>Department</label>
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="styled-dropdown"
              style={{ width: '160px', height: '36px' }}
            >
              <option value="">All Departments</option>
              <option value="R&D">R&D</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Production">Production</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>Search</label>
            <input
              type="text"
              placeholder="Slip No, requester, purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="styled-text-input"
              style={{ width: '220px', height: '36px' }}
            />
          </div>
        </div>

        {/* Row 2: Export button — right aligned */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-export-grey" onClick={handleExportCSV} style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="grid-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Opening Balance</th>
              <th>Slip Date</th>
              <th>Expense Slip No</th>
              <th>Particulars (Purpose)</th>
              <th>Category</th>
              <th>Department</th>
              <th style={{ textAlign: 'right' }}>Amount Spent</th>
              <th style={{ textAlign: 'right' }}>Ending Balance</th>
            </tr>
          </thead>
          <tbody>
            {processedTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No approved petty cash transactions found matching filters.</td>
              </tr>
            ) : (
              processedTransactions.map((tr) => (
                <tr key={tr.id}>
                  <td style={{ color: 'var(--text-muted)' }}>
                    SGD {tr.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>{tr.date}</td>
                  <td className="bold-cell">{tr.slipNo}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '500' }}>{tr.purpose}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>By: {tr.requester}</span>
                    </div>
                  </td>
                  <td><span className="items-badge">{tr.category}</span></td>
                  <td>{tr.department}</td>
                  <td style={{ textAlign: 'right', fontWeight: '500', color: 'var(--danger)' }}>
                    ({tr.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>
                    SGD {tr.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Styled JSX */}
      <style jsx="true">{`
        .summary-grid-pc {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 8px;
        }

        .pc-card-stat {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.blue {
          background-color: rgba(59, 130, 246, 0.1);
          color: var(--primary);
        }

        .stat-icon-wrapper.orange {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }

        .stat-icon-wrapper.green {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--accent);
        }

        .stat-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-meta span {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .stat-meta strong {
          font-size: 18px;
          color: var(--secondary);
        }
      `}</style>
    </div>
  );
};

export default PCBook;

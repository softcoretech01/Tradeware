import { formatDate } from '../../utils/dateUtils';
import React, { useState, useMemo } from 'react';
import { Search, X, Printer, Download } from 'lucide-react';


const BankBook = () => {
  // Filters
  const [selectedBank, setSelectedBank] = useState('OCBC - Cash in Hand - IDR');
  const [fromDate, setFromDate] = useState('01-May-2026');
  const [toDate, setToDate] = useState('26-May-2026');
  const [keyword, setKeyword] = useState('');

  // Dropdown list
  const bankAccounts = [
    'OCBC - Cash in Hand - IDR',
    'DBS - SGD Account',
    'UOB - USD Account'
  ];

  // Initial mock transactions matching Screenshot 1
  const initialTransactions = [
    { id: 1, date: '01-May-2026', type: 'OPENING BALANCE (IDR)', party: '-', isLink: false, debit: 3047266069.42, credit: 0 },
    { id: 2, date: '04-May-2026', type: 'Payment (IDR)', party: 'PT KARIMUN TEKNOLOGI GAS', isLink: true, debit: 0, credit: 488400000.00 },
    { id: 3, date: '07-May-2026', type: 'Payment (IDR)', party: 'PT KARIMUN TEKNOLOGI GAS', isLink: true, debit: 0, credit: 476678400.00 },
    { id: 4, date: '11-May-2026', type: 'Payment (IDR)', party: 'PT INDOSEAL BATAM JAYA', isLink: true, debit: 0, credit: 900000.00 },
    { id: 5, date: '11-May-2026', type: 'Payment (IDR)', party: 'PT BERKAT BERSAUDARA BATAM', isLink: true, debit: 0, credit: 29400000.00 },
    { id: 6, date: '11-May-2026', type: 'Payment (IDR)', party: 'PT BERKAT BERSAUDARA BATAM', isLink: true, debit: 0, credit: 32714041.00 },
    { id: 7, date: '11-May-2026', type: 'Payment (IDR)', party: 'CIN HAN', isLink: true, debit: 0, credit: 129423750.00 },
    { id: 8, date: '11-May-2026', type: 'Payment (IDR)', party: 'PT GAGAS ENERGI INDONESIA', isLink: true, debit: 0, credit: 100421575.00 },
    { id: 9, date: '11-May-2026', type: 'Payment (IDR)', party: 'PT CITRAUTAMA DISTRIBUSINDORAYA', isLink: true, debit: 0, credit: 259800.00 }
  ];

  // Rates state for each row
  const [rates, setRates] = useState({
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1
  });

  const handleRateChange = (id, newRate) => {
    const rateVal = parseFloat(newRate);
    setRates(prev => ({
      ...prev,
      [id]: isNaN(rateVal) ? '' : rateVal
    }));
  };

  const overdraftLimit = 7000000000.00;

  // Dynamic calculations: re-calculates total converted, balances, and overdrafts sequentially
  const computedLedger = useMemo(() => {
    let runningBalance = 0;
    
    return initialTransactions.map((tr) => {
      const currentRate = rates[tr.id] === '' ? 1 : rates[tr.id];
      
      // Calculate adjusted debit & credit based on rate changes
      const adjustedDebit = tr.debit * currentRate;
      const adjustedCredit = tr.credit * currentRate;

      // Update running balance sequentially
      if (tr.id === 1) {
        runningBalance = adjustedDebit - adjustedCredit;
      } else {
        runningBalance = runningBalance + adjustedDebit - adjustedCredit;
      }

      const balanceValue = runningBalance;
      const overdraftValue = overdraftLimit - balanceValue;

      // Total (Converted): only displayed if rate is modified from 1
      const totalConverted = currentRate !== 1 ? (tr.debit || tr.credit) * currentRate : null;

      return {
        ...tr,
        rate: rates[tr.id],
        totalConverted,
        balance: balanceValue,
        overdraft: overdraftValue
      };
    });
  }, [rates]);

  // Filters logic
  const filteredLedger = useMemo(() => {
    return computedLedger.filter(tr => {
      if (keyword) {
        const query = keyword.toLowerCase();
        return (
          tr.type.toLowerCase().includes(query) ||
          tr.party.toLowerCase().includes(query) ||
          tr.date.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [computedLedger, keyword]);

  const handleClearFilters = () => {
    setSelectedBank('OCBC - Cash in Hand - IDR');
    setFromDate('01-May-2026');
    setToDate('26-May-2026');
    setKeyword('');
    setRates({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 });
  };

  return (
    <div className="module-container fade-in" style={{ padding: '0 8px' }}>


      {/* Main Filter Section — two-row layout: inputs top-left, buttons bottom-right */}
      <div className="filter-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Row 1: Filter inputs — left aligned */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>Bank Name</label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '240px' }}>
              <select 
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="styled-dropdown"
                style={{ paddingRight: '30px', height: '36px' }}
              >
                {bankAccounts.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {selectedBank && (
                <button type="button" onClick={() => setSelectedBank('')} className="clear-select-btn" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)', position: 'absolute' }}>✕</button>
              )}
            </div>
          </div>

          <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>From</label>
            <input 
              type="text" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="styled-text-input"
              style={{ width: '160px', height: '36px' }}
            />
          </div>

          <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>To</label>
            <input 
              type="text" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="styled-text-input"
              style={{ width: '160px', height: '36px' }}
            />
          </div>
        </div>

        {/* Row 2: Action buttons — right aligned */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button className="btn-search-blue" onClick={() => {}} style={{ height: '36px' }}>
            <Search size={15} style={{ marginRight: '6px' }} /> Search
          </button>
          <button className="btn-cancel-red" onClick={handleClearFilters} style={{ height: '36px' }}>
            <X size={15} style={{ marginRight: '6px' }} /> Cancel
          </button>
          <button className="btn-print-blue" onClick={() => window.print()} style={{ height: '36px' }}>
            <Printer size={15} style={{ marginRight: '6px' }} /> Print
          </button>
          <button className="btn-export-grey" style={{ height: '36px' }}>
            <Download size={15} style={{ marginRight: '6px' }} /> Export
          </button>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="tabs-container">
        {/* Action controls row */}
        <div className="table-controls-row" style={{ justifyContent: 'flex-end' }}>
          <input 
            type="text" 
            placeholder="Keyword Search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="table-keyword-search"
          />
        </div>

        {/* Table Layout */}
        <div className="table-wrapper-card">
          <table className="screenshot-blue-table text-13">
            <thead>
              <tr>
                <th>Date <span className="sort-arrows">↑↓</span></th>
                <th>Transaction Type <span className="sort-arrows">↑↓</span> <span className="funnel-icon">∇</span></th>
                <th>Party <span className="sort-arrows">↑↓</span> <span className="funnel-icon">∇</span></th>
                <th>Rate <span className="sort-arrows">↑↓</span></th>
                <th>Total (Converted) <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Debit <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Credit <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Balance <span className="sort-arrows">↑↓</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.type}</td>
                  <td className={row.isLink ? 'link-cell' : ''}>
                    {row.isLink ? <u>{row.party}</u> : row.party}
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={row.rate} 
                      onChange={(e) => handleRateChange(row.id, e.target.value)}
                      className="rate-table-input"
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '500' }}>
                    {row.totalConverted ? row.totalConverted.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {row.debit > 0 ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {row.credit > 0 ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>
                    {row.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Styled CSS */}
      <style jsx="true">{`


        /* Filter styling */
        .filter-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }

        .filter-grid-row-4 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .filter-item-input {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-item-input label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .styled-dropdown, .styled-text-input {
          height: 38px;
          padding: 8px 12px;
          font-family: inherit;
          font-size: 13px;
          color: #1e293b;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          outline: none;
          width: 100%;
        }

        .styled-dropdown:focus, .styled-text-input:focus {
          border-color: #3b82f6;
        }

        .clear-select-btn {
          position: absolute;
          right: 28px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 11px;
        }

        .filter-buttons-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .btn-search-blue, .btn-print-blue, .btn-cancel-red, .btn-export-grey {
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 18px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }

        .btn-search-blue {
          background-color: #0284c7;
        }
        .btn-search-blue:hover {
          background-color: #0369a1;
        }

        .btn-cancel-red {
          background-color: #ef4444;
        }
        .btn-cancel-red:hover {
          background-color: #dc2626;
        }

        .btn-print-blue {
          background-color: #3b82f6;
        }
        .btn-print-blue:hover {
          background-color: #2563eb;
        }

        .btn-export-grey {
          background-color: #64748b;
        }
        .btn-export-grey:hover {
          background-color: #475569;
        }

        /* Table container */
        .tabs-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
        }

        .table-controls-row {
          display: flex;
          padding: 12px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .table-keyword-search {
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 13px;
          outline: none;
          width: 220px;
        }

        /* Table Styling */
        .table-wrapper-card {
          overflow-x: auto;
        }

        .screenshot-blue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          border: 1px solid #cbd5e1;
        }

        .screenshot-blue-table.text-13 {
          font-size: 12.5px;
        }

        .screenshot-blue-table th {
          background-color: #0067b1;
          color: #ffffff;
          font-weight: 600;
          padding: 10px 12px;
          text-align: left;
          font-size: 12px;
          border-right: 1px solid rgba(255,255,255,0.25);
          border-bottom: 1px solid #cbd5e1;
          white-space: nowrap;
        }

        .screenshot-blue-table th:last-child {
          border-right: none;
        }

        .screenshot-blue-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          color: #334155;
          vertical-align: middle;
        }

        .screenshot-blue-table td:last-child {
          border-right: none;
        }

        .screenshot-blue-table tbody tr:hover {
          background-color: #f1f5f9;
        }

        .link-cell {
          color: #0067b1;
          font-weight: 600;
          cursor: pointer;
        }

        .sort-arrows {
          font-size: 10px;
          color: rgba(255,255,255,0.7);
          margin-left: 2px;
        }

        .funnel-icon {
          font-size: 11px;
          color: rgba(255,255,255,0.8);
          margin-left: 2px;
        }

        .rate-table-input {
          width: 60px;
          height: 28px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 13px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default BankBook;

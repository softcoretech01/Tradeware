import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, X } from 'lucide-react';

const CashBook = () => {
  // Filter States
  const [selectedType, setSelectedType] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('IDR');
  const [fromDate, setFromDate] = useState('01-May-2026');
  const [toDate, setToDate] = useState('26-May-2026');
  const [keyword, setKeyword] = useState('');

  // Initial mock cash book records matching Screenshot 4
  const mockTransactions = [
    { id: 1, date: '01-May-2026', refNo: '-', type: 'OPENING BALANCE', party: '-', debit: 193876716.00, credit: 0.00, balance: 193876716.00 },
    { id: 2, date: '01-May-2026', refNo: 'OPENING BALANCE', type: 'Opening Balance', party: '-', debit: 1.00, credit: 0.00, balance: 193876717.00 },
    { id: 3, date: '02-May-2026', refNo: 'CLM0003306', type: 'Payment', party: 'Lysasigita', debit: 0.00, credit: 24641700.00, balance: 169235017.00 },
    { id: 4, date: '05-May-2026', refNo: 'CLM0003473', type: 'Payment', party: 'Elsa', debit: 0.00, credit: 42151862.00, balance: 127083155.00 },
    { id: 5, date: '05-May-2026', refNo: '-', type: 'Round plus', party: '-', debit: 0.00, credit: 38.00, balance: 127083117.00 },
    { id: 6, date: '07-May-2026', refNo: 'PPP0000049', type: 'Cash withdraw', party: 'Multiple', debit: 441888900.00, credit: 0.00, balance: 568972017.00 },
    { id: 7, date: '08-May-2026', refNo: 'CLM0003554', type: 'Payment', party: 'Lusilia', debit: 0.00, credit: 5449657.00, balance: 563522360.00 },
    { id: 8, date: '08-May-2026', refNo: '-', type: 'Round plus', party: '-', debit: 0.00, credit: 43.00, balance: 563522317.00 },
    { id: 9, date: '11-May-2026', refNo: 'CLM0003472', type: 'Payment', party: 'Laura Cindy Perwitasari', debit: 0.00, credit: 5167900.00, balance: 558354417.00 },
    { id: 10, date: '12-May-2026', refNo: 'CLM0003769', type: 'Payment', party: 'Mery', debit: 0.00, credit: 175000.00, balance: 558179417.00 }
  ];

  // Filters logic
  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(tr => {
      if (selectedType && tr.type !== selectedType) return false;
      if (keyword) {
        const q = keyword.toLowerCase();
        return (
          tr.refNo.toLowerCase().includes(q) ||
          tr.type.toLowerCase().includes(q) ||
          tr.party.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedType, keyword]);

  const handleClearFilters = () => {
    setSelectedType('');
    setSelectedCurrency('IDR');
    setFromDate('01-May-2026');
    setToDate('26-May-2026');
    setKeyword('');
  };

  return (
    <div className="module-container fade-in" style={{ padding: '0 8px' }}>


      {/* Main Filter Section — two-row layout: inputs top-left, buttons bottom-right */}
      <div className="filter-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Row 1: Filter inputs — left aligned */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>Type</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="styled-dropdown"
              style={{ width: '160px', height: '36px' }}
            >
              <option value="">Select Type</option>
              <option value="Payment">Payment</option>
              <option value="Opening Balance">Opening Balance</option>
              <option value="Cash withdraw">Cash withdraw</option>
              <option value="Round plus">Round plus</option>
            </select>
          </div>

          <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>Currency</label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '110px' }}>
              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="styled-dropdown"
                style={{ paddingRight: '30px', height: '36px' }}
              >
                <option value="IDR">IDR</option>
                <option value="SGD">SGD</option>
                <option value="USD">USD</option>
              </select>
              {selectedCurrency && (
                <button type="button" onClick={() => setSelectedCurrency('')} className="clear-select-btn" style={{ right: '8px' }}>✕</button>
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
              style={{ width: '130px', height: '36px' }}
            />
          </div>

          <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>To</label>
            <input 
              type="text" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="styled-text-input"
              style={{ width: '130px', height: '36px' }}
            />
          </div>
        </div>

        {/* Row 2: Action buttons — right aligned */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button className="btn-search-blue" style={{ height: '36px' }}>
            <Search size={15} style={{ marginRight: '6px' }} /> Search
          </button>
          <button className="btn-print-blue" style={{ height: '36px' }} onClick={() => window.print()}>
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
        <div className="table-controls-row">
          <button className="btn-cancel-red-cancel" onClick={handleClearFilters}>
            <X size={14} style={{ marginRight: '6px' }} /> Cancel
          </button>

          <input 
            type="text" 
            placeholder="Keyword Search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="table-keyword-search"
          />
        </div>

        {/* Table layout */}
        <div className="table-wrapper-card">
          <table className="screenshot-blue-table">
            <thead>
              <tr>
                <th>Date <span className="sort-arrows">↑↓</span></th>
                <th>Reference <span className="sort-arrows">↑↓</span> <span className="funnel-icon">∇</span></th>
                <th>Transaction Type <span className="sort-arrows">↑↓</span> <span className="funnel-icon">∇</span></th>
                <th>Party / Account <span className="sort-arrows">↑↓</span> <span className="funnel-icon">∇</span></th>
                <th style={{ textAlign: 'right' }}>Debit <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Credit <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Balance <span className="sort-arrows">↑↓</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.refNo}</td>
                  <td>{row.type}</td>
                  <td>{row.party}</td>
                  <td style={{ textAlign: 'right' }}>{row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>{row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>{row.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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

        .btn-search-blue, .btn-print-blue, .btn-export-grey {
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
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .btn-cancel-red-cancel {
          background-color: #ef4444;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 6px 14px;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }
        .btn-cancel-red-cancel:hover {
          background-color: #dc2626;
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
      `}</style>
    </div>
  );
};

export default CashBook;

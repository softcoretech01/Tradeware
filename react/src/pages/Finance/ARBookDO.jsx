import { formatDate } from '../../utils/dateUtils';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 

  Search, Printer, Download, Share2
} from 'lucide-react';

const ARBookDO = () => {
  // Filter States
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [fromDate, setFromDate] = useState('01-Mar-2026');
  const [toDate, setToDate] = useState('26-May-2026');
  const [globalSearch, setGlobalSearch] = useState('');

  const customers = [
    { id: 'CUST-1', name: 'ACE FIRE ENGINEERING PTE LTD' },
    { id: 'CUST-2', name: 'AIR LIQUIDE SINGAPORE PTE LTD' },
    { id: 'CUST-3', name: 'AKHUN SERVICE' }
  ];

  // Table Data populated with realistic Delivery Orders matching standard projects
  const [doData, setDoData] = useState([
    { id: 1, date: '10-May-2026', refNo: 'DO-2026-001', customerName: 'ACE FIRE ENGINEERING PTE LTD', invoiceAmt: 15000.00, debitNote: 0.00, receiptAmt: 5000.00, creditNote: 0.00, balance: 10000.00 },
    { id: 2, date: '18-May-2026', refNo: 'DO-2026-002', customerName: 'ACE FIRE ENGINEERING PTE LTD', invoiceAmt: 8500.00, debitNote: 0.00, receiptAmt: 0.00, creditNote: 0.00, balance: 8500.00 },
    { id: 3, date: '22-May-2026', refNo: 'DO-2026-003', customerName: 'AIR LIQUIDE SINGAPORE PTE LTD', invoiceAmt: 22000.00, debitNote: 0.00, receiptAmt: 10000.00, creditNote: 0.00, balance: 12000.00 }
  ]);
  const [selectedDoIds, setSelectedDoIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDoIds(doData.map(d => d.id));
    } else {
      setSelectedDoIds([]);
    }
  };

  return (
    <div className="module-container fade-in" style={{ padding: '0 8px' }}>


      {/* Main Filter Section — two-row layout: inputs top-left, buttons bottom-right */}
      <div className="filter-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Row 1: Filter inputs — left aligned */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>Customer</label>
            <select 
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="styled-dropdown"
              style={{ width: '220px', height: '36px' }}
            >
              <option value="">Select...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
          <button className="btn-convert-orange" style={{ height: '36px' }}>
            <Share2 size={15} style={{ marginRight: '6px' }} /> Convert to Invoice
          </button>
          <button className="btn-search-blue" style={{ height: '36px' }}>
            <Search size={15} style={{ marginRight: '6px' }} /> Search
          </button>
          <button className="btn-export-grey" style={{ height: '36px' }}>
            <Download size={15} style={{ marginRight: '6px' }} /> Export
          </button>
          <button className="btn-print-blue" style={{ height: '36px' }} onClick={() => window.print()}>
            <Printer size={15} style={{ marginRight: '6px' }} /> Print
          </button>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="tabs-container">
        {/* Action controls row */}
        <div className="table-controls-row" style={{ justifyContent: 'flex-end' }}>
          <input 
            type="text" 
            placeholder="Global Search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="table-keyword-search"
          />
        </div>

        {/* Table layout */}
        <div className="table-wrapper-card">
          <table className="screenshot-blue-table text-13">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={doData.length > 0 && selectedDoIds.length === doData.length}
                  />
                </th>
                <th>Date <span className="sort-arrows">↑↓</span></th>
                <th>Reference No. <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Invoice Amount (A) <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Debit Note (B) <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Receipt (C) <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Credit Note (D) <span className="sort-arrows">↑↓</span></th>
                <th style={{ textAlign: 'right' }}>Balance ((A+B)-(C+D))</th>
              </tr>
            </thead>
            <tbody>
              {doData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty-gray">
                    No available options
                  </td>
                </tr>
              ) : (
                doData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={selectedDoIds.includes(row.id)}
                        onChange={() => {}}
                      />
                    </td>
                    <td>{formatDate(row.date)}</td>
                    <td className="link-cell"><u>{row.refNo}</u></td>
                    <td style={{ textAlign: 'right' }}>{row.invoiceAmt.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{row.debitNote.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{row.receiptAmt.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{row.creditNote.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800' }}>{row.balance.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="pagination-footer-row">
          <button className="pag-btn">«</button>
          <button className="pag-btn">‹</button>
          <button className="pag-btn">›</button>
          <button className="pag-btn">»</button>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="copyright-footer-bar">
        Copyright © 2026 All Rights Reserved. 1.0.0.1
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

        .filter-grid-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

        .filter-buttons-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .btn-search-blue, .btn-print-blue, .btn-convert-orange, .btn-export-grey {
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 18px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }

        .btn-convert-orange {
          background-color: #f59e0b;
        }
        .btn-convert-orange:hover {
          background-color: #d97706;
        }

        .btn-search-blue {
          background-color: #0284c7;
        }
        .btn-search-blue:hover {
          background-color: #0369a1;
        }

        .btn-export-grey {
          background-color: #64748b;
        }
        .btn-export-grey:hover {
          background-color: #475569;
        }

        .btn-print-blue {
          background-color: #3b82f6;
        }
        .btn-print-blue:hover {
          background-color: #2563eb;
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

        .table-wrapper-card {
          overflow-x: auto;
        }

        .screenshot-blue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          border: 1px solid #cbd5e1;
        }

        .screenshot-blue-table th {
          background-color: #0067b1;
          color: #ffffff;
          font-weight: 600;
          padding: 10px 14px;
          text-align: left;
          font-size: 12.5px;
          border-right: 1px solid rgba(255,255,255,0.25);
          border-bottom: 1px solid #cbd5e1;
          white-space: nowrap;
        }

        .screenshot-blue-table th:last-child {
          border-right: none;
        }

        .screenshot-blue-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          color: #334155;
          vertical-align: middle;
        }

        .screenshot-blue-table td:last-child {
          border-right: none;
        }

        .table-empty-gray {
          text-align: center;
          color: #64748b;
          background-color: #f8fafc;
          padding: 16px !important;
          font-size: 13px;
          font-weight: 500;
        }

        .link-cell {
          color: #0067b1;
          font-weight: 600;
          cursor: pointer;
        }

        .sort-arrows {
          font-size: 10px;
          color: rgba(255,255,255,0.7);
          margin-left: 4px;
        }

        /* Footer pagination */
        .pagination-footer-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .pag-btn {
          border: none;
          background: none;
          color: #0067b1;
          font-size: 15px;
          cursor: pointer;
          padding: 4px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pag-btn:hover {
          color: #0284c7;
        }

        .copyright-footer-bar {
          text-align: left;
          font-size: 12px;
          color: #94a3b8;
          margin-top: 16px;
          padding: 8px 0;
        }
      `}</style>
    </div>
  );
};

export default ARBookDO;

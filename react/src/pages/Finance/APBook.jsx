import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Search, X, Calendar, Filter, Download, ArrowRight, Check, HelpCircle
} from 'lucide-react';

const APBook = () => {
  // Tabs: 'GRN' | 'IRN' | 'Accounts payable'
  const [activeTab, setActiveTab] = useState('GRN');

  // Filter States
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [fromDate, setFromDate] = useState('01-05-2026');
  const [toDate, setToDate] = useState('26-05-2026');
  const [keyword, setKeyword] = useState('');

  // Suppliers & Currencies mock options
  const suppliersList = [
    'PT GLOBAL WELINDO BATAM',
    'ACE GASES MARKETINGS PTE LTD',
    'PT ARYA ANUGERAH PRIMA',
    'PT ARTAGAS PRIMANDIRI',
    'PT SURYA BUANA BINTAN'
  ];

  // Tab 1: GRN Data
  const grnData = [
    { no: 'GN0002530', date: '04-May-2026', supplier: 'PT GLOBAL WELINDO BATAM', createdDate: '04-May-2026', createdBy: 'Adit' },
    { no: 'GN0002574', date: '05-May-2026', supplier: 'ACE GASES MARKETINGS PTE LTD', createdDate: '07-May-2026', createdBy: 'Rifqi' },
    { no: 'GN0002612', date: '07-May-2026', supplier: 'PT ARYA ANUGERAH PRIMA', createdDate: '09-May-2026', createdBy: 'Lifi' },
    { no: 'GN0002616', date: '08-May-2026', supplier: 'ACE GASES MARKETINGS PTE LTD', createdDate: '11-May-2026', createdBy: 'Rifqi' },
    { no: 'GN0002619', date: '07-May-2026', supplier: 'PT ARTAGAS PRIMANDIRI', createdDate: '11-May-2026', createdBy: 'Laura' },
    { no: 'GN0002620', date: '08-May-2026', supplier: 'PT SURYA BUANA BINTAN', createdDate: '11-May-2026', createdBy: 'Laura' }
  ];

  // Tab 2: IRN Data
  const irnData = [
    { ref: 'IRN0027968', date: '21-May-2026', po: 'PO0002682', poDate: '21-May-2026', currency: 'IDR', dueDate: '31-May-2026', amount: 1000.00, cumulative: 1000.00 },
    { ref: 'IRN0027965', date: '11-May-2026', po: 'PO000497', poDate: '08-Dec-2025', currency: 'IDR', dueDate: '18-May-2026', amount: 2940000.00, cumulative: 2941000.00 },
    { ref: 'IRN0027963', date: '08-May-2026', po: 'PO0002673', poDate: '07-May-2026', currency: 'SGD', dueDate: '06-Aug-2026', amount: 10728.00, cumulative: 2951728.00 },
    { ref: 'IRN0027961', date: '11-May-2026', po: 'PO0002639', poDate: '06-May-2026', currency: 'IDR', dueDate: '25-May-2026', amount: 59450000.00, cumulative: 62401728.00 }
  ];

  // Tab 3: Accounts Payable Data
  const apData = [
    { po: 'PO0002565', poDate: '04-May-2026', poAmt: 3243500.00, grn: 'GN0002523', grnDate: '25-Apr-2026', irn: 'IRN0026998', irnDate: '25-Apr-2026', grnIrnAmt: 3243500.00, claim: 'CLM0003788', claimDate: '04-May-2026', claimAmt: 3243500.00, balance: 0.00, cumulative: 0.00 },
    { po: 'PO0002618', poDate: '01-May-2026', poAmt: 29400000.00, grn: 'GN0002562', grnDate: '02-May-2026', irn: 'IRN002792', irnDate: '02-May-2026', grnIrnAmt: 29400000.00, claim: 'CLM0003856', claimDate: '06-May-2026', claimAmt: 29400000.00, balance: 0.00, cumulative: 0.00 },
    { po: 'PO0002560', poDate: '04-May-2026', poAmt: 1050000.00, grn: 'GN0002529', grnDate: '04-May-2026', irn: 'IRN0027014', irnDate: '04-May-2026', grnIrnAmt: 1050000.00, claim: 'CLM0003805', claimDate: '05-May-2026', claimAmt: 1050000.00, balance: 0.00, cumulative: 0.00 }
  ];

  const [selectedIrnIds, setSelectedIrnIds] = useState([]);

  const handleSelectIrn = (ref) => {
    setSelectedIrnIds(prev => 
      prev.includes(ref) ? prev.filter(r => r !== ref) : [...prev, ref]
    );
  };

  const handleSelectAllIrn = (e) => {
    if (e.target.checked) {
      setSelectedIrnIds(irnData.map(d => d.ref));
    } else {
      setSelectedIrnIds([]);
    }
  };

  // Filter Logic
  const filteredGrn = grnData.filter(d => {
    if (selectedSupplier && d.supplier !== selectedSupplier) return false;
    if (keyword && !d.no.toLowerCase().includes(keyword.toLowerCase()) && !d.supplier.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const filteredIrn = irnData.filter(d => {
    if (selectedCurrency && d.currency !== selectedCurrency) return false;
    if (keyword && !d.ref.toLowerCase().includes(keyword.toLowerCase()) && !d.po.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const filteredAp = apData.filter(d => {
    if (keyword && !d.po.toLowerCase().includes(keyword.toLowerCase()) && !d.grn.toLowerCase().includes(keyword.toLowerCase()) && !d.irn.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const handleClearFilters = () => {
    setSelectedSupplier('');
    setSelectedCurrency('');
    setFromDate('01-05-2026');
    setToDate('26-05-2026');
    setKeyword('');
  };

  return (
    <div className="module-container fade-in" style={{ padding: '0 8px' }}>


      {/* Main Filter Section — two-row layout: inputs top-left, buttons bottom-right */}
      <div className="filter-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Row 1: Filter inputs — left aligned */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>Supplier</label>
              <select 
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="styled-dropdown"
                style={{ width: '220px', height: '36px' }}
              >
                <option value="">Select Supplier</option>
                {suppliersList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>Currency</label>
              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="styled-dropdown"
                style={{ width: '140px', height: '36px' }}
              >
                <option value="">Select Currency</option>
                <option value="IDR">IDR</option>
                <option value="SGD">SGD</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>From</label>
              <input 
                type="text" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="DD-MM-YYYY"
                className="styled-text-input"
                style={{ width: '120px', height: '36px' }}
              />
            </div>

            <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>To</label>
              <input 
                type="text" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="DD-MM-YYYY"
                className="styled-text-input"
                style={{ width: '120px', height: '36px' }}
              />
            </div>
        </div>

        {/* Row 2: Action buttons — right aligned */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button className="btn-search-blue" style={{ height: '36px' }}>
            <Search size={15} style={{ marginRight: '6px' }} /> Search
          </button>
          <button className="btn-cancel-red" onClick={handleClearFilters} style={{ height: '36px' }}>
            <X size={15} style={{ marginRight: '6px' }} /> Cancel
          </button>
        </div>

        {activeTab === 'Accounts payable' && (
          <div className="total-ap-display" style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
            Total AP: <span className="red-amount" style={{ color: '#b91c1c', fontWeight: '800' }}>-1,382,000.00</span>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="tabs-container">
        <div className="tabs-header-bar">
          <button 
            className={`tab-btn-item ${activeTab === 'GRN' ? 'active' : ''}`}
            onClick={() => setActiveTab('GRN')}
          >
            GRN
          </button>
          <button 
            className={`tab-btn-item ${activeTab === 'IRN' ? 'active' : ''}`}
            onClick={() => setActiveTab('IRN')}
          >
            IRN
          </button>
          <button 
            className={`tab-btn-item ${activeTab === 'Accounts payable' ? 'active' : ''}`}
            onClick={() => setActiveTab('Accounts payable')}
          >
            Accounts payable
          </button>

          {activeTab === 'IRN' && (
            <button className="btn-create-payment-claim">
              <Check size={14} style={{ marginRight: '6px' }} /> Create Payment Claim
            </button>
          )}
        </div>

        {/* Action controls row */}
        <div className="table-controls-row">
          <button className="btn-clear-red-filter" onClick={handleClearFilters}>
            <span style={{ marginRight: '6px', fontSize: '14px' }}>✕</span> Clear
          </button>

          <input 
            type="text" 
            placeholder="Keyword Search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="table-keyword-search"
          />
        </div>

        {/* Dynamic Table Sections */}
        <div className="table-wrapper-card">
          {activeTab === 'GRN' && (
            <table className="screenshot-blue-table">
              <thead>
                <tr>
                  <th>GRN No <span className="sort-arrows">↑↓</span></th>
                  <th>GRN Date <span className="sort-arrows">↑↓</span></th>
                  <th>Supplier <span className="sort-arrows">↑↓</span></th>
                  <th>Created Date <span className="sort-arrows">↑↓</span></th>
                  <th>Created By <span className="sort-arrows">↑↓</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredGrn.map((row) => (
                  <tr key={row.no}>
                    <td className="link-cell"><u>{row.no}</u></td>
                    <td>{row.date}</td>
                    <td>{row.supplier}</td>
                    <td>{row.createdDate}</td>
                    <td>{row.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'IRN' && (
            <table className="screenshot-blue-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox"
                      onChange={handleSelectAllIrn}
                      checked={selectedIrnIds.length === irnData.length}
                    />
                  </th>
                  <th>Reference (IRN) <span className="sort-arrows">↑↓</span></th>
                  <th>IRN Date <span className="sort-arrows">↑↓</span></th>
                  <th>PO Number <span className="sort-arrows">↑↓</span></th>
                  <th>Currency <span className="sort-arrows">↑↓</span></th>
                  <th>Due Date <span className="sort-arrows">↑↓</span></th>
                  <th style={{ textAlign: 'right' }}>Amount <span className="sort-arrows">↑↓</span></th>
                  <th style={{ textAlign: 'right' }}>Cumulative Amount <span className="sort-arrows">↑↓</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredIrn.map((row) => (
                  <tr key={row.ref}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={selectedIrnIds.includes(row.ref)}
                        onChange={() => handleSelectIrn(row.ref)}
                      />
                    </td>
                    <td className="link-cell"><u>{row.ref}</u></td>
                    <td>{row.date}</td>
                    <td>
                      <div className="stacked-cell">
                        <u className="link-color">{row.po}</u>
                        <span className="sub-text">{row.poDate}</span>
                      </div>
                    </td>
                    <td>{row.currency}</td>
                    <td>{row.dueDate}</td>
                    <td style={{ textAlign: 'right' }}>{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>{row.cumulative.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'Accounts payable' && (
            <table className="screenshot-blue-table text-13">
              <thead>
                <tr>
                  <th>PO No / DATE <span className="sort-arrows">↑↓</span></th>
                  <th style={{ textAlign: 'right' }}>PO Amt <span className="sort-arrows">↑↓</span></th>
                  <th>GRN No. / DATE <span className="sort-arrows">↑↓</span></th>
                  <th>IRN No. / DATE <span className="sort-arrows">↑↓</span></th>
                  <th style={{ textAlign: 'right' }}>GRN/IRN Amount <span className="sort-arrows">↑↓</span></th>
                  <th>Claim No. / DATE <span className="sort-arrows">↑↓</span></th>
                  <th style={{ textAlign: 'right' }}>Claim Amt <span className="sort-arrows">↑↓</span></th>
                  <th style={{ textAlign: 'right' }}>Balance <span className="sort-arrows">↑↓</span></th>
                  <th style={{ textAlign: 'right' }}>Cumulative <span className="sort-arrows">↑↓</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredAp.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="stacked-cell">
                        <u className="link-color">{row.po}</u>
                        <span className="sub-text">{row.poDate}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{row.poAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <div className="stacked-cell">
                        <u className="link-color">{row.grn}</u>
                        <span className="sub-text">{row.grnDate}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stacked-cell">
                        <u className="link-color">{row.irn}</u>
                        <span className="sub-text">{row.irnDate}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{row.grnIrnAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <div className="stacked-cell">
                        <u className="link-color">{row.claim}</u>
                        <span className="sub-text">{row.claimDate}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{row.claimAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>{row.balance.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{row.cumulative.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
          gap: 16px;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }

        .filter-grid-row {
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
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          outline: none;
          width: 100%;
        }

        .styled-dropdown:focus, .styled-text-input:focus {
          border-color: #3b82f6;
          background-color: #ffffff;
        }

        .filter-buttons-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .btn-search-blue {
          background-color: #0284c7;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 18px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }

        .btn-search-blue:hover {
          background-color: #0369a1;
        }

        .btn-cancel-red {
          background-color: #ef4444;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 18px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }

        .btn-cancel-red:hover {
          background-color: #dc2626;
        }

        /* Tabs bar */
        .tabs-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
        }

        .tabs-header-bar {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
          background: #ffffff;
          position: relative;
        }

        .tab-btn-item {
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          position: relative;
          background: none;
        }

        .tab-btn-item.active {
          color: #3b82f6;
        }

        .tab-btn-item.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #3b82f6;
        }

        .btn-create-payment-claim {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background-color: #10b981;
          color: white;
          font-weight: 600;
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .btn-create-payment-claim:hover {
          background-color: #059669;
        }

        /* Action controls */
        .table-controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .btn-clear-red-filter {
          background-color: #ef4444;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 6px 14px;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .btn-clear-red-filter:hover {
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

        /* Screenshot Table Styling */
        .table-wrapper-card {
          padding: 0;
          overflow-x: auto;
        }

        .screenshot-blue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          border: 1px solid #cbd5e1;
        }

        .screenshot-blue-table.text-13 {
          font-size: 12.5px;
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

        .screenshot-blue-table tbody tr:hover {
          background-color: #f1f5f9;
        }

        .link-cell {
          color: #0067b1;
          font-weight: 600;
          cursor: pointer;
        }

        .link-color {
          color: #0067b1;
        }

        .sort-arrows {
          font-size: 10px;
          color: rgba(255,255,255,0.7);
          margin-left: 4px;
        }

        .stacked-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sub-text {
          font-size: 10.5px;
          color: #64748b;
        }

        .total-ap-display {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 14px;
        }

        .red-amount {
          color: #b91c1c;
          font-weight: 800;
        }
      `}</style>
    </div>
  );
};

export default APBook;

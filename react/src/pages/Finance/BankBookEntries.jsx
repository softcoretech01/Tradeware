import React, { useState, useMemo } from 'react';
import { 
  Search, Printer, Eye, CheckCircle2, Edit3, Trash2, MessageSquare, Plus, Download, ArrowLeft, X
} from 'lucide-react';

const BankBookEntries = () => {
  // Navigation state: 'list' | 'create'
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);

  // List view filters
  const [fromDate, setFromDate] = useState('01-May-2026');
  const [toDate, setToDate] = useState('26-May-2026');
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [keyword, setKeyword] = useState('');

  // Dialog/modal states
  const [viewOpen, setViewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Mock list entries matching standard project master names
  const [entries, setEntries] = useState([
    {
      id: 1,
      date: '20-May-2026',
      bankName: 'DBS - SGD Account',
      party: 'ACE FIRE ENGINEERING PTE LTD',
      voucher: 'V-8821',
      amount: 15000.00,
      bankCharges: 15.00,
      status: 'S', // S for Saved, P for Posted
      verify: 'MP', // empty or MP (Pending) or C (Completed)
      comment: 'Initial contra ledger transaction'
    },
    {
      id: 2,
      date: '22-May-2026',
      bankName: 'OCBC - Cash in Hand - IDR',
      party: 'PT KARIMUN TEKNOLOGI GAS',
      voucher: 'V-8822',
      amount: 488400000.00,
      bankCharges: 50000.00,
      status: 'P',
      verify: 'C',
      comment: 'Cylinder procurement payment clearance'
    },
    {
      id: 3,
      date: '25-May-2026',
      bankName: 'UOB - USD Account',
      party: 'AIR LIQUIDE SINGAPORE PTE LTD',
      voucher: 'V-8823',
      amount: 12000.00,
      bankCharges: 25.00,
      status: 'S',
      verify: '',
      comment: 'USD account advance deposit payment'
    }
  ]);

  // Selected checkboxes
  const [selectedIds, setSelectedIds] = useState([]);

  // Create form states
  const [createBank, setCreateBank] = useState('');
  const [createCurrency, setCreateCurrency] = useState('');
  const [createRows, setCreateRows] = useState([
    { id: 1, type: 'Receipt', date: '26-May-2026', party: '', refNo: '', amount: '', method: 'Bank Transfer', charges: '', salesPerson: '' }
  ]);

  // Calculations for Create Page
  const createTotals = useMemo(() => {
    let receipts = 0;
    let payments = 0;
    createRows.forEach(row => {
      const amt = parseFloat(row.amount) || 0;
      if (row.type === 'Receipt') {
        receipts += amt;
      } else {
        payments += amt;
      }
    });
    return { receipts, payments };
  }, [createRows]);

  const handleAddCreateRow = () => {
    setCreateRows(prev => [
      ...prev,
      { id: Date.now(), type: 'Receipt', date: '26-May-2026', party: '', refNo: '', amount: '', method: 'Bank Transfer', charges: '', salesPerson: '' }
    ]);
  };

  const handleRemoveCreateRow = (id) => {
    if (createRows.length === 1) return;
    setCreateRows(prev => prev.filter(r => r.id !== id));
  };

  const handleCreateRowChange = (id, field, value) => {
    setCreateRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSaveEntry = (isPost = false) => {
    if (!createBank || !createCurrency) {
      alert("Please select a bank account and currency.");
      return;
    }
    const hasInvalid = createRows.some(r => !r.amount || !r.party);
    if (hasInvalid) {
      alert("Please fill in Party and Amount fields.");
      return;
    }

    if (editId !== null) {
      // Edit existing entries
      const firstRow = createRows[0];
      setEntries(prev => prev.map(ent => {
        if (ent.id === editId) {
          return {
            ...ent,
            date: firstRow.date,
            bankName: createBank,
            party: firstRow.party,
            voucher: firstRow.refNo || '-',
            amount: parseFloat(firstRow.amount),
            bankCharges: firstRow.charges ? parseFloat(firstRow.charges) : '',
            status: isPost ? 'P' : 'S'
          };
        }
        return ent;
      }));
      setEditId(null);
    } else {
      // Create new entries
      const newEntries = createRows.map((row, idx) => ({
        id: Date.now() + idx,
        date: row.date,
        bankName: createBank,
        party: row.party,
        voucher: row.refNo || '-',
        amount: parseFloat(row.amount),
        bankCharges: row.charges ? parseFloat(row.charges) : '',
        status: isPost ? 'P' : 'S',
        verify: '',
        comment: ''
      }));
      setEntries(prev => [...prev, ...newEntries]);
    }

    setView('list');
    
    // Reset form
    setCreateBank('');
    setCreateCurrency('');
    setCreateRows([{ id: 1, type: 'Receipt', date: '26-May-2026', party: '', refNo: '', amount: '', method: 'Bank Transfer', charges: '', salesPerson: '' }]);
  };

  // Checkbox toggle handlers
  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredEntries.map(ent => ent.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filter list
  const filteredEntries = useMemo(() => {
    return entries.filter(ent => {
      if (keyword) {
        const q = keyword.toLowerCase();
        return (
          ent.bankName.toLowerCase().includes(q) ||
          ent.party.toLowerCase().includes(q) ||
          ent.voucher.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, keyword]);

  // View Details Handler
  const handleOpenView = (entry) => {
    setSelectedEntry(entry);
    setViewOpen(true);
  };

  // Print Handler
  const handleOpenPrint = (entry) => {
    setSelectedEntry(entry);
    setPrintOpen(true);
  };

  // Quick Post Handler
  const handleQuickPost = (id) => {
    setEntries(prev => prev.map(ent => ent.id === id ? { ...ent, status: 'P' } : ent));
    alert("Voucher posted successfully!");
  };

  // Edit Handler
  const handleOpenEdit = (entry) => {
    setEditId(entry.id);
    setCreateBank(entry.bankName);
    // Guess currency based on bankName or default to IDR
    setCreateCurrency(entry.bankName.includes('IDR') ? 'IDR' : entry.bankName.includes('USD') ? 'USD' : 'SGD');
    setCreateRows([
      {
        id: entry.id,
        type: entry.amount >= 0 ? 'Receipt' : 'Payment',
        date: entry.date,
        party: entry.party,
        refNo: entry.voucher,
        amount: Math.abs(entry.amount).toString(),
        method: 'Bank Transfer',
        charges: entry.bankCharges ? entry.bankCharges.toString() : '',
        salesPerson: ''
      }
    ]);
    setView('create');
  };

  // Delete Handler
  const handleDeleteEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this bank book entry?")) {
      setEntries(prev => prev.filter(ent => ent.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Comments Handlers
  const handleOpenComment = (entry) => {
    setSelectedEntry(entry);
    setCommentText(entry.comment || '');
    setCommentOpen(true);
  };

  const handleSaveComment = () => {
    setEntries(prev => prev.map(ent => ent.id === selectedEntry.id ? { ...ent, comment: commentText } : ent));
    setCommentOpen(false);
    alert("Comment updated successfully!");
  };

  // View 1: List View
  if (view === 'list') {
    return (
      <div className="module-container fade-in" style={{ padding: '0 8px' }}>
        {/* Main Filter Section — two-row layout: inputs top-left, New button bottom-right */}
        <div className="filter-card" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Row 1: Filter inputs — left aligned */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>From</label>
              <input 
                type="text" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="styled-text-input"
                style={{ width: '115px', height: '36px' }}
              />
            </div>

            <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>To</label>
              <input 
                type="text" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="styled-text-input"
                style={{ width: '115px', height: '36px' }}
              />
            </div>

            <div className="filter-item-input-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>Currency</label>
              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="styled-dropdown"
                style={{ width: '90px', height: '36px' }}
              >
                <option value="All">All</option>
                <option value="IDR">IDR</option>
                <option value="SGD">SGD</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Row 2: New button — right aligned */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-create-green" onClick={() => { setView('create'); setEditId(null); }} style={{ margin: 0 }}>
              <div className="icon-box">
                <Plus size={16} />
              </div>
              <div className="text-box">New</div>
            </button>
          </div>
        </div>

        {/* Main Grid Wrapper */}
        <div className="tabs-container">
          {/* Table controls row */}
          <div className="table-controls-row">
            <button className="btn-clear-red-filter" onClick={() => setKeyword('')}>
              ✕ Clear
            </button>

            {/* Status Indicators Legend */}
            <div className="status-indicators-legend">
              <span>Status:</span>
              <div className="status-legend-item">
                <span className="badge-legend badge-red-s">S</span> Saved
              </div>
              <div className="status-legend-item">
                <span className="badge-legend badge-green-p">P</span> Posted
              </div>
              <span style={{ marginLeft: '12px' }}>Verify:</span>
              <div className="status-legend-item">
                <span className="badge-legend badge-blue-mp">MP</span> Pending
              </div>
              <div className="status-legend-item">
                <span className="badge-legend badge-green-c">C</span> Completed
              </div>
            </div>

            <input 
              type="text" 
              placeholder="Keyword Search..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
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
                      onChange={handleToggleSelectAll}
                      checked={filteredEntries.length > 0 && selectedIds.length === filteredEntries.length}
                    />
                  </th>
                  <th>Date <span className="sort-arrows">↑↓</span> <span className="funnel-icon">∇</span></th>
                  <th>Bank Name <span className="sort-arrows">↑↓</span> <span className="funnel-icon">∇</span></th>
                  <th>Party <span className="sort-arrows">↑↓</span> <span className="funnel-icon">∇</span></th>
                  <th>Voucher <span className="sort-arrows">↑↓</span> <span className="funnel-icon">∇</span></th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Bank Charges</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Verify</th>
                  <th style={{ textAlign: 'center' }}>View</th>
                  <th style={{ textAlign: 'center' }}>Print</th>
                  <th style={{ textAlign: 'center' }}>Post</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((row) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(row.id)}
                        onChange={() => handleToggleSelectRow(row.id)}
                      />
                    </td>
                    <td>{row.date}</td>
                    <td>{row.bankName}</td>
                    <td>{row.party}</td>
                    <td>{row.voucher}</td>
                    <td style={{ textAlign: 'right' }}>{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>{row.bankCharges ? row.bankCharges.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                    <td style={{ textAlign: 'center' }}>
                      {row.status === 'S' ? (
                        <span className="badge-legend badge-red-s">S</span>
                      ) : (
                        <span className="badge-legend badge-green-p">P</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.verify === 'MP' && <span className="badge-legend badge-blue-mp">MP</span>}
                      {row.verify === 'C' && <span className="badge-legend badge-green-c">C</span>}
                    </td>
                    <td style={{ textAlign: 'center', color: '#64748b', cursor: 'pointer' }} onClick={() => handleOpenView(row)}><Eye size={16} /></td>
                    <td style={{ textAlign: 'center', color: '#64748b', cursor: 'pointer' }} onClick={() => handleOpenPrint(row)}><Printer size={16} /></td>
                    <td style={{ textAlign: 'center', color: '#10b981', cursor: 'pointer' }} onClick={() => handleQuickPost(row.id)}><CheckCircle2 size={16} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Edit3 size={15} style={{ color: '#0284c7', cursor: 'pointer' }} onClick={() => handleOpenEdit(row)} />
                        <Trash2 size={15} style={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => handleDeleteEntry(row.id)} />
                        <MessageSquare size={15} style={{ color: '#64748b', cursor: 'pointer' }} onClick={() => handleOpenComment(row)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Centered Pagination */}
          <div className="pagination-footer-row">
            <button className="pag-btn">«</button>
            <button className="pag-btn">‹</button>
            <button className="pag-btn active">1</button>
            <button className="pag-btn">›</button>
            <button className="pag-btn">»</button>
          </div>
        </div>

        {/* View Details Modal */}
        {viewOpen && selectedEntry && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h3>Bank Book Voucher Details</h3>
                <button className="close-btn" onClick={() => setViewOpen(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="view-detail-body">
                  <div className="view-detail-row">
                    <strong>Date:</strong> <span>{selectedEntry.date}</span>
                  </div>
                  <div className="view-detail-row">
                    <strong>Bank Account:</strong> <span>{selectedEntry.bankName}</span>
                  </div>
                  <div className="view-detail-row">
                    <strong>Party:</strong> <span>{selectedEntry.party}</span>
                  </div>
                  <div className="view-detail-row">
                    <strong>Voucher / Ref No:</strong> <span>{selectedEntry.voucher}</span>
                  </div>
                  <div className="view-detail-row">
                    <strong>Amount:</strong> <span style={{ fontWeight: 'bold', color: '#10b981' }}>SGD {selectedEntry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="view-detail-row">
                    <strong>Bank Charges:</strong> <span>{selectedEntry.bankCharges ? `SGD ${selectedEntry.bankCharges.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</span>
                  </div>
                  <div className="view-detail-row">
                    <strong>Status:</strong> <span>{selectedEntry.status === 'P' ? 'Posted' : 'Saved'}</span>
                  </div>
                  {selectedEntry.comment && (
                    <div className="view-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                      <strong>Remarks / Comment:</strong>
                      <span style={{ color: '#475569', fontWeight: 'normal', background: '#f8fafc', padding: '8px', borderRadius: '4px', width: '100%', border: '1px solid #e2e8f0', marginTop: '4px', wordBreak: 'break-word' }}>
                        {selectedEntry.comment}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-modal-blue" onClick={() => setViewOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Print Modal */}
        {printOpen && selectedEntry && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px' }}>
              <div className="modal-header">
                <h3>Print Voucher</h3>
                <button className="close-btn" onClick={() => setPrintOpen(false)}>✕</button>
              </div>
              <div className="modal-body" id="print-area">
                <div className="print-voucher-area">
                  <div className="print-header">
                    <div>
                      <h1 className="company-title">TRADEWARE ERP SYSTEMS</h1>
                      <p>10 Ubi Crescent, #05-24 Ubi Techpark, Singapore</p>
                      <p>Email: contact@tradeware.com | Tel: 6543-2109</p>
                    </div>
                    <div className="voucher-title-block">
                      <h2>BANK VOUCHER</h2>
                      <p><strong>VOUCHER ID:</strong> {selectedEntry.voucher}</p>
                      <p><strong>DATE:</strong> {selectedEntry.date}</p>
                    </div>
                  </div>

                  <hr className="print-divider" />

                  <div className="print-metadata-grid">
                    <div>
                      <p><strong>BANK ACCOUNT:</strong> {selectedEntry.bankName}</p>
                      <p><strong>PARTY:</strong> {selectedEntry.party}</p>
                    </div>
                    <div>
                      <p><strong>TRANSACTION TYPE:</strong> Receipt</p>
                      <p><strong>STATUS:</strong> {selectedEntry.status === 'P' ? 'POSTED' : 'SAVED'}</p>
                    </div>
                  </div>

                  <table className="print-items-table">
                    <thead>
                      <tr>
                        <th>Particulars / Description</th>
                        <th className="num-col">Bank Charges</th>
                        <th className="num-col">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Cash receipt ledger allocation from {selectedEntry.party}</td>
                        <td className="num-col">{selectedEntry.bankCharges ? `$${selectedEntry.bankCharges.toFixed(2)}` : '$0.00'}</td>
                        <td className="num-col" style={{ fontWeight: 'bold' }}>${selectedEntry.amount.toFixed(2)}</td>
                      </tr>
                      <tr className="total-row">
                        <td colSpan="2">Net Amount</td>
                        <td className="num-col">${selectedEntry.amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {selectedEntry.comment && (
                    <div className="print-remarks">
                      <p><strong>VOUCHER REMARKS:</strong></p>
                      <p>{selectedEntry.comment}</p>
                    </div>
                  )}

                  <div className="print-signatures">
                    <div className="sig-line">
                      <div className="sig-space"></div>
                      <p>Prepared By</p>
                    </div>
                    <div className="sig-line">
                      <div className="sig-space"></div>
                      <p>Authorized Signature</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-modal-blue" onClick={() => window.print()}>
                  <Printer size={15} style={{ marginRight: '6px' }} /> Print
                </button>
                <button className="btn-modal-red" onClick={() => setPrintOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Comment Modal */}
        {commentOpen && selectedEntry && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Voucher Remarks / Comments</h3>
                <button className="close-btn" onClick={() => setCommentOpen(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Voucher No: {selectedEntry.voucher}</label>
                  <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Enter remarks here..."
                    rows={4}
                    className="row-text-input"
                    style={{ height: 'auto', padding: '8px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-modal-blue" onClick={handleSaveComment}>Save Remarks</button>
                <button className="btn-modal-red" onClick={() => setCommentOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Copyright */}
        <div className="copyright-footer-bar">
          Copyright © 2026 All Rights Reserved. 1.0.0.1
        </div>

        {/* Styled CSS */}
        {styles}
      </div>
    );
  }

  // View 2: Create View (Voucher entry form redesigned as a premium form page)
  return (
    <div className="form-container fade-in" style={{ padding: '0 8px' }}>
      <div className="form-header">
        <div className="header-title">
          <button className="back-btn" type="button" onClick={() => setView('list')} title="Back to List">
            <ArrowLeft size={20} />
          </button>
          <h1>{editId ? 'Edit Bank Book Entry' : 'New Bank Book Entry'}</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-modal-red" onClick={() => setView('list')}>Cancel</button>
          <button type="button" onClick={() => handleSaveEntry(false)} className="btn-modal-blue">
            ✓ Save
          </button>
          <button type="button" onClick={() => handleSaveEntry(true)} className="btn-modal-green">
            💾 Post
          </button>
        </div>
      </div>

      <div className="card form-card">
        {/* Bank Selector Header Row */}
        <div className="form-input-top-bar">
          <div className="filter-item-input">
            <label>Bank Account *</label>
            <select 
              value={createBank}
              onChange={(e) => setCreateBank(e.target.value)}
              className="styled-dropdown"
              style={{ width: '260px' }}
            >
              <option value="">Select Bank...</option>
              <option value="OCBC - Cash in Hand - IDR">OCBC - Cash in Hand - IDR</option>
              <option value="DBS - SGD Account">DBS - SGD Account</option>
              <option value="UOB - USD Account">UOB - USD Account</option>
            </select>
          </div>

          <div className="filter-item-input">
            <label>Currency *</label>
            <select 
              value={createCurrency}
              onChange={(e) => setCreateCurrency(e.target.value)}
              className="styled-dropdown"
              style={{ width: '180px' }}
            >
              <option value="">Currency...</option>
              <option value="IDR">IDR</option>
              <option value="SGD">SGD</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {/* Right Top Totals */}
          <div className="form-totals-summary-card">
            <div className="form-total-value">
              <span>TOTAL RECEIPTS</span>
              <strong className="green-txt">{createTotals.receipts.toFixed(2)}</strong>
            </div>
            <div className="form-total-value">
              <span>TOTAL PAYMENTS</span>
              <strong className="red-txt">{createTotals.payments.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Rows Input Table */}
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table className="screenshot-blue-table-inputs">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Type</th>
                <th style={{ width: '140px' }}>Date</th>
                <th>Party *</th>
                <th>Reference No.</th>
                <th style={{ width: '140px' }}>Amount</th>
                <th style={{ width: '150px' }}>Method</th>
                <th style={{ width: '120px' }}>Charges</th>
                <th>Sales Person</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Del</th>
              </tr>
            </thead>
            <tbody>
              {createRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <select 
                      value={row.type}
                      onChange={(e) => handleCreateRowChange(row.id, 'type', e.target.value)}
                      className="row-select-input"
                    >
                      <option value="Receipt">Receipt</option>
                      <option value="Payment">Payment</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text"
                      value={row.date}
                      onChange={(e) => handleCreateRowChange(row.id, 'date', e.target.value)}
                      className="row-text-input"
                    />
                  </td>
                  <td>
                    <input 
                      type="text"
                      placeholder={row.type === 'Receipt' ? 'Select Customer...' : 'Select Supplier...'}
                      value={row.party}
                      onChange={(e) => handleCreateRowChange(row.id, 'party', e.target.value)}
                      className="row-text-input"
                    />
                  </td>
                  <td>
                    <input 
                      type="text"
                      value={row.refNo}
                      onChange={(e) => handleCreateRowChange(row.id, 'refNo', e.target.value)}
                      className="row-text-input"
                    />
                  </td>
                  <td>
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) => handleCreateRowChange(row.id, 'amount', e.target.value)}
                      className="row-text-input text-right"
                    />
                  </td>
                  <td>
                    <select 
                      value={row.method}
                      onChange={(e) => handleCreateRowChange(row.id, 'method', e.target.value)}
                      className="row-select-input"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="number"
                      placeholder="0"
                      value={row.charges}
                      onChange={(e) => handleCreateRowChange(row.id, 'charges', e.target.value)}
                      className="row-text-input text-right"
                    />
                  </td>
                  <td>
                    <input 
                      type="text"
                      placeholder="Select..."
                      value={row.salesPerson}
                      onChange={(e) => handleCreateRowChange(row.id, 'salesPerson', e.target.value)}
                      className="row-text-input"
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveCreateRow(row.id)}
                      className="row-del-btn"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Plus Button below Table */}
        {!editId && (
          <div style={{ marginTop: '14px' }}>
            <button type="button" onClick={handleAddCreateRow} className="form-plus-row-btn">
              +
            </button>
          </div>
        )}
      </div>

      {/* Footer Copyright */}
      <div className="copyright-footer-bar">
        Copyright © 2026 All Rights Reserved. 1.0.0.1
      </div>

      {/* Styled CSS */}
      {styles}
    </div>
  );
};

// Extracted CSS component styling to keep code clean and reusable
const styles = (
  <style jsx="true">{`
    /* Form header layout */
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--surface);
      padding: 16px 24px;
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-title h1 {
      font-size: 20px;
      font-weight: 700;
      color: var(--secondary);
    }

    .back-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--background);
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: var(--primary);
      color: white;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .form-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 32px;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
    }

    /* Modal dialog styling */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal-content {
      background: #ffffff;
      border-radius: 8px;
      width: 100%;
      margin: 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .modal-header {
      padding: 16px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }
    .modal-header h3 {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
    }
    .close-btn:hover {
      color: #ef4444;
    }
    .modal-body {
      padding: 24px;
      overflow-y: auto;
      max-height: 70vh;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #f8fafc;
    }

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

    .btn-create-green {
      background-color: #72b043;
      color: #ffffff;
      font-weight: 600;
      font-size: 13.5px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      height: 36px;
      cursor: pointer;
      padding: 0;
      overflow: hidden;
      border: 1px solid #5fa330;
    }
    .btn-create-green:hover {
      background-color: #64a038;
    }
    .btn-create-green .icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.15);
      height: 100%;
      padding: 0 10px;
      border-right: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-create-green .text-box {
      padding: 0 14px;
      font-weight: 600;
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

    .btn-clear-red-filter {
      background-color: #ef4444;
      color: #ffffff;
      font-weight: 600;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .status-indicators-legend {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12.5px;
      color: #475569;
    }

    .status-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .badge-legend {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
    }

    .badge-red-s { background-color: #ef4444; }
    .badge-green-p { background-color: #22c55e; }
    .badge-blue-mp { background-color: #0ea5e9; }
    .badge-green-c { background-color: #10b981; }

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

    /* Centered Pagination */
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

    .pag-btn.active {
      background: #eff6ff;
      color: #0067b1;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      width: 32px;
      height: 32px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .copyright-footer-bar {
      text-align: left;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 16px;
      padding: 8px 0;
    }

    /* Form Page styles */
    .form-input-top-bar {
      display: flex;
      gap: 20px;
      align-items: flex-end;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 16px;
    }

    .form-totals-summary-card {
      margin-left: auto;
      display: flex;
      gap: 24px;
      background: #ffffff;
      padding: 10px 20px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }

    .form-total-value {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: right;
    }

    .form-total-value span {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
    }

    .form-total-value strong {
      font-size: 16px;
      font-weight: 800;
    }

    .green-txt { color: #10b981; }
    .red-txt { color: #ef4444; }

    /* Input table inside form card */
    .screenshot-blue-table-inputs {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      border: 1px solid #cbd5e1;
    }

    .screenshot-blue-table-inputs th {
      background-color: #0067b1;
      color: #ffffff;
      font-weight: 700;
      padding: 10px 12px;
      font-size: 12px;
      text-align: left;
      border-right: 1px solid rgba(255,255,255,0.25);
    }

    .screenshot-blue-table-inputs td {
      padding: 8px 6px;
      border-bottom: 1px solid #cbd5e1;
      border-right: 1px solid #cbd5e1;
      vertical-align: middle;
      background: #ffffff;
    }

    .screenshot-blue-table-inputs td:last-child {
      border-right: none;
    }

    .row-text-input {
      width: 100%;
      height: 32px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 13px;
      outline: none;
      background: #ffffff;
      transition: all 0.2s;
    }
    
    .row-text-input:focus {
      border-color: #3b82f6;
    }

    .text-right {
      text-align: right;
    }

    .row-select-input {
      width: 100%;
      height: 32px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px;
      font-size: 13px;
      outline: none;
      background: #ffffff;
    }

    .row-del-btn {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 16px;
      cursor: pointer;
    }

    .form-plus-row-btn {
      width: 32px;
      height: 32px;
      background-color: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 4px;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .btn-modal-blue, .btn-modal-green, .btn-modal-red {
      color: #ffffff;
      font-weight: 600;
      font-size: 13px;
      padding: 8px 24px;
      border: none;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      gap: 6px;
    }

    .btn-modal-blue { background-color: #0284c7; }
    .btn-modal-blue:hover { background-color: #0369a1; }
    .btn-modal-green { background-color: #22c55e; }
    .btn-modal-green:hover { background-color: #16a34a; }
    .btn-modal-red { background-color: #ef4444; }
    .btn-modal-red:hover { background-color: #dc2626; }

    /* View detail styling */
    .view-detail-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .view-detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #cbd5e1;
      font-size: 13.5px;
    }

    .view-detail-row:last-of-type {
      border-bottom: none;
    }

    .view-detail-row strong {
      color: #64748b;
      font-weight: 500;
    }

    .view-detail-row span {
      font-weight: 600;
      color: #1e293b;
    }

    /* Print styling */
    .print-voucher-area {
      padding: 20px;
      background-color: #ffffff;
      color: #000000;
      font-family: inherit;
    }

    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .voucher-title-block {
      text-align: right;
    }

    .voucher-title-block h2 {
      font-size: 18px;
      font-weight: 700;
      color: #0067b1;
      margin-bottom: 4px;
    }

    .print-divider {
      border: none;
      border-top: 2px solid #000000;
      margin: 12px 0;
    }

    .print-metadata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
      font-size: 13px;
    }

    .print-items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
    }

    .print-items-table th {
      border-bottom: 2px solid #000000;
      font-weight: 700;
      padding: 8px;
      text-align: left;
    }

    .print-items-table td {
      border-bottom: 1px solid #cbd5e1;
      padding: 8px;
    }

    .print-items-table .num-col {
      text-align: right;
    }

    .print-items-table .total-row td {
      border-top: 2px solid #000000;
      border-bottom: 2px solid #000000;
      font-weight: 700;
    }

    .print-remarks {
      margin-top: 16px;
      border: 1px solid #cbd5e1;
      padding: 10px;
      border-radius: 4px;
      background-color: #f8fafc;
      font-size: 12.5px;
    }

    .print-signatures {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      gap: 40px;
      font-size: 12.5px;
    }

    .sig-line {
      flex: 1;
      text-align: center;
    }

    .sig-space {
      height: 36px;
      border-bottom: 1px solid #000000;
      margin-bottom: 6px;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #print-area, #print-area * {
        visibility: visible;
      }
      #print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  `}</style>
);

export default BankBookEntries;

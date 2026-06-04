import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Search, RotateCcw, Plus, Edit, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Filter, X
} from 'lucide-react';
import { toggleSupplierStatus, addSupplier, updateSupplier, deleteSupplier } from '../../store/suppliersSlice';
import SupplierForm from '../../components/SupplierForm';

const Suppliers = () => {
  const suppliers = useSelector(state => state.suppliers.suppliers);
  const dispatch = useDispatch();

  // Search filter state
  const [searchName, setSearchName] = useState('');
  const [keyword, setKeyword] = useState('');

  // Applied filter state
  const [appliedSearchName, setAppliedSearchName] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  // View state
  const [view, setView] = useState('list');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setView('form');
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setView('form');
  };

  const handleSaveSupplier = (formData) => {
    if (selectedSupplier) {
      dispatch(updateSupplier(formData));
    } else {
      dispatch(addSupplier(formData));
    }
    setView('list');
  };

  const handleDelete = (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      dispatch(deleteSupplier(supplierId));
    }
  };

  const handleSearch = () => {
    setAppliedSearchName(searchName);
    setAppliedKeyword(keyword);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchName('');
    setKeyword('');
    setAppliedSearchName('');
    setAppliedKeyword('');
    setCurrentPage(1);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesName = appliedSearchName 
      ? s.name.toLowerCase().includes(appliedSearchName.toLowerCase())
      : true;

    const matchesKeyword = appliedKeyword 
      ? (
          s.name.toLowerCase().includes(appliedKeyword.toLowerCase()) ||
          s.id.toLowerCase().includes(appliedKeyword.toLowerCase()) ||
          (s.email && s.email.toLowerCase().includes(appliedKeyword.toLowerCase())) ||
          (s.phone && s.phone.includes(appliedKeyword)) ||
          s.type.toLowerCase().includes(appliedKeyword.toLowerCase()) ||
          s.currency.toLowerCase().includes(appliedKeyword.toLowerCase())
        )
      : true;

    return matchesName && matchesKeyword;
  });

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (view === 'form') {
    return (
      <SupplierForm 
        supplier={selectedSupplier}
        onCancel={() => setView('list')}
        onSave={handleSaveSupplier}
      />
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>SUPPLIERS / VENDORS</h1>
      </div>

      {/* Legacy Filter Section */}
      <div className="card filter-card">
        <div className="filter-row">
          <div className="filter-group">
            <label>Supplier Name</label>
            <input 
              type="text" 
              placeholder="e.g. GLOBAL STEEL" 
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button className="btn btn-primary" onClick={handleSearch}>
              <Search size={16} /> Search
            </button>
            <button className="btn btn-danger" onClick={handleClear}>
              <RotateCcw size={16} /> Cancel
            </button>
            <button className="btn btn-success" onClick={handleAddNew}>
              <Plus size={16} /> New</button>
          </div>
        </div>
      </div>

      {/* Sub-action bar */}
      <div className="sub-actions-bar">
        <button className="btn btn-danger btn-clear-filter" onClick={handleClear}>
          <X size={16} /> Clear
        </button>
        <div className="keyword-search-wrapper">
          <input 
            type="text" 
            placeholder="Keyword Search" 
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setAppliedKeyword(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="card table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th><span className="th-content">Code <Filter size={12} /></span></th>
                <th><span className="th-content">Name <Filter size={12} /></span></th>
                <th><span className="th-content">Type <Filter size={12} /></span></th>
                <th><span className="th-content">Currency <Filter size={12} /></span></th>
                <th><span className="th-content">Lead Time (Days) <Filter size={12} /></span></th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSuppliers.length > 0 ? (
                paginatedSuppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td className="code-cell ">{supplier.id}</td>
                    <td className="bold-cell ">{supplier.name}</td>
                    <td><span className="badge badge-gray">{supplier.type}</span></td>
                    <td className="bold-cell text-primary ">{supplier.currency}</td>
                    <td className="lead-time-cell">{supplier.leadTime} Days</td>
                    <td>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={supplier.active} 
                          onChange={() => dispatch(toggleSupplierStatus(supplier.id))}
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn" onClick={() => handleEdit(supplier)} title="Edit"><Edit size={19} /></button>
                        <button className="delete-btn" onClick={() => handleDelete(supplier.id)} title="Delete"><Trash2 size={19} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-row-cell">
                    No suppliers found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredSuppliers.length > pageSize && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredSuppliers.length)} of {filteredSuppliers.length} entries
            </div>
            <div className="pagination-controls">
              <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft size={16} />
              </button>
              <button className="page-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page} 
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button className="page-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                <ChevronRight size={16} />
              </button>
              <button className="page-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .page-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--secondary);
          margin-bottom: 8px;
        }

        .card {
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .filter-card {
          padding: 20px 24px;
        }

        .filter-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          max-width: 400px;
        }

        .filter-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .filter-group input {
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          outline: none;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s;
        }

        .filter-group input:focus {
          border-color: var(--primary);
        }

        .filter-buttons {
          display: flex;
          gap: 12px;
        }

        .sub-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-clear-filter {
          background: var(--danger);
          padding: 8px 16px;
        }

        .keyword-search-wrapper {
          width: 260px;
        }

        .keyword-search-wrapper input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          outline: none;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s;
        }

        .keyword-search-wrapper input:focus {
          border-color: var(--primary);
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
          color: white;
        }

        .btn-primary { background: var(--primary); }
        .btn-danger { background: var(--danger); }
        .btn-success { background: var(--accent); }

        .btn:hover { opacity: 0.9; transform: translateY(-1px); }

        .table-card {
          padding: 0;
        }

        table thead {
          background: #f1f5f9;
        }

        table th {
          text-align: left;
          padding: 16px 24px;
          font-size: 13px;
          font-weight: 700;
          color: var(--secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border);
        }

        .th-content {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        table td {
          padding: 16px 24px;
          font-size: 14px;
          border-bottom: 1px solid var(--border);
          color: var(--text-main);
        }

        .code-cell {
          font-family: monospace;
          color: var(--primary);
          font-weight: 600;
        }

        .bold-cell {
          font-weight: 600;
          color: var(--secondary);
        }

        .text-primary {
          color: var(--primary) !important;
        }

        .lead-time-cell {
          font-family: monospace;
          font-weight: 600;
          color: var(--text-main);
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }

        .badge-gray {
          background: #f1f5f9;
          color: #475569;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .edit-btn {
          color: var(--primary);
          padding: 6px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .edit-btn:hover {
          background: #eff6ff;
        }

        .delete-btn {
          color: var(--danger);
          padding: 6px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .delete-btn:hover {
          background: #fef2f2;
        }

        .empty-row-cell {
          text-align: center;
          padding: 32px;
          color: var(--text-muted);
          font-size: 15px;
          font-style: italic;
        }

        /* Switch Styling */
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }

        .switch input { opacity: 0; width: 0; height: 0; }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1;
          transition: .4s;
          border-radius: 20px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 14px; width: 14px;
          left: 3px; bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider { background-color: var(--accent); }
        input:checked + .slider:before { transform: translateX(20px); }

        .pagination {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border);
        }

        .pagination-info {
          font-size: 13px;
          color: var(--text-muted);
        }

        .pagination-controls {
          display: flex;
          gap: 6px;
        }

        .page-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 13px;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .page-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .page-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
};

export default Suppliers;

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Search, RotateCcw, Plus, Edit, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Filter, X
} from 'lucide-react';
import { toggleItemStatus, addItem, updateItem, deleteItem } from '../../store/itemsSlice';
import ItemForm from '../../components/ItemForm';

const Items = () => {
  const items = useSelector(state => state.items.items);
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Select Filter Type');
  
  // Applied filter state
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedFilterType, setAppliedFilterType] = useState('Select Filter Type');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // View State: 'list' or 'form'
  const [view, setView] = useState('list');
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setAppliedFilterType(filterType);
    setCurrentPage(1); // Reset to page 1 on filter
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilterType('Select Filter Type');
    setAppliedSearchTerm('');
    setAppliedFilterType('Select Filter Type');
    setCurrentPage(1);
  };

  const filteredItems = items.filter(item => {
    if (!appliedSearchTerm) return true;
    const term = appliedSearchTerm.toLowerCase();
    
    if (appliedFilterType === 'Item Code') {
      return item.id.toLowerCase().includes(term);
    } else if (appliedFilterType === 'Item Name') {
      return item.name.toLowerCase().includes(term);
    } else if (appliedFilterType === 'Item Group') {
      return item.group.toLowerCase().includes(term);
    } else if (appliedFilterType === 'Item Category') {
      return item.category.toLowerCase().includes(term);
    } else {
      return (
        item.name.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term) ||
        item.group.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }
  });

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddNew = () => {
    setSelectedItem(null);
    setView('form');
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setView('form');
  };

  const handleSaveItem = (formData) => {
    if (selectedItem) {
      dispatch(updateItem(formData));
    } else {
      dispatch(addItem(formData));
    }
    setView('list');
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      dispatch(deleteItem(itemId));
    }
  };

  if (view === 'form') {
    return (
      <ItemForm 
        item={selectedItem} 
        onCancel={() => setView('list')} 
        onSave={handleSaveItem} 
      />
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>ITEMS</h1>
      </div>

      {/* Filter Section */}
      <div className="card filter-card">
        <div className="filter-grid">
          <div className="filter-field">
            <label>Search By</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option>Select Filter Type</option>
              <option>Item Code</option>
              <option>Item Name</option>
              <option>Item Group</option>
              <option>Item Category</option>
            </select>
          </div>
          <div className="filter-field search-field">
            <label>&nbsp;</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                placeholder="Keyword Search" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn" 
                  onClick={() => setSearchTerm('')}
                  title="Clear Search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn btn-primary" onClick={handleSearch}><Search size={16} /> Search</button>
            <button className="btn btn-danger" onClick={handleClear}><RotateCcw size={16} /> Clear</button>
            <button className="btn btn-success" onClick={handleAddNew}><Plus size={16} /> New</button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th><span className="th-content">Item Code <Filter size={12} /></span></th>
                <th><span className="th-content">Item Group <Filter size={12} /></span></th>
                <th><span className="th-content">Item Category <Filter size={12} /></span></th>
                <th><span className="th-content">Item Name <Filter size={12} /></span></th>
                <th><span className="th-content">Brand <Filter size={12} /></span></th>
                <th><span className="th-content">UOM <Filter size={12} /></span></th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(item => (
                  <tr key={item.id}>
                    <td className="code-cell ">{item.id}</td>
                    <td><span className="badge badge-gray">{item.group}</span></td>
                    <td >{item.category}</td>
                    <td >{item.name}</td>
                    <td>{item.brand || '-'}</td>
                    <td>{item.uom || 'PCS'}</td>
                    <td>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={item.active} 
                          onChange={() => dispatch(toggleItemStatus(item.id))}
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn" onClick={() => handleEdit(item)} title="Edit"><Edit size={19} /></button>
                        <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Delete"><Trash2 size={19} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-row-cell">
                    No items found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredItems.length > pageSize && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} entries
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
          padding: 24px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: 1fr 2fr auto;
          gap: 20px;
          align-items: flex-end;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-field label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .filter-field select, .filter-field input {
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          outline: none;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s;
        }

        .filter-field select:focus, .filter-field input:focus {
          border-color: var(--primary);
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .clear-search-btn {
          position: absolute;
          right: 10px;
          color: var(--text-muted);
          background: #f1f5f9;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .clear-search-btn:hover {
          background: var(--danger);
          color: white;
        }

        .filter-actions {
          display: flex;
          gap: 12px;
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

export default Items;

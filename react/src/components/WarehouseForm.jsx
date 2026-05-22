import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Save, ArrowLeft, Plus, Trash2, Box, Package, ShieldCheck, MapPin } from 'lucide-react';

const WarehouseForm = ({ warehouse, onSave, onCancel }) => {
  // Fetch master items from items store for stock selection
  const masterItems = useSelector(state => state.items.items);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    address: '',
    manager: '',
    phone: '',
    active: true,
    racks: [],
    stockTracking: []
  });

  // State for sub-forms
  const [newRack, setNewRack] = useState('');
  
  const [stockItemCode, setStockItemCode] = useState('');
  const [stockRackBin, setStockRackBin] = useState('');
  const [stockQty, setStockQty] = useState('0');

  useEffect(() => {
    if (warehouse) {
      setFormData(warehouse);
    }
  }, [warehouse]);

  // Set default stock item code if available
  useEffect(() => {
    if (masterItems.length > 0 && !stockItemCode) {
      setStockItemCode(masterItems[0].id);
    }
  }, [masterItems, stockItemCode]);

  // Set default rack option if available
  useEffect(() => {
    if (formData.racks.length > 0 && !stockRackBin) {
      setStockRackBin(formData.racks[0]);
    }
  }, [formData.racks, stockRackBin]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddRack = () => {
    if (!newRack.trim()) return;
    if (formData.racks.includes(newRack.trim())) {
      alert('This rack/bin location already exists!');
      return;
    }
    setFormData(prev => ({
      ...prev,
      racks: [...prev.racks, newRack.trim()]
    }));
    // Auto select this newly added rack for the stock line
    setStockRackBin(newRack.trim());
    setNewRack('');
  };

  const handleRemoveRack = (rackToRemove) => {
    setFormData(prev => ({
      ...prev,
      racks: prev.racks.filter(r => r !== rackToRemove),
      // Also filter out any stock lines associated with this deleted rack
      stockTracking: prev.stockTracking.filter(s => s.rackBin !== rackToRemove)
    }));
  };

  const handleAddStock = () => {
    if (!stockItemCode || !stockRackBin || !stockQty) {
      alert('Please fill in all stock line details!');
      return;
    }

    const selectedItem = masterItems.find(item => item.id === stockItemCode);
    if (!selectedItem) return;

    // Check if item already exists on this rack in this warehouse
    const exists = formData.stockTracking.some(
      s => s.itemCode === stockItemCode && s.rackBin === stockRackBin
    );
    if (exists) {
      alert('This item is already listed on the selected Rack/Bin location! Please remove the existing line first if you wish to update.');
      return;
    }

    const newLine = {
      itemCode: stockItemCode,
      itemName: selectedItem.name,
      rackBin: stockRackBin,
      qty: parseInt(stockQty, 10) || 0
    };

    setFormData(prev => ({
      ...prev,
      stockTracking: [...prev.stockTracking, newLine]
    }));

    setStockQty('0');
  };

  const handleRemoveStock = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      stockTracking: prev.stockTracking.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.name.trim() || !formData.address.trim()) {
      alert('Warehouse Code, Name, and Address are required!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="form-container fade-in">
      <div className="form-header">
        <div className="header-title">
          <button className="back-btn" type="button" onClick={onCancel} title="Back to List">
            <ArrowLeft size={20} />
          </button>
          <h1>{warehouse ? 'Edit Warehouse Location' : 'New Warehouse Master'}</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" form="warehouse-form" className="btn btn-primary">
            <Save size={18} />
            {warehouse ? 'Update Warehouse' : 'Save Warehouse'}
          </button>
        </div>
      </div>

      <div className="card form-card">
        <form id="warehouse-form" onSubmit={handleSubmit}>
          
          {/* Section 1: Basic Warehouse Info */}
          <div className="form-section">
            <h3 className="section-title">Warehouse Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Warehouse Code *</label>
                <input 
                  type="text" name="id" value={formData.id} 
                  onChange={handleChange} required disabled={!!warehouse}
                  placeholder="e.g. WH001"
                />
              </div>
              <div className="form-group">
                <label>Warehouse Name *</label>
                <input 
                  type="text" name="name" value={formData.name} 
                  onChange={handleChange} required 
                  placeholder="e.g. SINGAPORE CENTRAL WAREHOUSE"
                />
              </div>
              <div className="form-group">
                <label>Manager Name</label>
                <input 
                  type="text" name="manager" value={formData.manager} 
                  onChange={handleChange} 
                  placeholder="e.g. Alex Tan"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" name="phone" value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="e.g. +65 9123 4567"
                />
              </div>
            </div>

            <div className="form-grid mt-4">
              <div className="form-group span-3">
                <label>Warehouse Address *</label>
                <div className="input-with-icon-left">
                  <MapPin size={16} className="inp-icon" />
                  <input 
                    type="text" name="address" value={formData.address} 
                    onChange={handleChange} required
                    placeholder="Enter warehouse physical location / address"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="toggle-label-main">Active Status</label>
                <label className="switch mt-2">
                  <input 
                    type="checkbox" name="active" checked={formData.active} 
                    onChange={handleChange}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Rack / Bin Locations */}
          <div className="form-section">
            <h3 className="section-title">Rack / Bin Locations</h3>
            <div className="sub-form-panel">
              <div className="sub-form-row">
                <div className="form-group flex-2">
                  <label>New Rack / Bin Code</label>
                  <input 
                    type="text" value={newRack} 
                    onChange={(e) => setNewRack(e.target.value)}
                    placeholder="e.g. Rack A-01, Bin 104"
                  />
                </div>
                <button type="button" className="btn btn-success sub-btn" onClick={handleAddRack}>
                  <Plus size={16} /> Add Location
                </button>
              </div>

              {formData.racks.length > 0 ? (
                <div className="tags-container">
                  {formData.racks.map(rack => (
                    <span key={rack} className="rack-tag">
                      <Box size={14} />
                      {rack}
                      <button type="button" className="remove-tag-btn" onClick={() => handleRemoveRack(rack)}>&times;</button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="empty-sub-info">No rack or bin locations added yet. Add some above.</div>
              )}
            </div>
          </div>

          {/* Section 3: Site-wise stock tracking */}
          <div className="form-section last">
            <h3 className="section-title">Site-Wise Stock Tracking</h3>
            <div className="sub-form-panel">
              <div className="sub-form-row">
                <div className="form-group flex-2">
                  <label>Select Item</label>
                  <select value={stockItemCode} onChange={(e) => setStockItemCode(e.target.value)}>
                    {masterItems.map(item => (
                      <option key={item.id} value={item.id}>
                        [{item.id}] {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Rack/Bin Location</label>
                  <select value={stockRackBin} onChange={(e) => setStockRackBin(e.target.value)}>
                    {formData.racks.length > 0 ? (
                      formData.racks.map(rack => (
                        <option key={rack} value={rack}>{rack}</option>
                      ))
                    ) : (
                      <option value="">-- No Racks Added --</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock Qty</label>
                  <input 
                    type="number" value={stockQty} 
                    onChange={(e) => setStockQty(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary sub-btn" 
                  onClick={handleAddStock}
                  disabled={formData.racks.length === 0}
                >
                  <Plus size={16} /> Link Stock
                </button>
              </div>

              {formData.stockTracking.length > 0 ? (
                <div className="sub-table-wrapper mt-4">
                  <table className="sub-table">
                    <thead>
                      <tr>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Rack / Bin Location</th>
                        <th>Stock Quantity</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.stockTracking.map((stock, index) => (
                        <tr key={`${stock.itemCode}-${stock.rackBin}`}>
                          <td className="monospace-cell text-primary">{stock.itemCode}</td>
                          <td className="bold-cell">{stock.itemName}</td>
                          <td><span className="badge badge-gray">{stock.rackBin}</span></td>
                          <td className="monospace-cell bold-cell">{stock.qty} Units</td>
                          <td className="text-right">
                            <button 
                              type="button" 
                              className="btn-danger-icon" 
                              onClick={() => handleRemoveStock(index)}
                              title="Delete Link"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-sub-info">No stock linked to this site yet. Select an item and a rack above to link stock.</div>
              )}
            </div>
          </div>

        </form>
      </div>

      <style jsx="true">{`
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
          padding: 32px;
        }

        .form-section {
          margin-bottom: 32px;
          padding-bottom: 32px;
          border-bottom: 1px solid var(--border);
        }

        .form-section.last {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .span-3 {
          grid-column: span 3;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .toggle-label-main {
          margin-bottom: 2px;
        }

        .form-group input, .form-group select {
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          outline: none;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s;
        }

        .form-group input:focus, .form-group select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.05);
        }

        .form-group input:disabled, .form-group select:disabled {
          background: #f1f5f9;
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }

        .input-with-icon-left {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon-left input {
          width: 100%;
          padding-left: 36px !important;
        }

        .inp-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .sub-form-panel {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 24px;
        }

        .sub-form-row {
          display: flex;
          align-items: flex-end;
          gap: 16px;
        }

        .flex-2 {
          flex: 2;
        }

        .sub-btn {
          height: 42px;
          white-space: nowrap;
        }

        /* Tags for Racks */
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .rack-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
          box-shadow: var(--shadow-sm);
        }

        .remove-tag-btn {
          background: none;
          border: none;
          color: var(--danger);
          font-size: 16px;
          cursor: pointer;
          font-weight: bold;
          padding: 0 4px;
          display: flex;
          align-items: center;
        }

        .remove-tag-btn:hover {
          opacity: 0.8;
        }

        .empty-sub-info {
          font-size: 13px;
          color: var(--text-muted);
          text-align: center;
          padding: 16px 0;
          font-style: italic;
        }

        /* Sub Table Styling */
        .sub-table-wrapper {
          border: 1px solid var(--border);
          border-radius: 6px;
          background: white;
          overflow: hidden;
        }

        .sub-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sub-table th {
          text-align: left;
          background: #f1f5f9;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 700;
          color: var(--secondary);
          border-bottom: 1px solid var(--border);
        }

        .sub-table td {
          padding: 12px 16px;
          font-size: 13px;
          border-bottom: 1px solid var(--border);
          color: var(--text-main);
        }

        .monospace-cell {
          font-family: monospace;
        }

        .text-primary {
          color: var(--primary);
        }

        .bold-cell {
          font-weight: 600;
        }

        .text-right {
          text-align: right;
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

        .btn-danger-icon {
          color: var(--danger);
          padding: 6px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .btn-danger-icon:hover {
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
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        .btn-success { background: var(--accent); }

        .btn:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>
    </div>
  );
};

export default WarehouseForm;

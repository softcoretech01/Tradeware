import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Package, MapPin, BarChart3, ClipboardList, AlertTriangle } from 'lucide-react';

const InventoryForm = ({ inventory, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    itemCode: '',
    itemName: '',
    warehouse: 'Main Warehouse',
    batchNo: '',
    totalStock: 0,
    reservedStock: 0,
    availableStock: 0,
    damagedStock: 0,
    uom: 'PCS',
    minStock: 0,
    reorderLevel: 0,
    lastInwardDate: '',
    lastOutwardDate: '',
    lastInwardType: 'Purchase Receipt',
    costPrice: 0,
    status: 'In Stock',
    active: true,
    // Inward details
    inwardType: 'Purchase Receipt',
    inwardRefNo: '',
    inwardQty: 0,
    inwardDate: new Date().toISOString().split('T')[0],
    inwardRemarks: '',
    // Outward details
    outwardType: '',
    outwardRefNo: '',
    outwardQty: 0,
    outwardDate: '',
    outwardRemarks: '',
    // Tracking
    expiryDate: '',
    lotNo: '',
    serialNo: '',
    supplierName: '',
    poReference: '',
  });

  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (inventory) {
      setFormData(prev => ({ ...prev, ...inventory }));
    }
  }, [inventory]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Auto-calculate available stock
  useEffect(() => {
    const available = formData.totalStock - formData.reservedStock - formData.damagedStock;
    let status = 'In Stock';
    if (formData.totalStock <= 0) status = 'Out of Stock';
    else if (available <= 0 && formData.reservedStock > 0) status = 'Reserved';
    else if (available <= formData.minStock) status = 'Low Stock';

    setFormData(prev => ({
      ...prev,
      availableStock: Math.max(0, available),
      status,
    }));
  }, [formData.totalStock, formData.reservedStock, formData.damagedStock, formData.minStock]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <Package size={16} /> },
    { id: 'stock', label: 'Stock Details', icon: <BarChart3 size={16} /> },
    { id: 'inward', label: 'Stock Inward', icon: <ClipboardList size={16} /> },
    { id: 'outward', label: 'Stock Outward', icon: <ClipboardList size={16} /> },
    { id: 'tracking', label: 'Tracking & Batch', icon: <MapPin size={16} /> },
  ];

  return (
    <div className="form-container fade-in">
      <div className="form-header">
        <div className="header-title">
          <button className="back-btn" onClick={onCancel} title="Back to List">
            <ArrowLeft size={20} />
          </button>
          <div className="header-info">
            <h1>{inventory ? 'Edit Inventory' : 'New Inventory Entry'}</h1>
            <span className="header-subtitle">
              {inventory ? `Editing ${inventory.id} — ${inventory.itemName}` : 'Create a new inventory record'}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" form="inventory-form" className="btn btn-primary-form">
            <Save size={18} />
            {inventory ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card form-card">
        <form id="inventory-form" onSubmit={handleSubmit}>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="tab-content fade-in">
              <div className="form-section">
                <h3 className="section-title">Item Identification</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Inventory ID *</label>
                    <input
                      type="text" name="id" value={formData.id}
                      onChange={handleChange} required disabled={!!inventory}
                      placeholder="e.g. INV-0001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Item Code *</label>
                    <input
                      type="text" name="itemCode" value={formData.itemCode}
                      onChange={handleChange} required
                      placeholder="e.g. ITM05316"
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>Item Name *</label>
                    <input
                      type="text" name="itemName" value={formData.itemName}
                      onChange={handleChange} required
                      placeholder="Enter item name"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Location & Unit</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Warehouse *</label>
                    <select name="warehouse" value={formData.warehouse} onChange={handleChange}>
                      <option value="Main Warehouse">Main Warehouse</option>
                      <option value="Secondary Warehouse">Secondary Warehouse</option>
                      <option value="Cold Storage">Cold Storage</option>
                      <option value="Transit Warehouse">Transit Warehouse</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>UOM</label>
                    <select name="uom" value={formData.uom} onChange={handleChange}>
                      <option value="PCS">PCS</option>
                      <option value="SET">SET</option>
                      <option value="KGS">KGS</option>
                      <option value="MTR">MTR</option>
                      <option value="LTR">LTR</option>
                      <option value="BOX">BOX</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cost Price (₹)</label>
                    <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} step="0.01" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Supplier</label>
                    <input type="text" name="supplierName" value={formData.supplierName} onChange={handleChange} placeholder="Supplier name" />
                  </div>
                </div>
              </div>

              <div className="form-section last">
                <h3 className="section-title">Settings</h3>
                <div className="form-toggles">
                  <label className="toggle-item">
                    <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
                    <div className="toggle-content">
                      <span className="toggle-label">Active Status</span>
                      <span className="toggle-desc">Enable/Disable this inventory record</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Stock Details Tab */}
          {activeTab === 'stock' && (
            <div className="tab-content fade-in">
              <div className="stock-summary-cards">
                <div className="stock-card total">
                  <div className="stock-card-icon"><Package size={22} /></div>
                  <div className="stock-card-info">
                    <span className="stock-card-value">{formData.totalStock}</span>
                    <span className="stock-card-label">Total Stock</span>
                  </div>
                </div>
                <div className="stock-card available">
                  <div className="stock-card-icon"><BarChart3 size={22} /></div>
                  <div className="stock-card-info">
                    <span className="stock-card-value">{formData.availableStock}</span>
                    <span className="stock-card-label">Available</span>
                  </div>
                </div>
                <div className="stock-card reserved">
                  <div className="stock-card-icon"><ClipboardList size={22} /></div>
                  <div className="stock-card-info">
                    <span className="stock-card-value">{formData.reservedStock}</span>
                    <span className="stock-card-label">Reserved</span>
                  </div>
                </div>
                <div className="stock-card damaged">
                  <div className="stock-card-icon"><AlertTriangle size={22} /></div>
                  <div className="stock-card-info">
                    <span className="stock-card-value">{formData.damagedStock}</span>
                    <span className="stock-card-label">Damaged</span>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Stock Quantities</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Total Stock *</label>
                    <input type="number" name="totalStock" value={formData.totalStock} onChange={handleChange} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Reserved Stock</label>
                    <input type="number" name="reservedStock" value={formData.reservedStock} onChange={handleChange} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Available Stock</label>
                    <input type="number" name="availableStock" value={formData.availableStock} disabled className="computed-field" />
                  </div>
                  <div className="form-group">
                    <label>Damaged Stock</label>
                    <input type="number" name="damagedStock" value={formData.damagedStock} onChange={handleChange} min="0" />
                  </div>
                </div>
              </div>

              <div className="form-section last">
                <h3 className="section-title">Reorder Settings</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Minimum Stock Level</label>
                    <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Reorder Level</label>
                    <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <input type="text" name="status" value={formData.status} disabled className="computed-field" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stock Inward Tab */}
          {activeTab === 'inward' && (
            <div className="tab-content fade-in">
              <div className="form-section">
                <h3 className="section-title">
                  <span className="title-badge inward-badge">INWARD</span>
                  Stock Inward Details
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Inward Type *</label>
                    <select name="inwardType" value={formData.inwardType || formData.lastInwardType} onChange={handleChange}>
                      <option value="Purchase Receipt">Purchase Receipt</option>
                      <option value="Import Receipt">Import Receipt</option>
                      <option value="Stock Transfer">Stock Transfer</option>
                      <option value="Opening Stock">Opening Stock</option>
                      <option value="Sales Return">Sales Return</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reference No.</label>
                    <input type="text" name="inwardRefNo" value={formData.inwardRefNo} onChange={handleChange} placeholder="e.g. PR-2025-001" />
                  </div>
                  <div className="form-group">
                    <label>Inward Quantity</label>
                    <input type="number" name="inwardQty" value={formData.inwardQty} onChange={handleChange} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Inward Date</label>
                    <input type="date" name="inwardDate" value={formData.inwardDate || formData.lastInwardDate} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-section last">
                <h3 className="section-title">Remarks</h3>
                <div className="form-group full-width">
                  <label>Inward Remarks</label>
                  <textarea
                    name="inwardRemarks"
                    value={formData.inwardRemarks}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Add any notes or remarks about this inward transaction..."
                  />
                </div>
              </div>

              <div className="info-panel">
                <h4>Supported Inward Types</h4>
                <div className="info-tags">
                  <span className="info-tag">Purchase Receipt</span>
                  <span className="info-tag">Import Receipt</span>
                  <span className="info-tag">Stock Transfer</span>
                  <span className="info-tag">Opening Stock</span>
                  <span className="info-tag">Sales Return</span>
                </div>
              </div>
            </div>
          )}

          {/* Stock Outward Tab */}
          {activeTab === 'outward' && (
            <div className="tab-content fade-in">
              <div className="form-section">
                <h3 className="section-title">
                  <span className="title-badge outward-badge">OUTWARD</span>
                  Stock Outward Details
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Outward Type *</label>
                    <select name="outwardType" value={formData.outwardType} onChange={handleChange}>
                      <option value="">Select Outward Type</option>
                      <option value="Sales Delivery">Sales Delivery</option>
                      <option value="Project Supply">Project Supply</option>
                      <option value="Sample Issue">Sample Issue</option>
                      <option value="Stock Transfer">Stock Transfer</option>
                      <option value="Damage Issue">Damage Issue</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reference No.</label>
                    <input type="text" name="outwardRefNo" value={formData.outwardRefNo} onChange={handleChange} placeholder="e.g. SD-2025-001" />
                  </div>
                  <div className="form-group">
                    <label>Outward Quantity</label>
                    <input type="number" name="outwardQty" value={formData.outwardQty} onChange={handleChange} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Outward Date</label>
                    <input type="date" name="outwardDate" value={formData.outwardDate || formData.lastOutwardDate} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-section last">
                <h3 className="section-title">Remarks</h3>
                <div className="form-group full-width">
                  <label>Outward Remarks</label>
                  <textarea
                    name="outwardRemarks"
                    value={formData.outwardRemarks}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Add any notes or remarks about this outward transaction..."
                  />
                </div>
              </div>

              <div className="info-panel">
                <h4>Supported Outward Types</h4>
                <div className="info-tags">
                  <span className="info-tag outward">Sales Delivery</span>
                  <span className="info-tag outward">Project Supply</span>
                  <span className="info-tag outward">Sample Issue</span>
                  <span className="info-tag outward">Stock Transfer</span>
                  <span className="info-tag outward">Damage Issue</span>
                </div>
              </div>
            </div>
          )}

          {/* Tracking & Batch Tab */}
          {activeTab === 'tracking' && (
            <div className="tab-content fade-in">
              <div className="form-section">
                <h3 className="section-title">Batch & Lot Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Batch No.</label>
                    <input type="text" name="batchNo" value={formData.batchNo} onChange={handleChange} placeholder="e.g. B2024-001" />
                  </div>
                  <div className="form-group">
                    <label>Lot No.</label>
                    <input type="text" name="lotNo" value={formData.lotNo} onChange={handleChange} placeholder="e.g. LOT-2024-001" />
                  </div>
                  <div className="form-group">
                    <label>Serial No.</label>
                    <input type="text" name="serialNo" value={formData.serialNo} onChange={handleChange} placeholder="e.g. SN-0001" />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-section last">
                <h3 className="section-title">Purchase Reference</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>PO Reference</label>
                    <input type="text" name="poReference" value={formData.poReference} onChange={handleChange} placeholder="e.g. PO-2024-0150" />
                  </div>
                  <div className="form-group">
                    <label>Last Inward Type</label>
                    <input type="text" name="lastInwardType" value={formData.lastInwardType} disabled className="computed-field" />
                  </div>
                  <div className="form-group">
                    <label>Last Inward Date</label>
                    <input type="date" name="lastInwardDate" value={formData.lastInwardDate} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Last Outward Date</label>
                    <input type="date" name="lastOutwardDate" value={formData.lastOutwardDate} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>
          )}
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

        .header-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .header-title h1 {
          font-size: 20px;
          font-weight: 700;
          color: var(--secondary);
        }

        .header-subtitle {
          font-size: 13px;
          color: var(--text-muted);
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

        /* Tab Navigation */
        .tab-navigation {
          display: flex;
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          padding: 4px;
          gap: 4px;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab-btn:hover {
          background: var(--background);
          color: var(--text-main);
        }

        .tab-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 2px 8px rgba(30, 64, 175, 0.3);
        }

        .tab-content {
          animation: fadeIn 0.25s ease-out;
        }

        /* Form Card */
        .form-card {
          padding: 32px;
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
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
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-badge {
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .inward-badge {
          background: #dcfce7;
          color: #166534;
        }

        .outward-badge {
          background: #fee2e2;
          color: #991b1b;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .span-2 {
          grid-column: span 2;
        }

        .full-width {
          width: 100%;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .form-group input, .form-group select, .form-group textarea {
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          outline: none;
          font-size: 14px;
          font-family: inherit;
          background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.05);
        }

        .form-group input:disabled, .form-group select:disabled {
          background: #f8fafc;
          color: var(--text-muted);
        }

        .computed-field {
          background: #f0fdf4 !important;
          border-color: #bbf7d0 !important;
          color: #166534 !important;
          font-weight: 600 !important;
        }

        /* Stock Summary Cards */
        .stock-summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stock-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border);
          transition: all 0.2s;
        }

        .stock-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }

        .stock-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stock-card.total { background: linear-gradient(135deg, #eff6ff, #dbeafe); }
        .stock-card.total .stock-card-icon { background: #3b82f6; color: white; }
        .stock-card.available { background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
        .stock-card.available .stock-card-icon { background: #10b981; color: white; }
        .stock-card.reserved { background: linear-gradient(135deg, #fffbeb, #fef3c7); }
        .stock-card.reserved .stock-card-icon { background: #f59e0b; color: white; }
        .stock-card.damaged { background: linear-gradient(135deg, #fef2f2, #fee2e2); }
        .stock-card.damaged .stock-card-icon { background: #ef4444; color: white; }

        .stock-card-info {
          display: flex;
          flex-direction: column;
        }

        .stock-card-value {
          font-size: 24px;
          font-weight: 800;
          color: var(--secondary);
          line-height: 1;
        }

        .stock-card-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        /* Toggle */
        .form-toggles {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .toggle-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-item:hover {
          background: var(--background);
          border-color: var(--primary);
        }

        .toggle-item input {
          width: 20px;
          height: 20px;
          margin-top: 2px;
        }

        .toggle-content {
          display: flex;
          flex-direction: column;
        }

        .toggle-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
        }

        .toggle-desc {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Info Panel */
        .info-panel {
          margin-top: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 10px;
          border: 1px solid var(--border);
        }

        .info-panel h4 {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 12px;
        }

        .info-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .info-tag {
          padding: 6px 14px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #166534;
          transition: all 0.2s;
        }

        .info-tag.outward {
          color: #991b1b;
        }

        .info-tag:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        /* Buttons */
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .btn-primary-form {
          background: var(--primary);
          color: white;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-primary-form:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        @media (max-width: 1024px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .stock-summary-cards {
            grid-template-columns: repeat(2, 1fr);
          }
          .tab-navigation {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default InventoryForm;

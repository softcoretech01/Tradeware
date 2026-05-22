import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, RotateCcw } from 'lucide-react';

const ItemForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    brand: '',
    model: '',
    size: '',
    color: '',
    uom: 'PCS',
    hsnCode: '',
    gstPercent: '18',
    minStock: '0',
    reorderLevel: '0',
    batchApplicable: false,
    serialApplicable: false,
    isImported: false,
    active: true,
    group: 'GENERAL',
    category: 'GENERAL'
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="form-container fade-in">
      <div className="form-header">
        <div className="header-title">
          <button className="back-btn" onClick={onCancel} title="Back to List">
            <ArrowLeft size={20} />
          </button>
          <h1>{item ? 'Edit Item' : 'New Item Master'}</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" form="item-master-form" className="btn btn-primary">
            <Save size={18} />
            {item ? 'Update Item' : 'Save Item'}
          </button>
        </div>
      </div>

      <div className="card form-card">
        <form id="item-master-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Item Code *</label>
                <input 
                  type="text" name="id" value={formData.id} 
                  onChange={handleChange} required disabled={!!item}
                  placeholder="e.g. ITM001"
                />
              </div>
              <div className="form-group">
                <label>Item Name *</label>
                <input 
                  type="text" name="name" value={formData.name} 
                  onChange={handleChange} required 
                  placeholder="Enter item name"
                />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Alumil" />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="e.g. AS-100" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Technical Specifications</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Size / Dimensions</label>
                <input type="text" name="size" value={formData.size} onChange={handleChange} placeholder="e.g. 100x200" />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input type="text" name="color" value={formData.color} onChange={handleChange} placeholder="e.g. Silver" />
              </div>
              <div className="form-group">
                <label>UOM</label>
                <select name="uom" value={formData.uom} onChange={handleChange}>
                  <option value="PCS">PCS</option>
                  <option value="SET">SET</option>
                  <option value="KGS">KGS</option>
                  <option value="MTR">MTR</option>
                </select>
              </div>
              <div className="form-group">
                <label>HSN Code</label>
                <input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Inventory & Taxation</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>GST %</label>
                <select name="gstPercent" value={formData.gstPercent} onChange={handleChange}>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div className="form-group">
                <label>Item Group</label>
                <select name="group" value={formData.group} onChange={handleChange}>
                  <option value="GENERAL">GENERAL</option>
                  <option value="ALUMINIUM">ALUMINIUM</option>
                  <option value="GLASS">GLASS</option>
                  <option value="HARDWARE">HARDWARE</option>
                </select>
              </div>
              <div className="form-group">
                <label>Item Category</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="GENERAL">GENERAL</option>
                  <option value="Aluminium">Aluminium</option>
                  <option value="Glass">Glass</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Rubber">Rubber</option>
                  <option value="Sealants">Sealants</option>
                  <option value="Paint">Paint</option>
                  <option value="Service">Service</option>
                  <option value="VEHICLE TIRE">VEHICLE TIRE</option>
                  <option value="ACCESSORY">ACCESSORY</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className="form-group">
                <label>Min Stock</label>
                <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Reorder Level</label>
                <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-section last">
            <h3 className="section-title">Settings & Flags</h3>
            <div className="form-toggles">
              <label className="toggle-item">
                <input type="checkbox" name="batchApplicable" checked={formData.batchApplicable} onChange={handleChange} />
                <div className="toggle-content">
                  <span className="toggle-label">Batch Applicable</span>
                  <span className="toggle-desc">Enable batch tracking for this item</span>
                </div>
              </label>
              <label className="toggle-item">
                <input type="checkbox" name="serialApplicable" checked={formData.serialApplicable} onChange={handleChange} />
                <div className="toggle-content">
                  <span className="toggle-label">Serial Number Applicable</span>
                  <span className="toggle-desc">Track individual serial numbers</span>
                </div>
              </label>
              <label className="toggle-item">
                <input type="checkbox" name="isImported" checked={formData.isImported} onChange={handleChange} />
                <div className="toggle-content">
                  <span className="toggle-label">Imported Item</span>
                  <span className="toggle-desc">Mark as imported material</span>
                </div>
              </label>
              <label className="toggle-item">
                <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
                <div className="toggle-content">
                  <span className="toggle-label">Active Status</span>
                  <span className="toggle-desc">Enable/Disable this item in operations</span>
                </div>
              </label>
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

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
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

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

export default ItemForm;

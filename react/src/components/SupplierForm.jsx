import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Truck, Globe, ShieldCheck, DollarSign, Clock } from 'lucide-react';

const SupplierForm = ({ supplier, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    type: 'Local suppliers',
    currency: 'SGD',
    leadTime: '0',
    active: true,
    taxDetails: { taxId: '', regType: 'Registered', taxRate: '0' },
    paymentTerms: 'COD',
    importDetails: { licenseNo: '', incoterms: 'EXW', portLoading: '', portDischarge: '', shippingLine: '' }
  });

  useEffect(() => {
    if (supplier) {
      setFormData(supplier);
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isImportRelated = formData.type === 'Import vendors' || formData.type === 'Overseas suppliers';

  return (
    <div className="form-container fade-in">
      <div className="form-header">
        <div className="header-title">
          <button className="back-btn" type="button" onClick={onCancel} title="Back to List">
            <ArrowLeft size={20} />
          </button>
          <h1>{supplier ? 'Edit Supplier / Vendor' : 'New Supplier Master'}</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" form="supplier-master-form" className="btn btn-primary">
            <Save size={18} />
            {supplier ? 'Update Supplier' : 'Save Supplier'}
          </button>
        </div>
      </div>

      <div className="card form-card">
        <form id="supplier-master-form" onSubmit={handleSubmit}>
          
          {/* Section 1: Basic Information */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Supplier Code *</label>
                <input 
                  type="text" name="id" value={formData.id} 
                  onChange={handleChange} required disabled={!!supplier}
                  placeholder="e.g. SUPP-100"
                />
              </div>
              <div className="form-group">
                <label>Supplier Name *</label>
                <input 
                  type="text" name="name" value={formData.name} 
                  onChange={handleChange} required 
                  placeholder="Enter vendor or supplier name"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" name="email" value={formData.email} 
                  onChange={handleChange} 
                  placeholder="e.g. sales@vendor.com"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" name="phone" value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="e.g. +65 6777 8888"
                />
              </div>
            </div>

            <div className="form-grid mt-4">
              <div className="form-group">
                <label>Supplier Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} required>
                  <option value="Local suppliers">Local suppliers</option>
                  <option value="Overseas suppliers">Overseas suppliers</option>
                  <option value="Import vendors">Import vendors</option>
                </select>
              </div>
              <div className="form-group">
                <label>Currency *</label>
                <select name="currency" value={formData.currency} onChange={handleChange} required>
                  <option value="SGD">SGD (Singapore Dollar)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="INR">INR (Indian Rupee)</option>
                  <option value="IDR">IDR (Indonesian Rupiah)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Lead Time (Days)</label>
                <div className="input-with-icon-left">
                  <Clock size={16} className="inp-icon" />
                  <input 
                    type="number" name="leadTime" value={formData.leadTime} 
                    onChange={handleChange} 
                    placeholder="e.g. 7"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Payment Terms</label>
                <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange}>
                  <option value="COD">COD (Cash on Delivery)</option>
                  <option value="Cash">Cash</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="Net 90">Net 90 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Taxation Details */}
          <div className="form-section">
            <h3 className="section-title">Taxation & GST/VAT Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Tax Registration Type</label>
                <select 
                  value={formData.taxDetails.regType} 
                  onChange={(e) => handleNestedChange('taxDetails', 'regType', e.target.value)}
                >
                  <option value="Registered">Registered Vendor</option>
                  <option value="VAT Registered">VAT Registered</option>
                  <option value="Exempt">Tax Exempt</option>
                  <option value="Unregistered">Unregistered</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tax ID / GSTIN / VAT Number</label>
                <input 
                  type="text" 
                  value={formData.taxDetails.taxId} 
                  onChange={(e) => handleNestedChange('taxDetails', 'taxId', e.target.value)}
                  placeholder="e.g. 22BBBBB3333C1Z5 or VAT99988"
                  disabled={formData.taxDetails.regType === 'Unregistered'}
                />
              </div>
              <div className="form-group">
                <label>Applicable Tax Rate (%)</label>
                <input 
                  type="number" 
                  value={formData.taxDetails.taxRate} 
                  onChange={(e) => handleNestedChange('taxDetails', 'taxRate', e.target.value)}
                  placeholder="e.g. 9 or 18"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Import details (Dynamically stylized but accessible) */}
          <div className="form-section last">
            <div className="section-header-flex">
              <h3 className="section-title">Import & Shipping Details</h3>
              {!isImportRelated && (
                <span className="badge badge-info-gray">Recommended for Import/Overseas Vendors</span>
              )}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Import License Number</label>
                <input 
                  type="text" 
                  value={formData.importDetails.licenseNo} 
                  onChange={(e) => handleNestedChange('importDetails', 'licenseNo', e.target.value)}
                  placeholder="e.g. IMP-EU-55441"
                />
              </div>
              <div className="form-group">
                <label>Incoterms</label>
                <select 
                  value={formData.importDetails.incoterms} 
                  onChange={(e) => handleNestedChange('importDetails', 'incoterms', e.target.value)}
                >
                  <option value="EXW">EXW (Ex Works)</option>
                  <option value="FOB">FOB (Free On Board)</option>
                  <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                  <option value="CFR">CFR (Cost and Freight)</option>
                  <option value="DDP">DDP (Delivered Duty Paid)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Port of Loading</label>
                <input 
                  type="text" 
                  value={formData.importDetails.portLoading} 
                  onChange={(e) => handleNestedChange('importDetails', 'portLoading', e.target.value)}
                  placeholder="e.g. Shanghai Port"
                />
              </div>
              <div className="form-group">
                <label>Port of Discharge</label>
                <input 
                  type="text" 
                  value={formData.importDetails.portDischarge} 
                  onChange={(e) => handleNestedChange('importDetails', 'portDischarge', e.target.value)}
                  placeholder="e.g. Singapore PSA"
                />
              </div>
            </div>

            <div className="form-grid mt-4">
              <div className="form-group">
                <label>Preferred Shipping Line</label>
                <input 
                  type="text" 
                  value={formData.importDetails.shippingLine} 
                  onChange={(e) => handleNestedChange('importDetails', 'shippingLine', e.target.value)}
                  placeholder="e.g. Maersk Line, CMA CGM"
                />
              </div>
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

        .section-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header-flex .section-title {
          margin-bottom: 0;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }

        .badge-info-gray {
          background: #f1f5f9;
          color: #64748b;
          border: 1px dashed var(--border);
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

        .form-group input:disabled, .form-group select:disabled {
          background: #f1f5f9;
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .mt-4 {
          margin-top: 16px;
        }

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

        .btn:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>
    </div>
  );
};

export default SupplierForm;

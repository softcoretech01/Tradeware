import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Plus, Trash2, User, Phone, Mail, Building, PlusCircle } from 'lucide-react';

const CustomerForm = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    type: 'Builders',
    active: true,
    billingAddress: { line1: '', line2: '', city: '', state: '', zip: '' },
    shippingAddress: { line1: '', line2: '', city: '', state: '', zip: '' },
    gstDetails: { gstin: '', stateCode: '', regType: 'Unregistered' },
    creditLimit: '0',
    paymentTerms: 'COD',
    priceCategory: 'Retail',
    contactPersons: [],
    projects: []
  });

  const [sameAsBilling, setSameAsBilling] = useState(false);

  // Sub-forms for Contact Persons and Projects
  const [newContact, setNewContact] = useState({ name: '', designation: '', phone: '', email: '' });
  const [newProject, setNewProject] = useState({ name: '', location: '', description: '', value: '' });

  useEffect(() => {
    if (customer) {
      setFormData(customer);
      // Check if billing and shipping addresses match to initialize checkbox
      const billingStr = JSON.stringify(customer.billingAddress);
      const shippingStr = JSON.stringify(customer.shippingAddress);
      if (billingStr === shippingStr && customer.billingAddress.line1 !== '') {
        setSameAsBilling(true);
      }
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => {
      const updatedSection = { ...prev[section], [field]: value };
      const updated = { ...prev, [section]: updatedSection };
      
      // If "same as billing" is checked and we modify billing, copy to shipping
      if (section === 'billingAddress' && sameAsBilling) {
        updated.shippingAddress = { ...updatedSection };
      }
      return updated;
    });
  };

  const handleSameAsBillingChange = (e) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress }
      }));
    }
  };

  // Contact Persons management
  const handleAddContact = () => {
    if (!newContact.name) {
      alert('Please enter at least a name for the contact person.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      contactPersons: [...prev.contactPersons, { ...newContact }]
    }));
    setNewContact({ name: '', designation: '', phone: '', email: '' });
  };

  const handleRemoveContact = (index) => {
    setFormData(prev => ({
      ...prev,
      contactPersons: prev.contactPersons.filter((_, i) => i !== index)
    }));
  };

  // Projects management
  const handleAddProject = () => {
    if (!newProject.name) {
      alert('Please enter a project name.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { ...newProject }]
    }));
    setNewProject({ name: '', location: '', description: '', value: '' });
  };

  const handleRemoveProject = (index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
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
          <button className="back-btn" type="button" onClick={onCancel} title="Back to List">
            <ArrowLeft size={20} />
          </button>
          <h1>{customer ? 'Edit Customer' : 'New Customer Master'}</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" form="customer-master-form" className="btn btn-primary">
            <Save size={18} />
            {customer ? 'Update Customer' : 'Save Customer'}
          </button>
        </div>
      </div>

      <div className="card form-card">
        <form id="customer-master-form" onSubmit={handleSubmit}>
          
          {/* Section 1: Basic Details */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Customer Code *</label>
                <input 
                  type="text" name="id" value={formData.id} 
                  onChange={handleChange} required disabled={!!customer}
                  placeholder="e.g. CUST-100"
                />
              </div>
              <div className="form-group">
                <label>Customer Name *</label>
                <input 
                  type="text" name="name" value={formData.name} 
                  onChange={handleChange} required 
                  placeholder="Enter company or customer name"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" name="email" value={formData.email} 
                  onChange={handleChange} 
                  placeholder="e.g. contact@domain.com"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" name="phone" value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="e.g. 555-0199"
                />
              </div>
            </div>

            <div className="form-grid mt-4">
              <div className="form-group">
                <label>Customer Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} required>
                  <option value="Builders">Retailer</option>
                  <option value="Dealers">Wholesaler</option>
                  <option value="Contractors">Project Based</option>
                </select>
              </div>
              <div className="form-group">
                <label>Credit Limit ($)</label>
                <input 
                  type="number" name="creditLimit" value={formData.creditLimit} 
                  onChange={handleChange} 
                  placeholder="Credit Limit"
                />
              </div>
              <div className="form-group">
                <label>Payment Terms</label>
                <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange}>
                  <option value="COD">COD (Cash on Delivery)</option>
                  <option value="Cash">Cash</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price Category</label>
                <select name="priceCategory" value={formData.priceCategory} onChange={handleChange}>
                  <option value="Retail">Retail / Standard</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Distributor">Premium / Distributor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Addresses */}
          <div className="form-section">
            <div className="section-header-flex">
              <h3 className="section-title">Addresses</h3>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={sameAsBilling} 
                  onChange={handleSameAsBillingChange} 
                />
                <span>Shipping Address same as Billing</span>
              </label>
            </div>
            
            <div className="address-columns">
              {/* Billing Address */}
              <div className="address-col">
                <h4 className="sub-section-title">Billing Address</h4>
                <div className="form-group mb-3">
                  <label>Address Line 1</label>
                  <input 
                    type="text" 
                    value={formData.billingAddress.line1} 
                    onChange={(e) => handleNestedChange('billingAddress', 'line1', e.target.value)}
                    placeholder="Street Address, P.O. Box"
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Address Line 2</label>
                  <input 
                    type="text" 
                    value={formData.billingAddress.line2} 
                    onChange={(e) => handleNestedChange('billingAddress', 'line2', e.target.value)}
                    placeholder="Apartment, suite, unit, building"
                  />
                </div>
                <div className="form-row-three">
                  <div className="form-group">
                    <label>City</label>
                    <input 
                      type="text" 
                      value={formData.billingAddress.city} 
                      onChange={(e) => handleNestedChange('billingAddress', 'city', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input 
                      type="text" 
                      value={formData.billingAddress.state} 
                      onChange={(e) => handleNestedChange('billingAddress', 'state', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input 
                      type="text" 
                      value={formData.billingAddress.zip} 
                      onChange={(e) => handleNestedChange('billingAddress', 'zip', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className={`address-col ${sameAsBilling ? 'disabled-col' : ''}`}>
                <h4 className="sub-section-title">Shipping Address</h4>
                <div className="form-group mb-3">
                  <label>Address Line 1</label>
                  <input 
                    type="text" 
                    value={formData.shippingAddress.line1} 
                    onChange={(e) => handleNestedChange('shippingAddress', 'line1', e.target.value)}
                    disabled={sameAsBilling}
                    placeholder="Street Address, P.O. Box"
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Address Line 2</label>
                  <input 
                    type="text" 
                    value={formData.shippingAddress.line2} 
                    onChange={(e) => handleNestedChange('shippingAddress', 'line2', e.target.value)}
                    disabled={sameAsBilling}
                    placeholder="Apartment, suite, unit, building"
                  />
                </div>
                <div className="form-row-three">
                  <div className="form-group">
                    <label>City</label>
                    <input 
                      type="text" 
                      value={formData.shippingAddress.city} 
                      onChange={(e) => handleNestedChange('shippingAddress', 'city', e.target.value)}
                      disabled={sameAsBilling}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input 
                      type="text" 
                      value={formData.shippingAddress.state} 
                      onChange={(e) => handleNestedChange('shippingAddress', 'state', e.target.value)}
                      disabled={sameAsBilling}
                    />
                  </div>
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input 
                      type="text" 
                      value={formData.shippingAddress.zip} 
                      onChange={(e) => handleNestedChange('shippingAddress', 'zip', e.target.value)}
                      disabled={sameAsBilling}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: GST Details */}
          <div className="form-section">
            <h3 className="section-title">Taxation & GST Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>GST Registration Type</label>
                <select 
                  value={formData.gstDetails.regType} 
                  onChange={(e) => handleNestedChange('gstDetails', 'regType', e.target.value)}
                >
                  <option value="Unregistered">Unregistered</option>
                  <option value="Registered">Regular Registered</option>
                  <option value="Composition">Composition Scheme</option>
                </select>
              </div>
              <div className="form-group">
                <label>GSTIN Number</label>
                <input 
                  type="text" 
                  value={formData.gstDetails.gstin} 
                  onChange={(e) => handleNestedChange('gstDetails', 'gstin', e.target.value)}
                  placeholder="e.g. 22AAAAA1111A1Z1"
                  disabled={formData.gstDetails.regType === 'Unregistered'}
                />
              </div>
              <div className="form-group">
                <label>State Code</label>
                <input 
                  type="text" 
                  value={formData.gstDetails.stateCode} 
                  onChange={(e) => handleNestedChange('gstDetails', 'stateCode', e.target.value)}
                  placeholder="e.g. 22"
                  disabled={formData.gstDetails.regType === 'Unregistered'}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Contact Persons */}
          <div className="form-section">
            <h3 className="section-title">Contact Persons</h3>
            
            {/* Existing Contact Persons List */}
            {formData.contactPersons.length > 0 && (
              <div className="nested-list-wrapper mb-4">
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Designation</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.contactPersons.map((contact, idx) => (
                      <tr key={idx}>
                        <td className="bold-cell">{contact.name}</td>
                        <td>{contact.designation || '-'}</td>
                        <td>{contact.phone || '-'}</td>
                        <td>{contact.email || '-'}</td>
                        <td>
                          <button 
                            type="button" 
                            className="sub-delete-btn" 
                            onClick={() => handleRemoveContact(idx)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Subform to add a new contact */}
            <div className="subform-card">
              <h4 className="subform-title">Add Contact Person</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon-left">
                    <User size={16} className="inp-icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={newContact.name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <div className="input-with-icon-left">
                    <Building size={16} className="inp-icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. Project Manager"
                      value={newContact.designation}
                      onChange={(e) => setNewContact(prev => ({ ...prev, designation: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-with-icon-left">
                    <Phone size={16} className="inp-icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. +65 9123 4567"
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon-left">
                    <Mail size={16} className="inp-icon" />
                    <input 
                      type="email" 
                      placeholder="e.g. john@domain.com"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary mt-3 inline-btn"
                onClick={handleAddContact}
              >
                <Plus size={16} /> Add to Contacts List
              </button>
            </div>
          </div>

          {/* Section 5: Projects */}
          <div className="form-section last">
            <h3 className="section-title">Project Details</h3>

            {/* Existing Projects List */}
            {formData.projects.length > 0 && (
              <div className="nested-list-wrapper mb-4">
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Location</th>
                      <th>Description</th>
                      <th>Value ($)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.projects.map((proj, idx) => (
                      <tr key={idx}>
                        <td className="bold-cell">{proj.name}</td>
                        <td>{proj.location || '-'}</td>
                        <td>{proj.description || '-'}</td>
                        <td className="number-cell">{proj.value ? parseFloat(proj.value).toLocaleString() : '-'}</td>
                        <td>
                          <button 
                            type="button" 
                            className="sub-delete-btn" 
                            onClick={() => handleRemoveProject(idx)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Subform to add a new project */}
            <div className="subform-card">
              <h4 className="subform-title">Add Project</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Marina Bay piping"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Marina South"
                    value={newProject.location}
                    onChange={(e) => setNewProject(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Project Value ($)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 100000"
                    value={newProject.value}
                    onChange={(e) => setNewProject(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Brief Description</label>
                  <input 
                    type="text" 
                    placeholder="Scope of work details"
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary mt-3 inline-btn"
                onClick={handleAddProject}
              >
                <Plus size={16} /> Add to Projects List
              </button>
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

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
        }

        .checkbox-label input {
          width: 16px;
          height: 16px;
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

        .address-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .address-col {
          display: flex;
          flex-direction: column;
        }

        .disabled-col {
          opacity: 0.6;
          pointer-events: none;
        }

        .sub-section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--secondary);
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        .mb-3 {
          margin-bottom: 12px;
        }

        .mb-4 {
          margin-bottom: 16px;
        }

        .mt-4 {
          margin-top: 16px;
        }

        .mt-3 {
          margin-top: 12px;
        }

        .form-row-three {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        /* Dynamic lists styling */
        .nested-list-wrapper {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .sub-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sub-table th {
          background: #f8fafc;
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          border-bottom: 1px solid var(--border);
          text-align: left;
        }

        .sub-table td {
          padding: 10px 16px;
          font-size: 13px;
          border-bottom: 1px solid var(--border);
          color: var(--text-main);
        }

        .sub-table tr:last-child td {
          border-bottom: none;
        }

        .bold-cell {
          font-weight: 600;
          color: var(--secondary);
        }

        .number-cell {
          font-family: monospace;
          font-weight: 600;
        }

        .sub-delete-btn {
          color: var(--danger);
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .sub-delete-btn:hover {
          background: #fef2f2;
        }

        .subform-card {
          background: #f8fafc;
          border: 1px dashed var(--border);
          border-radius: 8px;
          padding: 20px;
        }

        .subform-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 16px;
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

        .inline-btn {
          padding: 8px 16px;
          font-size: 13px;
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

export default CustomerForm;

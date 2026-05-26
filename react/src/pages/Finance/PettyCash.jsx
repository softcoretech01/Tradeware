import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPettyCashSlip, approvePettyCashSlip } from '../../store/financeSlice';
import { 
  Plus, Check, Trash2, Upload, FileText, CheckCircle2, Clock, X, AlertCircle
} from 'lucide-react';

const PettyCash = () => {
  const dispatch = useDispatch();
  const pettyCashTransactions = useSelector(state => state.finance.pettyCashTransactions);
  const currentUser = useSelector(state => state.erp.currentUser);
  const userPermissions = useSelector(state => state.erp.rolesPermissions?.[currentUser?.role || 'Admin']);

  // Check if current user can approve petty cash
  const canApprove = userPermissions?.['Account Integration']?.approve ?? true;

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('Sales');
  const [requester, setRequester] = useState(currentUser?.name || 'Alice Connor');
  const [category, setCategory] = useState('Transport');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Validation
  const [errors, setErrors] = useState({});

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFileSim(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileSim(e.target.files[0]);
    }
  };

  const uploadFileSim = (file) => {
    setIsUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });
          return 100;
        }
        return p + 25;
      });
    }, 100);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setProgress(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!amount || Number(amount) <= 0) {
      newErrors.amount = "Disbursement amount must be greater than zero.";
    }
    if (!purpose.trim()) {
      newErrors.purpose = "Detailed disbursement purpose is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    dispatch(addPettyCashSlip({
      date,
      requester,
      department,
      category,
      amount: Number(amount),
      purpose,
      status: 'Pending',
      verifiedFile: uploadedFile ? uploadedFile.name : null
    }));

    // Reset Form
    setAmount('');
    setPurpose('');
    setUploadedFile(null);
    alert("Petty cash request submitted for review!");
  };

  const handleApprove = (id) => {
    dispatch(approvePettyCashSlip(id));
    alert("Petty cash slip approved!");
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Petty Cash Management Counter</h2>
          <span className="subtitle">Submit disbursement claims, record verified receipts, and process approvals</span>
        </div>
      </div>

      <div className="layout-split">
        {/* Left Side: Form */}
        <div className="form-card">
          <h3 className="card-title-od">Submit Petty Cash Request</h3>
          <form onSubmit={handleSubmit} className="pc-form">
            <div className="field-group">
              <label>Request Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="table-input" 
                required
              />
            </div>

            <div className="field-group" style={{ marginTop: '12px' }}>
              <label>Department</label>
              <select 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)}
                className="table-select"
              >
                <option value="Sales">Sales</option>
                <option value="R&D">R&D</option>
                <option value="Operations">Operations</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Production">Production</option>
              </select>
            </div>

            <div className="field-group" style={{ marginTop: '12px' }}>
              <label>Requester Name</label>
              <input 
                type="text" 
                value={requester} 
                onChange={(e) => setRequester(e.target.value)} 
                placeholder="Requester Name"
                className="table-input"
                required
              />
            </div>

            <div className="field-group" style={{ marginTop: '12px' }}>
              <label>Expense Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="table-select"
              >
                <option value="Transport">Transport / Taxi Reimbursements</option>
                <option value="Food">Pantry / Client Food & Beverages</option>
                <option value="Stationery">Stationery & Printing</option>
                <option value="Maintenance">Maintenance Equipment</option>
                <option value="Other">Other Expenses</option>
              </select>
            </div>

            <div className="field-group" style={{ marginTop: '12px' }}>
              <label>Amount (SGD)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00"
                step="0.01"
                className={`table-input ${errors.amount ? 'input-error' : ''}`}
              />
              {errors.amount && <span className="error-lbl"><AlertCircle size={12} /> {errors.amount}</span>}
            </div>

            <div className="field-group" style={{ marginTop: '12px' }}>
              <label>Detailed Purpose</label>
              <textarea 
                value={purpose} 
                onChange={(e) => setPurpose(e.target.value)} 
                placeholder="Describe expense details (e.g. taxi receipt woodlands site client meeting)..."
                rows="3"
                className={`table-input ${errors.purpose ? 'input-error' : ''}`}
                style={{ resize: 'vertical' }}
              />
              {errors.purpose && <span className="error-lbl"><AlertCircle size={12} /> {errors.purpose}</span>}
            </div>

            {/* Drag & drop file area */}
            <div className="field-group" style={{ marginTop: '12px' }}>
              <label>Receipt Proof Upload</label>
              <div 
                className={`drag-area-pc ${dragActive ? 'active' : ''} ${uploadedFile ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                {!uploadedFile && !isUploading && (
                  <div className="placeholder-pc">
                    <Upload size={24} style={{ margin: '0 auto', color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      Drag slip or <label className="browse-lbl-pc">browse<input type="file" onChange={handleFileChange} style={{ display: 'none' }} /></label>
                    </span>
                  </div>
                )}
                {isUploading && (
                  <div className="upload-pc">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                    <span style={{ fontSize: '11px', position: 'relative' }}>Uploading {progress}%</span>
                  </div>
                )}
                {uploadedFile && (
                  <div className="uploaded-pc">
                    <FileText size={18} style={{ color: 'var(--primary)' }} />
                    <span className="file-name-pc">{uploadedFile.name}</span>
                    <button type="button" className="btn-icon-danger" onClick={handleRemoveFile}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '16px', background: 'var(--primary)', width: '100%' }}>
              <Plus size={16} /> Submit Claim Request
            </button>
          </form>
        </div>

        {/* Right Side: Requests tracker and approvals */}
        <div className="tracker-panel">
          <h3 className="card-title-od" style={{ marginBottom: '16px' }}>Disbursements Approval Queue</h3>
          
          <div className="pc-transactions-list">
            {pettyCashTransactions.map((tr) => (
              <div key={tr.id} className="pc-item-card">
                <div className="pc-item-header">
                  <div>
                    <strong className="slip-no">{tr.slipNo}</strong>
                    <span className="date-pc">{tr.date}</span>
                  </div>
                  <span className={`status-badge-pc ${tr.status.toLowerCase()}`}>
                    {tr.status === 'Approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {tr.status}
                  </span>
                </div>
                <div className="pc-item-body">
                  <div className="pc-meta">
                    <span>Requester: <strong>{tr.requester}</strong> ({tr.department})</span>
                    <span>Category: <strong>{tr.category}</strong></span>
                  </div>
                  <p className="pc-purpose">{tr.purpose}</p>
                  
                  {tr.verifiedFile && (
                    <span className="verified-attachment">
                      <FileText size={12} /> Attachment: {tr.verifiedFile}
                    </span>
                  )}
                </div>
                <div className="pc-item-footer">
                  <span className="pc-amount">SGD {tr.amount.toFixed(2)}</span>
                  {tr.status === 'Pending' && canApprove && (
                    <button 
                      className="btn-primary" 
                      onClick={() => handleApprove(tr.id)}
                      style={{ 
                        padding: '4px 10px', 
                        fontSize: '12px', 
                        backgroundColor: 'var(--accent)', 
                        borderColor: 'var(--accent)' 
                      }}
                    >
                      Approve Slip
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Styled JSX */}
      <style jsx="true">{`
        .layout-split {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: 24px;
          align-items: start;
        }

        .form-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        .card-title-od {
          font-size: 15px;
          font-weight: 700;
          color: var(--secondary);
          margin: 0 0 16px 0;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-group label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .error-lbl {
          font-size: 11px;
          color: var(--danger);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .input-error {
          border-color: var(--danger) !important;
        }

        /* Drag area petty cash */
        .drag-area-pc {
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          background: #fafcfd;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          position: relative;
          overflow: hidden;
        }

        .drag-area-pc.active {
          border-color: var(--primary);
          background-color: #eff6ff;
        }

        .placeholder-pc {
          text-align: center;
        }

        .browse-lbl-pc {
          color: var(--primary);
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
        }

        .upload-pc {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.08);
        }

        .progress-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: rgba(59, 130, 246, 0.2);
          transition: width 0.1s;
        }

        .uploaded-pc {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .file-name-pc {
          font-size: 12px;
          color: var(--secondary);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Tracker Right Panel */
        .tracker-panel {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        .pc-transactions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 600px;
          overflow-y: auto;
        }

        .pc-item-card {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          background: #fafcfd;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pc-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .slip-no {
          font-size: 14px;
          color: var(--secondary);
          display: block;
        }

        .date-pc {
          font-size: 11px;
          color: var(--text-muted);
        }

        .status-badge-pc {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .status-badge-pc.approved {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--accent);
        }

        .status-badge-pc.pending {
          background-color: rgba(245, 158, 11, 0.1);
          color: var(--warning);
        }

        .pc-item-body {
          font-size: 13px;
        }

        .pc-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          color: var(--text-main);
        }

        .pc-purpose {
          color: var(--text-muted);
          margin: 4px 0 0 0;
        }

        .verified-attachment {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--primary);
          margin-top: 8px;
        }

        .pc-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px dashed var(--border);
          padding-top: 10px;
        }

        .pc-amount {
          font-size: 15px;
          font-weight: 700;
          color: var(--secondary);
        }
      `}</style>
    </div>
  );
};

export default PettyCash;

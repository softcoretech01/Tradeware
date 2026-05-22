import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Chip, Tooltip, IconButton
} from '@mui/material';
import { 
  Search, Eye, Check, Navigation, MapPin, Truck, Calendar, Clock,
  Play, ShieldCheck, Map
} from 'lucide-react';
import { updateDispatchStatus } from '../../store/erpSlice';

const DispatchTracking = () => {
  const dispatch = useDispatch();

  // Store Selectors
  const deliveryChallans = useSelector(state => state.erp.deliveryChallans || []);

  // Grid States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedChallanId, setSelectedChallanId] = useState(deliveryChallans[0]?.id || '');

  // Confirm Delivery Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRemarks, setConfirmRemarks] = useState('');

  // Selected Challan object
  const activeChallan = deliveryChallans.find(c => c.id === selectedChallanId) || deliveryChallans[0];

  // Filter & Search data
  const filteredChallans = deliveryChallans.filter(dc => {
    const matchSearch = 
      dc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dc.driverName && dc.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (dc.vehicleNo && dc.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === '' || dc.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (id, newStatus, remarks) => {
    dispatch(updateDispatchStatus({ id, status: newStatus, remarks }));
  };

  const handleOpenConfirmDialog = () => {
    setConfirmRemarks('');
    setConfirmOpen(true);
  };

  const handleConfirmDelivery = () => {
    if (!activeChallan) return;
    dispatch(updateDispatchStatus({ 
      id: activeChallan.id, 
      status: 'Delivered', 
      remarks: confirmRemarks || 'Delivered to consignee and signed off by supervisor.' 
    }));
    setConfirmOpen(false);
  };

  // Stepper helper
  const getStepClass = (stepStatus) => {
    if (!activeChallan) return 'pending';
    const statusOrder = ['Draft', 'Dispatched', 'In Transit', 'Delivered'];
    const activeIndex = statusOrder.indexOf(activeChallan.status);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (activeIndex >= stepIndex) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="module-container fade-in">
      <div className="module-header">
        <div>
          <h2>Real-Time Dispatch Tracking</h2>
          <p className="breadcrumb">Delivery & Dispatch &gt; Dispatch Tracking</p>
        </div>
      </div>

      <div className="dispatch-layout">
        {/* Left Side: Dispatch List */}
        <div className="dispatch-list-panel">
          <div className="panel-search-bar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search dispatch list..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <div className="dispatch-items">
            {filteredChallans.length === 0 ? (
              <div className="empty-message">No dispatches found.</div>
            ) : (
              filteredChallans.map(dc => (
                <div 
                  key={dc.id} 
                  className={`dispatch-card ${activeChallan?.id === dc.id ? 'active' : ''}`}
                  onClick={() => setSelectedChallanId(dc.id)}
                >
                  <div className="dispatch-card-header">
                    <span className="dispatch-card-id">{dc.id}</span>
                    <span className={`status-badge ${dc.status.toLowerCase().replace(' ', '-')}`}>
                      {dc.status}
                    </span>
                  </div>
                  <div className="dispatch-card-body">
                    <div className="customer-name">{dc.customerName}</div>
                    <div className="delivery-meta">
                      <span><strong>Vehicle:</strong> {dc.vehicleNo}</span>
                      <span><strong>Driver:</strong> {dc.driverName}</span>
                    </div>
                    <div className="delivery-destination">
                      <MapPin size={12} className="meta-icon" />
                      <span>{dc.siteLocation}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Tracking Dashboard */}
        <div className="dispatch-dashboard-panel">
          {activeChallan ? (
            <div className="dashboard-content">
              {/* Header Info */}
              <div className="details-header">
                <div>
                  <h3>Dispatch Details: {activeChallan.id}</h3>
                  <span className="customer-sub">{activeChallan.customerName}</span>
                </div>
                <div className="action-buttons-wrapper">
                  {activeChallan.status === 'Draft' && (
                    <button 
                      className="btn-action dispatch-btn" 
                      onClick={() => handleStatusChange(activeChallan.id, 'Dispatched', 'Vehicle loaded and dispatched from central depot.')}
                    >
                      <Play size={16} /> Dispatch Vehicle
                    </button>
                  )}
                  {activeChallan.status === 'Dispatched' && (
                    <button 
                      className="btn-action transit-btn" 
                      onClick={() => handleStatusChange(activeChallan.id, 'In Transit', 'Transit started. Driver confirmed en route.')}
                    >
                      <Navigation size={16} /> Mark Out-For-Delivery
                    </button>
                  )}
                  {activeChallan.status === 'In Transit' && (
                    <button 
                      className="btn-action deliver-btn" 
                      onClick={handleOpenConfirmDialog}
                    >
                      <Check size={16} /> Confirm Receipt
                    </button>
                  )}
                  {activeChallan.status === 'Delivered' && (
                    <Chip label="Delivery Successful" color="success" icon={<ShieldCheck size={16} />} sx={{ fontWeight: '600' }} />
                  )}
                </div>
              </div>

              {/* Status Stepper */}
              <div className="stepper-wrapper">
                <div className="stepper-horizontal">
                  <div className={`step-item ${getStepClass('Draft')}`}>
                    <div className="step-circle">1</div>
                    <span className="step-label">Draft</span>
                  </div>
                  <div className="step-line"></div>
                  <div className={`step-item ${getStepClass('Dispatched')}`}>
                    <div className="step-circle">2</div>
                    <span className="step-label">Dispatched</span>
                  </div>
                  <div className="step-line"></div>
                  <div className={`step-item ${getStepClass('In Transit')}`}>
                    <div className="step-circle">3</div>
                    <span className="step-label">In Transit</span>
                  </div>
                  <div className="step-line"></div>
                  <div className={`step-item ${getStepClass('Delivered')}`}>
                    <div className="step-circle">4</div>
                    <span className="step-label">Delivered</span>
                  </div>
                </div>
              </div>

              {/* Map & Logistics Grid */}
              <div className="dashboard-grid">
                {/* SVG Live Simulation Map */}
                <div className="map-card">
                  <div className="card-heading">
                    <Map size={16} /> Live Delivery Route Simulation
                  </div>
                  <div className="map-canvas">
                    {/* SVG Simulated Map */}
                    <svg viewBox="0 0 400 240" style={{ width: '100%', height: '100%', background: '#0f172a', borderRadius: '6px' }}>
                      {/* Grid background lines */}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="400" height="240" fill="url(#grid)" />

                      {/* Map routes */}
                      <path 
                        d="M 50 180 Q 150 50, 200 130 T 350 70" 
                        fill="none" 
                        stroke="#334155" 
                        strokeWidth="5" 
                        strokeLinecap="round" 
                      />
                      <path 
                        id="route-path"
                        d="M 50 180 Q 150 50, 200 130 T 350 70" 
                        fill="none" 
                        stroke="rgba(59, 130, 246, 0.4)" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeDasharray="6,4"
                      />

                      {/* Animated path progress */}
                      {activeChallan.status !== 'Draft' && (
                        <path 
                          d="M 50 180 Q 150 50, 200 130 T 350 70" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                          strokeDasharray="400"
                          strokeDashoffset={
                            activeChallan.status === 'Dispatched' ? '300' :
                            activeChallan.status === 'In Transit' ? '150' : '0'
                          }
                          style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
                        />
                      )}

                      {/* Source Location: Central Depot */}
                      <circle cx="50" cy="180" r="10" fill="#3b82f6" />
                      <circle cx="50" cy="180" r="16" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="ping-depot" />
                      <text x="50" y="210" fill="#fff" fontSize="10" textAnchor="middle" fontWeight="bold">Central Warehouse</text>

                      {/* Destination Location */}
                      <circle cx="350" cy="70" r="10" fill="#ef4444" />
                      {activeChallan.status === 'Delivered' && (
                        <circle cx="350" cy="70" r="18" fill="none" stroke="#10b981" strokeWidth="2" className="ping-dest" />
                      )}
                      <text x="350" y="95" fill="#fff" fontSize="10" textAnchor="middle" fontWeight="bold">{activeChallan.builderName}</text>

                      {/* Animated Moving Truck */}
                      {activeChallan.status === 'Draft' && (
                        <g transform="translate(42, 170)">
                          <rect width="16" height="10" rx="2" fill="#3b82f6" />
                          <rect x="12" y="2" width="6" height="6" rx="1" fill="#93c5fd" />
                          <circle cx="4" cy="10" r="2.5" fill="#000" />
                          <circle cx="12" cy="10" r="2.5" fill="#000" />
                        </g>
                      )}

                      {activeChallan.status === 'Dispatched' && (
                        <g transform="translate(100, 115)">
                          <rect width="16" height="10" rx="2" fill="#3b82f6" />
                          <rect x="12" y="2" width="6" height="6" rx="1" fill="#93c5fd" />
                          <circle cx="4" cy="10" r="2.5" fill="#000" />
                          <circle cx="12" cy="10" r="2.5" fill="#000" />
                        </g>
                      )}

                      {activeChallan.status === 'In Transit' && (
                        <g className="moving-truck">
                          <animateMotion 
                            path="M 50 180 Q 150 50, 200 130 T 350 70" 
                            begin="0s" 
                            dur="6s" 
                            repeatCount="indefinite" 
                          />
                          <g transform="translate(-10, -8)">
                            <rect width="18" height="10" rx="2" fill="#10b981" />
                            <rect x="13" y="1.5" width="6" height="6" rx="1" fill="#a7f3d0" />
                            <circle cx="4" cy="10" r="2.5" fill="#000" />
                            <circle cx="14" cy="10" r="2.5" fill="#000" />
                          </g>
                        </g>
                      )}

                      {activeChallan.status === 'Delivered' && (
                        <g transform="translate(340, 60)">
                          <rect width="16" height="10" rx="2" fill="#10b981" />
                          <rect x="12" y="2" width="6" height="6" rx="1" fill="#a7f3d0" />
                          <circle cx="4" cy="10" r="2.5" fill="#000" />
                          <circle cx="12" cy="10" r="2.5" fill="#000" />
                        </g>
                      )}
                    </svg>

                    <div className="live-pill">
                      <span className="live-dot"></span> Live Transit Sim
                    </div>
                  </div>
                </div>

                {/* Logistics Information Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="logistics-details-card">
                    <div className="card-heading">
                      <Truck size={16} /> Crew & Equipment
                    </div>
                    <div className="details-table">
                      <div className="detail-row">
                        <span className="lbl">Vehicle Assigned</span>
                        <span className="val">{activeChallan.vehicleNo} ({activeChallan.vehicleType})</span>
                      </div>
                      <div className="detail-row">
                        <span className="lbl">Driver Assigned</span>
                        <span className="val">{activeChallan.driverName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="lbl">Driver Phone</span>
                        <span className="val">{activeChallan.driverContact || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="lbl">Dispatched From</span>
                        <span className="val">Singapore Central Warehouse</span>
                      </div>
                      <div className="detail-row">
                        <span className="lbl">Destination Site</span>
                        <span className="val">{activeChallan.builderName} ({activeChallan.siteLocation})</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Location Detail */}
                  <div className="logistics-details-card">
                    <div className="card-heading">
                      <MapPin size={16} /> Shipping Destination
                    </div>
                    <p style={{ fontSize: '13px', margin: 0, padding: '10px 14px', background: '#f8fafc', borderRadius: '4px', borderLeft: '3px solid var(--primary-light)' }}>
                      {activeChallan.deliveryLocation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Timelines */}
              <div className="timeline-section">
                <h4>Dispatch Activity & Timeline Log</h4>
                <div className="vertical-timeline">
                  {activeChallan.trackingTimeline && activeChallan.trackingTimeline.map((tl, i) => (
                    <div className="timeline-node" key={i}>
                      <div className="timeline-dot-wrapper">
                        <div className={`timeline-dot ${tl.status.toLowerCase().replace(' ', '-')}`}></div>
                      </div>
                      <div className="timeline-content-card">
                        <div className="node-title-row">
                          <span className="node-status">{tl.status}</span>
                          <span className="node-time"><Calendar size={10} style={{ display: 'inline', marginRight: '4px' }} />{tl.timestamp.split(',')[0]} <Clock size={10} style={{ display: 'inline', margin: '0 4px' }} />{tl.timestamp.split(',')[1] || ''}</span>
                        </div>
                        <p className="node-remarks">{tl.remarks}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="select-prompt">
              <Truck size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3>Select a Dispatch Job</h3>
              <p>Choose an item from the sidebar list to view its active logistics, dispatch timeline, and live simulation map.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delivery Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'var(--primary)' }}>Confirm Site Handover</DialogTitle>
        <DialogContent>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Input customer handover signature notes or remarks to finalize the delivery of challan <strong>{activeChallan?.id}</strong>.
          </p>
          <TextField
            label="Handover Notes / Acknowledgment"
            value={confirmRemarks}
            onChange={(e) => setConfirmRemarks(e.target.value)}
            placeholder="e.g. Received by Site Supervisor Keith. Cargo intact."
            multiline
            rows={3}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelivery} variant="contained" color="success">
            Confirm & Complete
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx="true">{`
        .dispatch-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 20px;
          height: calc(100vh - 180px);
          min-height: 550px;
        }

        @media (max-width: 960px) {
          .dispatch-layout {
            grid-template-columns: 1fr;
            height: auto;
          }
        }

        .dispatch-list-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-search-bar {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #f8fafc;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px 10px;
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 6px;
        }

        .search-input-wrapper input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13px;
          color: var(--text-main);
        }

        .filter-select {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 13px;
          outline: none;
        }

        .dispatch-items {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .empty-message {
          padding: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        .dispatch-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dispatch-card:hover {
          border-color: var(--primary-light);
          background: #f8fafc;
        }

        .dispatch-card.active {
          border-color: var(--primary);
          background: rgba(59, 130, 246, 0.04);
          box-shadow: 0 0 0 1px var(--primary);
        }

        .dispatch-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .dispatch-card-id {
          font-weight: 600;
          font-size: 13px;
          color: var(--primary);
        }

        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.draft { background: #e2e8f0; color: #475569; }
        .status-badge.dispatched { background: #dbeafe; color: #1e40af; }
        .status-badge.in-transit { background: #fef3c7; color: #d97706; }
        .status-badge.delivered { background: #d1fae5; color: #065f46; }

        .dispatch-card-body .customer-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-main);
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .delivery-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .delivery-destination {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Right Panel styling */
        .dispatch-dashboard-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .select-prompt {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }

        .select-prompt h3 {
          font-size: 16px;
          margin-bottom: 8px;
          color: var(--text-main);
        }

        .select-prompt p {
          font-size: 13px;
          color: var(--text-muted);
          max-width: 320px;
        }

        .dashboard-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
        }

        .details-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--secondary);
          margin: 0 0 4px 0;
        }

        .customer-sub {
          font-size: 13px;
          color: var(--text-muted);
        }

        .action-buttons-wrapper {
          display: flex;
          gap: 8px;
        }

        .btn-action {
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: white;
        }

        .dispatch-btn { background: #3b82f6; }
        .dispatch-btn:hover { background: #2563eb; }
        .transit-btn { background: #f59e0b; }
        .transit-btn:hover { background: #d97706; }
        .deliver-btn { background: #10b981; }
        .deliver-btn:hover { background: #059669; }

        /* Stepper Horizontal */
        .stepper-wrapper {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px 24px;
        }

        .stepper-horizontal {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: bold;
          background: #e2e8f0;
          color: #94a3b8;
          transition: all 0.3s;
          border: 2px solid white;
        }

        .step-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          margin-top: 6px;
        }

        .step-line {
          flex: 1;
          height: 3px;
          background: #e2e8f0;
          margin: 0 -10px;
          transform: translateY(-11px);
        }

        .step-item.completed .step-circle {
          background: var(--accent);
          color: white;
        }

        .step-item.completed .step-label {
          color: var(--accent);
          font-weight: 600;
        }

        /* Dashboard Grid Map + Crew details */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }

        @media (max-width: 760px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .map-card {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--surface);
          box-shadow: var(--shadow-sm);
        }

        .card-heading {
          background: #f8fafc;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .map-canvas {
          height: 240px;
          position: relative;
        }

        /* Map Animations and SVG styles */
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .ping-depot, .ping-dest {
          transform-origin: center;
          animation: ping 1.5s ease-out infinite;
        }

        .live-pill {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(16, 185, 129, 0.95);
          color: white;
          font-size: 11px;
          font-weight: bold;
          padding: 3px 8px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }

        .live-dot {
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          display: inline-block;
          animation: blink 1s infinite alternate;
        }

        @keyframes blink {
          from { opacity: 0.3; }
          to { opacity: 1; }
        }

        /* Logistics Detail cards */
        .logistics-details-card {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          box-shadow: var(--shadow-sm);
          padding-bottom: 10px;
        }

        .details-table {
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          border-bottom: 1px dashed #f1f5f9;
          padding-bottom: 4px;
        }

        .detail-row .lbl {
          color: var(--text-muted);
        }

        .detail-row .val {
          font-weight: 500;
          color: var(--text-main);
        }

        /* Activity timeline log */
        .timeline-section h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: var(--text-main);
        }

        .vertical-timeline {
          display: flex;
          flex-direction: column;
          gap: 0px;
          padding-left: 10px;
        }

        .timeline-node {
          display: flex;
          gap: 16px;
          position: relative;
        }

        .timeline-node::after {
          content: '';
          position: absolute;
          left: 17px;
          top: 24px;
          bottom: -12px;
          width: 2px;
          background: var(--border);
          z-index: 1;
        }

        .timeline-node:last-child::after {
          display: none;
        }

        .timeline-dot-wrapper {
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 2;
          width: 36px;
          padding-top: 8px;
        }

        .timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          background: #94a3b8;
          box-shadow: 0 0 0 2px #cbd5e1;
        }

        .timeline-dot.draft { background: #94a3b8; box-shadow: 0 0 0 2px #e2e8f0; }
        .timeline-dot.dispatched { background: #3b82f6; box-shadow: 0 0 0 2px #dbeafe; }
        .timeline-dot.in-transit { background: #f59e0b; box-shadow: 0 0 0 2px #fef3c7; }
        .timeline-dot.delivered { background: #10b981; box-shadow: 0 0 0 2px #d1fae5; }

        .timeline-content-card {
          flex: 1;
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 12px;
        }

        .node-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .node-status {
          font-weight: 600;
          font-size: 13px;
          color: var(--text-main);
        }

        .node-time {
          font-size: 11px;
          color: var(--text-muted);
        }

        .node-remarks {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default DispatchTracking;

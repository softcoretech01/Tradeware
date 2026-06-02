import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Chip, Paper, Box, Grid, Typography, Card, CardContent,
  Alert, AlertTitle, Tabs, Tab
} from '@mui/material';
import {
  Search, FileSpreadsheet, FileText, CheckCircle, XCircle, AlertTriangle,
  Lock, Edit3, ClipboardCheck, ArrowUpRight, DollarSign, Percent, Info,
  TrendingUp, Users, Plus, Trash2, ShieldCheck, Tag, Calendar
} from 'lucide-react';
import { updateItem } from '../../store/itemsSlice';
import { updateBatchPricing } from '../../store/batchImportSlice';
import { addApprovalRequest, processApproval } from '../../store/erpSlice';
import { exportToExcel, exportToPDF } from '../../utils/exportUtil';

const BLUE = { main: '#1E3A8A', light: '#3B82F6', dark: '#172554', bg: '#EFF6FF' };
const GREEN = { main: '#15803D', light: '#22C55E', bg: '#DCFCE7' };
const RED = { main: '#B91C1C', light: '#EF4444', bg: '#FEE2E2' };
const AMBER = { main: '#B45309', light: '#F59E0B', bg: '#FEF3C7' };
const SLATE = { main: '#475569', light: '#94A3B8', bg: '#F1F5F9' };

const PricingManagement = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const items = useSelector(state => state.items.items);
  const customers = useSelector(state => state.customers.customers);
  const batches = useSelector(state => state.batchImport.batches);
  const approvalRequests = useSelector(state => state.erp.approvalRequests);
  const currentUser = useSelector(state => state.erp.currentUser);
  const activeRole = currentUser?.role || 'Admin';

  // Tabs state
  const [activeTab, setActiveTab] = useState(0);

  // SEARCHES & FILTERS
  const [tierSearch, setTierSearch] = useState('');
  const [tierGroup, setTierGroup] = useState('All');
  const [tierCategory, setTierCategory] = useState('All');
  const [tierPage, setTierPage] = useState(1);

  const [projectSearch, setProjectSearch] = useState('');
  
  const [batchSearch, setBatchSearch] = useState('');
  const [batchMarginFilter, setBatchMarginFilter] = useState('All');
  const [batchPage, setBatchPage] = useState(1);

  const pageSize = 6;

  // MODALS & DIALOGS
  const [editTierOpen, setEditTierOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  
  const [editBatchOpen, setEditBatchOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // FORM FIELDS - Edit Tier Price
  const [tierForm, setTierForm] = useState({
    standardPrice: '',
    buildersPrice: '',
    dealersPrice: '',
    contractorsPrice: '',
    houseOwnersPrice: ''
  });

  // FORM FIELDS - New Project Price Contract
  const [projectForm, setProjectForm] = useState({
    customerId: '',
    projectName: '',
    itemId: '',
    specialRate: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });

  // FORM FIELDS - Edit Batch Price
  const [batchPriceInput, setBatchPriceInput] = useState('');

  // DISCOUNT CONFIGURATION STATE
  const [discountLimits, setDiscountLimits] = useState({
    maxLineDiscount: 10.0,
    maxOverallDiscount: 15.0
  });

  // TRANSACTION SIMULATOR STATE
  const [simCustomer, setSimCustomer] = useState('');
  const [simProject, setSimProject] = useState('');
  const [simLines, setSimLines] = useState([
    { itemId: '', qty: 1, lineDiscount: 0 }
  ]);
  const [simOverallDiscount, setSimOverallDiscount] = useState(0);
  const [simulatedSuccessfully, setSimulatedSuccessfully] = useState(false);

  // LOCAL STATE - Project contracts (pre-seeded)
  const [projectContracts, setProjectContracts] = useState([
    {
      id: 'PRC-001',
      customerId: 'CUST-1',
      customerName: 'ACE FIRE ENGINEERING PTE LTD',
      projectName: 'Changi Airport T5 Fire System',
      itemId: 'ITM05316',
      itemName: 'Pin Piston Sanchin 120',
      specialRate: 105.0,
      startDate: '2026-05-01',
      endDate: '2026-12-31',
      status: 'Active'
    },
    {
      id: 'PRC-002',
      customerId: 'CUST-2',
      customerName: 'AIR LIQUIDE SINGAPORE PTE LTD',
      projectName: 'Woodlands Gas Pipeline Expansion',
      itemId: 'ITM05315',
      itemName: 'Stang Piston Sanchin 120',
      specialRate: 200.0,
      startDate: '2026-04-15',
      endDate: '2026-10-15',
      status: 'Active'
    }
  ]);

  // Derived statistics for cards
  const stats = useMemo(() => {
    const totalItems = items.length;
    const activeProjectRates = projectContracts.filter(c => c.status === 'Active').length;
    const pendingDiscountApprovals = approvalRequests.filter(
      r => r.module === 'Pricing Management' && r.type === 'Discount Approval' && r.status === 'Pending'
    ).length;

    // Avg batch margin
    let sumMargin = 0;
    batches.forEach(b => sumMargin += b.marginPercent);
    const avgMargin = batches.length ? sumMargin / batches.length : 0;

    return {
      totalItems,
      activeProjectRates,
      avgMargin,
      pendingDiscountApprovals
    };
  }, [items, projectContracts, approvalRequests, batches]);

  // TAB 1: Filtered Standard & Tier Prices
  const filteredTiers = useMemo(() => {
    return items.filter(item => {
      const matchSearch =
        item.id.toLowerCase().includes(tierSearch.toLowerCase()) ||
        item.name.toLowerCase().includes(tierSearch.toLowerCase()) ||
        item.brand?.toLowerCase().includes(tierSearch.toLowerCase());
      
      const matchGroup = tierGroup === 'All' || item.group === tierGroup;
      const matchCat = tierCategory === 'All' || item.category === tierCategory;

      return matchSearch && matchGroup && matchCat;
    });
  }, [items, tierSearch, tierGroup, tierCategory]);

  const paginatedTiers = useMemo(() => {
    const startIndex = (tierPage - 1) * pageSize;
    return filteredTiers.slice(startIndex, startIndex + pageSize);
  }, [filteredTiers, tierPage]);

  const tierTotalPages = Math.ceil(filteredTiers.length / pageSize) || 1;

  // TAB 2: Filtered Project Contracts
  const filteredProjectContracts = useMemo(() => {
    return projectContracts.filter(c => {
      return (
        c.customerName.toLowerCase().includes(projectSearch.toLowerCase()) ||
        c.projectName.toLowerCase().includes(projectSearch.toLowerCase()) ||
        c.itemName.toLowerCase().includes(projectSearch.toLowerCase())
      );
    });
  }, [projectContracts, projectSearch]);

  // TAB 3: Filtered Batch Pricing
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchSearch =
        b.batchNo.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.itemCode.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.itemName.toLowerCase().includes(batchSearch.toLowerCase());
      
      const isLow = b.marginPercent < 15.0;
      const matchMargin =
        batchMarginFilter === 'All' ||
        (batchMarginFilter === 'Low' && isLow) ||
        (batchMarginFilter === 'Normal' && !isLow);

      return matchSearch && matchMargin;
    });
  }, [batches, batchSearch, batchMarginFilter]);

  const paginatedBatches = useMemo(() => {
    const startIndex = (batchPage - 1) * pageSize;
    return filteredBatches.slice(startIndex, startIndex + pageSize);
  }, [filteredBatches, batchPage]);

  const batchTotalPages = Math.ceil(filteredBatches.length / pageSize) || 1;

  // Unique groups and categories list
  const uniqueGroups = useMemo(() => {
    return ['All', ...new Set(items.map(i => i.group).filter(Boolean))];
  }, [items]);

  const uniqueCategories = useMemo(() => {
    return ['All', ...new Set(items.map(i => i.category).filter(Boolean))];
  }, [items]);

  // Projects list for the selected customer in simulator
  const simCustomerProjects = useMemo(() => {
    if (!simCustomer) return [];
    const cust = customers.find(c => c.id === simCustomer);
    return cust?.projects || [];
  }, [simCustomer, customers]);

  // Base prices derived in simulation for each line
  const simulatedInvoice = useMemo(() => {
    let rawSubtotal = 0;
    let totalLineDiscount = 0;
    let lineWarnings = [];
    const custObj = customers.find(c => c.id === simCustomer);
    const customerType = custObj ? custObj.type : 'Builders'; // default

    const processedLines = simLines.map((line, idx) => {
      if (!line.itemId) return { ...line, basePrice: 0, lineTotal: 0 };
      const itemObj = items.find(i => i.id === line.itemId);
      if (!itemObj) return { ...line, basePrice: 0, lineTotal: 0 };

      // 1. Resolve project contract price if project is selected
      let basePrice = 0;
      let matchedContract = null;

      if (simCustomer && simProject) {
        matchedContract = projectContracts.find(
          c => c.customerId === simCustomer &&
               c.projectName === simProject &&
               c.itemId === line.itemId &&
               c.status === 'Active'
        );
      }

      if (matchedContract) {
        basePrice = matchedContract.specialRate;
      } else {
        // 2. Resolve pricing tier based on customer type
        if (customerType === 'Builders') basePrice = itemObj.buildersPrice;
        else if (customerType === 'Dealers') basePrice = itemObj.dealersPrice;
        else if (customerType === 'Contractors') basePrice = itemObj.contractorsPrice;
        else if (customerType === 'House Owners') basePrice = itemObj.houseOwnersPrice;

        // Fallback to standard price if tier price is empty/zero
        if (!basePrice || Number(basePrice) === 0) {
          basePrice = itemObj.standardPrice || 100.0;
        }
      }

      const grossAmount = line.qty * basePrice;
      const lineDiscPercent = Number(line.lineDiscount || 0);
      const lineDiscAmount = grossAmount * (lineDiscPercent / 100);
      const lineTotal = grossAmount - lineDiscAmount;

      rawSubtotal += grossAmount;
      totalLineDiscount += lineDiscAmount;

      if (lineDiscPercent > discountLimits.maxLineDiscount) {
        lineWarnings.push(`Line #${idx + 1} (${itemObj.name}) discount of ${lineDiscPercent}% exceeds limit of ${discountLimits.maxLineDiscount}%`);
      }

      return {
        ...line,
        itemName: itemObj.name,
        basePrice,
        grossAmount,
        lineDiscAmount,
        lineTotal,
        pricingMethod: matchedContract ? 'Project Rate' : `${customerType === 'Builders' ? 'Retailer' : customerType === 'Dealers' ? 'Wholesaler' : customerType === 'Contractors' ? 'Project Based' : customerType} Price`
      };
    });

    const netSubtotal = rawSubtotal - totalLineDiscount;
    const overallDiscPercent = Number(simOverallDiscount || 0);
    const overallDiscAmount = netSubtotal * (overallDiscPercent / 100);
    const billingSubtotal = netSubtotal - overallDiscAmount;
    
    // 18% GST standard
    const gstAmount = billingSubtotal * 0.18;
    const finalTotal = billingSubtotal + gstAmount;

    let overallWarning = '';
    if (overallDiscPercent > discountLimits.maxOverallDiscount) {
      overallWarning = `Overall invoice discount of ${overallDiscPercent}% exceeds policy threshold of ${discountLimits.maxOverallDiscount}%`;
    }

    const hasViolation = lineWarnings.length > 0 || !!overallWarning;

    return {
      lines: processedLines,
      rawSubtotal,
      totalLineDiscount,
      netSubtotal,
      overallDiscAmount,
      billingSubtotal,
      gstAmount,
      finalTotal,
      lineWarnings,
      overallWarning,
      hasViolation
    };
  }, [simCustomer, simProject, simLines, simOverallDiscount, items, customers, projectContracts, discountLimits]);

  // HANDLERS - EDIT TIER PRICES
  const handleOpenEditTier = (item) => {
    setSelectedItem(item);
    setTierForm({
      standardPrice: item.standardPrice || '',
      buildersPrice: item.buildersPrice || '',
      dealersPrice: item.dealersPrice || '',
      contractorsPrice: item.contractorsPrice || '',
      houseOwnersPrice: item.houseOwnersPrice || ''
    });
    setEditTierOpen(true);
  };

  const handleSaveTiers = () => {
    if (!selectedItem) return;
    const updated = {
      ...selectedItem,
      standardPrice: Number(tierForm.standardPrice) || 0,
      buildersPrice: Number(tierForm.buildersPrice) || 0,
      dealersPrice: Number(tierForm.dealersPrice) || 0,
      contractorsPrice: Number(tierForm.contractorsPrice) || 0,
      houseOwnersPrice: Number(tierForm.houseOwnersPrice) || 0
    };

    dispatch(updateItem(updated));
    setEditTierOpen(false);
    setSelectedItem(null);
  };

  // HANDLERS - PROJECT CONTRACTS
  const handleOpenAddProject = () => {
    const firstCust = customers[0];
    const firstItem = items[0];
    setProjectForm({
      customerId: firstCust ? firstCust.id : '',
      projectName: firstCust?.projects?.[0]?.name || '',
      itemId: firstItem ? firstItem.id : '',
      specialRate: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });
    setAddProjectOpen(true);
  };

  const handleSaveProjectContract = () => {
    const { customerId, projectName, itemId, specialRate, startDate, endDate } = projectForm;
    if (!customerId || !projectName || !itemId || !specialRate) {
      alert('Please fill out all contract fields.');
      return;
    }

    const custObj = customers.find(c => c.id === customerId);
    const itemObj = items.find(i => i.id === itemId);

    const newContract = {
      id: `PRC-${String(projectContracts.length + 1).padStart(3, '0')}`,
      customerId,
      customerName: custObj ? custObj.name : 'Unknown Customer',
      projectName,
      itemId,
      itemName: itemObj ? itemObj.name : 'Unknown Item',
      specialRate: Number(specialRate),
      startDate,
      endDate,
      status: 'Active'
    };

    setProjectContracts(prev => [newContract, ...prev]);
    setAddProjectOpen(false);
  };

  const handleDeleteProjectContract = (id) => {
    setProjectContracts(prev => prev.filter(c => c.id !== id));
  };

  // HANDLERS - EDIT BATCH PRICE
  const handleOpenEditBatch = (batch) => {
    setSelectedBatch(batch);
    setBatchPriceInput(String(batch.finalSellingPrice));
    setEditBatchOpen(true);
  };

  const handleSaveBatchPrice = () => {
    if (!selectedBatch || !batchPriceInput) return;
    const price = Number(batchPriceInput);
    const cost = selectedBatch.landedUnitCost;
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;

    dispatch(updateBatchPricing({
      batchNo: selectedBatch.batchNo,
      finalSellingPrice: price,
      marginPercent: margin
    }));

    setEditBatchOpen(false);
    setSelectedBatch(null);
  };

  // HANDLERS - EXPORTS
  const handleExportTiersExcel = () => {
    const data = filteredTiers.map(t => ({
      'Item Code': t.id,
      'Group': t.group,
      'Category': t.category,
      'Name': t.name,
      'Brand': t.brand,
      'UOM': t.uom,
      'Standard Price (INR)': t.standardPrice || 0,
      'Retailer Price (INR)': t.buildersPrice || 0,
      'Wholesaler Price (INR)': t.dealersPrice || 0,
      'Project Based Price (INR)': t.contractorsPrice || 0
    }));
    exportToExcel(data, `Customer_Tiers_Pricing_${new Date().toISOString().split('T')[0]}`, 'Tiers List');
  };

  const handleExportTiersPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Code' },
      { field: 'name', headerName: 'Item Name' },
      { field: 'standardPrice', headerName: 'Standard' },
      { field: 'buildersPrice', headerName: 'Retailer' },
      { field: 'dealersPrice', headerName: 'Wholesaler' },
      { field: 'contractorsPrice', headerName: 'Project Based' }
    ];
    exportToPDF(cols, filteredTiers, `Customer_Tiers_Pricing_${new Date().toISOString().split('T')[0]}`, 'Customer Tier Prices');
  };

  // HANDLERS - TRANSACTION SIMULATOR
  const handleAddSimLine = () => {
    setSimLines(prev => [...prev, { itemId: items[0]?.id || '', qty: 1, lineDiscount: 0 }]);
  };

  const handleRemoveSimLine = (idx) => {
    if (simLines.length <= 1) return;
    setSimLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSimLine = (idx, field, value) => {
    setSimLines(prev => prev.map((l, i) => {
      if (i === idx) {
        return { ...l, [field]: value };
      }
      return l;
    }));
  };

  const handleProcessTransaction = () => {
    if (!simCustomer) {
      alert('Please select a customer.');
      return;
    }
    if (simLines.some(l => !l.itemId)) {
      alert('Please select items for all lines.');
      return;
    }

    setSimulatedSuccessfully(true);
    setTimeout(() => setSimulatedSuccessfully(false), 4000);

    // Clear simulator
    setSimCustomer('');
    setSimProject('');
    setSimLines([{ itemId: items[0]?.id || '', qty: 1, lineDiscount: 0 }]);
    setSimOverallDiscount(0);
  };

  const handleSubmitDiscountApproval = () => {
    if (!simCustomer) return;
    const custObj = customers.find(c => c.id === simCustomer);
    const customerName = custObj ? custObj.name : 'Unknown Customer';
    
    // Construct violation messages
    const warnings = [...simulatedInvoice.lineWarnings];
    if (simulatedInvoice.overallWarning) warnings.push(simulatedInvoice.overallWarning);
    const detailsStr = `Customer: ${customerName}. Violation Details: ${warnings.join('; ')}. Subtotal: ₹${simulatedInvoice.netSubtotal?.toFixed(2)}. Net Payable: ₹${simulatedInvoice.finalTotal?.toFixed(2)}.`;

    const approvalPayload = {
      id: `APR-2026-${String(approvalRequests.length + 1).padStart(3, '0')}`,
      module: 'Pricing Management',
      type: 'Discount Approval',
      referenceId: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      requestedBy: currentUser?.name || 'Luke Skywalker',
      requestDate: new Date().toISOString().split('T')[0],
      details: detailsStr,
      status: 'Pending',
      remarks: '',
      history: [
        { status: 'Submitted', timestamp: new Date().toLocaleString(), user: currentUser?.name || 'Luke Skywalker', remarks: 'Request submitted for excess discount authorization.' }
      ]
    };

    dispatch(addApprovalRequest(approvalPayload));
    alert('Discount approval request has been logged and routed to manager queue.');

    // Clear simulator
    setSimCustomer('');
    setSimProject('');
    setSimLines([{ itemId: items[0]?.id || '', qty: 1, lineDiscount: 0 }]);
    setSimOverallDiscount(0);
  };

  // Managers/Admins can authorize directly
  const handleApproveDiscount = (id) => {
    dispatch(processApproval({ id, decision: 'Approved', remarks: 'Approved from pricing center', user: currentUser?.name || 'Tony Stark' }));
    alert('Request approved successfully.');
  };

  const handleRejectDiscount = (id) => {
    dispatch(processApproval({ id, decision: 'Rejected', remarks: 'Discount exceeds allowed policies', user: currentUser?.name || 'Tony Stark' }));
    alert('Request rejected.');
  };

  // Pricing-specific approval requests list
  const pendingApprovals = useMemo(() => {
    return approvalRequests.filter(
      r => r.module === 'Pricing Management' && r.type === 'Discount Approval'
    );
  }, [approvalRequests]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }} className="fade-in">
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: BLUE.main, letterSpacing: -0.5 }}>
            Pricing & Discount Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Configure client tiers, project-specific contracts, batch margin controls, and simulate transaction discount rules.
          </Typography>
        </Box>
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={handleExportTiersExcel}
              startIcon={<FileSpreadsheet size={18} />}
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: BLUE.light, color: BLUE.light }}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              onClick={handleExportTiersPDF}
              startIcon={<FileText size={18} />}
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: BLUE.light, color: BLUE.light }}
            >
              Export PDF
            </Button>
          </Box>
        )}
        
      </Box>

      {/* KPI METRIC CARDS */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: BLUE.bg }}>
                <Tag size={24} style={{ color: BLUE.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Item Registry</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.totalItems} Products</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: GREEN.bg }}>
                <Users size={24} style={{ color: GREEN.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Active Project Contracts</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.activeProjectRates} Rules</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: AMBER.bg }}>
                <TrendingUp size={24} style={{ color: AMBER.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Avg. Batch Margin</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.avgMargin?.toFixed(1)}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined" sx={{ borderColor: stats.pendingDiscountApprovals > 0 ? RED.light : 'inherit' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: stats.pendingDiscountApprovals > 0 ? RED.bg : SLATE.bg }}>
                <Lock size={24} style={{ color: stats.pendingDiscountApprovals > 0 ? RED.main : SLATE.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Discount Approvals Needed</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: stats.pendingDiscountApprovals > 0 ? RED.main : 'inherit' }}>
                  {stats.pendingDiscountApprovals} Pending
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABS CONTAINER */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }} variant="outlined">
        <Tabs
          value={activeTab}
          onChange={(e, nv) => setActiveTab(nv)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            backgroundColor: '#ffffff',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              py: 2
            }
          }}
        >
          <Tab label="Standard & Customer Tiers" />
          <Tab label="Batch-Wise pricing" />
        </Tabs>
      </Paper>

      {/* TAB 1: STANDARD & CUSTOMER TIERS */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <div className="filter-panel">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by code, brand, or item name..."
                value={tierSearch}
                onChange={(e) => { setTierSearch(e.target.value); setTierPage(1); }}
              />
            </div>
            <div className="filter-selects">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={tierGroup}
                  onChange={(e) => { setTierGroup(e.target.value); setTierPage(1); }}
                  displayEmpty
                >
                  <MenuItem value="All">All Groups</MenuItem>
                  {uniqueGroups.filter(g => g !== 'All').map(g => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={tierCategory}
                  onChange={(e) => { setTierCategory(e.target.value); setTierPage(1); }}
                  displayEmpty
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  {uniqueCategories.filter(c => c !== 'All').map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          <div className="grid-card">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Group</th>
                  <th>Category</th>
                  <th>Item Name</th>
                  <th>Standard Price</th>
                  <th>Retailer Price</th>
                  <th>Wholesaler Price</th>
                  <th>Project Based Price</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTiers.length > 0 ? (
                  paginatedTiers.map(t => (
                    <tr key={t.id}>
                      <td className="bold-cell">{t.id}</td>
                      <td><Chip label={t.group} size="small" style={{ backgroundColor: SLATE.bg, color: SLATE.main, fontWeight: 700 }} /></td>
                      <td>{t.category}</td>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td className="bold-cell">₹{t.standardPrice || 0}</td>
                      <td>₹{t.buildersPrice || 0}</td>
                      <td>₹{t.dealersPrice || 0}</td>
                      <td>₹{t.contractorsPrice || 0}</td>
                      <td className="actions-cell">
                        <Tooltip title="Edit Customer Tiers">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEditTier(t)}
                            sx={{ p: 1 }}
                          >
                            <Edit3 size={20} />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="table-empty">
                      No items matched search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {tierTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Showing Page {tierPage} of {tierTotalPages} ({filteredTiers.length} total products)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={tierPage === 1}
                  onClick={() => setTierPage(prev => prev - 1)}
                  sx={{ textTransform: 'none' }}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={tierPage === tierTotalPages}
                  onClick={() => setTierPage(prev => prev + 1)}
                  sx={{ textTransform: 'none' }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* TAB 2: BATCH-WISE PRICING */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <div className="filter-panel">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by batch number or item name..."
                value={batchSearch}
                onChange={(e) => { setBatchSearch(e.target.value); setBatchPage(1); }}
              />
            </div>
            <div className="filter-selects">
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                  value={batchMarginFilter}
                  onChange={(e) => { setBatchMarginFilter(e.target.value); setBatchPage(1); }}
                  displayEmpty
                >
                  <MenuItem value="All">All Margin Ranges</MenuItem>
                  <MenuItem value="Low">Low Margin (&lt;15%)</MenuItem>
                  <MenuItem value="Normal">Healthy Margin (&ge;15%)</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          <div className="grid-card">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Batch No</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Landed Cost (INR)</th>
                  <th>Final Selling Price</th>
                  <th>Gross Margin (%)</th>
                  <th>Batch Status</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBatches.length > 0 ? (
                  paginatedBatches.map(b => {
                    const isLow = b.marginPercent < 15.0;
                    return (
                      <tr key={b.batchNo} style={{ backgroundColor: isLow ? 'rgba(239, 68, 68, 0.01)' : 'inherit' }}>
                        <td className="bold-cell">{b.batchNo}</td>
                        <td>{b.itemCode}</td>
                        <td>{b.itemName}</td>
                        <td>₹{b.landedUnitCost?.toFixed(2)}</td>
                        <td className="bold-cell">₹{b.finalSellingPrice?.toFixed(2)}</td>
                        <td className="bold-cell" style={{ color: isLow ? RED.main : GREEN.main }}>
                          {b.marginPercent?.toFixed(1)}%
                        </td>
                        <td>
                          <Chip
                            label={b.status}
                            size="small"
                            style={{
                              backgroundColor: b.status === 'Available' ? GREEN.bg : b.status === 'On Hold' ? AMBER.bg : RED.bg,
                              color: b.status === 'Available' ? GREEN.main : b.status === 'On Hold' ? AMBER.main : RED.main,
                              fontWeight: 700
                            }}
                          />
                        </td>
                        <td className="actions-cell">
                          <Tooltip title="Modify Batch Price">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenEditBatch(b)}
                              sx={{ p: 1 }}
                            >
                              <Edit3 size={20} />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="table-empty">
                      No batches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {batchTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Showing Page {batchPage} of {batchTotalPages} ({filteredBatches.length} total batches)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={batchPage === 1}
                  onClick={() => setBatchPage(prev => prev - 1)}
                  sx={{ textTransform: 'none' }}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={batchPage === batchTotalPages}
                  onClick={() => setBatchPage(prev => prev + 1)}
                  sx={{ textTransform: 'none' }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* EDIT TIER PRICES MODAL */}
      <Dialog open={editTierOpen} onClose={() => setEditTierOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="dialog-title">
          Configure Price Tiers
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Configure pricing levels for <strong>{selectedItem?.name}</strong> ({selectedItem?.id}).
          </Typography>

          <TextField
            fullWidth
            label="Standard Retail Price (INR)"
            type="number"
            value={tierForm.standardPrice}
            onChange={(e) => setTierForm(prev => ({ ...prev, standardPrice: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Retailer Price (INR)"
            type="number"
            value={tierForm.buildersPrice}
            onChange={(e) => setTierForm(prev => ({ ...prev, buildersPrice: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Wholesaler Price (INR)"
            type="number"
            value={tierForm.dealersPrice}
            onChange={(e) => setTierForm(prev => ({ ...prev, dealersPrice: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Project Based Price (INR)"
            type="number"
            value={tierForm.contractorsPrice}
            onChange={(e) => setTierForm(prev => ({ ...prev, contractorsPrice: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditTierOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveTiers} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Save Pricing Tiers
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT BATCH SELLING PRICE MODAL */}
      <Dialog open={editBatchOpen} onClose={() => setEditBatchOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="dialog-title">
          Modify Batch Selling Price
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Update the selling price for batch <strong>{selectedBatch?.batchNo}</strong>.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, backgroundColor: SLATE.bg }}>
            <Typography variant="caption" color="text.secondary">Landed Cost Price (INR):</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: BLUE.dark }}>
              ₹{selectedBatch?.landedUnitCost?.toFixed(2)}
            </Typography>
          </Paper>

          <TextField
            fullWidth
            label="New Selling Price (INR)"
            type="number"
            value={batchPriceInput}
            onChange={(e) => setBatchPriceInput(e.target.value)}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Calculated Gross Margin:</Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 800,
                color: (selectedBatch && batchPriceInput && ((Number(batchPriceInput) - selectedBatch.landedUnitCost) / Number(batchPriceInput)) * 100 < 15.0) ? RED.main : GREEN.main
              }}
            >
              {selectedBatch && batchPriceInput ? (((Number(batchPriceInput) - selectedBatch.landedUnitCost) / Number(batchPriceInput)) * 100).toFixed(1) : '0.0'}%
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditBatchOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveBatchPrice} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Update Price
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PricingManagement;

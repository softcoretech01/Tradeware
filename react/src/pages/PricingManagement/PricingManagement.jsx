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
        pricingMethod: matchedContract ? 'Project Rate' : `${customerType} Tier`
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
      'Builders Tier (INR)': t.buildersPrice || 0,
      'Dealers Tier (INR)': t.dealersPrice || 0,
      'Contractors Tier (INR)': t.contractorsPrice || 0,
      'House Owners Tier (INR)': t.houseOwnersPrice || 0
    }));
    exportToExcel(data, `Customer_Tiers_Pricing_${new Date().toISOString().split('T')[0]}`, 'Tiers List');
  };

  const handleExportTiersPDF = () => {
    const cols = [
      { field: 'id', headerName: 'Code' },
      { field: 'name', headerName: 'Item Name' },
      { field: 'standardPrice', headerName: 'Standard' },
      { field: 'buildersPrice', headerName: 'Builder' },
      { field: 'dealersPrice', headerName: 'Dealer' },
      { field: 'contractorsPrice', headerName: 'Contractor' },
      { field: 'houseOwnersPrice', headerName: 'House Owner' }
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
        {activeTab === 1 && (
          <Button
            variant="contained"
            onClick={handleOpenAddProject}
            startIcon={<Plus size={18} />}
            sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: BLUE.main }}
          >
            Create Project Contract
          </Button>
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
          <Tab label="Project-Wise pricing" />
          <Tab label="Batch-Wise pricing" />
          <Tab label="Discount Calculator & Simulator" />
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
                  <th>Builders Tier</th>
                  <th>Dealers Tier</th>
                  <th>Contractors Tier</th>
                  <th>House Owners Tier</th>
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
                      <td>₹{t.houseOwnersPrice || 0}</td>
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
                    <td colSpan={10} className="table-empty">
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

      {/* TAB 2: PROJECT-WISE PRICING */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <div className="filter-panel">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by customer, project, or item..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-card">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Customer Name</th>
                  <th>Project Name</th>
                  <th>Item Name</th>
                  <th>Special Project Rate</th>
                  <th>Start Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjectContracts.length > 0 ? (
                  filteredProjectContracts.map(c => (
                    <tr key={c.id}>
                      <td className="bold-cell">{c.id}</td>
                      <td style={{ fontWeight: 600 }}>{c.customerName}</td>
                      <td>{c.projectName}</td>
                      <td className="bold-cell">{c.itemName}</td>
                      <td className="bold-cell" style={{ color: BLUE.main }}>₹{c.specialRate?.toFixed(2)}</td>
                      <td><Calendar size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> {c.startDate}</td>
                      <td><Calendar size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> {c.endDate}</td>
                      <td>
                        <Chip label={c.status} size="small" style={{ backgroundColor: GREEN.bg, color: GREEN.main, fontWeight: 700 }} />
                      </td>
                      <td className="actions-cell">
                        <Tooltip title="Delete Contract Rule">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteProjectContract(c.id)}
                            sx={{ p: 1 }}
                          >
                            <Trash2 size={20} />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="table-empty">
                      No project-wise contracts configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Box>
      )}

      {/* TAB 3: BATCH-WISE PRICING */}
      {activeTab === 2 && (
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
                              backgroundColor: b.status === 'Available' ? GREEN.bg : b.status === 'Quarantined' ? AMBER.bg : RED.bg,
                              color: b.status === 'Available' ? GREEN.main : b.status === 'Quarantined' ? AMBER.main : RED.main,
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

      {/* TAB 4: DISCOUNT & TRANSACTION SIMULATOR */}
      {activeTab === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* SIMULATOR CONTROLS */}
          <Grid container spacing={3.5}>
            
            {/* THRESHOLD PARAMETERS PANEL */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1, backgroundColor: BLUE.bg }}>
                  <ShieldCheck size={18} style={{ color: BLUE.main }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main }}>
                    Discount Threshold Controls
                  </Typography>
                </Box>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Configure standard maximum discount percentages. Exceeding these values locks direct transaction billing and routes to management approval queues.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Max Line-Item Discount (%)"
                    type="number"
                    value={discountLimits.maxLineDiscount}
                    onChange={(e) => setDiscountLimits(prev => ({ ...prev, maxLineDiscount: parseFloat(e.target.value) || 0 }))}
                    InputProps={{ endAdornment: <Percent size={16} /> }}
                  />
                  <TextField
                    fullWidth
                    label="Max Overall Invoice Discount (%)"
                    type="number"
                    value={discountLimits.maxOverallDiscount}
                    onChange={(e) => setDiscountLimits(prev => ({ ...prev, maxOverallDiscount: parseFloat(e.target.value) || 0 }))}
                    InputProps={{ endAdornment: <Percent size={16} /> }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* TRANSACT SIMULATION FORM */}
            <Grid item xs={12} md={8}>
              <Card variant="outlined">
                <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ClipboardCheck size={18} style={{ color: BLUE.main }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Sales Billing & Discount Simulator
                  </Typography>
                </Box>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {simulatedSuccessfully && (
                    <Alert severity="success" icon={<CheckCircle size={18} />}>
                      <AlertTitle sx={{ fontWeight: 700 }}>Transaction Processed</AlertTitle>
                      Simulation complete. Pricing logged under standard policy protocols.
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="sim-customer-label">Customer Profile</InputLabel>
                        <Select
                          labelId="sim-customer-label"
                          value={simCustomer}
                          label="Customer Profile"
                          onChange={(e) => { setSimCustomer(e.target.value); setSimProject(''); }}
                        >
                          <MenuItem value="">Select Customer...</MenuItem>
                          {customers.map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.name} ({c.type})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!simCustomer || simCustomerProjects.length === 0}>
                        <InputLabel id="sim-project-label">Customer Bulk Project</InputLabel>
                        <Select
                          labelId="sim-project-label"
                          value={simProject}
                          label="Customer Bulk Project"
                          onChange={(e) => setSimProject(e.target.value)}
                        >
                          <MenuItem value="">None (Standard Tier pricing)</MenuItem>
                          {simCustomerProjects.map((p, idx) => (
                            <MenuItem key={idx} value={p.name}>{p.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* LINES TABLE */}
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Line Items</Typography>
                  {simLines.map((line, idx) => {
                    const resolvedLine = simulatedInvoice.lines[idx] || {};
                    return (
                      <Grid container spacing={2} alignItems="center" key={idx}>
                        <Grid item xs={4}>
                          <FormControl fullWidth size="small">
                            <Select
                              value={line.itemId}
                              onChange={(e) => handleUpdateSimLine(idx, 'itemId', e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="" disabled>Select Item...</MenuItem>
                              {items.map(i => (
                                <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={2}>
                          <TextField
                            size="small"
                            label="Quantity"
                            type="number"
                            value={line.qty}
                            onChange={(e) => handleUpdateSimLine(idx, 'qty', parseInt(e.target.value) || 1)}
                          />
                        </Grid>
                        
                        <Grid item xs={2}>
                          <TextField
                            size="small"
                            label="Line Disc (%)"
                            type="number"
                            value={line.lineDiscount}
                            onChange={(e) => handleUpdateSimLine(idx, 'lineDiscount', parseFloat(e.target.value) || 0)}
                          />
                        </Grid>

                        <Grid item xs={3} sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Unit Price: ₹{resolvedLine.basePrice || 0} ({resolvedLine.pricingMethod || '—'})
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Total: ₹{resolvedLine.lineTotal?.toFixed(2) || '0.00'}
                          </Typography>
                        </Grid>

                        <Grid item xs={1}>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveSimLine(idx)}
                            disabled={simLines.length <= 1}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Grid>
                      </Grid>
                    );
                  })}

                  <Button
                    variant="outlined"
                    startIcon={<Plus size={16} />}
                    onClick={handleAddSimLine}
                    size="small"
                    sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                  >
                    Add Line Item
                  </Button>

                  <Box sx={{ borderTop: '1px solid #e2e8f0', pt: 2, mt: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Overall Invoice Discount (%)"
                          type="number"
                          value={simOverallDiscount}
                          onChange={(e) => setSimOverallDiscount(parseFloat(e.target.value) || 0)}
                          InputProps={{ endAdornment: <Percent size={16} /> }}
                        />
                      </Grid>

                      {/* SUMMARY math */}
                      <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Gross Subtotal:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{simulatedInvoice.rawSubtotal?.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Line Discounts:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: RED.main }}>-₹{simulatedInvoice.totalLineDiscount?.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Overall Discount:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: RED.main }}>-₹{simulatedInvoice.overallDiscAmount?.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Taxable Value:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{simulatedInvoice.billingSubtotal?.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">GST (18%):</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{simulatedInvoice.gstAmount?.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', pt: 1, mt: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Net Total Payable:</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: BLUE.main }}>₹{simulatedInvoice.finalTotal?.toFixed(2)}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* ALERTS & PROMPTS FOR EXCESS DISCOUNTS */}
                  {simulatedInvoice.hasViolation && (
                    <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={{ mt: 1 }}>
                      <AlertTitle sx={{ fontWeight: 700 }}>Excess Discount Limit Reached</AlertTitle>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                        {simulatedInvoice.lineWarnings.map((w, i) => (
                          <Typography variant="caption" key={i} sx={{ display: 'block' }}>• {w}</Typography>
                        ))}
                        {simulatedInvoice.overallWarning && (
                          <Typography variant="caption">• {simulatedInvoice.overallWarning}</Typography>
                        )}
                        <Typography variant="caption" sx={{ mt: 1, fontWeight: 700, color: AMBER.main }}>
                          Direct saving is blocked. Transaction requires manager approval to finalize.
                        </Typography>
                      </Box>
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                    {simulatedInvoice.hasViolation ? (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<Lock size={16} />}
                        onClick={handleSubmitDiscountApproval}
                        disabled={!simCustomer}
                        sx={{ fontWeight: 600 }}
                      >
                        Submit for Excess Approval
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleProcessTransaction}
                        disabled={!simCustomer || simLines.some(l => !l.itemId)}
                        sx={{ backgroundColor: BLUE.main, fontWeight: 600 }}
                      >
                        Finalize & Process Transaction
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* MANAGER AUTHORIZATION INTERACTION BLOCK */}
          <Card variant="outlined">
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1, backgroundColor: BLUE.bg }}>
              <ClipboardCheck size={18} style={{ color: BLUE.main }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BLUE.main }}>
                Manager Excess Discount Approval Queue
              </Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {pendingApprovals.length > 0 ? (
                <table className="erp-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Requested By</th>
                      <th>Date</th>
                      <th>Authorization Details</th>
                      <th>Status</th>
                      <th className="actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map(req => (
                      <tr key={req.id}>
                        <td className="bold-cell">{req.id}</td>
                        <td>{req.requestedBy}</td>
                        <td>{req.requestDate}</td>
                        <td style={{ maxWidth: '400px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{req.details}</td>
                        <td>
                          <Chip
                            label={req.status}
                            size="small"
                            style={{
                              backgroundColor:
                                req.status === 'Approved' ? GREEN.bg :
                                req.status === 'Rejected' ? RED.bg : AMBER.bg,
                              color:
                                req.status === 'Approved' ? GREEN.main :
                                req.status === 'Rejected' ? RED.main : AMBER.main,
                              fontWeight: 700
                            }}
                          />
                        </td>
                        <td className="actions-cell">
                          {req.status === 'Pending' ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Approve Request">
                                <IconButton
                                  onClick={() => handleApproveDiscount(req.id)}
                                  sx={{ color: GREEN.main, p: 0.5 }}
                                >
                                  <CheckCircle size={22} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject Request">
                                <IconButton
                                  onClick={() => handleRejectDiscount(req.id)}
                                  sx={{ color: RED.main, p: 0.5 }}
                                >
                                  <XCircle size={22} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No excess discount authorization requests are currently pending in queue.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
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
            label="Builders Tier Price (INR)"
            type="number"
            value={tierForm.buildersPrice}
            onChange={(e) => setTierForm(prev => ({ ...prev, buildersPrice: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Dealers Tier Price (INR)"
            type="number"
            value={tierForm.dealersPrice}
            onChange={(e) => setTierForm(prev => ({ ...prev, dealersPrice: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Contractors Tier Price (INR)"
            type="number"
            value={tierForm.contractorsPrice}
            onChange={(e) => setTierForm(prev => ({ ...prev, contractorsPrice: e.target.value }))}
          />
          <TextField
            fullWidth
            label="House Owners Tier Price (INR)"
            type="number"
            value={tierForm.houseOwnersPrice}
            onChange={(e) => setTierForm(prev => ({ ...prev, houseOwnersPrice: e.target.value }))}
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

      {/* CREATE PROJECT CONTRACT MODAL */}
      <Dialog open={addProjectOpen} onClose={() => setAddProjectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">
          Create Project Pricing Contract
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Define a special contract price for bulk volume projects. This contract overrides standard tier pricing during transaction processing.
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="proj-customer-label">Customer Profile</InputLabel>
            <Select
              labelId="proj-customer-label"
              value={projectForm.customerId}
              label="Customer Profile"
              onChange={(e) => {
                const selectedCust = customers.find(c => c.id === e.target.value);
                setProjectForm(prev => ({
                  ...prev,
                  customerId: e.target.value,
                  projectName: selectedCust?.projects?.[0]?.name || ''
                }));
              }}
            >
              {customers.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!projectForm.customerId}>
            <InputLabel id="proj-name-label">Project Name</InputLabel>
            <Select
              labelId="proj-name-label"
              value={projectForm.projectName}
              label="Project Name"
              onChange={(e) => setProjectForm(prev => ({ ...prev, projectName: e.target.value }))}
            >
              {customers.find(c => c.id === projectForm.customerId)?.projects?.map((p, idx) => (
                <MenuItem key={idx} value={p.name}>{p.name}</MenuItem>
              )) || <MenuItem value="">No Projects Configured</MenuItem>}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="proj-item-label">Select Product Item</InputLabel>
            <Select
              labelId="proj-item-label"
              value={projectForm.itemId}
              label="Select Product Item"
              onChange={(e) => setProjectForm(prev => ({ ...prev, itemId: e.target.value }))}
            >
              {items.map(i => (
                <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Negotiated Project Rate (INR)"
            type="number"
            value={projectForm.specialRate}
            onChange={(e) => setProjectForm(prev => ({ ...prev, specialRate: e.target.value }))}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Contract Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={projectForm.startDate}
                onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Contract Expiry Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={projectForm.endDate}
                onChange={(e) => setProjectForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddProjectOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveProjectContract} variant="contained" sx={{ backgroundColor: BLUE.main }}>
            Create Contract
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

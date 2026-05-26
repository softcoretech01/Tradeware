import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // GL Codes for account allocation
  glCodes: [
    { code: '1010', name: 'Petty Cash', category: 'Assets', active: true },
    { code: '1020', name: 'DBS Bank Account SGD', category: 'Assets', active: true },
    { code: '1030', name: 'OCBC Bank Account USD', category: 'Assets', active: true },
    { code: '1200', name: 'Accounts Receivable (AR)', category: 'Assets', active: true },
    { code: '2000', name: 'Accounts Payable (AP)', category: 'Liabilities', active: true },
    { code: '2100', name: 'Bank Overdraft Facility', category: 'Liabilities', active: true },
    { code: '4000', name: 'Sales Revenue', category: 'Revenue', active: true },
    { code: '5000', name: 'Cost of Goods Sold (COGS)', category: 'Expense', active: true },
    { code: '6000', name: 'Office Rent & Utilities', category: 'Expense', active: true },
    { code: '6100', name: 'Printing & Stationery', category: 'Expense', active: true },
    { code: '6200', name: 'Travel & Food Expenses', category: 'Expense', active: true }
  ],

  // Registered bank accounts
  bankAccounts: [
    { id: 'BANK-1', bankName: 'DBS Bank Ltd', accountNumber: '123-45678-9', currency: 'SGD', glCode: '1020', balance: 85000.00, limit: 50000.00, status: 'Active' },
    { id: 'BANK-2', bankName: 'OCBC Bank Ltd', accountNumber: '987-65432-1', currency: 'USD', glCode: '1030', balance: 42000.00, limit: 0.00, status: 'Active' }
  ],

  // Overdraft configurations
  overdrafts: [
    { id: 'OD-1', bankAccountId: 'BANK-1', bankName: 'DBS Bank Ltd', accountNumber: '123-45678-9', limit: 50000.00, drawdown: 15000.00, interestRate: 6.50, interestMethod: 'Daily Balance Method', status: 'Active' },
    { id: 'OD-2', bankAccountId: 'BANK-2', bankName: 'OCBC Bank Ltd', accountNumber: '987-65432-1', limit: 20000.00, drawdown: 0.00, interestRate: 5.75, interestMethod: 'Average Monthly Balance', status: 'Inactive' }
  ],

  // Accounts Payable Ledger Data
  apInvoices: [
    { id: 'INV-AP-101', supplierId: 'SUPP-1', supplierName: 'GLOBAL STEEL INDUSTRIES', date: '2026-05-10', dueDate: '2026-06-10', currency: 'SGD', totalAmount: 12500.00, paidAmount: 8500.00, outstandingAmount: 4000.00, poNumber: 'PO-2026-001', grnNumber: 'GRN-2026-001', claimDate: '2026-05-15' },
    { id: 'INV-AP-102', supplierId: 'SUPP-1', supplierName: 'GLOBAL STEEL INDUSTRIES', date: '2026-05-18', dueDate: '2026-06-18', currency: 'SGD', totalAmount: 9400.00, paidAmount: 0.00, outstandingAmount: 9400.00, poNumber: 'PO-2026-002', grnNumber: 'GRN-2026-003', claimDate: '2026-05-20' },
    { id: 'INV-AP-103', supplierId: 'SUPP-2', supplierName: 'SINGAPORE HARDWARE SUPPLIES', date: '2026-05-05', dueDate: '2026-06-05', currency: 'SGD', totalAmount: 18500.00, paidAmount: 18500.00, outstandingAmount: 0.00, poNumber: 'PO-2026-003', grnNumber: 'GRN-2026-002', claimDate: '2026-05-08' },
    { id: 'INV-AP-104', supplierId: 'SUPP-3', supplierName: 'EUROPEAN VALVE SYSTEMS GMBH', date: '2026-04-20', dueDate: '2026-05-20', currency: 'EUR', totalAmount: 14500.00, paidAmount: 5000.00, outstandingAmount: 9500.00, poNumber: 'PO-2026-004', grnNumber: 'GRN-2026-004', claimDate: '2026-04-25' }
  ],

  // Accounts Receivable Ledger Data (with aging categories)
  arInvoices: [
    { id: 'INV-AR-201', customerId: 'CUST-1', customerName: 'ACE FIRE ENGINEERING PTE LTD', date: '2026-05-12', dueDate: '2026-06-12', currency: 'SGD', totalAmount: 15000.00, paidAmount: 5000.00, outstandingAmount: 10000.00, doNumber: 'DO-2026-001', claimDate: '2026-05-15' },
    { id: 'INV-AR-202', customerId: 'CUST-1', customerName: 'ACE FIRE ENGINEERING PTE LTD', date: '2026-04-05', dueDate: '2026-05-05', currency: 'SGD', totalAmount: 8500.00, paidAmount: 0.00, outstandingAmount: 8500.00, doNumber: 'DO-2026-002', claimDate: '2026-04-08' },
    { id: 'INV-AR-203', customerId: 'CUST-2', customerName: 'AIR LIQUIDE SINGAPORE PTE LTD', date: '2026-03-10', dueDate: '2026-04-10', currency: 'USD', totalAmount: 22000.00, paidAmount: 10000.00, outstandingAmount: 12000.00, doNumber: 'DO-2026-003', claimDate: '2026-03-12' },
    { id: 'INV-AR-204', customerId: 'CUST-3', customerName: 'AKHUN SERVICE', date: '2026-01-15', dueDate: '2026-02-15', currency: 'SGD', totalAmount: 6000.00, paidAmount: 0.00, outstandingAmount: 6000.00, doNumber: 'DO-2026-004', claimDate: '2026-01-18' }
  ],

  // Running ledger for Bank Book
  bankBookTransactions: [
    { id: 'BB-TR-001', date: '2026-05-10', refNo: 'CHK-100201', bankAccountId: 'BANK-1', bankAccountName: 'DBS Bank Ltd', description: 'Supplier payment - Global Steel', deposit: 0.00, withdrawal: 5000.00, clearedStatus: 'Cleared', reconciledDate: '2026-05-11', currency: 'SGD' },
    { id: 'BB-TR-002', date: '2026-05-12', refNo: 'EFT-229910', bankAccountId: 'BANK-1', bankAccountName: 'DBS Bank Ltd', description: 'Customer payment receipt - Ace Fire', deposit: 10000.00, withdrawal: 0.00, clearedStatus: 'Cleared', reconciledDate: '2026-05-13', currency: 'SGD' },
    { id: 'BB-TR-003', date: '2026-05-20', refNo: 'TRF-33441', bankAccountId: 'BANK-1', bankAccountName: 'DBS Bank Ltd', description: 'Transfer to Petty Cash Counter', deposit: 0.00, withdrawal: 1500.00, clearedStatus: 'Cleared', reconciledDate: '2026-05-21', currency: 'SGD' },
    { id: 'BB-TR-004', date: '2026-05-24', refNo: 'CHK-200982', bankAccountId: 'BANK-2', bankAccountName: 'OCBC Bank Ltd', description: 'Office Equipment purchase', deposit: 0.00, withdrawal: 2400.00, clearedStatus: 'Pending', reconciledDate: null, currency: 'USD' }
  ],

  // Running ledger for Cash Book
  cashBookTransactions: [
    { id: 'CB-TR-001', date: '2026-05-20', voucherNumber: 'VOU-CB-2026-001', payee: 'Supplier Global Steel', description: 'Cash settlement for parts invoice', type: 'Payment', category: 'Claim Category A', claimRef: 'CLAIM-901', cashIn: 0.00, cashOut: 450.00, balance: 1550.00, currency: 'IDR' },
    { id: 'CB-TR-002', date: '2026-05-21', voucherNumber: 'VOU-CB-2026-002', payee: 'Customer Akhun Service', description: 'Deposit payment for custom fittings', type: 'Receipt', category: 'Other Income', claimRef: 'REF-1002', cashIn: 1200.00, cashOut: 0.00, balance: 2750.00, currency: 'IDR' },
    { id: 'CB-TR-003', date: '2026-05-23', voucherNumber: 'VOU-CB-2026-003', payee: 'Office Stationery Shop', description: 'Printer toners and copy papers purchase', type: 'Payment', category: 'Printing & Stationery', claimRef: 'EXP-1011', cashIn: 0.00, cashOut: 180.00, balance: 2570.00, currency: 'IDR' },
    { id: 'CB-TR-004', date: '2026-05-25', voucherNumber: 'VOU-CB-2026-004', payee: 'General Manager', description: 'Cash replenishment from bank transfer', type: 'Receipt', category: 'Rounding', claimRef: 'TRF-5002', cashIn: 1500.00, cashOut: 0.00, balance: 4070.00, currency: 'IDR' }
  ],

  // Petty Cash Slips / Requests
  pettyCashTransactions: [
    { id: 'PC-TR-001', date: '2026-05-10', slipNo: 'PC-SLIP-001', requester: 'Alice Connor', department: 'R&D', category: 'Stationery', amount: 45.00, purpose: 'Lab notebooks and pens', status: 'Approved', verifiedFile: 'receipt_stationery.png' },
    { id: 'PC-TR-002', date: '2026-05-15', slipNo: 'PC-SLIP-002', requester: 'Bob Miller', department: 'Sales', category: 'Transport', amount: 80.00, purpose: 'Client lunch travel reimbursement', status: 'Approved', verifiedFile: 'taxi_slip.pdf' },
    { id: 'PC-TR-003', date: '2026-05-22', slipNo: 'PC-SLIP-003', requester: 'Carol Smith', department: 'Operations', category: 'Food', amount: 120.00, purpose: 'Pantry coffee and tea restocking', status: 'Approved', verifiedFile: 'pantry_grocery.jpg' },
    { id: 'PC-TR-004', date: '2026-05-25', slipNo: 'PC-SLIP-004', requester: 'David Webb', department: 'Maintenance', category: 'Transport', amount: 65.00, purpose: 'Emergency pipeline tools delivery taxi', status: 'Pending', verifiedFile: 'cab_fare.jpg' }
  ]
};

export const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    // AP Book / Ledger allocation
    addAPInvoice: (state, action) => {
      state.apInvoices.unshift({
        ...action.payload,
        paidAmount: 0.00,
        outstandingAmount: action.payload.totalAmount
      });
    },
    updateAPInvoicePayment: (state, action) => {
      const { id, payAmount } = action.payload;
      const invoice = state.apInvoices.find(inv => inv.id === id);
      if (invoice) {
        invoice.paidAmount += Number(payAmount);
        invoice.outstandingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
      }
    },

    // AR Book / Ledger allocation
    addARInvoice: (state, action) => {
      state.arInvoices.unshift({
        ...action.payload,
        paidAmount: 0.00,
        outstandingAmount: action.payload.totalAmount
      });
    },
    updateARInvoiceReceipt: (state, action) => {
      const { id, receiveAmount } = action.payload;
      const invoice = state.arInvoices.find(inv => inv.id === id);
      if (invoice) {
        invoice.paidAmount += Number(receiveAmount);
        invoice.outstandingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
      }
    },

    // Bank Book Entries
    addBankBookTransaction: (state, action) => {
      const tr = action.payload;
      state.bankBookTransactions.unshift({
        id: `BB-TR-${Date.now()}`,
        date: tr.date,
        refNo: tr.refNo,
        bankAccountId: tr.bankAccountId,
        bankAccountName: state.bankAccounts.find(b => b.id === tr.bankAccountId)?.bankName || 'Registered Account',
        description: tr.description,
        deposit: tr.entryType === 'Receipt' ? Number(tr.amount) : 0.00,
        withdrawal: tr.entryType === 'Payment' ? Number(tr.amount) : 0.00,
        clearedStatus: 'Pending',
        reconciledDate: null,
        currency: tr.currency || 'SGD'
      });

      // Update bank account balance
      const bank = state.bankAccounts.find(b => b.id === tr.bankAccountId);
      if (bank) {
        if (tr.entryType === 'Receipt') {
          bank.balance += Number(tr.amount);
        } else if (tr.entryType === 'Payment') {
          bank.balance -= Number(tr.amount);
        }
      }
    },
    toggleReconciliationStatus: (state, action) => {
      const { id, isReconciled, date } = action.payload;
      const tr = state.bankBookTransactions.find(t => t.id === id);
      if (tr) {
        tr.clearedStatus = isReconciled ? 'Cleared' : 'Pending';
        tr.reconciledDate = isReconciled ? date : null;
      }
    },

    // Cash Book Entries
    addCashBookTransaction: (state, action) => {
      const tr = action.payload;
      const runningBalance = state.cashBookTransactions.length > 0 
        ? state.cashBookTransactions[0].balance 
        : 1000.00;
      
      const newBalance = tr.type === 'Receipt' 
        ? runningBalance + Number(tr.amount) 
        : runningBalance - Number(tr.amount);

      state.cashBookTransactions.unshift({
        id: `CB-TR-${Date.now()}`,
        date: tr.date,
        voucherNumber: tr.voucherNumber || `VOU-CB-${Date.now().toString().slice(-4)}`,
        payee: tr.payee,
        description: tr.description,
        type: tr.type,
        category: tr.category,
        claimRef: tr.claimRef || 'N/A',
        cashIn: tr.type === 'Receipt' ? Number(tr.amount) : 0.00,
        cashOut: tr.type === 'Payment' ? Number(tr.amount) : 0.00,
        balance: newBalance,
        currency: tr.currency || 'IDR'
      });
    },

    // Add Batch Cash Book Voucher
    addBatchCashBookVoucher: (state, action) => {
      const { date, currency, entries } = action.payload;
      let runningBalance = state.cashBookTransactions.length > 0 
        ? state.cashBookTransactions[0].balance 
        : 1000.00;

      entries.forEach((ent, index) => {
        const amt = Number(ent.amount);
        const isReceipt = ['Receipt', 'Other Income'].includes(ent.transactionType);
        
        if (isReceipt) {
          runningBalance += amt;
        } else {
          runningBalance -= amt;
        }

        state.cashBookTransactions.unshift({
          id: `CB-TR-${Date.now()}-${index}`,
          date: date,
          voucherNumber: `VOU-CB-${Date.now().toString().slice(-4)}`,
          payee: ent.dropdown || 'Cash Participant',
          description: ent.description,
          type: isReceipt ? 'Receipt' : 'Payment',
          category: ent.claimCategory || 'General',
          claimRef: ent.reference || 'N/A',
          cashIn: isReceipt ? amt : 0.00,
          cashOut: !isReceipt ? amt : 0.00,
          balance: runningBalance,
          currency: currency
        });
      });
    },

    // Overdraft Limit Update
    updateOverdraftLine: (state, action) => {
      const config = action.payload;
      const od = state.overdrafts.find(o => o.id === config.id);
      if (od) {
        od.limit = Number(config.limit);
        od.drawdown = Number(config.drawdown);
        od.interestRate = Number(config.interestRate);
        od.interestMethod = config.interestMethod;
        od.status = config.status;

        // Sync back to Bank account drawing limit
        const bank = state.bankAccounts.find(b => b.id === od.bankAccountId);
        if (bank) {
          bank.limit = Number(config.limit);
        }
      }
    },
    addOverdraftLine: (state, action) => {
      const config = action.payload;
      state.overdrafts.push({
        id: `OD-${state.overdrafts.length + 1}`,
        bankAccountId: config.bankAccountId,
        bankName: state.bankAccounts.find(b => b.id === config.bankAccountId)?.bankName || 'Registered Bank',
        accountNumber: state.bankAccounts.find(b => b.id === config.bankAccountId)?.accountNumber || 'N/A',
        limit: Number(config.limit),
        drawdown: Number(config.drawdown),
        interestRate: Number(config.interestRate),
        interestMethod: config.interestMethod,
        status: config.status
      });
    },

    // Petty Cash Slip Entries
    addPettyCashSlip: (state, action) => {
      const req = action.payload;
      state.pettyCashTransactions.unshift({
        id: `PC-TR-${Date.now()}`,
        date: req.date,
        slipNo: `PC-SLIP-00${state.pettyCashTransactions.length + 1}`,
        requester: req.requester,
        department: req.department,
        category: req.category,
        amount: Number(req.amount),
        purpose: req.purpose,
        status: req.status || 'Pending',
        verifiedFile: req.verifiedFile || null
      });
    },
    approvePettyCashSlip: (state, action) => {
      const slip = state.pettyCashTransactions.find(t => t.id === action.payload);
      if (slip) {
        slip.status = 'Approved';
      }
    }
  }
});

export const {
  addAPInvoice,
  updateAPInvoicePayment,
  addARInvoice,
  updateARInvoiceReceipt,
  addBankBookTransaction,
  toggleReconciliationStatus,
  addCashBookTransaction,
  addBatchCashBookVoucher,
  updateOverdraftLine,
  addOverdraftLine,
  addPettyCashSlip,
  approvePettyCashSlip
} = financeSlice.actions;

export default financeSlice.reducer;

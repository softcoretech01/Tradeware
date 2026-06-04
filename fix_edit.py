import re

def fix_invoice_jsx():
    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\Invoice.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update setFormData in Edit button
    old_btn = r'setSelectedInvoice\(inv\); setFormData\(inv\); setEditOpen\(true\);'
    new_btn = r'''setSelectedInvoice(inv); setFormData({
      invoiceId: inv.id,
      soId: inv.soRef,
      cpoRef: inv.cpoRef,
      customerName: inv.customerName,
      amount: inv.subTotal || inv.amount || 0,
      taxAmount: inv.taxAmount || 0,
      taxType: inv.taxType || 'IGST',
      total: inv.grandTotal || inv.total || 0,
      items: inv.items || []
    }); setEditOpen(true);'''
    content = content.replace(old_btn, new_btn)

    # 2. Update handleEditSave
    old_save = r'''const handleEditSave = \(\) => {
    if \(!formData\.soId\) {
      alert\('Sales Order reference is required\.'\);
      return;
    }

    dispatch\(generateInvoice\(formData\)\);
    setEditOpen\(false\);
  };'''
    new_save = r'''const handleEditSave = () => {
    if (!formData.soId) {
      alert('Sales Order reference is required.');
      return;
    }

    dispatch(updateInvoice(formData));
    setEditOpen(false);
  };'''
    content = re.sub(old_save, new_save, content)

    # 3. Add updateInvoice to imports
    content = content.replace('generateInvoice', 'generateInvoice, updateInvoice')

    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\Invoice.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed Invoice.jsx")

def fix_salesorder_jsx():
    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    old_save = r'''const handleEditSave = \(\) => {
    if \(!formData\.cpoRef\) {
      alert\('Customer PO reference is required\.'\);
      return;
    }
    if \(formData\.items\.length === 0\) {
      alert\('No line items found for the order\.'\);
      return;
    }

    dispatch\(addSalesOrder\(formData\)\);
    setEditOpen\(false\);
  };'''
    new_save = r'''const handleEditSave = () => {
    if (!formData.cpoRef) {
      alert('Customer PO reference is required.');
      return;
    }
    if (formData.items.length === 0) {
      alert('No line items found for the order.');
      return;
    }

    dispatch(updateSalesOrder(formData));
    setEditOpen(false);
  };'''
    content = re.sub(old_save, new_save, content)

    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed SalesOrder.jsx")

def fix_erpslice():
    with open(r'd:\Trade Wave\react\src\store\erpSlice.js', 'r', encoding='utf-8') as f:
        content = f.read()

    update_invoice_code = r'''
    updateInvoice: (state, action) => {
      const idx = state.invoices.findIndex(inv => inv.id === action.payload.invoiceId);
      if (idx !== -1) {
        state.invoices[idx] = {
          ...state.invoices[idx],
          soRef: action.payload.soId,
          cpoRef: action.payload.cpoRef,
          customerName: action.payload.customerName,
          items: action.payload.items,
          subTotal: action.payload.amount,
          taxType: action.payload.taxType,
          taxAmount: action.payload.taxAmount,
          grandTotal: action.payload.total
        };
      }
    },
    deleteSalesOrder: (state, action) => {'''

    content = content.replace('deleteSalesOrder: (state, action) => {', update_invoice_code)

    # export it
    content = content.replace('generateInvoice,', 'generateInvoice, updateInvoice,')

    with open(r'd:\Trade Wave\react\src\store\erpSlice.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed erpSlice.js")

fix_invoice_jsx()
fix_salesorder_jsx()
fix_erpslice()

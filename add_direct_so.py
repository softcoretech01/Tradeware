import re

def update_sales_order():
    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Selectors
    if 'state.items.items' not in content:
        content = content.replace(
            'const customerPOs = useSelector(state => state.erp.customerPOs);',
            'const customerPOs = useSelector(state => state.erp.customerPOs);\n  const customers = useSelector(state => state.customers.customers);\n  const itemsMaster = useSelector(state => state.items.items);'
        )
    
    # 2. handleItemChange
    old_item_change = r'''  const handleItemChange = \(idx, field, value\) => {
    const updated = \[\.\.\.formData\.items\];
    if \(field === 'suppliedQty'\) {
      const sup = parseFloat\(value\) \|\| 0;
      updated\[idx\] = {
        \.\.\.updated\[idx\],
        suppliedQty: sup,
        pendingQty: Math\.max\(0, updated\[idx\]\.orderedQty - sup\)
      };
    } else {
      updated\[idx\] = {
        \.\.\.updated\[idx\],
        \[field\]: value
      };
    }
    setFormData\(prev => \({ \.\.\.prev, items: updated \}\)\);
  };'''
    
    new_item_change = r'''  const handleItemChange = (idx, field, value) => {
    const updated = [...formData.items];
    if (field === 'suppliedQty') {
      const sup = parseFloat(value) || 0;
      updated[idx] = {
        ...updated[idx],
        suppliedQty: sup,
        pendingQty: Math.max(0, updated[idx].orderedQty - sup)
      };
    } else if (field === 'orderedQty') {
      const ord = parseFloat(value) || 0;
      updated[idx] = {
        ...updated[idx],
        orderedQty: ord,
        pendingQty: Math.max(0, ord - (updated[idx].suppliedQty || 0))
      };
    } else {
      updated[idx] = {
        ...updated[idx],
        [field]: value
      };
    }
    setFormData(prev => ({ ...prev, items: updated }));
  };'''
    content = re.sub(old_item_change, new_item_change, content)

    # 3. handleSave and handleEditSave checks
    content = content.replace("if (!formData.cpoRef) {\n      alert('Customer PO reference is required.');", "if (!formData.customerName) {\n      alert('Client Name is required.');")
    
    # 4. JSX changes
    # CPO select dropdowns (both Create and Edit)
    content = content.replace(
        '''<Select
                value={formData.cpoRef}
                label="Reference Customer PO"
                onChange={(e) => handleCPOChange(e.target.value)}
              >
                {customerPOs.map(cpo => (''',
        '''<Select
                value={formData.cpoRef}
                label="Reference Customer PO"
                onChange={(e) => handleCPOChange(e.target.value)}
              >
                <MenuItem value=""><em>None (Direct Order)</em></MenuItem>
                {customerPOs.map(cpo => ('''
    )
    
    # Client Name TextField
    old_client_name = r'''<TextField
              label="Client Name"
              value={formData\.customerName}
              fullWidth
              disabled
            />'''
    new_client_name = r'''{formData.cpoRef ? (
              <TextField label="Client Name" value={formData.customerName} fullWidth disabled />
            ) : (
              <FormControl fullWidth>
                <InputLabel>Client Name</InputLabel>
                <Select
                  value={formData.customerName}
                  label="Client Name"
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                >
                  <MenuItem value=""><em>Select Customer</em></MenuItem>
                  {customers.map(c => (
                    <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}'''
    content = re.sub(old_client_name, new_client_name, content)
    
    # Line Items Section header with Add Item Button
    old_h4 = r'''<h4>Dispatch Allocation & Quantity Tracking</h4>'''
    new_h4 = r'''<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>Dispatch Allocation & Quantity Tracking</h4>
                {!formData.cpoRef && (
                  <Button 
                    size="small" 
                    startIcon={<Plus size={16} />}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        items: [...prev.items, { itemId: '', name: '', orderedQty: 1, suppliedQty: 1, pendingQty: 0, unitPrice: 0 }]
                      }))
                    }}
                  >Add Item</Button>
                )}
              </div>'''
    content = re.sub(old_h4, new_h4, content)

    # Empty State for Line Items Table
    content = content.replace('{formData.items.length > 0 && (', '{(!formData.cpoRef || formData.items.length > 0) && (')

    # Table Item Name Cell
    old_item_name = r'''<TableCell>\{item\.name\} \(\{item\.itemId\}\)</TableCell>'''
    new_item_name = r'''<TableCell>
                      {formData.cpoRef ? (
                        <span>{item.name} ({item.itemId})</span>
                      ) : (
                        <select
                          className="table-select"
                          style={{ width: '100%', padding: '4px' }}
                          value={item.itemId}
                          onChange={(e) => {
                            const selectedItem = itemsMaster.find(i => i.id === e.target.value);
                            handleItemChange(idx, 'itemId', e.target.value);
                            if (selectedItem) {
                              handleItemChange(idx, 'name', selectedItem.name);
                              handleItemChange(idx, 'unitPrice', selectedItem.standardPrice);
                            }
                          }}
                        >
                          <option value="">Select Item</option>
                          {itemsMaster.map(itm => (
                            <option key={itm.id} value={itm.id}>{itm.name} ({itm.id})</option>
                          ))}
                        </select>
                      )}
                    </TableCell>'''
    content = re.sub(old_item_name, new_item_name, content)

    # Table Ordered Qty Cell
    old_ordered_qty = r'''<TableCell>\{item\.orderedQty\}</TableCell>'''
    new_ordered_qty = r'''<TableCell>
                      {formData.cpoRef ? (
                        <span>{item.orderedQty}</span>
                      ) : (
                        <input
                          type="number"
                          className="table-input"
                          value={item.orderedQty}
                          min="1"
                          onChange={(e) => handleItemChange(idx, 'orderedQty', parseFloat(e.target.value) || 0)}
                        />
                      )}
                    </TableCell>'''
    content = re.sub(old_ordered_qty, new_ordered_qty, content)

    # Unit Price Cell
    old_unit_price = r'''<TableCell>\{item\.unitPrice\.toFixed\(2\)\}</TableCell>'''
    new_unit_price = r'''<TableCell>
                      {formData.cpoRef ? (
                        <span>{item.unitPrice?.toFixed(2)}</span>
                      ) : (
                        <input
                          type="number"
                          className="table-input"
                          value={item.unitPrice}
                          min="0"
                          step="0.01"
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      )}
                    </TableCell>'''
    content = re.sub(old_unit_price, new_unit_price, content)

    # Adding a Trash icon for Direct Orders
    old_total = r'''<TableCell className="bold-cell">
                        \{\(item\.suppliedQty \* item\.unitPrice\)\.toFixed\(2\)\}
                      </TableCell>
                    </TableRow>'''
    new_total = r'''<TableCell className="bold-cell">
                        {(item.suppliedQty * item.unitPrice)?.toFixed(2)}
                      </TableCell>
                      {!formData.cpoRef && (
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => {
                            const newItems = [...formData.items];
                            newItems.splice(idx, 1);
                            setFormData(prev => ({ ...prev, items: newItems }));
                          }}>
                            <Trash size={16} />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>'''
    content = re.sub(old_total, new_total, content)
    
    # Table Head Update (Add Action Column Header)
    old_thead = r'''<TableCell width="140">Total Value \(₹\)</TableCell>
                  </TableRow>
                </TableHead>'''
    new_thead = r'''<TableCell width="140">Total Value (₹)</TableCell>
                    {!formData.cpoRef && <TableCell width="60">Action</TableCell>}
                  </TableRow>
                </TableHead>'''
    content = re.sub(old_thead, new_thead, content)

    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Direct Sales Order logic added.")

update_sales_order()

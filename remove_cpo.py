import re

def remove_cpo_from_so():
    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove Reference Customer PO Select blocks
    cpo_select_pattern = r'''<FormControl fullWidth>\s*<InputLabel>Reference Customer PO</InputLabel>\s*<Select\s*value=\{formData\.cpoRef\}\s*label="Reference Customer PO"\s*onChange=\{\(e\) => handleCPOChange\(e\.target\.value\)\}\s*>\s*<MenuItem value=""><em>None \(Direct Order\)</em></MenuItem>\s*\{customerPOs\.map\(cpo => \(\s*<MenuItem key=\{cpo\.id\} value=\{cpo\.id\}>\{cpo\.id\} \(Client: \{cpo\.customerName\}\)</MenuItem>\s*\)\)\}\s*</Select>\s*</FormControl>'''
    content = re.sub(cpo_select_pattern, '', content)

    # 2. Replace Client Name block with just Customer Dropdown
    client_name_pattern = r'''\{formData\.cpoRef \? \(\s*<TextField label="Client Name" value=\{formData\.customerName\} fullWidth disabled />\s*\) : \(\s*<FormControl fullWidth>\s*<InputLabel>Client Name</InputLabel>\s*<Select\s*value=\{formData\.customerName\}\s*label="Client Name"\s*onChange=\{\(e\) => setFormData\(prev => \(\{ \.\.\.prev, customerName: e\.target\.value \}\)\)\}\s*>\s*<MenuItem value=""><em>Select Customer</em></MenuItem>\s*\{customers\.map\(c => \(\s*<MenuItem key=\{c\.id\} value=\{c\.name\}>\{c\.name\}</MenuItem>\s*\)\)\}\s*</Select>\s*</FormControl>\s*\)\}'''
    customer_select = r'''<FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={formData.customerName}
                  label="Customer"
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                >
                  <MenuItem value=""><em>Select Customer</em></MenuItem>
                  {customers.map(c => (
                    <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>'''
    content = re.sub(client_name_pattern, customer_select, content)

    # 3. Items section changes
    # Remove the `(!formData.cpoRef || formData.items.length > 0)` check
    content = content.replace('{(!formData.cpoRef || formData.items.length > 0) && (', '{(true) && (')
    # Wait, we want to just render it unconditionally if they can add items. We'll leave `{(true) && (` for now.

    # Button condition `{!formData.cpoRef && (` -> just button
    add_btn_pattern = r'''\{!formData\.cpoRef && \(\s*(<Button\s*size="small"\s*startIcon=\{<Plus size=\{16\} />\}\s*onClick=\{\(\) => \{\s*setFormData\(prev => \(\{\s*\.\.\.prev,\s*items: \[\.\.\.prev\.items, \{ itemId: '', name: '', orderedQty: 1, suppliedQty: 1, pendingQty: 0, unitPrice: 0 \}\]\s*\}\)\)\s*\}\}\s*>Add Item</Button>)\s*\)\}'''
    content = re.sub(add_btn_pattern, r'\1', content)

    # Item Name
    item_name_pattern = r'''\{formData\.cpoRef \? \(\s*<span>\{item\.name\} \(\{item\.itemId\}\)</span>\s*\) : \(\s*(<select[\s\S]*?</select>)\s*\)\}'''
    content = re.sub(item_name_pattern, r'\1', content)

    # Ordered Qty
    ordered_qty_pattern = r'''\{formData\.cpoRef \? \(\s*<span>\{item\.orderedQty\}</span>\s*\) : \(\s*(<input\s*type="number"\s*className="table-input"\s*value=\{item\.orderedQty\}\s*min="1"\s*onChange=\{\(e\) => handleItemChange\(idx, 'orderedQty', parseFloat\(e\.target\.value\) \|\| 0\)\}\s*/>)\s*\)\}'''
    content = re.sub(ordered_qty_pattern, r'\1', content)

    # Unit Price
    unit_price_pattern = r'''\{formData\.cpoRef \? \(\s*<span>\{item\.unitPrice\?\.toFixed\(2\)\}</span>\s*\) : \(\s*(<input\s*type="number"\s*className="table-input"\s*value=\{item\.unitPrice\}\s*min="0"\s*step="0\.01"\s*onChange=\{\(e\) => handleItemChange\(idx, 'unitPrice', parseFloat\(e\.target\.value\) \|\| 0\)\}\s*/>)\s*\)\}'''
    content = re.sub(unit_price_pattern, r'\1', content)

    # Action headers and columns
    # header
    header_pattern = r'''\{!formData\.cpoRef && <TableCell width="60">Action</TableCell>\}'''
    content = re.sub(header_pattern, r'<TableCell width="60">Action</TableCell>', content)

    # action column
    action_pattern = r'''\{!formData\.cpoRef && \(\s*(<TableCell align="center">[\s\S]*?</TableCell>)\s*\)\}'''
    content = re.sub(action_pattern, r'\1', content)

    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Direct order layout enforced.")

remove_cpo_from_so()

import re

def move_customer():
    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove the customer dropdown from its current place
    customer_dropdown = r'''          <div style={{ marginTop: '16px' }}>
            <FormControl fullWidth>
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
              </FormControl>
          </div>'''
    
    # We will replace it with empty string, but there are two occurrences (Create and Edit dialogs)
    content = content.replace(customer_dropdown, '')

    # 2. Insert it inside dialog-grid at the top
    # There are two dialog-grids. One for Create, one for Edit.
    
    top_customer_element = r'''<FormControl fullWidth>
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

    # We replace `<div className="dialog-grid">` with `<div className="dialog-grid">\n            ` + top_customer_element
    content = content.replace('<div className="dialog-grid">', f'<div className="dialog-grid">\n            {top_customer_element}')

    # 3. Remove CPO Ref column from table
    content = content.replace('<th>CPO Ref</th>', '')
    content = content.replace('<td className="text-muted">{so.cpoRef}</td>', '')
    content = content.replace('colSpan="8"', 'colSpan="7"')

    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Customer dropdown moved and CPO Ref column removed.")

move_customer()

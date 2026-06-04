import re

def fix_so():
    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix handleItemChange batch update bug
    old_handle_item = r'''  const handleItemChange = \(idx, field, value\) => {
    const updated = \[\.\.\.formData\.items\];
    if \(field === 'suppliedQty'\) {
      const sup = parseFloat\(value\) \|\| 0;
      updated\[idx\] = {
        \.\.\.updated\[idx\],
        suppliedQty: sup,
        pendingQty: Math\.max\(0, updated\[idx\]\.orderedQty - sup\)
      };
    } else if \(field === 'orderedQty'\) {
      const ord = parseFloat\(value\) \|\| 0;
      updated\[idx\] = {
        \.\.\.updated\[idx\],
        orderedQty: ord,
        pendingQty: Math\.max\(0, ord - \(updated\[idx\]\.suppliedQty \|\| 0\)\)
      };
    } else {
      updated\[idx\] = {
        \.\.\.updated\[idx\],
        \[field\]: value
      };
    }
    setFormData\(prev => \(\{ \.\.\.prev, items: updated \}\)\);
  };'''

    new_handle_item = r'''  const handleItemChange = (idx, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
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
      return { ...prev, items: updated };
    });
  };'''
    content = re.sub(old_handle_item, new_handle_item, content)

    # 2. handleOpenCreate default row
    old_create = r'''      items: \[\],
      warehouse: warehouses\[0\]\?\.name \|\| 'SINGAPORE CENTRAL WAREHOUSE','''
    new_create = r'''      items: [{ itemId: '', name: '', orderedQty: 1, suppliedQty: 1, pendingQty: 0, unitPrice: 0 }],
      warehouse: warehouses[0]?.name || 'SINGAPORE CENTRAL WAREHOUSE','''
    content = re.sub(old_create, new_create, content)

    # 3. Increase dialog maxWidth to 'lg'
    content = content.replace('maxWidth="md"', 'maxWidth="lg"')

    # 4. Increase select item box size
    content = content.replace("style={{ width: '100%', padding: '4px' }}", "style={{ width: '100%', minWidth: '180px', padding: '8px', fontSize: '14px' }}")

    with open(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed handleItemChange and UI sizing.")

fix_so()

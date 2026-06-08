import re

file_path = 'd:/Trade Wave/react/src/pages/ImportManagement/LandedCost.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the fetchPOs inside useEffect to map the data correctly
old_fetch = """  React.useEffect(() => {
    const fetchPOs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders`);
        if (res.ok) {
          const data = await res.json();
          setImportPOs(data);
        }
      } catch (e) {
        console.error('Failed to fetch POs', e);
      }
    };
    fetchPOs();
  }, []);"""

new_fetch = """  React.useEffect(() => {
    const fetchPOs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders`);
        if (res.ok) {
          const data = await res.json();
          const mappedPOs = data.map(po => ({
            id: po.import_po_number,
            db_id: po.import_po_id,
            date: po.po_date,
            supplierId: po.supplier_id,
            supplierName: po.supplier_name,
            currency: po.currency,
            currency_id: po.currency_id,
            exchangeRate: Number(po.exchange_rate),
            paymentTerms: po.payment_terms,
            totalFCY: Number(po.total_fcy),
            totalLCY: Number(po.total_lcy),
            status: po.status,
            items: po.items.map(it => ({
              itemCode: it.item_id,
              itemName: it.item_name,
              qty: Number(it.qty),
              fcyUnitPrice: Number(it.fcy_unit_price),
              totalFCY: Number(it.total_fcy)
            }))
          }));
          setImportPOs(mappedPOs);
        }
      } catch (e) {
        console.error('Failed to fetch POs', e);
      }
    };
    fetchPOs();
  }, []);"""
content = content.replace(old_fetch, new_fetch)

# Also fix the fcyUnit fallback in the mapping
old_items = """    const itemsWithFobVal = selectedShipment.items.map(item => {
      // If items come from Import PO API, their keys are itemCode, fcyUnitPrice, totalFCY
      const fcyUnit = Number(item.fcyUnitPrice || item.unitPrice || 0);
      const qty = Number(item.qty || 0);
      const fobValLCY = qty * fcyUnit * Number(exchangeRate || 1);
      return {
        ...item,
        fobValLCY
      };
    });"""
new_items = """    const itemsWithFobVal = selectedShipment.items.map(item => {
      const fcyUnit = Number(item.fcyUnitPrice || item.fcy_unit_price || 0);
      const qty = Number(item.qty || 0);
      const fobValLCY = qty * fcyUnit * Number(exchangeRate || 1);
      return {
        ...item,
        fobValLCY
      };
    });"""
content = content.replace(old_items, new_items)

# Save the changes
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapping patched!")

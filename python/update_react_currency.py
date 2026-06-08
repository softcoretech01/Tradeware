import os
import re

file_path = 'd:/Trade Wave/react/src/pages/ImportManagement/ImportPurchase.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add currenciesList state
content = content.replace("const [paymentTermsList, setPaymentTermsList] = useState([]);",
                          "const [paymentTermsList, setPaymentTermsList] = useState([]);\n  const [currenciesList, setCurrenciesList] = useState([]);")

# 2. Add fetch in Promise.all
content = content.replace("fetch(`${API_BASE_URL}/dropdown/payment-terms`)",
                          "fetch(`${API_BASE_URL}/dropdown/payment-terms`),\n        fetch(`${API_BASE_URL}/dropdown/currencies`)")
content = content.replace("const [posRes, supRes, itemRes, ptRes] = await Promise.all([",
                          "const [posRes, supRes, itemRes, ptRes, curRes] = await Promise.all([")
content = content.replace("if (ptRes.ok) setPaymentTermsList(await ptRes.json());",
                          "if (ptRes.ok) setPaymentTermsList(await ptRes.json());\n      if (curRes.ok) setCurrenciesList(await curRes.json());")

# 3. mappedPOs currency_id
content = content.replace("currency: po.currency,",
                          "currency: po.currency,\n          currency_id: po.currency_id,")

# 4. formCurrency initial state
content = content.replace("const [formCurrency, setFormCurrency] = useState('USD');",
                          "const [formCurrency, setFormCurrency] = useState('');")

# 5. handleOpenCreate
content = content.replace("setFormCurrency('USD');", "setFormCurrency('');")

# 6. handleOpenEdit
content = content.replace("setFormCurrency(po.currency || 'USD');", "setFormCurrency(po.currency_id || '');")

# 7. handleCurrencyChange
content = content.replace("""  const handleCurrencyChange = (currency) => {
    setFormCurrency(currency);
    setFormExchangeRate(DEFAULT_RATES[currency] || 83.5);
  };""", """  const handleCurrencyChange = (currency_id) => {
    setFormCurrency(currency_id);
    const curr = currenciesList.find(c => c.id === currency_id);
    if (curr) {
      setFormExchangeRate(DEFAULT_RATES[curr.code] || 83.5);
    }
  };""")

# 8. handleSupplierChange
content = content.replace("if (sup.currency) {", "if (sup.currency_id) {")
content = content.replace("handleCurrencyChange(sup.currency);", "handleCurrencyChange(sup.currency_id);")

# 9. handleSavePO Payload
# In handleSavePO, payload has `currency: formCurrency`. Change to `currency_id: formCurrency`
# Also need to map currency_id into items.
content = content.replace("""      currency: formCurrency,
      exchangeRate: Number(formExchangeRate),
      items: formItems.map(i => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        qty: Number(i.qty),
        fcyUnitPrice: Number(i.fcyUnitPrice)
      })),""", """      currency_id: formCurrency,
      exchangeRate: Number(formExchangeRate),
      items: formItems.map(i => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        currency_id: formCurrency,
        qty: Number(i.qty),
        fcyUnitPrice: Number(i.fcyUnitPrice)
      })),""")

# 10. The Select for FCY Currency
# <Select ...> <MenuItem value="USD">USD</MenuItem> ... </Select>
old_select = """                    <Select
                      labelId="currency-select-label"
                      value={formCurrency}
                      label="FCY Currency"
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                      <MenuItem value="SGD">SGD</MenuItem>
                    </Select>"""
new_select = """                    <Select
                      labelId="currency-select-label"
                      value={formCurrency}
                      label="FCY Currency"
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                    >
                      {currenciesList.map(c => (
                        <MenuItem key={c.id} value={c.id}>{c.code}</MenuItem>
                      ))}
                    </Select>"""
content = content.replace(old_select, new_select)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ImportPurchase.jsx")

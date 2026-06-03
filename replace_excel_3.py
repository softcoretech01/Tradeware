import os
import re

files_to_fix = [
    'BatchLotManagement/BatchMaintenance.jsx', 
    'BatchLotManagement/BatchStockInquiry.jsx', 
    'BatchLotManagement/BatchAgingAnalysis.jsx', 
    'ImportManagement/SellingPrice.jsx', 
    'ImportManagement/ShipmentTracking.jsx', 
    'ImportManagement/ImportPurchase.jsx'
]

replacement = r'''<Button 
            variant="outlined" 
            startIcon={<FileSpreadsheet size={16} />} 
            onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#E8F5E9' }, borderRadius: 2 }}
          >
            Export Excel
          </Button>'''

for f in files_to_fix:
    fp = os.path.join(r'd:\Trade Wave\react\src\pages', f.replace('/', '\\'))
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace the button
        new_content = re.sub(
            r'<Button[^>]*?onClick=\{handleExportExcel\}[^>]*?>\s*Export Excel\s*</Button>', 
            replacement, 
            content,
            flags=re.IGNORECASE | re.DOTALL
        )
        
        if new_content != content:
            with open(fp, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print('Updated ' + f)

import os
import re

directories = [
    r'd:\Trade Wave\react\src\pages',
    r'd:\Trade Wave\react\src\components'
]

pattern = re.compile(r'<Button[^>]*?handleExportExcel(?:Local)?[^>]*?>\s*(?:Export\s+)?Excel\s*</Button>', re.IGNORECASE | re.DOTALL)

def ensure_lucide_import(content):
    if '<FileSpreadsheet' in content and 'FileSpreadsheet' not in content[:content.find('<FileSpreadsheet')]:
        if 'lucide-react' in content:
            content = re.sub(r'import\s+\{([^}]+)\}\s+from\s+[\'"]lucide-react[\'"]', lambda m: m.group(0).replace('{', '{ FileSpreadsheet,'), content)
        else:
            content = "import { FileSpreadsheet } from 'lucide-react';\n" + content
    return content

for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                original_content = content
                
                def replacement(match):
                    m_text = match.group(0)
                    # Extract onClick handler name
                    onClick_match = re.search(r'onClick=\{([^}]+)\}', m_text)
                    if not onClick_match:
                        return m_text
                    handler = onClick_match.group(1)
                    
                    return f'''<Button 
            variant="outlined" 
            startIcon={{<FileSpreadsheet size={{16}} />}} 
            onClick={{{handler}}}
            sx={{{{ textTransform: 'none', fontWeight: 600, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': {{ borderColor: '#1B5E20', bgcolor: '#E8F5E9' }}, borderRadius: 2 }}}}
          >
            Export Excel
          </Button>'''

                new_content = pattern.sub(replacement, content)
                
                # Check for "Excel" explicitly to fix the ones like InventoryMaster which might have PdfIcon before
                # Actually, let's also fix the specific one in InventoryMaster manually or via script:
                new_content = re.sub(
                    r'<Button\s+variant="outlined"\s+startIcon=\{<ExcelIcon />\}\s+onClick=\{handleExportExcel\}[\s\S]*?Excel\s*</Button>',
                    replacement(re.match(r'.*onClick=\{([^\}]+)\}.*', '<Button onClick={handleExportExcel}>')),
                    new_content
                )

                if new_content != original_content:
                    new_content = ensure_lucide_import(new_content)
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Updated {filepath}')

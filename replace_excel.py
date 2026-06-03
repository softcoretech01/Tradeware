import os
import re

directories = [
    r'd:\Trade Wave\react\src\pages',
    r'd:\Trade Wave\react\src\components'
]

# Pattern 1: <button className="btn-secondary" onClick={handleExportExcel}><FileSpreadsheet /> Excel</button>
# Or similar raw HTML buttons
pattern_html_button = re.compile(r'<button\s+[^>]*?onClick=\{([^}]+)\}[^>]*?>\s*(<[A-Za-z]+[^>]*>)?\s*(?:Export\s+)?Excel\s*</button>', re.IGNORECASE)

# Pattern 2: <Button ... onClick={handleExportExcel} ... > Excel </Button>
# We need to be careful with MUI Buttons to preserve the icon if it's in startIcon
pattern_mui_button = re.compile(r'<Button\s+[^>]*?onClick=\{([^}]+)\}[^>]*?>\s*(?:Export\s+)?Excel\s*</Button>', re.IGNORECASE)

# Pattern 3: <Button ... onClick={...} startIcon={<...>} ... > Export Excel </Button>
# This regex will catch MUI buttons that might have inner text or just properties.
# A more general one:
pattern_general_mui = re.compile(r'<Button\s+(?:[^>]*?)onClick=\{([^}]+)\}(?:[^>]*?)>(?:\s*<[^>]+>\s*)?(?:Export\s+)?Excel\s*</Button>', re.IGNORECASE | re.DOTALL)

def ensure_mui_button_import(content):
    if '<Button' in content and 'Button' not in content[:content.find('<Button')]:
        # We need to add Button to @mui/material import
        if '@mui/material' in content:
            content = re.sub(r'from\s+[\'"]@mui/material[\'"]', r'from \'@mui/material\'', content)
            # This is tricky without a proper parser, but we can do a hacky check
            if 'import {' in content and 'from \'@mui/material\'' in content:
                # Find the import { ... } from '@mui/material'
                match = re.search(r'import\s+\{([^}]+)\}\s+from\s+[\'"]@mui/material[\'"]', content)
                if match and 'Button' not in match.group(1):
                    new_import = match.group(0).replace('{', '{ Button,')
                    content = content.replace(match.group(0), new_import)
        else:
            # Add new import
            content = "import { Button } from '@mui/material';\n" + content
    return content

for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                original_content = content
                
                # We will replace them with a standardized MUI Button
                # Let's see if lucide-react FileSpreadsheet is used, else TableChart
                icon_to_use = '<FileSpreadsheet size={16} />'
                if '<ExcelIcon' in content:
                    icon_to_use = '<ExcelIcon />'
                elif 'FileSpreadsheet' not in content:
                    # Let's just use TableChart and import it as ExcelIcon if needed, but easier is to use FileSpreadsheet 
                    # if we import it from lucide-react
                    pass

                replacement = r'''<Button 
            variant="outlined" 
            startIcon={''' + icon_to_use + r'''} 
            onClick={\1}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#E8F5E9' }, borderRadius: 2 }}
          >
            Export Excel
          </Button>'''

                # Let's try replacing HTML buttons first
                content = pattern_html_button.sub(replacement, content)
                content = pattern_general_mui.sub(replacement, content)
                
                # Check for imports
                if content != original_content:
                    if '<FileSpreadsheet' in replacement and 'FileSpreadsheet' not in content:
                        if 'lucide-react' in content:
                            content = re.sub(r'import\s+\{([^}]+)\}\s+from\s+[\'"]lucide-react[\'"]', lambda m: m.group(0).replace('{', '{ FileSpreadsheet,'), content)
                        else:
                            content = "import { FileSpreadsheet } from 'lucide-react';\n" + content
                            
                    content = ensure_mui_button_import(content)

                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f'Updated {filepath}')

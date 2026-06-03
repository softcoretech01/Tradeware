import os
import re

directories = [
    r'd:\Trade Wave\react\src\pages',
    r'd:\Trade Wave\react\src\components'
]

# We want to replace ANY MUI <Button> that contains "Excel" with the standardized one
# But we must preserve the onClick handler.

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
                
                # Match any Button that has onClick={something} and contains Excel (case insensitive) inside its text
                # We'll use a function to replace it so we can extract the onClick
                def replacement(match):
                    m_text = match.group(0)
                    if '#2E7D32' in m_text:
                        return m_text # Already styled
                    
                    # Extract onClick
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

                # Pattern to match <Button ...> ... Excel ... </Button>
                # It might have startIcon, etc.
                new_content = re.sub(r'<Button[\s\S]*?onClick=\{[^\}]+\}[\s\S]*?>\s*(?:Export\s+)?Excel\s*</Button>', replacement, content, flags=re.IGNORECASE)

                if new_content != original_content:
                    new_content = ensure_lucide_import(new_content)
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print('Updated ' + filepath)

import os
import re

for root, dirs, files in os.walk('d:/Trade Wave/react/src/pages'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'dateUtils' in content:
                # Remove all occurrences of the import
                content = re.sub(r'import\s+\{\s*formatDate\s*\}\s+from\s+[\'"]\.\./\.\./utils/dateUtils[\'"];?\n?', '', content)
                # Prepend the import at the very top
                new_import = "import { formatDate } from '../../utils/dateUtils';\n"
                content = new_import + content
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Fixed {file}')

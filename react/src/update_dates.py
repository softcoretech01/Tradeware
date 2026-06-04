import os
import re

pattern = re.compile(r'>\{([a-zA-Z0-9_]+\.[a-zA-Z0-9_]*[Dd]ate)\}<')

for root, dirs, files in os.walk('d:/Trade Wave/react/src/pages'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            matches = pattern.findall(content)
            if matches:
                if 'formatDate' not in content:
                    import_stmt = "import { formatDate } from '../../utils/dateUtils';\n"
                    import_pattern = re.compile(r'^import\s+.*?;?$', re.MULTILINE)
                    imports = list(import_pattern.finditer(content))
                    if imports:
                        last_import = imports[-1]
                        content = content[:last_import.end()] + '\n' + import_stmt + content[last_import.end():]
                    else:
                        content = import_stmt + content
                
                new_content = pattern.sub(r'>{formatDate(\1)}<', content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {file}')

import os

directories = [
    r'd:\Trade Wave\react\src\pages\PurchaseManagement',
    r'd:\Trade Wave\react\src\pages\SalesManagement'
]

def replace_currency(content):
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        # If it's a template literal line, we skip to avoid breaking interpolation
        # However, what if a line has ` but also JSX ${}? Rare, but possible.
        # Most of our targets do not have backticks in the same line.
        if '${' in line and '`' not in line:
            line = line.replace('>${', '>INR {')
            line = line.replace(': ${', ': INR {')
            line = line.replace(' ${', ' INR {')
            line = line.replace('($)', '(INR)')
        new_lines.append(line)
    return '\n'.join(new_lines)

for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = replace_currency(content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print('Updated', filepath)

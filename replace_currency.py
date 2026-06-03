import os, re

directories = [
    r'd:\Trade Wave\react\src\pages\PurchaseManagement',
    r'd:\Trade Wave\react\src\pages\SalesManagement'
]

pattern = re.compile(r'\$(?!\{)')

for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = pattern.sub('INR ', content)
                new_content = new_content.replace('INR )', 'INR)')
                new_content = new_content.replace('INR  ', 'INR ')
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print('Updated', filepath)

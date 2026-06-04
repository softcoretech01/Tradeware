import os
import re

def final_clean():
    pages_dir = r'd:\Trade Wave\react\src\pages'
    pattern = re.compile(r'<(td|TableCell)([^>]*)>(.*?)</\1>', re.DOTALL | re.IGNORECASE)

    valid_keywords = ['qty', 'quantity', 'amount', 'price', 'total', 'value', 'cost', 'rate', 'balance', 'limit', 'tax', 'discount', 'ordered', 'received', 'supplied', 'pending']

    for root, dirs, files in os.walk(pages_dir):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                def replacer(match):
                    tag = match.group(1)
                    attrs = match.group(2)
                    inner = match.group(3)

                    if 'text-right' in attrs:
                        # Plain variable {obj.prop}
                        var_match = re.match(r'^\s*\{\s*\w+\.(\w+)\s*\}\s*$', inner)
                        if var_match:
                            prop = var_match.group(1).lower()
                            # If prop doesn't contain any valid keyword, strip it!
                            if not any(k in prop for k in valid_keywords):
                                new_attrs = re.sub(r'\s*text-right\s*', ' ', attrs)
                                new_attrs = new_attrs.replace('className=" "', '')
                                new_attrs = new_attrs.replace('className=""', '')
                                return f'<{tag}{new_attrs}>{inner}</{tag}>'
                        
                    return match.group(0)

                new_content = pattern.sub(replacer, content)

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Cleaned {file}")

final_clean()

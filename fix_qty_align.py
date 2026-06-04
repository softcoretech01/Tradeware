import os
import re

def fix_qty_align():
    pages_dir = r'd:\Trade Wave\react\src\pages'
    
    # Matches exactly {variable.qty} or {variable.orderedQty} etc with no other text
    pattern = re.compile(r'<(td|TableCell)([^>]*)>(\s*\{[a-zA-Z0-9_\.]*(qty|quantity|amount|total|value|price|cost)[a-zA-Z0-9_\?]*(\(\))?\}\s*)</\1>', re.DOTALL | re.IGNORECASE)

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

                    if 'text-right' not in attrs and 'textAlign' not in attrs:
                        if 'className="' in attrs:
                            new_attrs = re.sub(r'className="([^"]*)"', r'className="\1 text-right"', attrs)
                        else:
                            new_attrs = attrs + ' className="text-right"'
                        return f'<{tag}{new_attrs}>{inner}</{tag}>'
                    
                    return match.group(0)

                new_content = pattern.sub(replacer, content)

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed {file}")

fix_qty_align()

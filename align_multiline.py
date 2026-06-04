import os
import re

def fix_multiline_tds():
    pages_dir = r'd:\Trade Wave\react\src\pages'
    
    # Regex to find <td ...> ... </td> or <TableCell ...> ... </TableCell>
    # Note: this simple regex assumes no nested td/TableCell tags.
    pattern = re.compile(r'<(td|TableCell)([^>]*)>(.*?)</\1>', re.DOTALL | re.IGNORECASE)

    for root, dirs, files in os.walk(pages_dir):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                modified = False

                def replacer(match):
                    tag = match.group(1)
                    attrs = match.group(2)
                    inner = match.group(3)

                    # If the inner content has number formatters or common number fields
                    has_number = (
                        '.toFixed' in inner or 
                        '.toLocaleString' in inner or
                        '.qty' in inner.lower() or
                        'quantity' in inner.lower() or
                        '.amount' in inner.lower() or
                        '.total' in inner.lower() or
                        '.price' in inner.lower() or
                        '.rate' in inner.lower() or
                        '.cost' in inner.lower() or
                        '.balance' in inner.lower() or
                        '.limit' in inner.lower() or
                        '.tax' in inner.lower() or
                        '.pending' in inner.lower() or
                        '.supplied' in inner.lower() or
                        '.ordered' in inner.lower() or
                        '.received' in inner.lower()
                    )

                    # Also if inner is just a number
                    if not has_number and re.match(r'^\s*\{\s*\w+\.\w+\s*\}\s*$', inner):
                         has_number = True # Might be a plain variable, but let's check keywords
                    
                    if has_number and 'text-right' not in attrs and 'textAlign' not in attrs:
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
                    print(f"Updated {file}")

fix_multiline_tds()

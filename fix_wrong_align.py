import os
import re

def fix_wrong_align():
    pages_dir = r'd:\Trade Wave\react\src\pages'
    
    # Regex to find <td ...> ... </td> or <TableCell ...> ... </TableCell>
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

                    # Check if text-right is applied
                    if 'text-right' in attrs:
                        inner_lower = inner.lower()
                        # If the inner text contains variables that are definitely not numbers
                        # but strings
                        is_string_var = (
                            'id' in inner_lower or 
                            'name' in inner_lower or 
                            'date' in inner_lower or 
                            'status' in inner_lower or 
                            'ref' in inner_lower or 
                            'code' in inner_lower or
                            'terms' in inner_lower or
                            'currency' in inner_lower or
                            'warehouse' in inner_lower or
                            'type' in inner_lower or
                            'desc' in inner_lower or
                            'remark' in inner_lower or
                            'email' in inner_lower or
                            'phone' in inner_lower or
                            'address' in inner_lower
                        )
                        # But wait, 'paid' (id) or 'provided' (id)?
                        # It's safer to check for explicit variable names like `.id`, `.name`, etc.
                        is_string_var_strict = re.search(r'\.(id|name|date|status|ref|code|terms|currency|warehouse|type|desc|remark|email|phone|address)\b', inner_lower)
                        
                        if is_string_var_strict:
                            # Remove text-right from attrs
                            new_attrs = re.sub(r'\s*text-right\s*', ' ', attrs)
                            new_attrs = new_attrs.replace('className=" "', '')
                            new_attrs = new_attrs.replace('className=""', '')
                            return f'<{tag}{new_attrs}>{inner}</{tag}>'
                        
                        # Also if inner doesn't have ANY number-like thing (no toFixed, no qty, etc.)
                        # and it's just a raw variable like `{item}`
                        
                    return match.group(0)

                new_content = pattern.sub(replacer, content)

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed {file}")

fix_wrong_align()

import os
import re

def strict_clean():
    pages_dir = r'd:\Trade Wave\react\src\pages'
    
    pattern = re.compile(r'<(td|TableCell)([^>]*)>(.*?)</\1>', re.DOTALL | re.IGNORECASE)

    # Keywords that indicate the column is DEFINITELY a string, ID, or name and should NOT be right-aligned.
    bad_keywords = [
        'batch', 'id', 'name', 'code', 'date', 'status', 'ref', 
        'terms', 'currency', 'warehouse', 'person', 'source', 
        'category', 'uom', 'email', 'phone', 'address', 'type', 
        'desc', 'remark', 'notes', 'delivery'
    ]

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
                        inner_lower = inner.lower()
                        
                        # 1. Strip if it contains any of the bad variable keywords (e.g., b.batchNo, l.contactPerson)
                        has_bad_keyword = any(kw in inner_lower for kw in bad_keywords)
                        
                        # 2. Strip if it contains the word "units" or "unit" outside of variables (e.g. {b.qty} units)
                        # We just check if ' unit' or ' units' is in the text.
                        has_unit_text = ' unit' in inner_lower or ' units' in inner_lower or ' days' in inner_lower
                        
                        # 3. BUT wait, what if the variable is `unitPrice`? `unitPrice` has 'unit'.
                        # 'unitPrice' contains 'unit', but it does NOT contain ' unit' (with space).
                        # Let's ensure `unitprice` is protected if it has .toFixed
                        
                        strip = False
                        
                        if has_bad_keyword:
                            strip = True
                        
                        if has_unit_text:
                            strip = True
                            
                        # Exception: if it's explicitly formatted as currency with .toFixed or .toLocaleString, 
                        # and it has 'price' or 'cost' or 'amount' or 'total' or 'value', KEEP IT.
                        if strip:
                            if ('.tofixed' in inner_lower or '.tolocalestring' in inner_lower) and any(x in inner_lower for x in ['price', 'cost', 'amount', 'total', 'value']):
                                strip = False # Keep it, it's a real amount!

                        if strip:
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

strict_clean()

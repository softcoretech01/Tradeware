import os
import re

def clean_alignment():
    pages_dir = r'd:\Trade Wave\react\src\pages'
    
    pattern = re.compile(r'<(td|TableCell)([^>]*)>(.*?)</\1>', re.DOTALL | re.IGNORECASE)

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
                        # Strictly remove if it is an ID, Code, or Name field that got accidentally caught
                        is_string = re.search(r'\.(itemid|itemcode|customername|suppliername|id|code|name|date|status|ref|type|desc|remark|email|phone|address|paymentterms|warehouse|delivery|notes)\b', inner_lower)
                        
                        if is_string:
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

clean_alignment()

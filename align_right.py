import os
import re

def add_text_right():
    # 1. Add .text-right to index.css
    with open(r'd:\Trade Wave\react\src\index.css', 'r', encoding='utf-8') as f:
        css = f.read()
    
    if '.text-right' not in css:
        css += '\n.text-right {\n  text-align: right !important;\n}\n'
        with open(r'd:\Trade Wave\react\src\index.css', 'w', encoding='utf-8') as f:
            f.write(css)

    # 2. Iterate over all JSX files in src/pages
    pages_dir = r'd:\Trade Wave\react\src\pages'
    
    # Keywords indicating an amount column header
    header_keywords = ['Total', 'Value', 'Price', 'Cost', 'Amount', 'Rate', 'Quantity', 'Qty', 'Limit', 'Balance']

    for root, dirs, files in os.walk(pages_dir):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                modified = False

                # Process <th> and <TableCell> tags with amount keywords
                # Regex looks for <th> or <TableCell ...> followed by text containing a keyword
                # We need to be careful. Let's do line by line.
                lines = content.split('\n')
                for i in range(len(lines)):
                    line = lines[i]
                    
                    # Check for header
                    if re.search(r'<(th|TableCell)[^>]*>', line):
                        # Check if it contains a keyword
                        if any(kw in line for kw in header_keywords) and ('text-right' not in line) and ('textAlign' not in line):
                            # Insert text-right class
                            if 'className=' in line:
                                line = re.sub(r'className="([^"]*)"', r'className="\1 text-right"', line)
                            else:
                                line = re.sub(r'<(th|TableCell)', r'<\1 className="text-right"', line)
                            lines[i] = line
                            modified = True

                    # Check for data cell
                    if re.search(r'<(td|TableCell)[^>]*>', line):
                        # If the cell has .toFixed, .toLocaleString, or specific text matching numbers
                        if ('.toFixed' in line or '.toLocaleString' in line) and ('text-right' not in line) and ('textAlign' not in line):
                            if 'className=' in line:
                                line = re.sub(r'className="([^"]*)"', r'className="\1 text-right"', line)
                            else:
                                line = re.sub(r'<(td|TableCell)', r'<\1 className="text-right"', line)
                            lines[i] = line
                            modified = True

                if modified:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write('\n'.join(lines))
                    print(f"Updated {file}")

add_text_right()

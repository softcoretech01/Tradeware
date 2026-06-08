import re
with open('d:/Trade Wave/react/src/pages/ImportManagement/LandedCost.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'gap' in line:
        print(f"{i+1}: {line.strip()}")

import re

file_path = 'd:/Trade Wave/react/src/pages/ImportManagement/LandedCost.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'p: 1\.5', r'p: 1', content)
content = re.sub(r'mb: 1\.5', r'mb: 1', content)
content = re.sub(r'spacing=\{1\.5\}', r'spacing={1}', content)
content = re.sub(r'gap: 1\.5', r'gap: 1', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated LandedCost.jsx to be more compact.")

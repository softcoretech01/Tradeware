import re

def tighten_layout():
    # Update Layout.jsx
    with open(r'd:\Trade Wave\react\src\components\Layout.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('padding: 24px;', 'padding: 16px;')
    
    with open(r'd:\Trade Wave\react\src\components\Layout.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

    # Update index.css
    with open(r'd:\Trade Wave\react\src\index.css', 'r', encoding='utf-8') as f:
        css = f.read()

    css = css.replace('.module-container {\n  display: flex;\n  flex-direction: column;\n  gap: 24px;',
                      '.module-container {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;')

    css = css.replace('padding: 16px 20px;', 'padding: 12px 16px;')
    css = css.replace('padding: 14px 20px;', 'padding: 10px 14px;')
    
    css = css.replace('gap: 16px;\n  margin-bottom: 16px;', 'gap: 12px;\n  margin-bottom: 12px;')
    
    css = css.replace('margin-top: 24px;\n  border-top: 1px solid var(--border);\n  padding-top: 20px;',
                      'margin-top: 16px;\n  border-top: 1px solid var(--border);\n  padding-top: 16px;')

    with open(r'd:\Trade Wave\react\src\index.css', 'w', encoding='utf-8') as f:
        f.write(css)
    
    print("UI spacing tightened successfully.")

tighten_layout()

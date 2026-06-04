import os

def apply_center():
    css_path = r'd:\Trade Wave\react\src\index.css'
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write('\n.text-center {\n  text-align: center !important;\n}\n')

    jsx_path = r'd:\Trade Wave\react\src\pages\CRM\ExistingLeads.jsx'
    with open(jsx_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update th
    content = content.replace('<th>Next Followup Date</th>', '<th className="text-center">Next Followup Date</th>')
    
    # Update td
    content = content.replace(
        '<td className={`bold-cell ${getFollowUpClass(followup?.nextFollowUpDate)}`}>',
        '<td className={`bold-cell text-center ${getFollowUpClass(followup?.nextFollowUpDate)}`}>'
    )

    with open(jsx_path, 'w', encoding='utf-8') as f:
        f.write(content)

apply_center()

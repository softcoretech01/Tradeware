import os

def fix_alignment(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix th
    content = content.replace('<th>Allocated Overhead</th>', '<th className="text-right">Allocated Overhead</th>')

    # Fix td
    content = content.replace('<td>{it.qty}</td>', '<td className="text-right">{it.qty}</td>')
    content = content.replace('<td style={{ color: AMBER.main, fontWeight: 500 }}>', '<td className="text-right" style={{ color: AMBER.main, fontWeight: 500 }}>')
    content = content.replace('<td className="bold-cell">\n                            {it.totalLandedCost', '<td className="bold-cell text-right">\n                            {it.totalLandedCost')
    content = content.replace('<td className="bold-cell" style={{ color: BLUE.main }}>\n                            {it.landedUnitCost', '<td className="bold-cell text-right" style={{ color: BLUE.main }}>\n                            {it.landedUnitCost')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_alignment(r'd:\Trade Wave\react\src\pages\PurchaseManagement\LandedCostCalculation.jsx')
fix_alignment(r'd:\Trade Wave\react\src\pages\ImportManagement\LandedCost.jsx')

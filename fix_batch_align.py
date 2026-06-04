import os

def fix_batch_align():
    # 1. BatchStockInquiry.jsx
    file1 = r'd:\Trade Wave\react\src\pages\BatchLotManagement\BatchStockInquiry.jsx'
    with open(file1, 'r', encoding='utf-8') as f:
        c1 = f.read()
    c1 = c1.replace('<th>Available Stock</th>', '<th className="text-right">Available Stock</th>')
    with open(file1, 'w', encoding='utf-8') as f:
        f.write(c1)

    # 2. BatchAgingAnalysis.jsx
    file2 = r'd:\Trade Wave\react\src\pages\BatchLotManagement\BatchAgingAnalysis.jsx'
    with open(file2, 'r', encoding='utf-8') as f:
        c2 = f.read()
    c2 = c2.replace('<td className="bold-cell ">{b.qty} units</td>', '<td className="bold-cell text-right">{b.qty} units</td>')
    c2 = c2.replace('<td className="bold-cell">{b.qty} units</td>', '<td className="bold-cell text-right">{b.qty} units</td>')
    with open(file2, 'w', encoding='utf-8') as f:
        f.write(c2)

    print("Batch alignments fixed.")

fix_batch_align()

import re

def split_popup(file_path, dialog_start_marker, array_name, item_var_name):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add editOpen state
    if 'const [editOpen, setEditOpen] = useState(false);' not in content:
        content = re.sub(r'(const \[formOpen, setFormOpen\] = useState\(false\);)', r'\1\n  const [editOpen, setEditOpen] = useState(false);', content)
    
    # 2. Add handleEditSave
    if 'const handleEditSave' not in content:
        save_match = re.search(r'(const handleSave = \(\) => {[\s\S]*?setFormOpen\(false\);\n  };)', content)
        if save_match:
            edit_save = save_match.group(1).replace('handleSave', 'handleEditSave').replace('setFormOpen(false)', 'setEditOpen(false)')
            content = content.replace(save_match.group(1), save_match.group(1) + '\n\n' + edit_save)

    # 3. Modify Edit button
    # In SalesOrder: onClick={() => { setSelectedSO(so); setFormOpen(true); }}
    # In Invoice: onClick={() => { setSelectedInvoice(inv); setFormData(inv); setFormOpen(true); }}
    # We want it to use setEditOpen(true) and make sure it sets formData
    if file_path.endswith('SalesOrder.jsx'):
        content = content.replace('onClick={() => { setSelectedSO(so); setFormOpen(true); }}', 'onClick={() => { setSelectedSO(so); setFormData(so); setEditOpen(true); }}')
    else:
        content = content.replace('setFormOpen(true); }}', 'setEditOpen(true); }}').replace('setSelectedInvoice(inv); setEditOpen(true)', 'setSelectedInvoice(inv); setFormData(inv); setEditOpen(true)')

    # 4. Duplicate the Dialog block
    # Find the dialog block
    idx_start = content.find(dialog_start_marker)
    if idx_start == -1:
        print(f"Could not find dialog start in {file_path}")
        return
    
    # Simple counting of <Dialog> </Dialog> to extract the block
    idx_end = content.find('</Dialog>', idx_start) + len('</Dialog>')
    dialog_block = content[idx_start:idx_end]
    
    # Create the Edit Dialog block
    edit_dialog_block = dialog_block.replace('open={formOpen}', 'open={editOpen}').replace('setFormOpen(false)', 'setEditOpen(false)')
    edit_dialog_block = edit_dialog_block.replace('handleSave', 'handleEditSave')
    
    # Change the titles
    # Original block becomes purely Create (or Invoice)
    if file_path.endswith('SalesOrder.jsx'):
        # Fix the ternary in Create block back to hardcoded
        dialog_block = re.sub(r'\{salesOrders\.some.*\}', 'Create', dialog_block)
        edit_dialog_block = re.sub(r'\{salesOrders\.some.*\}', 'Edit', edit_dialog_block)
        
        dialog_block = dialog_block.replace('CREATE SO DIALOG', 'CREATE SO DIALOG')
        edit_dialog_block = edit_dialog_block.replace('CREATE SO DIALOG', 'EDIT SO DIALOG')
    else:
        dialog_block = re.sub(r'\{invoices\.some.*\}', 'Invoice', dialog_block)
        edit_dialog_block = re.sub(r'\{invoices\.some.*\}', 'Edit', edit_dialog_block)
        
        dialog_block = dialog_block.replace('CREATE INVOICE DIALOG', 'CREATE INVOICE DIALOG')
        edit_dialog_block = edit_dialog_block.replace('CREATE INVOICE DIALOG', 'EDIT INVOICE DIALOG')
        

    # Insert back
    content = content[:idx_start] + dialog_block + '\n\n' + edit_dialog_block + content[idx_end:]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file_path}")

split_popup(r'd:\Trade Wave\react\src\pages\SalesManagement\SalesOrder.jsx', '{/* CREATE SO DIALOG */}', 'salesOrders', 'so')
split_popup(r'd:\Trade Wave\react\src\pages\SalesManagement\Invoice.jsx', '{/* CREATE INVOICE DIALOG */}', 'invoices', 'inv')

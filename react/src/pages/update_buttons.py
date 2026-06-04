import os
import re
import glob

# Directory containing the pages
PAGES_DIR = r"d:\Trade Wave\react\src\pages"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Replace the inner text of the "New" buttons
    # Usually they look like:
    # <button className="btn-primary" onClick={handleOpenCreate}>
    #   <Plus size={16} /> Some Text
    # </button>
    # We want to replace "Some Text" with "New".
    
    # We can match `<Plus ... /> Any Text` inside a button.
    # We need to make sure we don't accidentally replace other Plus buttons that shouldn't be just "New" (like add line item).
    # Those are usually `<Button startIcon={<PlusCircle size={16} />}` or similar.
    # The main create buttons are usually `<Plus size={16} /> Some Text`.
    
    # Let's target lines with <Plus size={16} /> followed by text, before a </button> or </Button>
    # Actually, replacing all `<Plus size={16} /> [A-Za-z\s()]+` with `<Plus size={16} /> New` is mostly safe for the header actions.
    # Let's do a regex substitution:
    # Match `<Plus size={16} />` followed by any whitespace, then any word characters/spaces/parens until the end of the line or `<`.
    
    content = re.sub(r'(<Plus size=\{16\} />)\s+[A-Za-z\s()-]+(?=\s*</button>|\s*<)', r'\1 New', content)
    content = re.sub(r'(<Plus size=\{18\} />)\s+[A-Za-z\s()-]+(?=\s*</button>|\s*<)', r'\1 New', content)

    # 2. Replace the inner text of the "Save" buttons
    # They look like: <Button onClick={handleSave} variant="contained" color="primary">Some Text</Button>
    
    content = re.sub(
        r'(<Button[^>]*onClick=\{handleSave\}[^>]*>)\s*[^<]+\s*(</Button>)',
        r'\1Save\2',
        content
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

# Process all jsx files
for root, dirs, files in os.walk(PAGES_DIR):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))

print("Done")

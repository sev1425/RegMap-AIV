import ast
import os
import sys

def get_imports_from_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            tree = ast.parse(f.read())
        except Exception as e:
            return set()
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                imports.add(name.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.add(node.module.split('.')[0])
    return imports

backend_dir = os.path.dirname(os.path.abspath(__file__))
all_imports = set()
for root, _, files in os.walk(backend_dir):
    # Exclude venv if exists
    if 'venv' in root or '.venv' in root:
        continue
    for file in files:
        if file.endswith('.py'):
            all_imports.update(get_imports_from_file(os.path.join(root, file)))

# stdlib modules we can ignore
import sys
stdlib = set(sys.stdlib_module_names) if hasattr(sys, 'stdlib_module_names') else set()
stdlib.update(['os', 'sys', 'time', 'json', 're', 'hashlib', 'pathlib', 'dataclasses', 'typing', 'sqlite3', 'datetime'])
# local modules
stdlib.update(['api', 'models', 'ai', 'services', 'database', 'reports', 'tests'])

external_imports = sorted([imp for imp in all_imports if imp not in stdlib and imp != ''])
print("External imports found:")
for imp in external_imports:
    print(imp)

import os
import re

hooks_dir = r"c:\Users\sevan\OneDrive\Desktop\REGMAP-AIV\frontend\src\hooks"

for filename in os.listdir(hooks_dir):
    if not filename.endswith(".js") or filename == "useUpload.js" or filename == "useDashboard.js" or filename == "useCopilot.js":
        continue
        
    filepath = os.path.join(hooks_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    if "useGlobalContext" in content:
        continue
        
    # Add import
    content = content.replace("import { useCallback, useEffect, useState } from \"react\";", "import { useCallback, useEffect, useState } from \"react\";\nimport { useGlobalContext } from \"../context/GlobalContext\";")
    
    # Extract hook name
    hook_name = filename.replace(".js", "")
    
    # Add lastUpdated
    content = content.replace(f"export function {hook_name}() {{", f"export function {hook_name}() {{\n    const {{ lastUpdated }} = useGlobalContext();")
    
    # Find fetch function name to update useEffect dependencies
    match = re.search(r"const (fetch[a-zA-Z]+) = useCallback", content)
    if match:
        fetch_name = match.group(1)
        content = content.replace(f"useEffect(() => {{\n        {fetch_name}();\n    }}, [{fetch_name}]);", f"useEffect(() => {{\n        {fetch_name}();\n    }}, [{fetch_name}, lastUpdated]);")
        content = content.replace(f"useEffect(() => {{\n        {fetch_name}();\n    }}, [ {fetch_name} ]);", f"useEffect(() => {{\n        {fetch_name}();\n    }}, [{fetch_name}, lastUpdated]);")
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Updated hooks.")

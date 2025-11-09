
import os
import shutil

layout_import = "import { TwoColumnLayout } from './Layout/TwoColumnLayout';
"

# Function to clean and fix layout migration
def fix_layout(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "TwoColumnLayout" not in content:
        return f"Skipped {file_path}: TwoColumnLayout not used."

    # Backup original file
    backup_path = file_path + ".bak"
    shutil.copyfile(file_path, backup_path)

    # Remove leftover <div className="w-full lg:w-1/2 ..."> wrappers inside content blocks
    # Replace them with React Fragments <></>
    lines = content.splitlines()
    new_lines = []
    skip = False
    for line in lines:
        if '<div className="w-full lg:w-1/2' in line:
            skip = True
            new_lines.append('<>')
            continue
        if skip and '</div>' in line:
            new_lines.append('</>')
            skip = False
            continue
        if not skip:
            new_lines.append(line)

    # Fix any missing closing braces or parentheses
    fixed_content = "
".join(new_lines)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(fixed_content)

    return f"Fixed {file_path} and created backup at {backup_path}"

# Recursively find all .tsx files
tsx_files = []
for root, _, files in os.walk('.'):
    for file in files:
        if file.endswith(".tsx"):
            tsx_files.append(os.path.join(root, file))

# Run fix for each file
results = [fix_layout(f) for f in tsx_files]

# Print results
for res in results:
    print(res)

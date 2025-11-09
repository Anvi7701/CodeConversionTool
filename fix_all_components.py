import os
import re

# Directory to scan for .tsx files
PROJECT_DIR = './components'

# JSX fixer function
def fix_jsx(content):
    # Fix common malformed map blocks and misplaced props
    content = re.sub(
        r"\{tabOrder\.map\(\(lang, index\) => \{",
        r"{tabOrder.map((lang, index) => {\n  const { label, icon } = languageDetails[lang];\n  return (",
        content
    )
    content = re.sub(
        r"\),\s*scrollable:\s*true,\s*minHeight:\s*\"500px\"",
        r"\)})\n},\nscrollable: true,\nminHeight: \"500px\"",
        content
    )
    return content

# Process all .tsx files in the directory
for root, _, files in os.walk(PROJECT_DIR):
    for file in files:
        if file.endswith('.tsx'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            fixed_content = fix_jsx(content)

            # Overwrite the original file with corrected content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)

            print(f"Corrected JSX syntax in: {file_path}")

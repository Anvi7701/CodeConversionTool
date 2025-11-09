import os
import re

# Directory to scan for .tsx files
PROJECT_DIR = '.'

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
        r"\)})\nscrollable: true,\nminHeight: \"500px\"",
        content
    )
    # Fix incomplete JSX tags ending with 'shad' or similar
    content = re.sub(
        r'(className=\"[^\"]*?)shad\n',
        r'\1shadow\">',
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

            # Save to a new file with _fixed suffix
            fixed_path = os.path.join(root, file.replace('.tsx', '_fixed.tsx'))
            with open(fixed_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)

            print(f"Fixed JSX syntax in: {fixed_path}")

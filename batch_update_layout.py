
import os

# List of converter component files to update
converter_files = [
    "CodeToJsonConverter.tsx",
    "CodeToXmlConverter.tsx",
    "CodeToHtmlConverter.tsx",
    "CodeToPythonConverter.tsx",
    "CodeToJsConverter.tsx",
    "JsonToPythonPrettyPrintConverter.tsx",
    "XmlInspector.tsx",
    "DataToClassConverter.tsx",
    "OnlineFormatter.tsx"
]

# Layout import line
layout_import = "import { TwoColumnLayout } from './Layout/TwoColumnLayout';
"

# Function to update a file
def update_file(file_path):
    if not os.path.exists(file_path):
        return f"Skipped {file_path}: file not found."

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if already updated
    if "TwoColumnLayout" in content:
        return f"Skipped {file_path}: already updated."

    # Add import after SEO import
    if "import SEO from" in content:
        content = content.replace("import SEO from", layout_import + "import SEO from")
    else:
        content = layout_import + content

    # Try to locate two layout divs with w-full lg:w-1/2
    parts = content.split('<div className="w-full lg:w-1/2')
    if len(parts) < 3:
        return f"Skipped {file_path}: layout structure not found."

    before = parts[0]
    input_div = '<div className="w-full lg:w-1/2' + parts[1].split('</div>', 1)[0] + '</div>'
    output_div = '<div className="w-full lg:w-1/2' + parts[2].split('</div>', 1)[0] + '</div>'
    after = '</div>'.join(parts[2].split('</div>')[1:])

    # Create layout wrapper
    layout_wrapper = f"""
<TwoColumnLayout
  left={{
    header: <h2 className="text-xl font-semibold">Input Section</h2>,
    content: (
      {input_div}
    ),
    scrollable: true,
    minHeight: "500px"
  }}
  right={{
    header: <h2 className="text-xl font-semibold">Output Section</h2>,
    content: (
      {output_div}
    ),
    scrollable: true,
    minHeight: "500px"
  }}
/>
"""

    # Replace old layout with new wrapper
    new_content = before + layout_wrapper + after

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    return f"Updated {file_path} successfully."

# Run update for each file
results = [update_file(f) for f in converter_files]

# Print results
for res in results:
    print(res)

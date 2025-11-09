
import os

# Layout import line
layout_import = "import { TwoColumnLayout } from './Layout/TwoColumnLayout';"


# Function to update a file
def update_file(file_path):
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

# Recursively find all .tsx files
tsx_files = []
for root, _, files in os.walk('.'):
    for file in files:
        if file.endswith(".tsx"):
            tsx_files.append(os.path.join(root, file))

# Run update for each file
results = [update_file(f) for f in tsx_files]

# Print results
for res in results:
    print(res)

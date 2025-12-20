import { formatCodeWithAi } from '../services/geminiService';

declare global {
  interface Window {
    prettier: any;
    prettierPlugins: any;
  }
}

export const generatePythonPrettyPrintScript = (jsonObj: any): string => {
  const pythonDataLiteral = toPython(jsonObj);
  return `import json

# Your JSON data as a Python dictionary
data = ${pythonDataLiteral}

# Pretty print the Python dictionary as a JSON string
# indent=4 creates readable indentation
# sort_keys=True organizes keys alphabetically
pretty_json_string = json.dumps(data, indent=4, sort_keys=True)

print(pretty_json_string)
`;
};

export const toPython = (obj: any, indent = 4): string => {
  const indentStr = ' '.repeat(indent);
  const outerIndent = ' '.repeat(Math.max(0, indent - 4));

  if (obj === null) return 'None';
  if (typeof obj === 'boolean') return obj ? 'True' : 'False';
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`; // Use single quotes for Python
  if (typeof obj === 'number') return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(item => `${indentStr}${toPython(item, indent + 4)}`).join(',\n');
    return `[\n${items}\n${outerIndent}]`;
  }

  if (typeof obj === 'object') {
    if (Object.keys(obj).length === 0) return '{}';
    const items = Object.entries(obj)
      .map(([key, value]) => `${indentStr}'${key}': ${toPython(value, indent + 4)}`)
      .join(',\n');
    return `{\n${items}\n${outerIndent}}`;
  }

  return 'None'; // Fallback
};


export const toXml = (obj: any): string => {
  const toXmlRecursive = (value: any, name: string): string => {
    let xml = '';
    const isObject = typeof value === 'object' && value !== null;
    const tagName = name.replace(/[^a-zA-Z0-9_.-]/g, ''); // Sanitize tag name

    if (Array.isArray(value)) {
      value.forEach(item => {
        xml += toXmlRecursive(item, tagName);
      });
      return xml;
    }

    xml += `<${tagName}`;

    if (isObject) {
      const attributes: { [key: string]: any } = {};
      const children: { [key: string]: any } = {};
      
      Object.entries(value).forEach(([key, val]) => {
          if (typeof val !== 'object' && val !== null && key.startsWith('@')) {
              attributes[key.substring(1)] = val;
          } else {
              children[key] = val;
          }
      });

      Object.entries(attributes).forEach(([key, val]) => {
        xml += ` ${key}="${String(val).replace(/"/g, '&quot;')}"`;
      });

      const childEntries = Object.entries(children);
      if (childEntries.length === 0) {
          xml += '/>';
          return xml;
      }
      xml += '>';
      childEntries.forEach(([key, val]) => {
        xml += toXmlRecursive(val, key);
      });
      xml += `</${tagName}>`;

    } else {
      xml += `>${String(value)}</${tagName}>`;
    }

    return xml;
  };

  let rawXmlString = '<?xml version="1.0" encoding="UTF-8" ?>\n';
  // Note: The formatXml function is now in formatters.ts
  // This function is now just for raw conversion.
  rawXmlString += toXmlRecursive(obj, 'root');
  return rawXmlString;
};

export const convertJsonToCsv = (json: any): string => {
    // Handle both single objects and arrays of objects
    const data = Array.isArray(json) ? json : [json];

    if (data.length === 0 || typeof data[0] !== 'object' || data[0] === null) {
        return ""; // Return empty for empty or non-object data
    }

    const escapeCsvField = (field: any): string => {
        if (field === null || field === undefined) {
            return '';
        }
        let str = String(field);
        if (typeof field === 'object') {
            str = JSON.stringify(field);
        }
        if (/[",\n]/.test(str)) {
            str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    // Collect all unique keys from all objects to create a complete header
    const headersSet = new Set<string>();
    data.forEach(row => {
        if (typeof row === 'object' && row !== null) {
            Object.keys(row).forEach(key => headersSet.add(key));
        }
    });
    const headers = Array.from(headersSet);
    const headerRow = headers.map(escapeCsvField).join(',');

    const dataRows = data.map(row => {
        if (typeof row !== 'object' || row === null) {
            return ''; // Skip non-object rows in array
        }
        return headers.map(header => {
            return escapeCsvField(row[header]);
        }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
};

const escapeHtml = (unsafe: any): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

export const beautifyJava = async (javaString: string): Promise<string> => {
    return await formatCodeWithAi(javaString, 'java');
};

export const convertJsonToHtml = async (json: any): Promise<string> => {
    const buildHtml = (data: any): string => {
        if (data === null) return `<span class="html-null">null</span>`;
        if (typeof data !== 'object') {
            const type = typeof data;
            return `<span class="html-${type}">${escapeHtml(data)}</span>`;
        }

        if (Array.isArray(data)) {
            if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                // Array of objects -> Table
        const headers = Array.from(new Set(data.flatMap(item => Object.keys(item))));
        const headerRow = `<thead><tr>${headers.map(h => `<th class="html-key">${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
                const bodyRows = data.map(row => 
                    `<tr>${headers.map(h => `<td>${buildHtml(row[h])}</td>`).join('')}</tr>`
                ).join('');
                return `<table>${headerRow}<tbody>${bodyRows}</tbody></table>`;
            } else {
                // Array of primitives -> List
                const items = data.map(item => `<li>${buildHtml(item)}</li>`).join('');
                return `<ul>${items}</ul>`;
            }
        }
        
        // Plain object -> Description List
    const items = Object.entries(data).map(([key, value]) => {
      const content = buildHtml(value);
      const wrapped = Array.isArray(value)
        ? `<div class="html-array">${content}</div>`
        : (typeof value === 'object' && value !== null)
          ? `<div class="html-object">${content}</div>`
          : content;
      return `<dt class="html-key">${escapeHtml(key)}</dt><dd>${wrapped}</dd>`;
    }).join('');
        return `<dl>${items}</dl>`;
    };
    
    const style = `<style>
    body { font-family: sans-serif; margin: 2em; background-color: #f8fafc; color: #0f172a; }
    table { border-collapse: collapse; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    th { background-color: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) { background-color: #f8fafc; }
    tr:hover { background-color: #f1f5f9; }
    ul { list-style-type: disc; padding-left: 20px; }
    dl { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1em; }
  dt { font-weight: 600; color: #475569; }
    dd { margin-left: 20px; margin-bottom: 1em; }
    .html-string { color: #166534; }
    .html-number { color: #1d4ed8; }
    .html-boolean { color: #7e22ce; }
    .html-null { color: #64748b; font-style: italic; }
  .html-key { color: #0f172a; font-weight: 600; }
  .html-object { background-color: #f8fafc; border-left: 3px solid #e2e8f0; padding: 8px; border-radius: 6px; margin: 4px 0; }
  .html-array { background-color: #f8fafc; border-left: 3px solid #cbd5e1; padding: 8px; border-radius: 6px; margin: 4px 0; }
</style>`;
    
    const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSON to HTML</title>
    ${style}
</head>
<body>
${buildHtml(json)}
</body>
</html>`;

    try {
      // Prefer fast local formatting if Prettier is available in the browser
      if (typeof window !== 'undefined' && (window as any).prettier) {
        const prettier = (window as any).prettier;
        const plugins = (window as any).prettierPlugins || [];
        return prettier.format(rawHtml, { parser: 'html', plugins });
      }
    } catch {
      // Fallback to raw HTML if local formatting fails
    }

    // Fallback: return raw HTML immediately (no network latency)
    return rawHtml;
};

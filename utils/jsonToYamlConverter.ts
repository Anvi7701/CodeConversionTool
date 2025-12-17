/**
 * Code-based JSON to YAML converter
 * Fast, offline conversion without external dependencies
 */

/**
 * Escape YAML special characters in strings
 */
function escapeYamlString(str: string): string {
  // Check if string needs quoting
  const needsQuoting = /[:#\{\}\[\],&*!|>'"%@`]|^\s|\s$|^-\s|^\d/.test(str) || 
                       str === '' || 
                       ['true', 'false', 'null', 'yes', 'no'].includes(str.toLowerCase());
  
  if (!needsQuoting) {
    return str;
  }
  
  // Use double quotes and escape special characters
  return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

/**
 * Convert JSON value to YAML string recursively
 */
function jsonToYamlRecursive(
  obj: any,
  indent: string = '',
  level: number = 0,
  isArrayItem: boolean = false
): string {
  const currentIndent = indent.repeat(level);
  const nextIndent = indent.repeat(level + 1);
  
  // Handle null
  if (obj === null) {
    return 'null';
  }
  
  // Handle primitives
  if (typeof obj === 'boolean') {
    return String(obj);
  }
  
  if (typeof obj === 'number') {
    return String(obj);
  }
  
  if (typeof obj === 'string') {
    return escapeYamlString(obj);
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }
    
    let yaml = '\n';
    obj.forEach((item) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        // Object in array
        yaml += `${nextIndent}-`;
        const itemYaml = jsonToYamlRecursive(item, indent, level + 1, true);
        if (itemYaml.startsWith('\n')) {
          yaml += itemYaml;
        } else {
          yaml += ' ' + itemYaml + '\n';
        }
      } else {
        // Primitive or nested array in array
        const itemYaml = jsonToYamlRecursive(item, indent, level + 1, false);
        if (itemYaml.includes('\n') && !itemYaml.startsWith('\n')) {
          yaml += `${nextIndent}- ${itemYaml}\n`;
        } else if (itemYaml.startsWith('\n')) {
          yaml += `${nextIndent}-${itemYaml}`;
        } else {
          yaml += `${nextIndent}- ${itemYaml}\n`;
        }
      }
    });
    return yaml.trimEnd();
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    
    if (keys.length === 0) {
      return '{}';
    }
    
    let yaml = isArrayItem ? '\n' : '';
    const effectiveIndent = isArrayItem ? nextIndent : currentIndent;
    
    keys.forEach((key, index) => {
      const value = obj[key];
      const escapedKey = /[:#\{\}\[\],&*!|>'"%@`]|\s/.test(key) ? `"${key}"` : key;
      
      // Add spacing for array items
      if (!isArrayItem && index > 0) {
        // No extra newline between object properties
      }
      
      const valueYaml = jsonToYamlRecursive(value, indent, isArrayItem ? level + 1 : level, false);
      
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value) || Object.keys(value).length > 0) {
          yaml += `${effectiveIndent}${escapedKey}:`;
          if (valueYaml.startsWith('\n') || valueYaml.includes('\n')) {
            yaml += valueYaml + '\n';
          } else {
            yaml += ' ' + valueYaml + '\n';
          }
        } else {
          // Empty object or array
          yaml += `${effectiveIndent}${escapedKey}: ${valueYaml}\n`;
        }
      } else {
        // Primitive value
        yaml += `${effectiveIndent}${escapedKey}: ${valueYaml}\n`;
      }
    });
    
    return yaml.trimEnd();
  }
  
  return String(obj);
}

/**
 * Main function to convert JSON to YAML
 */
export function convertJsonToYaml(
  jsonString: string,
  options: {
    indentSize?: number;
  } = {}
): string {
  try {
    const jsonObj = JSON.parse(jsonString);
    
    const {
      indentSize = 2
    } = options;
    
    const indent = ' '.repeat(indentSize);
    
    // Convert JSON to YAML
    const yaml = jsonToYamlRecursive(jsonObj, indent, 0, false);
    
    // Ensure single trailing newline
    return yaml.trim() + '\n';
  } catch (error: any) {
    throw new Error(`Failed to convert JSON to YAML: ${error.message}`);
  }
}

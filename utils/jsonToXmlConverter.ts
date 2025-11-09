/**
 * Code-based JSON to XML converter
 * Fast, offline, deterministic conversion without AI
 */

/**
 * Escape special XML characters
 */
function escapeXml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return String(unsafe);
  }
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert a JSON key to valid XML element name
 */
function toXmlElementName(key: string): string {
  // Remove invalid XML name characters
  let cleaned = key.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  
  // XML names cannot start with a number, hyphen, or period
  if (/^[0-9\-\.]/.test(cleaned)) {
    cleaned = 'item_' + cleaned;
  }
  
  // If empty after cleaning, use default
  if (cleaned.length === 0) {
    return 'item';
  }
  
  return cleaned;
}

/**
 * Convert JSON value to XML string
 */
function jsonToXmlRecursive(
  obj: any,
  rootName: string = 'root',
  indent: string = '',
  level: number = 0
): string {
  const currentIndent = indent.repeat(level);
  const nextIndent = indent.repeat(level + 1);
  
  // Handle null
  if (obj === null) {
    return `${currentIndent}<${rootName} xsi:nil="true"/>\n`;
  }
  
  // Handle primitive types
  if (typeof obj !== 'object') {
    const escaped = escapeXml(String(obj));
    return `${currentIndent}<${rootName}>${escaped}</${rootName}>\n`;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    let xml = '';
    if (obj.length === 0) {
      xml += `${currentIndent}<${rootName}/>\n`;
    } else {
      obj.forEach((item, index) => {
        const itemName = toXmlElementName(rootName.replace(/s$/, '')); // Try to singularize
        xml += jsonToXmlRecursive(item, itemName, indent, level);
      });
    }
    return xml;
  }
  
  // Handle objects
  let xml = `${currentIndent}<${rootName}>\n`;
  
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return `${currentIndent}<${rootName}/>\n`;
  }
  
  keys.forEach(key => {
    const elementName = toXmlElementName(key);
    const value = obj[key];
    
    if (Array.isArray(value)) {
      // Wrap array in a container element
      xml += `${nextIndent}<${elementName}>\n`;
      value.forEach(item => {
        const itemName = toXmlElementName(elementName.replace(/s$/, '') || 'item');
        xml += jsonToXmlRecursive(item, itemName, indent, level + 2);
      });
      xml += `${nextIndent}</${elementName}>\n`;
    } else {
      xml += jsonToXmlRecursive(value, elementName, indent, level + 1);
    }
  });
  
  xml += `${currentIndent}</${rootName}>\n`;
  return xml;
}

/**
 * Main function to convert JSON to XML
 */
export function convertJsonToXmlCode(
  jsonString: string,
  rootElementName: string = 'root',
  options: {
    includeXmlDeclaration?: boolean;
    prettyPrint?: boolean;
    indentSize?: number;
  } = {}
): string {
  try {
    const jsonObj = JSON.parse(jsonString);
    
    const {
      includeXmlDeclaration = true,
      prettyPrint = true,
      indentSize = 2
    } = options;
    
    const indent = prettyPrint ? ' '.repeat(indentSize) : '';
    
    let xml = '';
    
    // Add XML declaration
    if (includeXmlDeclaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }
    
    // Convert JSON to XML
    xml += jsonToXmlRecursive(jsonObj, rootElementName, indent, 0);
    
    // Remove trailing newline if not pretty printing
    if (!prettyPrint) {
      xml = xml.replace(/\s+/g, ' ').trim();
    }
    
    return xml.trim();
  } catch (error: any) {
    throw new Error(`Failed to convert JSON to XML: ${error.message}`);
  }
}

/**
 * Convert JSON to XML with attributes (alternative format)
 */
export function convertJsonToXmlWithAttributes(
  jsonString: string,
  rootElementName: string = 'root'
): string {
  try {
    const jsonObj = JSON.parse(jsonString);
    
    function toXmlWithAttrs(obj: any, name: string, indent: string = '', level: number = 0): string {
      const currentIndent = indent.repeat(level);
      const nextIndent = indent.repeat(level + 1);
      
      if (obj === null) {
        return `${currentIndent}<${name}/>\n`;
      }
      
      if (typeof obj !== 'object') {
        const escaped = escapeXml(String(obj));
        return `${currentIndent}<${name}>${escaped}</${name}>\n`;
      }
      
      if (Array.isArray(obj)) {
        let xml = '';
        obj.forEach((item) => {
          xml += toXmlWithAttrs(item, name, indent, level);
        });
        return xml;
      }
      
      // Separate attributes from child elements
      const attributes: string[] = [];
      const children: { key: string; value: any }[] = [];
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        // Simple types as attributes, complex types as child elements
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          attributes.push(`${toXmlElementName(key)}="${escapeXml(String(value))}"`);
        } else {
          children.push({ key, value });
        }
      });
      
      let xml = `${currentIndent}<${name}`;
      
      if (attributes.length > 0) {
        xml += ' ' + attributes.join(' ');
      }
      
      if (children.length === 0) {
        xml += '/>\n';
      } else {
        xml += '>\n';
        children.forEach(({ key, value }) => {
          const elementName = toXmlElementName(key);
          xml += toXmlWithAttrs(value, elementName, indent, level + 1);
        });
        xml += `${currentIndent}</${name}>\n`;
      }
      
      return xml;
    }
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += toXmlWithAttrs(jsonObj, rootElementName, '  ', 0);
    
    return xml.trim();
  } catch (error: any) {
    throw new Error(`Failed to convert JSON to XML: ${error.message}`);
  }
}

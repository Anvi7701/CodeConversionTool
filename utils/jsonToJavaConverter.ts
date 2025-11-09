/**
 * Code-based JSON to Java converter
 * Fast, offline, deterministic conversion without AI
 */

interface JavaField {
  name: string;
  type: string;
  isArray: boolean;
  isList: boolean;
}

interface JavaClass {
  name: string;
  fields: JavaField[];
  nestedClasses: JavaClass[];
}

/**
 * Convert a JSON key to Java-friendly field name (camelCase)
 */
function toFieldName(key: string): string {
  // Remove special characters and convert to camelCase
  let cleaned = key.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // If starts with number, prefix with underscore
  if (/^\d/.test(cleaned)) {
    cleaned = '_' + cleaned;
  }
  
  // Convert to camelCase
  const parts = cleaned.split('_').filter(p => p.length > 0);
  if (parts.length === 0) return 'field';
  
  return parts[0].toLowerCase() + parts.slice(1).map(p => 
    p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
  ).join('');
}

/**
 * Convert a JSON key to Java class name (PascalCase)
 */
function toClassName(key: string): string {
  const fieldName = toFieldName(key);
  return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
}

/**
 * Infer Java type from JSON value
 */
function inferJavaType(value: any, key: string, nestedClasses: JavaClass[]): JavaField {
  const field: JavaField = {
    name: toFieldName(key),
    type: 'Object',
    isArray: false,
    isList: false
  };

  if (value === null) {
    field.type = 'Object';
  } else if (typeof value === 'string') {
    field.type = 'String';
  } else if (typeof value === 'number') {
    field.type = Number.isInteger(value) ? 'int' : 'double';
  } else if (typeof value === 'boolean') {
    field.type = 'boolean';
  } else if (Array.isArray(value)) {
    field.isList = true;
    if (value.length > 0) {
      const firstElement = value[0];
      if (typeof firstElement === 'object' && firstElement !== null) {
        // Array of objects - create nested class
        const nestedClassName = toClassName(key);
        const nestedClass = analyzeObject(firstElement, nestedClassName);
        nestedClasses.push(nestedClass);
        field.type = nestedClassName;
      } else {
        // Array of primitives
        const primitiveType = inferJavaType(firstElement, 'temp', []);
        field.type = primitiveType.type;
      }
    } else {
      field.type = 'Object';
    }
  } else if (typeof value === 'object') {
    // Nested object - create nested class
    const nestedClassName = toClassName(key);
    const nestedClass = analyzeObject(value, nestedClassName);
    nestedClasses.push(nestedClass);
    field.type = nestedClassName;
  }

  return field;
}

/**
 * Analyze a JSON object and create a Java class structure
 */
function analyzeObject(obj: any, className: string): JavaClass {
  const javaClass: JavaClass = {
    name: className,
    fields: [],
    nestedClasses: []
  };

  if (!obj || typeof obj !== 'object') {
    return javaClass;
  }

  for (const [key, value] of Object.entries(obj)) {
    const field = inferJavaType(value, key, javaClass.nestedClasses);
    javaClass.fields.push(field);
  }

  return javaClass;
}

/**
 * Generate Java class code from JavaClass structure
 */
function generateJavaClass(javaClass: JavaClass, isNested: boolean = false): string {
  const indent = isNested ? '    ' : '';
  const fieldIndent = indent + '    ';
  const methodIndent = indent + '    ';
  
  let code = '';
  
  // Class declaration
  code += `${indent}public class ${javaClass.name} {\n`;
  
  // Fields
  for (const field of javaClass.fields) {
    const fieldType = field.isList ? `List<${field.type}>` : field.type;
    code += `${fieldIndent}private ${fieldType} ${field.name};\n`;
  }
  
  if (javaClass.fields.length > 0) {
    code += '\n';
  }
  
  // Default constructor
  code += `${fieldIndent}public ${javaClass.name}() {\n`;
  code += `${fieldIndent}}\n\n`;
  
  // Parameterized constructor
  if (javaClass.fields.length > 0) {
    const params = javaClass.fields.map(f => {
      const type = f.isList ? `List<${f.type}>` : f.type;
      return `${type} ${f.name}`;
    }).join(', ');
    
    code += `${fieldIndent}public ${javaClass.name}(${params}) {\n`;
    for (const field of javaClass.fields) {
      code += `${fieldIndent}    this.${field.name} = ${field.name};\n`;
    }
    code += `${fieldIndent}}\n\n`;
  }
  
  // Getters and Setters
  for (const field of javaClass.fields) {
    const fieldType = field.isList ? `List<${field.type}>` : field.type;
    const capitalizedName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    
    // Getter
    code += `${fieldIndent}public ${fieldType} get${capitalizedName}() {\n`;
    code += `${fieldIndent}    return ${field.name};\n`;
    code += `${fieldIndent}}\n\n`;
    
    // Setter
    code += `${fieldIndent}public void set${capitalizedName}(${fieldType} ${field.name}) {\n`;
    code += `${fieldIndent}    this.${field.name} = ${field.name};\n`;
    code += `${fieldIndent}}\n\n`;
  }
  
  // toString method
  code += `${fieldIndent}@Override\n`;
  code += `${fieldIndent}public String toString() {\n`;
  code += `${fieldIndent}    return "${javaClass.name}{" +\n`;
  
  javaClass.fields.forEach((field, index) => {
    const isLast = index === javaClass.fields.length - 1;
    const comma = isLast ? '' : ', " +\n';
    const prefix = index === 0 ? '' : '            "';
    code += `${fieldIndent}    ${prefix}${field.name}=" + ${field.name}${comma}`;
  });
  
  if (javaClass.fields.length > 0) {
    code += ' +\n';
  }
  code += `${fieldIndent}            "}";\n`;
  code += `${fieldIndent}}\n\n`;
  
  // equals method
  code += `${fieldIndent}@Override\n`;
  code += `${fieldIndent}public boolean equals(Object o) {\n`;
  code += `${fieldIndent}    if (this == o) return true;\n`;
  code += `${fieldIndent}    if (o == null || getClass() != o.getClass()) return false;\n`;
  code += `${fieldIndent}    ${javaClass.name} that = (${javaClass.name}) o;\n`;
  
  if (javaClass.fields.length > 0) {
    code += `${fieldIndent}    return `;
    javaClass.fields.forEach((field, index) => {
      const isLast = index === javaClass.fields.length - 1;
      const connector = isLast ? ';' : ' &&';
      const indent2 = index === 0 ? '' : '            ';
      
      if (field.type === 'int' || field.type === 'double' || field.type === 'boolean') {
        code += `${indent2}${field.name} == that.${field.name}${connector}\n${fieldIndent}    `;
      } else {
        code += `${indent2}java.util.Objects.equals(${field.name}, that.${field.name})${connector}\n${fieldIndent}    `;
      }
    });
  } else {
    code += `${fieldIndent}    return true;\n`;
  }
  
  code += `${fieldIndent}}\n\n`;
  
  // hashCode method
  code += `${fieldIndent}@Override\n`;
  code += `${fieldIndent}public int hashCode() {\n`;
  
  if (javaClass.fields.length > 0) {
    const fieldNames = javaClass.fields.map(f => f.name).join(', ');
    code += `${fieldIndent}    return java.util.Objects.hash(${fieldNames});\n`;
  } else {
    code += `${fieldIndent}    return 0;\n`;
  }
  
  code += `${fieldIndent}}\n`;
  
  // Nested classes
  if (javaClass.nestedClasses.length > 0) {
    code += '\n';
    for (const nestedClass of javaClass.nestedClasses) {
      code += generateJavaClass(nestedClass, true);
      code += '\n';
    }
  }
  
  code += `${indent}}\n`;
  
  return code;
}

/**
 * Main function to convert JSON to Java classes
 */
export function convertJsonToJavaCode(jsonString: string, rootClassName: string = 'RootObject'): string {
  try {
    const jsonObj = JSON.parse(jsonString);
    
    // Analyze the JSON structure
    const rootClass = analyzeObject(jsonObj, rootClassName);
    
    // Generate imports
    let code = '// Generated Java classes from JSON\n\n';
    
    // Check if we need imports
    const needsList = hasListFields(rootClass);
    
    if (needsList) {
      code += 'import java.util.List;\n';
      code += 'import java.util.Objects;\n\n';
    } else {
      code += 'import java.util.Objects;\n\n';
    }
    
    // Generate the main class and all nested classes
    code += generateJavaClass(rootClass);
    
    return code;
  } catch (error: any) {
    throw new Error(`Failed to convert JSON: ${error.message}`);
  }
}

/**
 * Check if class or nested classes have List fields
 */
function hasListFields(javaClass: JavaClass): boolean {
  if (javaClass.fields.some(f => f.isList)) {
    return true;
  }
  
  for (const nested of javaClass.nestedClasses) {
    if (hasListFields(nested)) {
      return true;
    }
  }
  
  return false;
}

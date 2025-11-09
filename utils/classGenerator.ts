// --- Utility Functions ---
const toPascalCase = (str: string): string => {
  return str.replace(/(^\w|-\w)/g, (c) => c.replace('-', '').toUpperCase());
};

const toCamelCase = (str: string): string => {
  return str.replace(/([-_]\w)/g, g => g[1].toUpperCase());
};

const getIndentation = (level: number): string => '  '.repeat(level);

// --- Intermediate Representation (IR) ---
type FieldType = 'string' | 'number' | 'boolean' | 'any' | 'object' | 'array';

interface Field {
  name: string;
  type: FieldType;
  nested?: ClassInfo;
  arrayType?: FieldType;
  arrayNested?: ClassInfo;
}

interface ClassInfo {
  name: string;
  fields: Field[];
}

const parseValue = (value: any, key: string, classMap: Map<string, any>): Omit<Field, 'name'> => {
  if (value === null) return { type: 'any' };

  const type = typeof value;
  if (type === 'string') return { type: 'string' };
  if (type === 'number') return { type: 'number' };
  if (type === 'boolean') return { type: 'boolean' };

  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', arrayType: 'any' };

    const firstItem = value[0];
    const firstItemType = parseValue(firstItem, `${key}Item`, classMap);
    
    return {
      type: 'array',
      arrayType: firstItemType.type,
      arrayNested: firstItemType.nested,
    };
  }

  if (type === 'object') {
    const className = toPascalCase(key);
    const nestedClassInfo = parseObjectToClassInfo(value, className, classMap);
    return { type: 'object', nested: nestedClassInfo };
  }

  return { type: 'any' };
};

const parseObjectToClassInfo = (obj: any, className: string, classMap: Map<string, any>): ClassInfo => {
    // Check cache first to handle recursion
    if (classMap.has(JSON.stringify(obj))) {
        return classMap.get(JSON.stringify(obj));
    }

    const fields: Field[] = Object.entries(obj).map(([key, value]) => {
        const fieldInfo = parseValue(value, key, classMap);
        return { name: key, ...fieldInfo };
    });

    const classInfo: ClassInfo = { name: className, fields };
    classMap.set(JSON.stringify(obj), classInfo);
    return classInfo;
};

const getNestedClasses = (classInfo: ClassInfo): ClassInfo[] => {
    const nestedClasses: ClassInfo[] = [];
    const visited = new Set<string>();

    const findNested = (currentClass: ClassInfo) => {
        if (visited.has(currentClass.name)) return;
        visited.add(currentClass.name);

        currentClass.fields.forEach(field => {
            if (field.nested) {
                nestedClasses.push(field.nested);
                findNested(field.nested);
            }
            if (field.arrayNested) {
                nestedClasses.push(field.arrayNested);
                findNested(field.arrayNested);
            }
        });
    };

    findNested(classInfo);
    return nestedClasses.filter((val, index, self) => self.findIndex(c => c.name === val.name) === index);
};


// --- Language Generators ---

const generateTypeScriptFromIr = (classInfo: ClassInfo): string => {
  const allGeneratedClasses: string[] = [];
  const nestedClasses = getNestedClasses(classInfo);
  
  const generateInterface = (cls: ClassInfo, level: number = 0): string => {
    const indent = getIndentation(level);
    let output = `${indent}export interface ${cls.name} {\n`;
    cls.fields.forEach(field => {
      let fieldType: string;
      if (field.type === 'object') {
        fieldType = field.nested!.name;
      } else if (field.type === 'array') {
        if (field.arrayType === 'object') {
          fieldType = `${field.arrayNested!.name}[]`;
        } else {
          fieldType = `${field.arrayType}[]`;
        }
      } else {
        fieldType = field.type;
      }
      output += `${indent}  ${toCamelCase(field.name)}: ${fieldType};\n`;
    });
    output += `${indent}}\n`;
    return output;
  };

  nestedClasses.forEach(cls => allGeneratedClasses.push(generateInterface(cls)));
  allGeneratedClasses.push(generateInterface(classInfo));
  
  return allGeneratedClasses.join('\n');
};

const generatePythonFromIr = (classInfo: ClassInfo): string => {
    const allGeneratedClasses: string[] = [];
    const nestedClasses = getNestedClasses(classInfo).reverse(); // Define nested classes first

    const typeMap: { [key in FieldType]: string } = {
        'string': 'str',
        'number': 'Union[int, float]',
        'boolean': 'bool',
        'any': 'Any',
        'object': '',
        'array': 'List'
    };
    
    const generateClass = (cls: ClassInfo): string => {
        let output = `@dataclass\nclass ${cls.name}:\n`;
        if (cls.fields.length === 0) {
          output += `    pass\n`;
        }
        cls.fields.forEach(field => {
            let fieldType: string;
            if (field.type === 'object') {
                fieldType = field.nested!.name;
            } else if (field.type === 'array') {
                if (field.arrayType === 'object') {
                    fieldType = `List[${field.arrayNested!.name}]`;
                } else {
                    fieldType = `List[${typeMap[field.arrayType]}]`;
                }
            } else {
                fieldType = typeMap[field.type];
            }
            output += `    ${field.name}: ${fieldType}\n`;
        });
        return output;
    };

    nestedClasses.forEach(cls => allGeneratedClasses.push(generateClass(cls)));
    allGeneratedClasses.push(generateClass(classInfo));

    const header = `from dataclasses import dataclass
from typing import Any, List, Union\n\n`;

    return header + allGeneratedClasses.join('\n');
};

const generateJavaFromIr = (classInfo: ClassInfo): string => {
    const allGeneratedClasses: string[] = [];
    const nestedClasses = getNestedClasses(classInfo);

    const typeMap: { [key in FieldType]: string } = {
        'string': 'String',
        'number': 'Double', // Use Double to be safe with floating points
        'boolean': 'Boolean',
        'any': 'Object',
        'object': '',
        'array': 'List'
    };

    const generateClass = (cls: ClassInfo): string => {
        let output = `public class ${cls.name} {\n`;
        cls.fields.forEach(field => {
            let fieldType: string;
            if (field.type === 'object') {
                fieldType = field.nested!.name;
            } else if (field.type === 'array') {
                if (field.arrayType === 'object') {
                    fieldType = `List<${field.arrayNested!.name}>`;
                } else {
                    fieldType = `List<${typeMap[field.arrayType]}>`;
                }
            } else {
                fieldType = typeMap[field.type];
            }
            const fieldName = toCamelCase(field.name);
            output += `    private ${fieldType} ${fieldName};\n\n`;
            // Getter
            output += `    public ${fieldType} get${toPascalCase(fieldName)}() {\n`;
            output += `        return this.${fieldName};\n    }\n\n`;
            // Setter
            output += `    public void set${toPascalCase(fieldName)}(${fieldType} ${fieldName}) {\n`;
            output += `        this.${fieldName} = ${fieldName};\n    }\n`;
        });
        output += `}\n`;
        return output;
    };

    allGeneratedClasses.push("import java.util.List;\n");
    nestedClasses.forEach(cls => allGeneratedClasses.push(generateClass(cls)));
    allGeneratedClasses.push(generateClass(classInfo));

    return allGeneratedClasses.join('\n');
};

const generateCSharpFromIr = (classInfo: ClassInfo): string => {
  const allGeneratedClasses: string[] = [];
  const nestedClasses = getNestedClasses(classInfo);

  const typeMap: { [key in FieldType]: string } = {
      'string': 'string',
      'number': 'double',
      'boolean': 'bool',
      'any': 'object',
      'object': '',
      'array': 'List'
  };

  const generateClass = (cls: ClassInfo): string => {
      let output = `public class ${cls.name}\n{\n`;
      cls.fields.forEach(field => {
          let fieldType: string;
          if (field.type === 'object') {
              fieldType = field.nested!.name;
          } else if (field.type === 'array') {
              if (field.arrayType === 'object') {
                  fieldType = `List<${field.arrayNested!.name}>`;
              } else {
                  fieldType = `List<${typeMap[field.arrayType]}>`;
              }
          } else {
              fieldType = typeMap[field.type];
          }
          const propertyName = toPascalCase(field.name);
          output += `    [JsonPropertyName("${field.name}")]\n`;
          output += `    public ${fieldType} ${propertyName} { get; set; }\n\n`;
      });
      output = output.trimEnd() + `\n}\n`;
      return output;
  };

  const header = `using System.Collections.Generic;
using System.Text.Json.Serialization;\n\n`;
  
  nestedClasses.forEach(cls => allGeneratedClasses.push(generateClass(cls)));
  allGeneratedClasses.push(generateClass(classInfo));

  return header + allGeneratedClasses.join('\n');
};

const generateGoFromIr = (classInfo: ClassInfo): string => {
    const allGeneratedClasses: string[] = [];
    const nestedClasses = getNestedClasses(classInfo).reverse();

    const typeMap: { [key in FieldType]: string } = {
        'string': 'string',
        'number': 'float64',
        'boolean': 'bool',
        'any': 'interface{}',
        'object': '',
        'array': '[]'
    };

    const generateStruct = (cls: ClassInfo): string => {
        let output = `type ${cls.name} struct {\n`;
        cls.fields.forEach(field => {
            let fieldType: string;
            if (field.type === 'object') {
                fieldType = field.nested!.name;
            } else if (field.type === 'array') {
                if (field.arrayType === 'object') {
                    fieldType = `[]${field.arrayNested!.name}`;
                } else {
                    fieldType = `[]${typeMap[field.arrayType]}`;
                }
            } else {
                fieldType = typeMap[field.type];
            }
            const propertyName = toPascalCase(field.name);
            output += `    ${propertyName} ${fieldType} \`json:"${field.name}"\`\n`;
        });
        output += `}\n`;
        return output;
    };

    nestedClasses.forEach(cls => allGeneratedClasses.push(generateStruct(cls)));
    allGeneratedClasses.push(generateStruct(classInfo));

    return "package main\n\n" + allGeneratedClasses.join('\n');
};

const generateSwiftFromIr = (classInfo: ClassInfo): string => {
    const allGeneratedClasses: string[] = [];
    const nestedClasses = getNestedClasses(classInfo).reverse();

    const typeMap: { [key in FieldType]: string } = {
        'string': 'String',
        'number': 'Double',
        'boolean': 'Bool',
        'any': 'Any',
        'object': '',
        'array': '[]'
    };

    const generateStruct = (cls: ClassInfo): string => {
        let output = `struct ${cls.name}: Codable {\n`;
        let codingKeys = `    enum CodingKeys: String, CodingKey {\n`;
        let hasCustomKeys = false;

        cls.fields.forEach(field => {
            let fieldType: string;
            const propertyName = toCamelCase(field.name);

            if (field.type === 'object') {
                fieldType = field.nested!.name;
            } else if (field.type === 'array') {
                if (field.arrayType === 'object') {
                    fieldType = `[${field.arrayNested!.name}]`;
                } else {
                    fieldType = `[${typeMap[field.arrayType]}]`;
                }
            } else {
                fieldType = typeMap[field.type];
            }
            output += `    let ${propertyName}: ${fieldType}\n`;

            if (propertyName !== field.name) {
                hasCustomKeys = true;
                codingKeys += `        case ${propertyName} = "${field.name}"\n`;
            }
        });
        
        codingKeys += `    }\n`;

        if (hasCustomKeys) {
            output += `\n` + codingKeys;
        }

        output += `}\n`;
        return output;
    };

    nestedClasses.forEach(cls => allGeneratedClasses.push(generateStruct(cls)));
    allGeneratedClasses.push(generateStruct(classInfo));

    return allGeneratedClasses.join('\n');
};

const generateRubyFromIr = (classInfo: ClassInfo): string => {
    const allGeneratedClasses: string[] = [];
    const nestedClasses = getNestedClasses(classInfo).reverse();

    const generateClass = (cls: ClassInfo): string => {
        let output = `class ${cls.name}\n`;
        const accessors = cls.fields.map(f => `:${f.name}`).join(', ');
        if (accessors) {
            output += `  attr_accessor ${accessors}\n\n`;
        }

        output += `  def initialize(hash)\n`;
        cls.fields.forEach(field => {
            output += `    @${field.name} = hash['${field.name}']\n`;
        });
        output += `  end\n`;
        output += `end\n`;
        return output;
    };

    nestedClasses.forEach(cls => allGeneratedClasses.push(generateClass(cls)));
    allGeneratedClasses.push(generateClass(classInfo));

    return allGeneratedClasses.join('\n');
};


const generateDartFromIr = (classInfo: ClassInfo): string => {
    const allGeneratedClasses: string[] = [];
    const nestedClasses = getNestedClasses(classInfo).reverse();

    const typeMap: { [key in FieldType]: string } = {
        'string': 'String',
        'number': 'double',
        'boolean': 'bool',
        'any': 'dynamic',
        'object': '',
        'array': 'List'
    };

    const generateClass = (cls: ClassInfo): string => {
        let output = `class ${cls.name} {\n`;
        // Fields
        cls.fields.forEach(field => {
            let fieldType: string;
            const propertyName = toCamelCase(field.name);
            if (field.type === 'object') {
                fieldType = field.nested!.name;
            } else if (field.type === 'array') {
                if (field.arrayType === 'object') {
                    fieldType = `List<${field.arrayNested!.name}>`;
                } else {
                    fieldType = `List<${typeMap[field.arrayType]}>`;
                }
            } else {
                fieldType = typeMap[field.type];
            }
            output += `  final ${fieldType} ${propertyName};\n`;
        });

        // Constructor
        output += `\n  ${cls.name}({\n`;
        cls.fields.forEach(field => {
            output += `    required this.${toCamelCase(field.name)},\n`;
        });
        output += `  });\n\n`;

        // fromJson factory
        output += `  factory ${cls.name}.fromJson(Map<String, dynamic> json) {\n`;
        output += `    return ${cls.name}(\n`;
        cls.fields.forEach(field => {
            const propertyName = toCamelCase(field.name);
            let parseLogic: string;
            if (field.type === 'object') {
                parseLogic = `${field.nested!.name}.fromJson(json['${field.name}'])`;
            } else if (field.type === 'array' && field.arrayType === 'object') {
                parseLogic = `(json['${field.name}'] as List).map((i) => ${field.arrayNested!.name}.fromJson(i)).toList()`;
            } else {
                parseLogic = `json['${field.name}']`;
            }
            output += `      ${propertyName}: ${parseLogic},\n`;
        });
        output += `    );\n  }\n`;
        output += `}\n`;
        return output;
    };

    nestedClasses.forEach(cls => allGeneratedClasses.push(generateClass(cls)));
    allGeneratedClasses.push(generateClass(classInfo));
    return allGeneratedClasses.join('\n');
};

const generateJsonSchemaFromIr = (classInfo: ClassInfo): string => {
    const definitions: { [key: string]: any } = {};

    const convertFieldToJsonSchema = (field: Field): any => {
        let schema: any = {};
        const typeMap = {
            'number': 'number',
            'string': 'string',
            'boolean': 'boolean',
            'any': {},
        };

        if (field.type === 'object') {
            schema['$ref'] = `#/definitions/${field.nested!.name}`;
            if (!definitions[field.nested!.name]) {
                definitions[field.nested!.name] = convertClassToJsonSchema(field.nested!);
            }
        } else if (field.type === 'array') {
            schema.type = 'array';
            if (field.arrayType === 'object') {
                schema.items = { '$ref': `#/definitions/${field.arrayNested!.name}` };
                 if (!definitions[field.arrayNested!.name]) {
                    definitions[field.arrayNested!.name] = convertClassToJsonSchema(field.arrayNested!);
                }
            } else {
                schema.items = { type: typeMap[field.arrayType] };
            }
        } else {
            schema.type = typeMap[field.type];
        }
        return schema;
    };

    const convertClassToJsonSchema = (cls: ClassInfo): any => {
        const properties: { [key: string]: any } = {};
        const required: string[] = [];

        cls.fields.forEach(field => {
            properties[field.name] = convertFieldToJsonSchema(field);
            required.push(field.name);
        });

        return {
            type: 'object',
            properties,
            required,
        };
    };

    const mainSchema = convertClassToJsonSchema(classInfo);
    
    const fullSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      ...mainSchema,
      definitions,
    };

    return JSON.stringify(fullSchema, null, 2);
};


// --- Main Exported Functions ---

export type TargetLanguage = 'typescript' | 'python' | 'java' | 'json_schema' | 'csharp' | 'go' | 'swift' | 'ruby' | 'dart';

export const generateClassFromJSON = (jsonString: string, rootClassName: string, targetLanguage: TargetLanguage): string => {
    const data = JSON.parse(jsonString);
    const classMap = new Map<string, any>();
    const rootClassInfo = parseObjectToClassInfo(data, toPascalCase(rootClassName) || 'Root', classMap);

    switch (targetLanguage) {
        case 'typescript':
            return generateTypeScriptFromIr(rootClassInfo);
        case 'python':
            return generatePythonFromIr(rootClassInfo);
        case 'java':
            return generateJavaFromIr(rootClassInfo);
        case 'csharp':
            return generateCSharpFromIr(rootClassInfo);
        case 'go':
            return generateGoFromIr(rootClassInfo);
        case 'swift':
            return generateSwiftFromIr(rootClassInfo);
        case 'ruby':
            return generateRubyFromIr(rootClassInfo);
        case 'dart':
            return generateDartFromIr(rootClassInfo);
        case 'json_schema':
            return generateJsonSchemaFromIr(rootClassInfo);
        default:
            throw new Error(`Unsupported target language: ${targetLanguage}`);
    }
};

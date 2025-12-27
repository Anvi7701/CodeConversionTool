import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

export type SchemaValidationResult = {
  isValid: boolean;
  errors: ErrorObject[] | null;
};

// Create a shared AJV instance
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export function validateJsonAgainstSchema(jsonText: string, schemaText: string): SchemaValidationResult {
  try {
    const data = JSON.parse(jsonText);
    const schema = JSON.parse(schemaText);
    const validate = ajv.compile(schema);
    const valid = validate(data);
    return { isValid: !!valid, errors: valid ? null : (validate.errors ?? null) };
  } catch (err) {
    // If parsing failed, surface a synthetic error
    return {
      isValid: false,
      errors: [
        {
          keyword: 'parse',
          instancePath: '',
          schemaPath: '',
          params: {},
          message: (err as Error)?.message || 'Failed to parse JSON or schema',
        } as ErrorObject,
      ],
    };
  }
}

// Basic schema generator (Draft-07) from sample JSON
export function generateSchemaFromSample(sampleText: string): { schemaText: string } {
  const sample = JSON.parse(sampleText);
  const schema = buildSchema(sample);
  const wrapped = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...schema,
  };
  return { schemaText: JSON.stringify(wrapped, null, 2) };
}

function buildSchema(value: any): any {
  if (value === null) return { type: 'null' };
  const t = typeof value;
  switch (t) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return { type: 'array', items: {} };
        // Infer items schema from first element; if heterogeneous, use anyOf
        const itemSchemas = value.map(buildSchema);
        const first = JSON.stringify(itemSchemas[0]);
        const homogeneous = itemSchemas.every(s => JSON.stringify(s) === first);
        return {
          type: 'array',
          items: homogeneous ? itemSchemas[0] : { anyOf: uniqueSchemas(itemSchemas) },
        };
      }
      // Object
      const props: Record<string, any> = {};
      const required: string[] = [];
      for (const key of Object.keys(value)) {
        required.push(key);
        props[key] = buildSchema(value[key]);
      }
      return { type: 'object', properties: props, required };
    default:
      return {}; // unknown
  }
}

function uniqueSchemas(schemas: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const s of schemas) {
    const k = JSON.stringify(s);
    if (!seen.has(k)) { seen.add(k); out.push(s); }
  }
  return out;
}

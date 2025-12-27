import React, { useEffect, useState } from 'react';
import { validateJsonAgainstSchema, generateSchemaFromSample } from '../utils/jsonSchemaValidator';

type JsonSchemaValidatorPanelProps = {
  initialJsonText?: string;
  initialSchemaText?: string;
  autoGenerate?: boolean;
};

export const JsonSchemaValidatorPanel: React.FC<JsonSchemaValidatorPanelProps> = ({ initialJsonText, initialSchemaText, autoGenerate }) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [schemaText, setSchemaText] = useState<string>('');
  const [result, setResult] = useState<{ isValid: boolean; errors: any[] | null } | null>(null);

  useEffect(() => {
    if (initialJsonText && initialJsonText !== jsonText) {
      setJsonText(initialJsonText);
    }
    if (initialSchemaText && initialSchemaText !== schemaText) {
      setSchemaText(initialSchemaText);
    }
  }, [initialJsonText, initialSchemaText]);

  useEffect(() => {
    if (autoGenerate && jsonText.trim()) {
      try {
        const { schemaText: out } = generateSchemaFromSample(jsonText);
        setSchemaText(out);
      } catch (e) {
        // ignore; user can click Generate manually if JSON invalid
      }
    }
    // run once when autoGenerate requested and jsonText initialized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, jsonText]);

  const handleValidate = () => {
    const res = validateJsonAgainstSchema(jsonText, schemaText);
    setResult({ isValid: res.isValid, errors: res.errors as any[] | null });
  };

  const handleGenerateSchema = () => {
    try {
      const { schemaText: out } = generateSchemaFromSample(jsonText);
      setSchemaText(out);
    } catch (e: any) {
      setResult({ isValid: false, errors: [{ message: e?.message || 'Failed to generate schema' }] });
    }
  };

  return (
    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">JSON Schema Validator</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleGenerateSchema} className="btn btn-blue-azure" title="Generate JSON Schema from sample JSON">
            <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
            <span>Generate Schema</span>
          </button>
          <button onClick={handleValidate} className="btn btn-blue-azure" title="Validate JSON against Schema">
            <i className="fa-solid fa-check" aria-hidden="true"></i>
            <span>Validate</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">JSON Sample</label>
          <textarea
            className="w-full h-32 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 text-sm"
            placeholder="Paste JSON here"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">JSON Schema (Draft-07)</label>
          <textarea
            className="w-full h-32 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 text-sm"
            placeholder="Paste or generate schema here"
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
          />
        </div>
      </div>
      {result && (
        <div className="mt-3">
          {result.isValid ? (
            <div className="text-sm font-medium text-green-700 dark:text-green-400">Validation passed ✓</div>
          ) : (
            <div>
              <div className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Validation failed</div>
              <ul className="text-xs list-disc ml-5">
                {(result.errors || []).map((e, idx) => (
                  <li key={idx}>
                    <span className="text-slate-800 dark:text-slate-200">{e.instancePath || ''}</span>
                    <span className="text-slate-600 dark:text-slate-300"> {e.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

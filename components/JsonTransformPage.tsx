import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SEO from './SEO';
import { JMESPathTransform } from './JMESPathTransform';

export const JsonTransformPage: React.FC = () => {
  const location = useLocation() as any;
  const initial = (location?.state && location.state.inputJson) || '';
  const [inputJson, setInputJson] = useState<string>(initial);
  const [showTransform, setShowTransform] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial && typeof initial === 'string') {
      setShowTransform(true);
    }
  }, [initial]);

  const handleOpen = () => {
    if (!inputJson.trim()) { setError('Please paste valid JSON to transform.'); return; }
    try { JSON.parse(inputJson); setError(null); setShowTransform(true); }
    catch (e: any) { setError('Invalid JSON. Please fix syntax errors before opening Transform.'); }
  };

  return (
    <>
      <SEO
        title="JSON Transform with JMESPath | AI JSON Tools"
        description="Transform JSON using JMESPath queries. Filter, project, sort, and reshape JSON interactively with previews. SEO-friendly JSON transform tool."
        keywords="json transform, jmespath, json filter, json project, json reshape, json query, json tool"
        canonical="https://yourdomain.com/json-transform"
        ogImage="https://yourdomain.com/images/json-transform.jpg"
        ogUrl="https://yourdomain.com/json-transform"
      />

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <span className="text-4xl">🛠️</span>
            JSON Transform (JMESPath)
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Write JMESPath queries to filter, project, and reshape your JSON. Paste JSON below and open the interactive transformer.
          </p>
        </div>

        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Paste Your JSON</label>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder='{"items":[{"id":1,"name":"Alpha"},{"id":2,"name":"Beta"}]}'
            className="w-full h-40 px-4 py-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          {error && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button onClick={handleOpen} className="btn btn-blue">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
              <span>Open Transform</span>
            </button>
            <button onClick={() => setInputJson('')} className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">Clear</button>
          </div>
        </div>

        {output && (
          <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Last Applied Result</label>
            <pre className="mt-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-4 text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>

      {showTransform && (
        <JMESPathTransform
          inputJson={inputJson}
          onApply={(result) => { setOutput(result); setShowTransform(false); }}
          onClose={() => setShowTransform(false)}
        />
      )}
    </>
  );
};

export default JsonTransformPage;

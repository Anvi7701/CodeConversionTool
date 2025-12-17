import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SEO from './SEO';
import { JMESPathTransform } from './JMESPathTransform';
import { parseJsonSafe } from '../utils/parseJsonSafe';
import { StructureAnalyzerErrorModal } from './StructureAnalyzerErrorModal';
import type { FixChange } from '../utils/simpleJsonFixer';

export const JsonTransformPage: React.FC = () => {
  const location = useLocation() as any;
  const initial = (location?.state && location.state.inputJson) || '';
  const [inputJson, setInputJson] = useState<string>(initial);
  const [showTransform, setShowTransform] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial && typeof initial === 'string') {
      setShowTransform(true);
    }
  }, [initial]);

  const handleLoadSample = () => {
    const sampleJson = {
      items: [
        { id: 1, name: "Alpha", category: "A", price: 100 },
        { id: 2, name: "Beta", category: "B", price: 200 },
        { id: 3, name: "Gamma", category: "A", price: 150 }
      ]
    };
    setInputJson(JSON.stringify(sampleJson, null, 2));
    setError(null);
    setShowErrorModal(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const text = content.trim();
          const parseResult = parseJsonSafe(text);
          if (parseResult.ok) {
            // Valid JSON, set input
            setInputJson(text);
            setError(null);
            setShowErrorModal(false);
          } else {
            // Invalid JSON, show error modal
            setInputJson(text);
            // Use setTimeout to ensure state is updated before modal
            setTimeout(() => {
              setShowErrorModal(true);
              setError('Invalid JSON');
            }, 50);
          }
        } catch (err: any) {
          setInputJson(content);
          setTimeout(() => {
            setShowErrorModal(true);
            setError(err.message);
          }, 50);
        }
      }
    };
    reader.onerror = () => {
      setShowErrorModal(true);
      setError('Failed to read file');
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleValidate = () => {
    const trimmedInput = inputJson.trim();
    if (!trimmedInput) return;

    setIsValidating(true);
    
    // Use setTimeout to ensure UI updates
    setTimeout(() => {
      const parseResult = parseJsonSafe(trimmedInput);
      
      if (parseResult.ok) {
        setShowSuccessModal(true);
        setShowErrorModal(false);
        setError(null);
      } else {
        setShowErrorModal(true);
        setShowSuccessModal(false);
        setError('Invalid JSON');
      }
      setIsValidating(false);
    }, 100);
  };

  const handleFixApplied = (fixedJson: string, changes: FixChange[]) => {
    setInputJson(fixedJson);
    setShowErrorModal(false);
    setError(null);
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpen = () => {
    if (!inputJson.trim()) { setError('Please paste valid JSON to transform.'); return; }
    const parseResult = parseJsonSafe(inputJson);
    if (parseResult.ok) {
      setError(null);
      setShowTransform(true);
    } else {
      setShowErrorModal(true);
      setError('Invalid JSON. Please fix syntax errors before opening Transform.');
    }
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            JSON Transform (JMESPath)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Write JMESPath queries to filter, project, and reshape your JSON. Paste JSON below and open the interactive transformer.
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <div className="flex items-center justify-start gap-2 mb-3">
            <button
              onClick={handleLoadSample}
              className="btn btn-blue"
            >
              <i className="fa-solid fa-file-code" aria-hidden="true"></i>
              <span>Load Sample</span>
            </button>
            <button
              onClick={handleUploadClick}
              className="btn btn-orange"
            >
              <i className="fa-solid fa-upload" aria-hidden="true"></i>
              <span>Upload JSON</span>
            </button>
            <button
              onClick={handleValidate}
              disabled={!inputJson.trim() || isValidating}
              className="btn btn-green"
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" aria-hidden="true"></i>
                  <span>Validate</span>
                </>
              )}
            </button>
            <button
              onClick={handleOpen}
              disabled={!inputJson.trim()}
              className="btn btn-purple"
            >
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
              <span>Open Transform</span>
            </button>
            <button
              onClick={() => {
                setInputJson('');
                setError(null);
                setOutput('');
              }}
              disabled={!inputJson.trim()}
              className="btn btn-red"
            >
              <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
              <span>Clear</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            onPaste={(e) => {
              // Show error modal after paste if JSON is invalid
              setTimeout(() => {
                const text = e.currentTarget.value.trim();
                if (text) {
                  const parseResult = parseJsonSafe(text);
                  if (!parseResult.ok) {
                    setShowErrorModal(true);
                    setError('Invalid JSON');
                  } else {
                    setError(null);
                    setShowErrorModal(false);
                  }
                }
              }, 100);
            }}
            placeholder='Paste or upload your JSON here, e.g., {"items":[{"id":1,"name":"Alpha"},{"id":2,"name":"Beta"}]}'
            className="w-full h-40 px-4 py-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {output && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Last Applied Result</label>
              <button
                onClick={handleCopyOutput}
                className="btn btn-blue"
                title="Copy to clipboard"
              >
                <i className="fa-solid fa-copy"></i>
                <span>Copy</span>
              </button>
            </div>
            <div className="relative">
              <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-4 text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{output}</pre>
              
              {/* Copy Success Toast */}
              {showCopyToast && (
                <div className="absolute top-2 right-2 bg-green-500 dark:bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-fade-in">
                  <i className="fa-solid fa-check-circle"></i>
                  <span>Copied!</span>
                </div>
              )}
            </div>
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

      {/* Error Modal */}
      {showErrorModal && (
        <StructureAnalyzerErrorModal
          open={showErrorModal}
          jsonInput={inputJson}
          onClose={() => setShowErrorModal(false)}
          onFixApplied={handleFixApplied}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-check text-white text-lg"></i>
                </div>
                <h3 className="text-xl font-bold text-white">Valid JSON</h3>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 text-center">
                Your JSON is valid and well-formed! You can now open the transformer.
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JsonTransformPage;

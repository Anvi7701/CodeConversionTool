import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SEO from './SEO';
import { analyzeJsonStructure } from '../utils/jsonStructureAnalyzer';
import { StatisticsDetailViewer } from './StatisticsDetailViewer';
import { StructureAnalyzerErrorModal } from './StructureAnalyzerErrorModal';
import { parseJsonSafe } from '../utils/parseJsonSafe';
import type { FixChange } from '../utils/simpleJsonFixer';

export const JsonStructureAnalyzerPage: React.FC = () => {
  const location = useLocation();
  const [inputJson, setInputJson] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Populate input from navigation state if available
  useEffect(() => {
    const state = location.state as { inputJson?: string } | null;
    if (state?.inputJson) {
      setInputJson(state.inputJson);
      
      // Automatically analyze the JSON and scroll to results
      const trimmedInput = state.inputJson.trim();
      if (trimmedInput) {
        // Validate JSON
        const parseResult = parseJsonSafe(trimmedInput);
        if (parseResult.ok) {
          // JSON is valid, proceed with analysis
          try {
            const analysis = analyzeJsonStructure(trimmedInput);
            setAnalysisResult(analysis);
            
            // Scroll to results section after a short delay to ensure DOM is updated
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }, 300);
          } catch (err: any) {
            console.error('Auto-analysis failed:', err);
          }
        }
      }
    }
  }, [location.state]);

  // Analyze JSON structure
  const handleAnalyze = () => {
    const trimmedInput = inputJson.trim();
    if (!trimmedInput) {
      return;
    }

    // First, validate JSON
    const parseResult = parseJsonSafe(trimmedInput);
    if (!parseResult.ok) {
      // Show error modal instead of inline error
      setShowErrorModal(true);
      setAnalysisResult(null);
      return;
    }

    // JSON is valid, proceed with analysis
    setIsAnalyzing(true);
    setShowErrorModal(false);

    try {
      const analysis = analyzeJsonStructure(trimmedInput);
      setAnalysisResult(analysis);
      
      // Scroll to results section after a short delay to ensure DOM is updated
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load sample JSON
  const handleLoadSample = () => {
    const sampleJson = {
      company: {
        name: "Tech Corp",
        established: 2010,
        public: true,
        employees: [
          { id: 1, name: "Alice", role: "CEO", salary: 150000 },
          { id: 2, name: "Bob", role: "CTO", salary: 140000 },
          { id: 3, name: "Charlie", role: "Developer", salary: 100000 }
        ],
        metadata: {
          location: "San Francisco",
          timezone: "PST",
          offices: ["HQ", "Branch1", "Branch2"]
        }
      },
      departments: [
        { name: "Engineering", budget: 500000, headcount: 25 },
        { name: "Sales", budget: 300000, headcount: 15 },
        { name: "Marketing", budget: 250000, headcount: 10 }
      ],
      settings: {
        theme: "dark",
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    };
    const jsonString = JSON.stringify(sampleJson, null, 2);
    setInputJson(jsonString);
    setShowErrorModal(false);
    
    // Auto-analyze and scroll
    try {
      const analysis = analyzeJsonStructure(jsonString);
      setAnalysisResult(analysis);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err: any) {
      console.error('Analysis failed:', err);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      // Show error in modal
      setInputJson('// Invalid file type. Please upload a JSON file (.json).');
      setShowErrorModal(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (typeof text === 'string') {
          // Validate JSON format using parseJsonSafe
          const parseResult = parseJsonSafe(text);
          if (parseResult.ok) {
            // Valid JSON, set input and auto-analyze
            setInputJson(text);
            setShowErrorModal(false);
            try {
              const analysis = analyzeJsonStructure(text);
              setAnalysisResult(analysis);
              setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 300);
            } catch (err: any) {
              console.error('Analysis failed:', err);
            }
          } else {
            // Invalid JSON, show error modal
            setInputJson(text);
            setShowErrorModal(true);
            setAnalysisResult(null);
          }
        } else {
          setInputJson('// Failed to read file content.');
          setShowErrorModal(true);
        }
      } catch (err: any) {
        setInputJson(`// Invalid JSON file: ${err.message}`);
        setShowErrorModal(true);
      }
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setInputJson('// Failed to read the file.');
      setShowErrorModal(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle when Auto Fix is applied from error modal
  const handleFixApplied = (fixedJson: string, _changes: FixChange[]) => {
     setInputJson(fixedJson);
      setShowErrorModal(false);
      setAnalysisResult(null);
  };

  // Handle input change and validate
  const handleInputChange = (value: string) => {
    setInputJson(value);
    setAnalysisResult(null);
    // Don't show error modal on every keystroke, only on Analyze button click
  };

  // Handle Validate button
  const handleValidate = () => {
    const trimmedInput = inputJson.trim();
    if (!trimmedInput) {
      return;
    }

    setIsValidating(true);

    // Validate JSON using parseJsonSafe
    const parseResult = parseJsonSafe(trimmedInput);
    
    if (parseResult.ok) {
      // JSON is valid - show success modal
      setShowSuccessModal(true);
      setShowErrorModal(false);
    } else {
      // JSON has errors - show error modal
      setShowErrorModal(true);
      setShowSuccessModal(false);
    }

    setIsValidating(false);
  };

  // Download analysis report as HTML
  const handleDownloadReport = () => {
    if (!analysisResult) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSON Structure Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #f8fafc; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1e293b; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; }
        .section { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .section h2 { color: #334155; margin-top: 0; }
        .stat { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .stat:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #475569; }
        .value { color: #1e293b; font-family: monospace; }
        .metadata { color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📈 JSON Structure Analysis Report</h1>
        
        <div class="section">
            <h2>Summary</h2>
            <div class="stat"><span class="label">Status:</span><span class="value">${analysisResult.summary.status}</span></div>
            <div class="stat"><span class="label">Root Type:</span><span class="value">${analysisResult.summary.type}</span></div>
            <div class="stat"><span class="label">Total Size:</span><span class="value">${analysisResult.summary.size}</span></div>
            <div class="stat"><span class="label">Nesting Depth:</span><span class="value">${analysisResult.summary.depth}</span></div>
            <div class="stat"><span class="label">Root Keys:</span><span class="value">${analysisResult.summary.keys}</span></div>
        </div>
        
        <div class="section">
            <h2>Data Types Distribution</h2>
            <div class="stat"><span class="label">Strings:</span><span class="value">${analysisResult.statistics.strings || 0}</span></div>
            <div class="stat"><span class="label">Numbers:</span><span class="value">${analysisResult.statistics.numbers || 0}</span></div>
            <div class="stat"><span class="label">Booleans:</span><span class="value">${analysisResult.statistics.booleans || 0}</span></div>
            <div class="stat"><span class="label">Nulls:</span><span class="value">${analysisResult.statistics.nulls || 0}</span></div>
            <div class="stat"><span class="label">Objects:</span><span class="value">${analysisResult.statistics.objects || 0}</span></div>
            <div class="stat"><span class="label">Arrays:</span><span class="value">${analysisResult.statistics.arrays || 0}</span></div>
        </div>
        
        ${analysisResult.detailedItems && analysisResult.detailedItems.arrays && analysisResult.detailedItems.arrays.length > 0 ? `
        <div class="section">
            <h2>Arrays Found</h2>
            ${analysisResult.detailedItems.arrays.map((arr: any) => `
                <div class="stat">
                    <span class="label">${arr.path}:</span>
                    <span class="value">${arr.preview}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${analysisResult.details.objectKeys && analysisResult.details.objectKeys.length > 0 ? `
        <div class="section">
            <h2>Root Level Keys</h2>
            ${analysisResult.details.objectKeys.map((key: string) => `
                <div class="stat">
                    <span class="label">${key}:</span>
                    <span class="value">${analysisResult.details.valueTypes[key]}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="metadata">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Powered by AI JSON Tools - JSON Structure Analyzer</p>
        </div>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'json-structure-analysis-report.html';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup after download initiates
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Structured Data (JSON-LD) aligned to requested SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "JSON Structure Analyzer",
    "description": "Analyze JSON structure online. View keys, nested objects, and hierarchy for better understanding.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="JSON Structure Analyzer | Free Online JSON Analysis Tool"
        description="Analyze JSON structure online. View keys, nested objects, and hierarchy for better understanding."
        keywords="analyze JSON structure, JSON hierarchy viewer, JSON analysis tool"
        canonical="https://yourdomain.com/json-structure-analyzer"
        ogUrl="https://yourdomain.com/json-structure-analyzer"
        structuredData={structuredData}
      />

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <i className="fa-solid fa-diagram-project text-lg" aria-hidden="true"></i>
            JSON Structure Analyzer – Analyze JSON Hierarchy and Keys
          </h1>
          <h2 className="text-sm text-slate-600 dark:text-slate-300">
            Explore JSON structure, keys, and nested objects visually. Perfect for debugging and data analysis.
          </h2>
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
              onClick={handleAnalyze}
              disabled={!inputJson.trim() || isAnalyzing}
              className="btn btn-purple"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-diagram-project" aria-hidden="true"></i>
                  <span>Analyze Structure</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setInputJson('');
                setAnalysisResult(null);
                setShowErrorModal(false);
              }}
              disabled={!inputJson.trim()}
              className="btn btn-red"
            >
              <i className="fa-solid fa-times" aria-hidden="true"></i>
              <span>Clear</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <textarea
            value={inputJson}
            onChange={(e) => handleInputChange(e.target.value)}
            onPaste={(e) => {
              // Auto-analyze after paste if JSON is valid
              setTimeout(() => {
                const text = e.currentTarget.value.trim();
                if (text) {
                  const parseResult = parseJsonSafe(text);
                  if (parseResult.ok) {
                    try {
                      const analysis = analyzeJsonStructure(text);
                      setAnalysisResult(analysis);
                      setShowErrorModal(false);
                      setTimeout(() => {
                        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 300);
                    } catch (err: any) {
                      console.error('Analysis failed:', err);
                    }
                  }
                }
              }, 100);
            }}
            placeholder='Paste or Upload your JSON here, e.g., {"users": [{"name": "John", "age": 30}], "count": 1}'
            className="w-full h-64 px-4 py-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Analysis Results Section */}
        {analysisResult && (
          <div ref={resultsRef} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            {/* Results Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800">
              <h2 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                <span>📊</span>
                Structure Analysis Report
              </h2>
              
              <button
                onClick={handleDownloadReport}
                className="btn btn-blue"
              >
                <i className="fa-solid fa-download" aria-hidden="true"></i>
                <span>Export Report</span>
              </button>
            </div>

            {/* Results Content */}
            <div className="p-6">
              <StatisticsDetailViewer data={analysisResult} />
            </div>
          </div>
        )}

        {!analysisResult && (
          <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No Analysis Results Yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Paste valid JSON data above and click "Analyze Structure" to see detailed statistics
            </p>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Comprehensive Statistics</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Get detailed metrics including total keys, maximum depth, data types distribution, array analysis, and object hierarchy.
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Deep Structure Insights</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Analyze nested structures, array compositions, object complexity, and understand your JSON architecture at every level.
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-3">📥</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Exportable Reports</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Download analysis reports as HTML files with formatted statistics, perfect for documentation and sharing with your team.
            </p>
          </div>
        </div>
      </div>

      {/* Error Modal - Shows when JSON has syntax errors */}
      <StructureAnalyzerErrorModal
        open={showErrorModal}
        jsonInput={inputJson}
        onClose={() => setShowErrorModal(false)}
        onFixApplied={handleFixApplied}
      />

      {/* Success Modal - Shows when JSON validation is successful */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border border-green-300 dark:border-green-700">
            {/* Header */}
            <div className="px-5 py-3 bg-green-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <h3 className="text-lg font-semibold">Validation Successful</h3>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-check text-3xl text-green-600 dark:text-green-400"></i>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    JSON is Valid!
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Your JSON file has been successfully validated with no errors.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-green-700 dark:text-green-400">
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check-circle mt-0.5"></i>
                    <span>No syntax errors detected</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check-circle mt-0.5"></i>
                    <span>Proper formatting and structure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check-circle mt-0.5"></i>
                    <span>Ready for structure analysis</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="btn btn-green"
              >
                <span>Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

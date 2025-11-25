import React, { useState } from 'react';
import SEO from './SEO';
import { analyzeJsonStructure } from '../utils/jsonStructureAnalyzer';
import { StatisticsDetailViewer } from './StatisticsDetailViewer';

export const JsonStructureAnalyzerPage: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze JSON structure
  const handleAnalyze = () => {
    const trimmedInput = inputJson.trim();
    if (!trimmedInput) {
      setParseError('Please enter JSON code to analyze');
      return;
    }

    setIsAnalyzing(true);
    setParseError(null);

    try {
      const analysis = analyzeJsonStructure(trimmedInput);
      setAnalysisResult(analysis);
      setParseError(null);
    } catch (err: any) {
      setParseError(`Analysis failed: ${err.message}`);
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
    setInputJson(JSON.stringify(sampleJson, null, 2));
    setAnalysisResult(null);
    setParseError(null);
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
            <h2>Overview Statistics</h2>
            <div class="stat"><span class="label">Total Keys:</span><span class="value">${analysisResult.totalKeys}</span></div>
            <div class="stat"><span class="label">Maximum Depth:</span><span class="value">${analysisResult.maxDepth}</span></div>
            <div class="stat"><span class="label">Total Arrays:</span><span class="value">${analysisResult.totalArrays}</span></div>
            <div class="stat"><span class="label">Total Objects:</span><span class="value">${analysisResult.totalObjects}</span></div>
        </div>
        
        <div class="section">
            <h2>Data Types Distribution</h2>
            <div class="stat"><span class="label">Strings:</span><span class="value">${analysisResult.typeDistribution.string || 0}</span></div>
            <div class="stat"><span class="label">Numbers:</span><span class="value">${analysisResult.typeDistribution.number || 0}</span></div>
            <div class="stat"><span class="label">Booleans:</span><span class="value">${analysisResult.typeDistribution.boolean || 0}</span></div>
            <div class="stat"><span class="label">Nulls:</span><span class="value">${analysisResult.typeDistribution.null || 0}</span></div>
            <div class="stat"><span class="label">Objects:</span><span class="value">${analysisResult.typeDistribution.object || 0}</span></div>
            <div class="stat"><span class="label">Arrays:</span><span class="value">${analysisResult.typeDistribution.array || 0}</span></div>
        </div>
        
        ${analysisResult.arrayAnalysis && analysisResult.arrayAnalysis.length > 0 ? `
        <div class="section">
            <h2>Array Analysis</h2>
            ${analysisResult.arrayAnalysis.map((arr: any) => `
                <div class="stat">
                    <span class="label">${arr.path}:</span>
                    <span class="value">${arr.length} items (${arr.itemTypes.join(', ')})</span>
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
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEO
        title="JSON Structure Analyzer - Analyze JSON Schema & Statistics | Deep JSON Insights"
        description="Analyze JSON structure, depth, complexity, and statistics instantly. Free online JSON structure analyzer to get detailed insights about JSON schema, data types distribution, array analysis, object hierarchy, and complexity metrics. Perfect for developers to understand JSON architecture and optimize data structures."
        keywords="json structure analyzer, json statistics, json depth analysis, json complexity report, json schema analysis, json data types, json hierarchy analyzer, analyze json structure, json architecture tool, json metrics, json profiler, json inspection tool, json structure report, json schema validator, json complexity checker, json object analyzer, json array analysis, json nested structure"
        canonical="https://yourdomain.com/json-structure-analyzer"
        ogImage="https://yourdomain.com/images/json-structure-analyzer.jpg"
        ogUrl="https://yourdomain.com/json-structure-analyzer"
      />

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <span className="text-4xl">📈</span>
            JSON Structure Analyzer
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Analyze your JSON structure to get detailed statistics, depth analysis, type distribution, and complexity metrics.
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Paste Your JSON Data
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleLoadSample}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-700"
              >
                Load Sample
              </button>
              <button
                onClick={() => {
                  setInputJson('');
                  setAnalysisResult(null);
                  setParseError(null);
                }}
                disabled={!inputJson.trim()}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder='Paste your JSON here, e.g., {"users": [{"name": "John", "age": 30}], "count": 1}'
            className="w-full h-64 px-4 py-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          {parseError && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">❌ Error:</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{parseError}</p>
            </div>
          )}
          <div className="mt-3 flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={!inputJson.trim() || isAnalyzing}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Analyze Structure
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results Section */}
        {analysisResult && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            {/* Results Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800">
              <h2 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                <span>📊</span>
                Structure Analysis Report
              </h2>
              
              <button
                onClick={handleDownloadReport}
                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>📥</span>
                Download Report
              </button>
            </div>

            {/* Results Content */}
            <div className="p-6">
              <StatisticsDetailViewer data={analysisResult} />
            </div>
          </div>
        )}

        {!analysisResult && !parseError && (
          <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No Analysis Results Yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Paste valid JSON data above and click "Analyze Structure" to see detailed statistics
            </p>
            <button
              onClick={handleLoadSample}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Try Sample JSON
            </button>
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
    </>
  );
};

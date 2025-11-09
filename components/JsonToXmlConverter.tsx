import React, { useState, useRef, useEffect } from 'react';
import { Tooltip } from './Tooltip';
import { UploadIcon, LightningIcon } from './icons';
import { ErrorAnalysisDisplay } from './ErrorAnalysisDisplay';
import { convertJsonToXmlCode } from '../utils/jsonToXmlConverter';
import { convertJsonToXml, correctCodeSyntax } from '../services/geminiService';

type ConversionMode = 'fast' | 'smart';

const JsonToXmlConverter: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [xmlOutput, setXmlOutput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [conversionMode, setConversionMode] = useState<ConversionMode>('fast');
  const [hasConverted, setHasConverted] = useState(false);
  const [inputChanged, setInputChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('JsonToXmlConverter mounted with initial mode:', conversionMode);
  }, []);

  useEffect(() => {
    console.log('Conversion mode changed to:', conversionMode);
  }, [conversionMode]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonInput(content);
        setError('');
        setInputChanged(true); // Mark input as changed
        setHasConverted(false); // Reset conversion state
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
    }
  };

  const handleAutoCorrect = async () => {
    if (!jsonInput.trim()) return;
    
    setIsCorrecting(true);
    setIsLoading(true);  // Show loading message immediately
    setError('');
    setXmlOutput('');  // Clear output to show loading
    
    try {
      console.log('Attempting AI-powered JSON syntax correction...');
      const correctedJson = await correctCodeSyntax(jsonInput, 'JSON');
      setJsonInput(correctedJson);
      setError(''); // Clear error after successful correction
      console.log('AI successfully corrected the JSON syntax');
      
      // Automatically convert the corrected JSON to XML
      // Always use Fast mode for auto-conversion to avoid double AI timeout
      console.log('Auto-converting corrected JSON to XML using Fast mode...');
      
      try {
        const xmlCode = convertJsonToXmlCode(correctedJson, 'root', {
          includeXmlDeclaration: true,
          prettyPrint: true,
          indentSize: 2
        });
        
        setXmlOutput(xmlCode);
        console.log('Auto-conversion successful');
        
        // Don't set hasConverted flag since we used Fast mode for auto-conversion
        // User can still click Convert to use Smart mode if desired
      } catch (convErr: any) {
        console.error('Auto-conversion error:', convErr);
        setError(convErr.message || 'Failed to convert corrected JSON to XML');
        // Reset flags on error
        setHasConverted(false);
        setInputChanged(true);
      }
    } catch (err: any) {
      console.error('Auto-correction failed:', err);
      setError(err.message || 'AI auto-correction failed. Please fix the JSON manually.');
      // Reset flags on error
      setHasConverted(false);
      setInputChanged(true);
    } finally {
      setIsLoading(false);
      setIsCorrecting(false);
    }
  };

  const handleConvert = async () => {
    setError('');
    setXmlOutput('');

    if (!jsonInput.trim()) {
      setError('Please enter JSON code to convert');
      return;
    }

    // Validate JSON first
    let jsonParseError: string | null = null;
    try {
      JSON.parse(jsonInput);
    } catch (err: any) {
      jsonParseError = err.message;
      
      // In Smart mode, offer AI-powered error correction
      if (conversionMode === 'smart') {
        const errorAnalysis = `### Invalid JSON Syntax

**Error Details:**
${err.message}

**What Happened:**
The JSON you provided has syntax errors that prevent it from being parsed. This could be due to:
- Missing or extra commas
- Unclosed quotes or brackets
- Invalid characters or formatting

### AI-Powered Resolution Available

Since you're using Smart Mode (AI), I can attempt to automatically fix these syntax errors for you.

**Suggestions:**
1. Click the "Auto-Correct with AI" button above to let AI fix the syntax errors
2. Or manually review and fix the JSON syntax
3. Common issues: trailing commas, unquoted keys, single quotes instead of double quotes`;
        
        setError(errorAnalysis);
        return;
      } else {
        // Fast mode: just show the error
        setError(`Invalid JSON syntax: ${err.message}`);
        return;
      }
    }

    setIsLoading(true);
    console.log(`Starting conversion using ${conversionMode} mode`);

    try {
      let xmlCode: string;

      if (conversionMode === 'fast') {
        console.log('Using Fast Mode (code-based conversion)');
        // Fast mode: Code-based conversion
        xmlCode = convertJsonToXmlCode(jsonInput, 'root', {
          includeXmlDeclaration: true,
          prettyPrint: true,
          indentSize: 2
        });
      } else {
        console.log('Using Smart Mode (AI-powered conversion)');
        // Smart mode: AI-powered conversion
        xmlCode = await convertJsonToXml(jsonInput);
      }

      setXmlOutput(xmlCode);
      console.log('Conversion successful');
      
      // Mark as converted and reset input change flag (only for Smart mode)
      if (conversionMode === 'smart') {
        console.log('Setting hasConverted=true and inputChanged=false');
        setHasConverted(true);
        setInputChanged(false);
      }
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert JSON to XML');
      // Reset flags on error
      setHasConverted(false);
      setInputChanged(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setXmlOutput('');
    setError('');
    setHasConverted(false);
    setInputChanged(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            JSON to XML Converter
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Convert JSON data to well-formed XML - Fast (code-based) or Smart (AI-powered)
          </p>
        </div>

        {/* Mode Info Banner */}
        <div className={`mb-6 p-4 rounded-lg ${
          conversionMode === 'fast' 
            ? 'bg-blue-50 border-2 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
            : 'bg-purple-50 border-2 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700'
        }`}>
          <h3 className={`font-bold text-lg mb-2 ${
            conversionMode === 'fast' ? 'text-blue-800 dark:text-blue-300' : 'text-purple-800 dark:text-purple-300'
          }`}>
            {conversionMode === 'fast' ? 'FAST MODE (CODE-BASED)' : 'SMART MODE (AI-POWERED)'}
          </h3>
          <p className={conversionMode === 'fast' ? 'text-blue-700 dark:text-blue-200' : 'text-purple-700 dark:text-purple-200'}>
            {conversionMode === 'fast' 
              ? '✓ Instant conversion • No internet required • Free • Deterministic output'
              : '✓ AI-powered conversion • Better quality • Handles complex structures • Requires internet'
            }
          </p>
          <p className={`mt-2 text-sm font-semibold ${
            conversionMode === 'fast' ? 'text-blue-600 dark:text-blue-300' : 'text-purple-600 dark:text-purple-300'
          }`}>
            💡 Click the big "Convert to XML" button below to start conversion
          </p>
        </div>

        {/* Control Panel */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Convert Button - Large and Prominent */}
            <button
              onClick={handleConvert}
              disabled={isLoading || (conversionMode === 'smart' && hasConverted && !inputChanged)}
              className="px-6 py-3 text-lg bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md font-semibold flex items-center gap-2"
              title={
                conversionMode === 'smart' && hasConverted && !inputChanged
                  ? 'Already converted. Modify the input or click Clear to convert again.'
                  : ''
              }
              onMouseEnter={() => {
                console.log('Button state:', { isLoading, conversionMode, hasConverted, inputChanged });
                console.log('Button should be disabled:', isLoading || (conversionMode === 'smart' && hasConverted && !inputChanged));
              }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                  Converting...
                </>
              ) : (
                <>
                  Convert to XML {conversionMode === 'fast' ? '⚡' : '🤖'}
                </>
              )}
            </button>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>

            {/* Mode Selector - Visually Separated */}
            <div className="ml-auto pl-4 border-l-2 border-gray-300 dark:border-gray-600 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Conversion Mode:
              </span>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setConversionMode('fast')}
                  className={`px-4 py-2 rounded-md transition-all font-semibold flex items-center gap-2 ${
                    conversionMode === 'fast'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <LightningIcon className="h-4 w-4" />
                  Fast
                </button>
                <button
                  onClick={() => setConversionMode('smart')}
                  className={`px-4 py-2 rounded-md transition-all font-semibold flex items-center gap-2 ${
                    conversionMode === 'smart'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🤖 Smart (AI)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                JSON Input
              </h2>
              <Tooltip content="Upload JSON file">
                <button
                  onClick={handleUploadClick}
                  className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  aria-label="Upload JSON file"
                >
                  <UploadIcon className="h-5 w-5" />
                </button>
              </Tooltip>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json,text/plain"
              onChange={handleFileUpload}
              className="hidden"
            />
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setInputChanged(true); // Mark input as changed on manual edit
                setHasConverted(false); // Reset conversion state
              }}
              placeholder='Enter JSON here, e.g., {"name": "John", "age": 30}'
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Output Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 relative">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              XML Output
            </h2>
            {isLoading ? (
              <div className="absolute inset-0 mt-16 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
                <div className="animate-spin h-16 w-16 border-4 border-purple-200 border-t-purple-600 dark:border-purple-800 dark:border-t-purple-400 rounded-full mb-6"></div>
                <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-3">
                  {isCorrecting 
                    ? '🔧 AI is auto-correcting and converting...' 
                    : conversionMode === 'smart' 
                      ? '🤖 AI is working its magic...' 
                      : '⚡ Converting...'
                  }
                </h3>
                <p className="text-lg text-purple-700 dark:text-purple-200 mb-2 text-center max-w-md">
                  {isCorrecting
                    ? 'Step 1: Fixing JSON syntax errors with AI, then converting to XML'
                    : conversionMode === 'smart' 
                      ? 'Our AI is analyzing your JSON and generating well-formatted XML with intelligent structure'
                      : 'Converting your JSON to XML format'
                  }
                </p>
                {isCorrecting ? (
                  <div className="mt-4 space-y-2 text-sm text-purple-600 dark:text-purple-300">
                    <p className="flex items-center gap-2">
                      <span className="animate-pulse">🔍</span>
                      <span>Analyzing syntax errors...</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="animate-pulse">🔧</span>
                      <span>AI is correcting JSON syntax...</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="animate-pulse">⚡</span>
                      <span>Auto-converting to XML...</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="animate-pulse">⏱️</span>
                      <span>Estimated time: 10-20 seconds</span>
                    </p>
                  </div>
                ) : conversionMode === 'smart' && (
                  <div className="mt-4 space-y-2 text-sm text-purple-600 dark:text-purple-300">
                    <p className="flex items-center gap-2">
                      <span className="animate-pulse">⏱️</span>
                      <span>Estimated time: 5-15 seconds</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="animate-pulse">🔍</span>
                      <span>Analyzing JSON structure...</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="animate-pulse">✨</span>
                      <span>Generating optimized XML output...</span>
                    </p>
                  </div>
                )}
                {conversionMode === 'fast' && !isCorrecting && (
                  <p className="mt-4 text-sm text-blue-600 dark:text-blue-300">
                    ⚡ Lightning-fast code-based conversion in progress...
                  </p>
                )}
              </div>
            ) : error && conversionMode === 'smart' && error.includes('###') ? (
              <ErrorAnalysisDisplay
                title="JSON Syntax Error"
                analysisText={error}
                showAutoCorrectButton={true}
                onAutoCorrect={handleAutoCorrect}
                isCorrecting={isCorrecting}
              />
            ) : error ? (
              <div className="absolute inset-0 p-6 overflow-auto bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                <p className="font-medium mb-2">Error:</p>
                <p>{error}</p>
              </div>
            ) : xmlOutput ? (
              <textarea
                value={xmlOutput}
                readOnly
                placeholder="XML output will appear here..."
                className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm resize-none"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                <svg className="h-24 w-24 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                  No XML output yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Enter JSON data and click "Convert to XML" to generate XML code
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Conversion Mode Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <LightningIcon className="h-5 w-5" />
                Fast Mode (Code-Based)
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <li>✓ Instant conversion (no network delay)</li>
                <li>✓ Works offline</li>
                <li>✓ No API costs</li>
                <li>✓ Deterministic output</li>
                <li>✓ Handles standard JSON structures</li>
              </ul>
            </div>
            <div className="p-4 border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                🤖 Smart Mode (AI-Powered)
              </h4>
              <ul className="text-sm text-purple-700 dark:text-purple-200 space-y-1">
                <li>✓ Better handling of complex structures</li>
                <li>✓ More human-readable output</li>
                <li>✓ Intelligent attribute vs element decisions</li>
                <li>✓ Better naming conventions</li>
                <li>✓ Requires internet connection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonToXmlConverter;

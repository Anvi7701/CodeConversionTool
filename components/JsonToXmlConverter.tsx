import React, { useState, useRef, useEffect } from 'react';
import { Tooltip } from './Tooltip';
import { UploadIcon, LightningIcon } from './icons';
import { ErrorAnalysisDisplay } from './ErrorAnalysisDisplay';
import { convertJsonToXmlCode } from '../utils/jsonToXmlConverter';
import { convertJsonToXml, correctCodeSyntax } from '../services/geminiService';
import { extractErrorPosition, getSurroundingLines, validateJsonSyntax, ErrorPosition } from '../utils/errorHighlighter';
import { fixSimpleJsonErrors, getFixSummary, FixChange } from '../utils/simpleJsonFixer';

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
  const [errorLines, setErrorLines] = useState<ErrorPosition[]>([]);
  const [appliedFixes, setAppliedFixes] = useState<FixChange[]>([]);
  const [showFixSummary, setShowFixSummary] = useState(false);
  const [switchedToSmartMode, setSwitchedToSmartMode] = useState(false); // Track if user switched via "Switch to Smart AI Mode" button
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync line numbers scroll with textarea scroll
  const handleTextareaScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('JsonToXmlConverter mounted with initial mode:', conversionMode);
  }, []);

  useEffect(() => {
    console.log('🔵 switchedToSmartMode changed to:', switchedToSmartMode);
  }, [switchedToSmartMode]);

  useEffect(() => {
    console.log('🟠 hasConverted changed to:', hasConverted, '| inputChanged:', inputChanged);
  }, [hasConverted, inputChanged]);

  useEffect(() => {
    console.log('Conversion mode changed to:', conversionMode);
    
    // If there's an error and user switches mode, re-validate to show mode-appropriate error
    if (error && jsonInput.trim()) {
      // Try to parse JSON to check if there's a syntax error
      try {
        JSON.parse(jsonInput);
        // If parsing succeeds, clear the error
        setError('');
        setErrorLines([]);
      } catch (err: any) {
        // JSON has syntax error - validate and find all errors
        const allErrors = validateJsonSyntax(jsonInput);
        setErrorLines(allErrors);
        
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
        } else {
          // Fast mode: just show the simple error
          setError(`Invalid JSON syntax: ${err.message}`);
        }
      }
    }
  }, [conversionMode]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Check if error is complex (not fixable by simple auto-fix)
  const isComplexError = (error: ErrorPosition): boolean => {
    const simplePatterns = [
      'Missing comma',
      'Trailing comma',
      'single quote',
      'Unquoted key',
      'Expected \',\''
    ];
    return !simplePatterns.some(pattern => 
      error.message?.includes(pattern)
    );
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
        setSwitchedToSmartMode(false); // Clear flag when uploading file
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
        
        // Mark as converted since we successfully generated XML output
        console.log('🟡 Auto-correct: Setting hasConverted=true and inputChanged=false');
        setHasConverted(true);
        setInputChanged(false);
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

  // Handle automatic fixing of simple errors
  const handleFixSimpleErrors = () => {
    const result = fixSimpleJsonErrors(jsonInput);
    
    if (result.wasFixed) {
      // Update the input with fixed JSON
      setJsonInput(result.fixed);
      setAppliedFixes(result.changes);
      setShowFixSummary(true);
      
      // Re-validate to check for remaining errors
      const remainingErrors = validateJsonSyntax(result.fixed);
      setErrorLines(remainingErrors);
      
      // If there are remaining errors, set error state to show error panel
      if (remainingErrors.length > 0) {
        setError(`Remaining errors after auto-fix: ${remainingErrors.length} error${remainingErrors.length > 1 ? 's' : ''}`);
      } else {
        // All errors fixed! Show success message
        setError('SUCCESS_ALL_FIXED');
      }
      
      // Clear any previous output
      setXmlOutput('');
      setHasConverted(false);
      setInputChanged(false);
    } else {
      // No fixes could be applied
      setAppliedFixes([]);
      setShowFixSummary(true);
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
      setErrorLines([]);
    } catch (err: any) {
      jsonParseError = err.message;
      
      // Validate and find all errors
      const allErrors = validateJsonSyntax(jsonInput);
      setErrorLines(allErrors);
      
      // In Smart mode, offer AI-powered error correction
      if (conversionMode === 'smart') {
        let errorAnalysis = `### Invalid JSON Syntax

**Error Details:**
${err.message}`;

        // Add error locations if available
        if (allErrors.length > 0) {
          errorAnalysis += `\n**Error Locations:**\n`;
          allErrors.forEach(error => {
            errorAnalysis += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
          });
        }

        errorAnalysis += `

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
        // Fast mode: show errors with line info
        let fastError = `Invalid JSON syntax: ${err.message}`;
        if (allErrors.length > 0) {
          fastError += `\n\n📍 Error Locations:\n`;
          allErrors.forEach(error => {
            fastError += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
          });
        }
        setError(fastError);
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
      
      // Mark as converted and reset input change flag
      console.log('🟡 Setting hasConverted=true and inputChanged=false');
      setHasConverted(true);
      setInputChanged(false);
      console.log('🟡 After setting - hasConverted should be TRUE, inputChanged should be FALSE');
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
    setSwitchedToSmartMode(false); // Clear flag when clearing input
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
              disabled={
                isLoading || 
                (hasConverted && !inputChanged) || 
                (errorLines.length > 0 && errorLines.some(isComplexError) && conversionMode === 'fast') // Disable in Fast mode when complex errors exist
              }
              className="px-6 py-3 text-lg bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md font-semibold flex items-center gap-2"
              title={
                errorLines.length > 0 && errorLines.some(isComplexError) && conversionMode === 'fast'
                  ? 'Complex errors detected. Please use Smart AI Mode or manually fix the errors to enable conversion.'
                  : hasConverted && !inputChanged
                  ? 'Already converted. Modify the input or click Clear to convert again.'
                  : ''
              }
              onMouseEnter={() => {
                console.log('🟢 Convert Button State:', { 
                  isLoading, 
                  conversionMode, 
                  hasConverted, 
                  inputChanged, 
                  switchedToSmartMode,
                  showFixSummary,
                  errorLinesCount: errorLines.length,
                  hasComplexErrors: errorLines.some(isComplexError)
                });
                console.log('🟢 Button disabled:', isLoading || (hasConverted && !inputChanged) || (errorLines.length > 0 && errorLines.some(isComplexError) && conversionMode === 'fast'));
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
                  onClick={() => {
                    setConversionMode('fast');
                    setSwitchedToSmartMode(false); // Clear flag when manually switching modes
                  }}
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
                  onClick={() => {
                    setConversionMode('smart');
                    setSwitchedToSmartMode(false); // Clear flag when manually switching modes
                  }}
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
            
            {/* Textarea with Line Numbers */}
            <div className="relative flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              {/* Line Numbers with Error Icons */}
              <div 
                ref={lineNumbersRef}
                className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 py-4 px-2 select-none overflow-hidden" 
                style={{ maxHeight: '384px' }}
              >
                {jsonInput.split('\n').map((_, index) => {
                  const lineNumber = index + 1;
                  const errorForLine = errorLines.find(e => e.line === lineNumber);
                  const isErrorLine = !!errorForLine;
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-1 font-mono text-xs leading-6 ${
                        isErrorLine 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                      style={{ minHeight: '1.5rem' }}
                      title={errorForLine ? `Error: ${errorForLine.message}` : ''}
                    >
                      {/* Error Icon (Red X) */}
                      {isErrorLine && (
                        <svg 
                          className="w-3 h-3 text-red-500 dark:text-red-400 flex-shrink-0" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      )}
                      {/* Line Number */}
                      <span className={`text-right ${isErrorLine ? 'font-bold' : ''}`} style={{ minWidth: '2rem' }}>
                        {lineNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setInputChanged(true);
                  setHasConverted(false);
                  setErrorLines([]);
                  setShowFixSummary(false);
                  setAppliedFixes([]);
                  setSwitchedToSmartMode(false); // Clear flag when user manually edits input
                }}
                onScroll={handleTextareaScroll}
                placeholder='Enter JSON here, e.g., {"name": "John", "age": 30}'
                className={`flex-1 h-96 p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm resize-none focus:outline-none leading-6 ${
                  errorLines.length > 0 ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                }`}
                style={{ lineHeight: '1.5rem' }}
              />
            </div>
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
            ) : error === 'SUCCESS_ALL_FIXED' ? (
              <div className="absolute inset-0 p-6 overflow-auto bg-green-50 dark:bg-green-900/30 rounded-lg">
                <div className="flex flex-col items-center justify-center h-full">
                  {/* Success Icon */}
                  <div className="mb-6">
                    <svg className="w-24 h-24 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* Success Message */}
                  <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-3">
                    🎉 Input File Corrected Successfully!
                  </h3>
                  <p className="text-green-600 dark:text-green-400 mb-6 text-center max-w-md">
                    All syntax errors have been automatically fixed. Your JSON is now valid and ready to convert.
                  </p>

                  {/* Fix Summary */}
                  {appliedFixes.length > 0 && (
                    <div className="w-full max-w-2xl mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-700">
                      <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Fixed {appliedFixes.length} Issue{appliedFixes.length > 1 ? 's' : ''}
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-3 font-medium">
                        {getFixSummary(appliedFixes)}
                      </p>
                      <div className="text-xs text-green-600 dark:text-green-400 space-y-1.5 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                        {appliedFixes.map((fix, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Line {fix.line}: {fix.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      setError('');
                      setShowFixSummary(false);
                      // Auto-convert the fixed JSON
                      handleConvert();
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Got it! Ready to Convert
                  </button>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 p-6 overflow-auto bg-red-50 dark:bg-red-900/30 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {errorLines.length > 0 ? `${errorLines.length} Syntax Error${errorLines.length > 1 ? 's' : ''} Found` : 'Error'}
                  </h3>
                </div>

                {/* Fix Summary - shown after auto-fix is applied */}
                {showFixSummary && appliedFixes.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      ✅ Automatically Fixed {appliedFixes.length} Issue{appliedFixes.length > 1 ? 's' : ''}
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      {getFixSummary(appliedFixes)}
                    </p>
                    <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                      {appliedFixes.map((fix, idx) => (
                        <div key={idx}>• Line {fix.line}: {fix.description}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Display errors in two-column layout: Simple vs Complex */}
                {errorLines.length > 0 ? (
                  <>
                    {/* Two-Column Error Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      
                      {/* LEFT COLUMN: Simple/Fixable Errors */}
                      <div className="border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/10">
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Simple Errors (Auto-Fixable)
                        </h4>
                        
                        {errorLines.filter(e => !isComplexError(e)).length > 0 ? (
                          <>
                            {/* Display simple errors */}
                            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                              {errorLines.filter(e => !isComplexError(e)).map((error, idx) => (
                                <div key={idx} className="p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-blue-500 text-xs">
                                  <p className="font-semibold text-blue-700 dark:text-blue-300">
                                    Line {error.line}, Column {error.column}
                                  </p>
                                  <p className="text-blue-600 dark:text-blue-400 mt-1 font-mono">
                                    {error.message || 'Syntax error detected'}
                                  </p>
                                </div>
                              ))}
                            </div>
                            
                            {/* Fix Simple Errors Button */}
                            {conversionMode === 'fast' && (
                              <div className="mt-3">
                                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                  Automatically fix common errors like missing commas, trailing commas, unquoted keys, and single quotes (95%+ success rate).
                                </p>
                                <button
                                  onClick={handleFixSimpleErrors}
                                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Fix Simple Errors
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          /* No simple errors - show friendly message */
                          <div className="text-center py-6">
                            <svg className="w-12 h-12 text-blue-300 dark:text-blue-700 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                              No Simple Errors Detected
                            </p>
                            <p className="text-xs text-blue-500 dark:text-blue-500">
                              All errors require advanced fixing
                            </p>
                            {conversionMode === 'fast' && (
                              <button
                                disabled
                                className="w-full mt-3 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Fix Simple Errors
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* RIGHT COLUMN: Complex Errors */}
                      <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50/50 dark:bg-purple-900/10">
                        <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                          </svg>
                          Complex Errors (AI Required)
                        </h4>
                        
                        {errorLines.filter(e => isComplexError(e)).length > 0 ? (
                          <>
                            {/* Display complex errors */}
                            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                              {errorLines.filter(e => isComplexError(e)).map((error, idx) => (
                                <div key={idx} className="p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-purple-500 text-xs">
                                  <p className="font-semibold text-purple-700 dark:text-purple-300">
                                    Line {error.line}, Column {error.column}
                                  </p>
                                  <p className="text-purple-600 dark:text-purple-400 mt-1 font-mono">
                                    {error.message || 'Syntax error detected'}
                                  </p>
                                </div>
                              ))}
                            </div>
                            
                            {/* Fix Complex Errors with AI Button */}
                            <div className="mt-3">
                              <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                                These errors require advanced fixing with bracket matching, structural fixes, and context-aware repairs.
                              </p>
                              <button
                                onClick={() => {
                                  console.log('🟣 Fix Complex Errors with AI clicked - switching to Smart mode and auto-correcting');
                                  setConversionMode('smart');
                                  setSwitchedToSmartMode(true);
                                  // Automatically trigger AI correction
                                  setTimeout(() => {
                                    handleAutoCorrect();
                                  }, 100); // Small delay to ensure mode switch completes
                                }}
                                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                Fix Complex Errors with AI
                              </button>
                            </div>
                          </>
                        ) : (
                          /* No complex errors - show friendly message */
                          <div className="text-center py-6">
                            <svg className="w-12 h-12 text-purple-300 dark:text-purple-700 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                              No Complex Errors Detected
                            </p>
                            <p className="text-xs text-purple-500 dark:text-purple-500">
                              All errors can be auto-fixed
                            </p>
                            <button
                              disabled
                              className="w-full mt-3 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              Fix Complex Errors with AI
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fix Summary - shown after auto-fix is applied */}
                    {showFixSummary && appliedFixes.length > 0 && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          ✅ Automatically Fixed {appliedFixes.length} Issue{appliedFixes.length > 1 ? 's' : ''}
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                          {getFixSummary(appliedFixes)}
                        </p>
                        <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                          {appliedFixes.map((fix, idx) => (
                            <div key={idx}>• Line {fix.line}: {fix.description}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                )}
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

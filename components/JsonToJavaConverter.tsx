import React, { useState, useRef, useEffect } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeViewer } from './CodeViewer';
import { SpinnerIcon, JavaIcon, CodeBracketIcon, UploadIcon, LightningIcon } from './icons';
import { convertJsonToJava, correctCodeSyntax } from '../services/geminiService';
import { convertJsonToJavaCode } from '../utils/jsonToJavaConverter';
import { Tooltip } from './Tooltip';
import { ErrorAnalysisDisplay } from './ErrorAnalysisDisplay';
import { extractErrorPosition, getSurroundingLines, validateJsonSyntax, ErrorPosition } from '../utils/errorHighlighter';
import { fixSimpleJsonErrors, getFixSummary, FixChange } from '../utils/simpleJsonFixer';

type ConversionMode = 'fast' | 'smart';

export const JsonToJavaConverter: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [outputJava, setOutputJava] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [conversionMode, setConversionMode] = useState<ConversionMode>('fast');
  const [hasConverted, setHasConverted] = useState(false);
  const [inputChanged, setInputChanged] = useState(false);
  const [errorLines, setErrorLines] = useState<ErrorPosition[]>([]);
  const [appliedFixes, setAppliedFixes] = useState<FixChange[]>([]);
  const [showFixSummary, setShowFixSummary] = useState(false);
  const [switchedToSmartMode, setSwitchedToSmartMode] = useState(false); // Track if user switched via "Switch to Smart AI Mode" button
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync line numbers scroll with textarea scroll
  const handleTextareaScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Debug: Log mode changes
  useEffect(() => {
    console.log('Conversion mode changed to:', conversionMode);
    
    // If there's an error and user switches mode, re-validate to show mode-appropriate error
    if (outputError && inputJson.trim()) {
      // Try to parse JSON to check if there's a syntax error
      try {
        JSON.parse(inputJson);
        // If parsing succeeds, clear the error
        setOutputError(null);
        setErrorLines([]);
      } catch (err: any) {
        // JSON has syntax error - validate and find all errors
        const allErrors = validateJsonSyntax(inputJson);
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
          
          setOutputError(errorAnalysis);
        } else {
          // Fast mode: just show the simple error
          setOutputError(`Invalid JSON syntax: ${err.message}`);
        }
      }
    }
  }, [conversionMode]);

  // Debug: Log component mount
  useEffect(() => {
    console.log('JsonToJavaConverter mounted with initial mode:', conversionMode);
  }, []);

  const handleInputChange = (value: string) => {
    setInputJson(value);
    setOutputError(null);
    setOutputJava(null);
    setInputChanged(true); // Mark input as changed
    setHasConverted(false); // Reset conversion state
    setShowFixSummary(false);
    setAppliedFixes([]);
    setSwitchedToSmartMode(false); // Clear flag when input changes (manual edit or file upload)
  };

  // Handle automatic fixing of simple errors
  const handleFixSimpleErrors = () => {
    const result = fixSimpleJsonErrors(inputJson);
    
    if (result.wasFixed) {
      // Update the input with fixed JSON
      setInputJson(result.fixed);
      setAppliedFixes(result.changes);
      setShowFixSummary(true);
      
      // Re-validate to check for remaining errors
      const remainingErrors = validateJsonSyntax(result.fixed);
      setErrorLines(remainingErrors);
      
      // If there are remaining errors, set error state to show error panel
      if (remainingErrors.length > 0) {
        setOutputError(`Remaining errors after auto-fix: ${remainingErrors.length} error${remainingErrors.length > 1 ? 's' : ''}`);
      } else {
        // All errors fixed! Show success message
        setOutputError('SUCCESS_ALL_FIXED');
      }
      
      // Clear any previous output
      setOutputJava(null);
      setHasConverted(false);
      setInputChanged(false);
    } else {
      // No fixes could be applied
      setAppliedFixes([]);
      setShowFixSummary(true);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (typeof text === 'string') {
        handleInputChange(text);
      } else {
        setOutputError('Failed to read file content.');
      }
    };
    reader.onerror = () => {
      setOutputError('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedExtensions = ['.json', '.txt'];
      
      const fileNameLower = file.name.toLowerCase();
      const lastDotIndex = fileNameLower.lastIndexOf('.');
      const fileExtension = lastDotIndex === -1 ? '' : fileNameLower.substring(lastDotIndex);

      if (!allowedExtensions.includes(fileExtension)) {
        setOutputError(`Invalid file type. Please upload a .json or .txt file.`);
        if (e.target) e.target.value = '';
        return;
      }
      processFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

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

  const handleAutoCorrect = async () => {
    if (!inputJson.trim()) return;
    
    setIsCorrecting(true);
    setIsLoading(true);  // Show loading message immediately
    setOutputError(null);
    setOutputJava('');  // Clear output to show loading
    
    try {
      console.log('Attempting AI-powered JSON syntax correction...');
      const correctedJson = await correctCodeSyntax(inputJson, 'JSON');
      setInputJson(correctedJson);
      setOutputError(null); // Clear error after successful correction
      console.log('AI successfully corrected the JSON syntax');
      
      // Automatically convert the corrected JSON to Java
      // Always use Fast mode for auto-conversion to avoid double AI timeout
      console.log('Auto-converting corrected JSON to Java using Fast mode...');
      
      try {
        const javaCode = convertJsonToJavaCode(correctedJson, 'RootObject');
        setOutputJava(javaCode);
        console.log('Auto-conversion successful');
        
        // Mark as converted since we successfully generated Java output
        console.log('🟡 Auto-correct: Setting hasConverted=true and inputChanged=false');
        setHasConverted(true);
        setInputChanged(false);
      } catch (convErr: any) {
        console.error('Auto-conversion error:', convErr);
        setOutputError(convErr.message || 'Failed to convert corrected JSON to Java');
        // Reset flags on error
        setHasConverted(false);
        setInputChanged(true);
      }
    } catch (err: any) {
      console.error('Auto-correction failed:', err);
      setOutputError(err.message || 'AI auto-correction failed. Please fix the JSON manually.');
      // Reset flags on error
      setHasConverted(false);
      setInputChanged(true);
    } finally {
      setIsLoading(false);
      setIsCorrecting(false);
    }
  };

  const handleConvert = async () => {
    const trimmedInput = inputJson.trim();
    if (!trimmedInput) {
      setOutputError("Input is empty. Please enter some JSON data.");
      return;
    }

    // Validate JSON syntax
    let jsonParseError: string | null = null;
    try {
      JSON.parse(trimmedInput);
      setErrorLines([]);
    } catch (e: any) {
      jsonParseError = e.message;
      
      // Validate and find all errors
      const allErrors = validateJsonSyntax(trimmedInput);
      setErrorLines(allErrors);
      
      // In Smart mode, offer AI-powered error correction
      if (conversionMode === 'smart') {
        let errorAnalysis = `### Invalid JSON Syntax

**Error Details:**
${e.message}`;

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
        
        setOutputError(errorAnalysis);
        return;
      } else {
        // Fast mode: show errors with line info
        let fastError = `Invalid JSON syntax: ${e.message}`;
        if (allErrors.length > 0) {
          fastError += `\n\n📍 Error Locations:\n`;
          allErrors.forEach(error => {
            fastError += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
          });
        }
        setOutputError(fastError);
        return;
      }
    }

    setIsLoading(true);
    setOutputError(null);
    setOutputJava(null);

    try {
      let javaCode: string;
      
      if (conversionMode === 'fast') {
        // Code-based conversion (instant, offline)
        console.log('Using Fast Mode (code-based conversion)');
        javaCode = convertJsonToJavaCode(trimmedInput, 'RootObject');
        console.log('Fast conversion successful');
      } else {
        // AI-based conversion (smart, requires internet)
        console.log('Using Smart Mode (AI-based conversion)');
        javaCode = await convertJsonToJava(trimmedInput);
        console.log('AI conversion successful');
      }
      
      setOutputJava(javaCode);
      
      // Mark as converted and reset input change flag
      console.log('Setting hasConverted=true and inputChanged=false');
      setHasConverted(true);
      setInputChanged(false);
    } catch (error: any) {
      console.error('Conversion error:', error);
      console.error('Mode was:', conversionMode);
      setOutputError(error.message || 'Conversion failed. Please try again.');
      // Reset flags on error
      setHasConverted(false);
      setInputChanged(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputJson('');
    setOutputJava(null);
    setOutputError(null);
    setHasConverted(false);
    setInputChanged(false);
    setSwitchedToSmartMode(false); // Clear flag when clearing input
  };

  return (
    <>
      <SEO
        title="JSON to Java Converter | AI JSON Tools"
        description="Convert JSON data to Java classes instantly using AI-powered conversion or fast code-based conversion. Generate POJOs with getters, setters, and proper annotations."
        keywords="JSON to Java, JSON converter, POJO generator, Java class generator, AI code converter"
        canonical="https://yourdomain.com/json-to-java-converter"
        ogImage="https://yourdomain.com/images/json-to-java.jpg"
        ogUrl="https://yourdomain.com/json-to-java-converter"
      />
      
      {/* Mode Info Banner */}
      <div className={`mb-4 p-4 border-2 rounded-lg ${
        conversionMode === 'fast' 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600' 
          : 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600'
      }`}>
        <div className="flex items-start gap-3">
          {conversionMode === 'fast' ? (
            <LightningIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          ) : (
            <SpinnerIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-grow">
            <h3 className={`font-bold mb-1 text-lg ${
              conversionMode === 'fast' 
                ? 'text-blue-900 dark:text-blue-100' 
                : 'text-purple-900 dark:text-purple-100'
            }`}>
              {conversionMode === 'fast' ? '⚡ FAST MODE ACTIVE (Code-Based)' : '🤖 SMART MODE ACTIVE (AI-Powered)'}
            </h3>
            <p className={`text-sm ${
              conversionMode === 'fast' 
                ? 'text-blue-800 dark:text-blue-200' 
                : 'text-purple-800 dark:text-purple-200'
            }`}>
              {conversionMode === 'fast' 
                ? '✓ Instant conversion • No internet required • Free • Perfect for simple JSON'
                : '✓ AI-powered • Intelligent naming • Better quality • Requires internet connection'
              }
            </p>
            <p className="text-xs font-semibold mt-2 text-slate-600 dark:text-slate-400">
              💡 Click the big "Convert to Java {conversionMode === 'fast' ? '⚡' : '🤖'}" button below to start conversion
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="mb-6 bg-light-card dark:bg-dark-card rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Convert Button - Large and Prominent */}
          <button
            onClick={handleConvert}
            disabled={
              isLoading || 
              !inputJson.trim() || 
              (hasConverted && !inputChanged) || 
              (errorLines.length > 0 && errorLines.some(isComplexError) && conversionMode === 'fast') // Disable in Fast mode when complex errors exist
            }
            className="px-6 py-3 text-lg bg-brand-primary hover:bg-teal-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md font-semibold flex items-center gap-2"
            title={
              errorLines.length > 0 && errorLines.some(isComplexError) && conversionMode === 'fast'
                ? 'Complex errors detected. Please use Smart AI Mode or manually fix the errors to enable conversion.'
                : hasConverted && !inputChanged
                ? 'Already converted. Modify the input or click Clear to convert again.'
                : ''
            }
            onMouseEnter={() => {
              console.log('Button state:', { 
                isLoading, 
                conversionMode, 
                hasConverted, 
                inputChanged,
                errorLinesCount: errorLines.length,
                hasComplexErrors: errorLines.some(isComplexError)
              });
              console.log('Button should be disabled:', isLoading || !inputJson.trim() || (hasConverted && !inputChanged) || (errorLines.length > 0 && errorLines.some(isComplexError) && conversionMode === 'fast'));
            }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                Converting...
              </>
            ) : (
              <>
                Convert to Java {conversionMode === 'fast' ? '⚡' : '🤖'}
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
                  console.log('Switching to Fast mode');
                  setConversionMode('fast');
                  setOutputError(null);
                  setOutputJava(null);
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
                  console.log('Switching to Smart mode');
                  setConversionMode('smart');
                  setOutputError(null);
                  setOutputJava(null);
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
      
      <div className="w-full flex flex-col lg:flex-row gap-6">
        {/* Input Panel */}
        <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CodeBracketIcon className="h-6 w-6" />
              Input JSON
            </h2>
            <Tooltip content="Upload a JSON file">
              <button 
                onClick={handleUploadClick} 
                className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              >
                <UploadIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>

          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".json,.txt" 
            className="hidden" 
            onChange={handleFileChange} 
          />

          {/* Textarea with Line Numbers */}
          <div className="relative flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Line Numbers with Error Icons */}
            <div 
              ref={lineNumbersRef}
              className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 py-4 px-2 select-none overflow-hidden" 
              style={{ maxHeight: '384px' }}
            >
              {inputJson.split('\n').map((_, index) => {
                const lineNumber = index + 1;
                const errorForLine = errorLines.find(e => e.line === lineNumber);
                const isErrorLine = !!errorForLine;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-1 font-mono text-xs leading-6 ${
                      isErrorLine 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-slate-500 dark:text-slate-400'
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
              value={inputJson}
              onChange={(e) => {
                handleInputChange(e.target.value);
                setErrorLines([]);
              }}
              onScroll={handleTextareaScroll}
              placeholder='Enter your JSON here, e.g., {"name": "John", "age": 30}'
              className={`flex-1 h-96 p-4 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-sm resize-none focus:outline-none leading-6 ${
                errorLines.length > 0 ? 'bg-red-50/30 dark:bg-red-900/10' : ''
              }`}
              style={{ lineHeight: '1.5rem' }}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <JavaIcon className="h-6 w-6" />
            Java Code
          </h2>

          <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0">
            <div className="flex-grow relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 z-10 p-6">
                  <div className="animate-spin h-16 w-16 border-4 border-purple-200 border-t-purple-600 dark:border-purple-800 dark:border-t-purple-400 rounded-full mb-6"></div>
                  <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-3">
                    {isCorrecting 
                      ? '🔧 AI is auto-correcting and converting...' 
                      : conversionMode === 'smart' 
                        ? '🤖 AI is crafting your Java classes...' 
                        : '⚡ Converting...'
                    }
                  </h3>
                  <p className="text-lg text-purple-700 dark:text-purple-200 mb-2 text-center max-w-md">
                    {isCorrecting
                      ? 'Step 1: Fixing JSON syntax errors with AI, then converting to Java'
                      : conversionMode === 'smart' 
                        ? 'Our AI is analyzing your JSON and generating professional Java POJOs with proper structure'
                        : 'Converting your JSON to Java classes'
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
                        <span>Auto-converting to Java...</span>
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
                        <span>Generating getters, setters, and methods...</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="animate-pulse">📝</span>
                        <span>Creating proper class hierarchy...</span>
                      </p>
                    </div>
                  )}
                  {conversionMode === 'fast' && !isCorrecting && (
                    <p className="mt-4 text-sm text-blue-600 dark:text-blue-300">
                      ⚡ Lightning-fast code-based conversion in progress...
                    </p>
                  )}
                </div>
              ) : outputError && conversionMode === 'smart' && outputError.includes('###') ? (
                <ErrorAnalysisDisplay
                  title="JSON Syntax Error"
                  analysisText={outputError}
                  showAutoCorrectButton={true}
                  onAutoCorrect={handleAutoCorrect}
                  isCorrecting={isCorrecting}
                />
              ) : outputError === 'SUCCESS_ALL_FIXED' ? (
                <div className="p-6 h-full overflow-auto bg-green-50 dark:bg-green-900/30">
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
                      <div className="w-full max-w-2xl mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-green-300 dark:border-green-700">
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
                        setOutputError(null);
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
              ) : outputError ? (
                <div className="p-6 h-full overflow-auto bg-red-50 dark:bg-red-900/30">
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
                  
                  {/* Display errors line by line */}
                  {errorLines.length > 0 ? (
                    <>
                      <div className="space-y-2 mb-4">
                        {errorLines.map((error, idx) => (
                          <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded border-l-4 border-red-500">
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                  Line {error.line}, Column {error.column}
                                </p>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">
                                  {error.message || 'Syntax error detected'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Fix Simple Errors Button (Fast Mode Only) */}
                      {conversionMode === 'fast' && !showFixSummary && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                                Try Quick Fix
                              </h4>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                                Automatically fix common errors like missing commas, trailing commas, unquoted keys, and single quotes (95%+ success rate).
                              </p>
                              <button
                                onClick={handleFixSimpleErrors}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Fix Simple Errors
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Suggestion for Smart Mode (only if complex errors remain after auto-fix) */}
                      {showFixSummary && errorLines.length > 0 && errorLines.some(isComplexError) && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded-lg">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
                                Complex Errors Detected
                              </h4>
                              <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                                The remaining {errorLines.length} error{errorLines.length > 1 ? 's require' : ' requires'} advanced fixing. Switch to <strong>Smart AI Mode</strong> for intelligent error correction with bracket matching, structural fixes, and context-aware repairs.
                              </p>
                              <button
                                onClick={() => {
                                  setConversionMode('smart');
                                  setSwitchedToSmartMode(true); // Mark that user switched via this button
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                                </svg>
                                Switch to Smart AI Mode
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-red-700 dark:text-red-300 whitespace-pre-wrap">{outputError}</p>
                  )}
                </div>
              ) : outputJava ? (
                <div className="h-full overflow-auto">
                  <CodeViewer code={outputJava} language="java" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <JavaIcon className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">
                    No Java code yet
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">
                    Enter JSON data and click "Convert to Java" to generate Java classes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

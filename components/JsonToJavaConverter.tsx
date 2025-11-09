import React, { useState, useRef, useEffect } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeViewer } from './CodeViewer';
import { SpinnerIcon, JavaIcon, CodeBracketIcon, UploadIcon, LightningIcon } from './icons';
import { convertJsonToJava, correctCodeSyntax } from '../services/geminiService';
import { convertJsonToJavaCode } from '../utils/jsonToJavaConverter';
import { Tooltip } from './Tooltip';
import { ErrorAnalysisDisplay } from './ErrorAnalysisDisplay';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log mode changes
  useEffect(() => {
    console.log('Conversion mode changed to:', conversionMode);
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
        
        // Don't set hasConverted flag since we used Fast mode for auto-conversion
        // User can still click Convert to use Smart mode if desired
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
    } catch (e: any) {
      jsonParseError = e.message;
      
      // In Smart mode, offer AI-powered error correction
      if (conversionMode === 'smart') {
        const errorAnalysis = `### Invalid JSON Syntax

**Error Details:**
${e.message}

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
        // Fast mode: just show the error
        setOutputError(`Invalid JSON syntax: ${e.message}`);
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
      
      // Mark as converted and reset input change flag (only for Smart mode)
      if (conversionMode === 'smart') {
        console.log('Setting hasConverted=true and inputChanged=false');
        setHasConverted(true);
        setInputChanged(false);
      }
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
            disabled={isLoading || !inputJson.trim() || (conversionMode === 'smart' && hasConverted && !inputChanged)}
            className="px-6 py-3 text-lg bg-brand-primary hover:bg-teal-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md font-semibold flex items-center gap-2"
            title={
              conversionMode === 'smart' && hasConverted && !inputChanged
                ? 'Already converted. Modify the input or click Clear to convert again.'
                : ''
            }
            onMouseEnter={() => {
              console.log('Button state:', { isLoading, conversionMode, hasConverted, inputChanged });
              console.log('Button should be disabled:', isLoading || !inputJson.trim() || (conversionMode === 'smart' && hasConverted && !inputChanged));
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

          <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0">
            <textarea
              value={inputJson}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder='Enter your JSON here, e.g., {"name": "John", "age": 30}'
              className="w-full h-96 bg-transparent resize-none p-4 focus:outline-none font-mono text-sm"
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
              ) : outputError ? (
                <div className="p-6 h-full overflow-auto">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">Error</h3>
                    <p className="text-red-700 dark:text-red-400 whitespace-pre-wrap">{outputError}</p>
                  </div>
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

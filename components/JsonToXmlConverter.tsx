import React, { useState, useRef, useEffect } from 'react';
import { Tooltip } from './Tooltip';
import { UploadIcon, LightningIcon } from './icons';
import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToXmlConverter: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON to XML Converter",
    description: "Convert JSON to XML online. Paste JSON on the left and generate XML output with one click.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "JSON to XML conversion",
      "Pretty-printed XML output",
      "Copy, download, and save XML",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON to XML Converter – Convert JSON to XML Online"
        description="Convert JSON to XML instantly. Paste JSON and click To XML to generate well-formatted XML output. Free, fast, and no sign-up."
        keywords="json to xml, convert json to xml, json xml converter, online json to xml"
        canonical="https://yoursite.com/json-to-xml"
        ogUrl="https://yoursite.com/json-to-xml"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left, then click To XML to generate XML on the right.
      </div>
      {/* Mirror the TOON page look & feel with unified toolbar */}
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={true}
        colorTheme="purple"
        hideFormatButtons={true}
        hideStructureAnalysisAndTransform={true}
      />
    </>
  );
        if (allErrors.length > 0) {
export default JsonToXmlConverter;
                    // Try to parse JSON for real-time error detection
                    try {
                      JSON.parse(newValue);
                      // Valid JSON - clear errors
                      setError('');
                      setErrorLines([]);
                    } catch (err: any) {
                      // Invalid JSON but it's JSON-like structure - clear error, will validate on convert
                      setError('');
                      setErrorLines([]);
                    }
                  } else {
                    // Empty input - clear everything
                    setError('');
                    setErrorLines([]);
                  }
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
                
                {/* Display errors in single column */}
                {errorLines.length > 0 ? (
                  <>
                    {/* Single-Column Error Display - showing ALL errors line by line */}
                    <div className="border-2 border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10 mb-4">
                      <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {errorLines.length} Syntax Error{errorLines.length > 1 ? 's' : ''} Found
                      </h4>
                      
                      {/* Display ALL errors line by line */}
                      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                        {errorLines.map((error, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2 bg-white dark:bg-gray-800 rounded border-l-4 ${
                              isComplexError(error) 
                                ? 'border-purple-500' 
                                : 'border-blue-500'
                            } text-xs`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-semibold ${
                                isComplexError(error)
                                  ? 'text-purple-700 dark:text-purple-300'
                                  : 'text-blue-700 dark:text-blue-300'
                              }`}>
                                Line {error.line}, Column {error.column}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                isComplexError(error)
                                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                                  : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              }`}>
                                {isComplexError(error) ? 'Complex' : 'Simple'}
                              </span>
                            </div>
                            <p className={`${
                              isComplexError(error)
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-blue-600 dark:text-blue-400'
                            } font-mono`}>
                              {error.message || 'Syntax error detected'}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons based on Mode and Error Type */}
                      {conversionMode === 'fast' ? (
                        /* FAST MODE */
                        <>
                          {/* Case 1: Only Simple Errors - Enable "Fix Simple Errors" */}
                          {errorLines.every(e => !isComplexError(e)) ? (
                            <div className="mt-3">
                              <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                ✓ All errors can be automatically fixed! Click below to fix common errors like missing commas, trailing commas, unquoted keys, and single quotes (95%+ success rate).
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
                          ) : (
                            /* Case 2 & 3: Has Complex Errors - Disabled "Fix Simple Errors" with advice */
                            <div className="mt-3">
                              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded-lg mb-3">
                                <p className="text-sm text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-medium">Complex Errors Detected</span>
                                </p>
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                  Your JSON contains complex errors (like bracket mismatches or structural issues) that require AI-powered fixing. Please switch to <span className="font-semibold">Smart (AI)</span> mode for advanced error correction with bracket matching and context-aware repairs.
                                </p>
                              </div>
                              <button
                                disabled
                                className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Fix Simple Errors (Unavailable)
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        /* SMART (AI) MODE */
                        <div className="mt-3">
                          <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                            AI-powered error correction can handle all types of errors including bracket mismatches, structural issues, and complex syntax problems.
                          </p>
                          <button
                            onClick={handleAutoCorrect}
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                            </svg>
                            Fix Complex Errors with AI
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Fix Summary - shown after auto-fix is applied */}
                    {showFixSummary && appliedFixes.length > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg mb-4">
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
                ) : error ? (
                  /* Show error message (for non-JSON content or other errors) */
                  <div className="border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4 bg-orange-50/50 dark:bg-orange-900/10">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-2">
                          Invalid Input
                        </h4>
                        <p className="text-sm text-orange-700 dark:text-orange-200">
                          {error}
                        </p>
                        <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-orange-200 dark:border-orange-800">
                          <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 font-medium">
                            Expected JSON format example:
                          </p>
                          <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono">
{`{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
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
      </div>
    </div>
  );
};

export default JsonToXmlConverter;

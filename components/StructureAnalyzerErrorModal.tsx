import React, { useState, useEffect } from 'react';
import { parseJsonSafe, type ParseResultErr } from '../utils/parseJsonSafe';
import { fixSimpleJsonErrors } from '../utils/simpleJsonFixer';
import type { ErrorPosition } from '../utils/errorHighlighter';
import type { FixChange } from '../utils/simpleJsonFixer';

interface StructureAnalyzerErrorModalProps {
  open: boolean;
  jsonInput: string;
  onClose: () => void;
  onFixApplied: (fixedJson: string, changes: FixChange[]) => void;
}

/**
 * Custom error modal for JSON Structure Analyzer page
 * Shows validation errors with Auto Fix and Return functionality
 * Similar to main formatter error display but in modal format
 */
export const StructureAnalyzerErrorModal: React.FC<StructureAnalyzerErrorModalProps> = ({
  open,
  jsonInput,
  onClose,
  onFixApplied
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<{ changes: FixChange[]; success: boolean } | null>(null);

  // Reset fixResult when modal opens or jsonInput changes
  useEffect(() => {
    if (open) {
      setFixResult(null);
      setIsFixing(false);
    }
  }, [open, jsonInput]);

  if (!open) return null;

  // Parse and classify errors
  const parseResult = parseJsonSafe(jsonInput);
  const hasComments = parseResult.hasComments;
  
  // Type-safe error extraction
  let errorLines: ErrorPosition[] = [];
  if (!parseResult.ok) {
    errorLines = (parseResult as ParseResultErr).errors;
  }
  
  const commentLines: number[] = hasComments ? parseResult.comments.map(c => c.line) : [];

  // Classify errors as simple or complex
  const simpleErrors: ErrorPosition[] = [];
  const complexErrors: ErrorPosition[] = [];

  errorLines.forEach(err => {
    if (isComplexError(err)) {
      complexErrors.push(err);
    } else {
      simpleErrors.push(err);
    }
  });

  // Check if error is complex (not fixable by simple auto-fix)
  function isComplexError(error: ErrorPosition): boolean {
    const msg = error.message?.toLowerCase() || '';
    
    // Complex structural issues that can't be auto-fixed
    const complexPatterns = [
      'unexpected token',
      'unexpected end',
      'unexpected string',
      'unexpected number',
      'expected property name',
      'expected comma',
      'invalid character',
      'unexpected identifier',
      'bad control character',
      'unterminated string',
      'invalid escape',
      'duplicate',
      'extraneous',
      'malformed',
      'unrecognized token'
    ];

    // If message matches complex patterns, it's complex
    if (complexPatterns.some(pattern => msg.includes(pattern))) {
      return true;
    }

    // Simple fixable patterns
    const simplePatterns = [
      'trailing comma',
      'single quote',
      'unquoted',
      'comment',
      'missing comma'
    ];

    if (simplePatterns.some(pattern => msg.includes(pattern))) {
      return false;
    }

    // Default to complex for unknown errors
    return true;
  }

  const totalErrors = errorLines.length + commentLines.length;
  const simpleCount = simpleErrors.length + commentLines.length;
  const complexCount = complexErrors.length;

  // Handle Auto Fix
  const handleAutoFix = async () => {
    setIsFixing(true);
    setFixResult(null);

    try {
      // Attempt to fix simple errors
      const fixRes = fixSimpleJsonErrors(jsonInput);
      
      if (fixRes.wasFixed && fixRes.changes.length > 0) {
        // Verify the fix worked
        try {
          JSON.parse(fixRes.fixed);
          // Success! Apply the fix
          onFixApplied(fixRes.fixed, fixRes.changes);
          setFixResult({ changes: fixRes.changes, success: true });
          
          // Close modal after short delay to show success
          setTimeout(() => {
            onClose();
          }, 1500);
        } catch {
          // Fix didn't resolve all errors
          setFixResult({ changes: fixRes.changes, success: false });
        }
      } else {
        // No fixes could be applied
        setFixResult({ changes: [], success: false });
      }
    } catch (error) {
      console.error('Auto-fix error:', error);
      setFixResult({ changes: [], success: false });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border border-red-300 dark:border-red-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 bg-red-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <h3 className="text-lg font-semibold">
              {totalErrors} Syntax {totalErrors === 1 ? 'Issue' : 'Issues'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Error Classification Badge */}
        <div className="px-5 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex gap-3">
          {simpleCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
              <span className="text-xs">✓</span>
              <span>Simple: {simpleCount}</span>
            </div>
          )}
          {complexCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
              <span className="text-xs">⚠</span>
              <span>Complex: {complexCount}</span>
            </div>
          )}
        </div>

        {/* Scrollable Error Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Fix Result Message */}
          {fixResult && (
            <div className={`p-4 rounded-lg border ${fixResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'}`}>
              {fixResult.success ? (
                <>
                  <p className="text-green-700 dark:text-green-400 font-semibold mb-2">✅ Auto Fix Successful!</p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Applied {fixResult.changes.length} {fixResult.changes.length === 1 ? 'fix' : 'fixes'}. 
                    Your JSON is now valid and has been updated.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-orange-700 dark:text-orange-400 font-semibold mb-2">⚠️ Partial Fix Applied</p>
                  <p className="text-sm text-orange-600 dark:text-orange-500">
                    {fixResult.changes.length > 0 
                      ? `Applied ${fixResult.changes.length} simple ${fixResult.changes.length === 1 ? 'fix' : 'fixes'}, but complex errors remain. Please review the errors below.`
                      : 'Unable to auto-fix these errors. Manual correction required.'}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Invalid JSON Message */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">
              Invalid JSON syntax: Expected double-quoted property name in JSON at position {errorLines[0]?.position || 'unknown'}
            </p>
            {errorLines[0]?.line && (
              <p className="text-xs text-red-600 dark:text-red-500">
                (line {errorLines[0].line} column {errorLines[0].column})
              </p>
            )}
          </div>

          {/* Simple Errors Section */}
          {simpleCount > 0 && (
            <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
              <div 
                className="px-4 py-2.5 bg-green-100 dark:bg-green-900/30 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-green-700 dark:text-green-400">▼</span>
                  <span className="font-semibold text-green-700 dark:text-green-400 text-sm">
                    Simple Errors ({simpleCount})
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 space-y-2">
                {/* Comment Lines */}
                {commentLines.map((line, idx) => (
                  <div key={`comment-${idx}`} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="flex-shrink-0 w-24 text-xs font-mono text-blue-600 dark:text-blue-400">
                      Line {line}, Column 1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Simple</p>
                      <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                        JSON comment detected (will be removed by Auto Fix)
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Simple Syntax Errors */}
                {simpleErrors.map((err, idx) => (
                  <div key={`simple-${idx}`} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <div className="flex-shrink-0 w-24 text-xs font-mono text-green-600 dark:text-green-400">
                      Line {err.line}, Column {err.column}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-700 dark:text-green-400 font-medium">Simple</p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        {err.message || 'Trailing comma before closing bracket'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complex Errors Section */}
          {complexCount > 0 && (
            <div className="border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden">
              <div 
                className="px-4 py-2.5 bg-orange-100 dark:bg-orange-900/30 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-orange-700 dark:text-orange-400">▼</span>
                  <span className="font-semibold text-orange-700 dark:text-orange-400 text-sm">
                    Complex Errors ({complexCount})
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 space-y-2">
                {complexErrors.map((err, idx) => (
                  <div key={`complex-${idx}`} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                    <div className="flex-shrink-0 w-24 text-xs font-mono text-orange-600 dark:text-orange-400">
                      Line {err.line}, Column {err.column}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">Complex</p>
                      <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                        {err.message || `Expected double-quoted property name in JSON at position ${err.position}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Message */}
          {complexCount > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                <strong>Complex issues detected.</strong> Auto Fix will remove comments and simple issues; 
                for remaining structural problems, switch to Smart (AI) mode for advanced correction.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            Return
          </button>
          
          {simpleCount > 0 && !fixResult?.success && (
            <button
              onClick={handleAutoFix}
              disabled={isFixing}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isFixing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fixing...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wrench"></i>
                  Auto Fix
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StructureAnalyzerErrorModal;

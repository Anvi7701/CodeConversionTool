import React from 'react';
import { LightBulbIcon, TerminalIcon, DocumentTextIcon, SpinnerIcon } from './icons';

interface Analysis {
  executionOutput?: string;
  explanation: string;
  suggestions: string[];
}

interface AnalysisViewerProps {
  analysis: Analysis | null;
}

export const AnalysisViewer: React.FC<AnalysisViewerProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="absolute inset-0 h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
        <SpinnerIcon className="h-10 w-10 mb-4 animate-spin text-slate-300 dark:text-slate-600" />
        <p>Analyzing generated code...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 p-6 overflow-auto text-sm">
      <div className="space-y-6">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-light-text dark:text-slate-200 mb-2">
            <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
            Code Explanation
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{analysis.explanation}</p>
        </div>
        
        {analysis.executionOutput && (
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-light-text dark:text-slate-200 mb-2">
                <TerminalIcon className="h-5 w-5 text-slate-500" />
                Predicted Execution Output
              </h3>
              <pre className="p-3 font-mono text-xs bg-slate-100 dark:bg-slate-900 rounded-md overflow-x-auto text-slate-700 dark:text-slate-200">
                <code>{analysis.executionOutput || '(No direct output)'}</code>
              </pre>
            </div>
        )}
        
        {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-light-text dark:text-slate-200 mb-2">
                <LightBulbIcon className="h-5 w-5 text-amber-500" />
                AI Suggestions
              </h3>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
        )}
      </div>
    </div>
  );
};

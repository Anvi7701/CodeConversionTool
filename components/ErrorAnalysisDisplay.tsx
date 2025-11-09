import React from 'react';
import { ErrorIcon, WandIcon, SpinnerIcon } from './icons';
import { Tooltip } from './Tooltip';

interface ErrorAnalysisDisplayProps {
  analysisText: string;
  title?: string;
  showAutoCorrectButton?: boolean;
  onAutoCorrect?: () => void;
  isCorrecting?: boolean;
}

export const ErrorAnalysisDisplay: React.FC<ErrorAnalysisDisplayProps> = ({
  analysisText,
  title = "Conversion Failed",
  showAutoCorrectButton = false,
  onAutoCorrect,
  isCorrecting = false,
}) => {
  // A simple markdown-to-html converter for the specific format we expect
  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-red-800 dark:text-red-300">{line.substring(4)}</h3>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="mb-2">{line}</p>;
      })
  };

  return (
    <div className="absolute inset-0 p-6 overflow-auto bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <ErrorIcon className="h-8 w-8 text-red-500" />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        {showAutoCorrectButton && onAutoCorrect && (
          <Tooltip content="Use AI to automatically fix this syntax error.">
            <button
              onClick={onAutoCorrect}
              disabled={isCorrecting}
              className="flex items-center flex-shrink-0 gap-1.5 px-3 py-1 text-sm font-medium rounded-md transition-colors text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isCorrecting ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <WandIcon className="h-4 w-4" />}
              <span>{isCorrecting ? 'Correcting...' : 'Auto-Correct with AI'}</span>
            </button>
          </Tooltip>
        )}
      </div>
      <div>
        {renderMarkdown(analysisText)}
      </div>
    </div>
  );
};

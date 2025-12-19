import React from 'react';
// removed unused icons

export const AutoCorrectionLoading: React.FC = () => {
  return (
    <div className="absolute inset-0 h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6">
      <div className="animate-spin h-16 w-16 border-4 border-purple-200 border-t-purple-600 dark:border-purple-800 dark:border-t-purple-400 rounded-full mb-6"></div>
      
      <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-3">
        🔧 AI is auto-correcting and formatting...
      </h3>
      
      <p className="text-lg text-purple-700 dark:text-purple-200 mb-2 text-center max-w-md">
        Step 1: Fixing JSON syntax errors with AI, then formatting
      </p>
      
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
          <span>Auto-formatting JSON...</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="animate-pulse">⏱️</span>
          <span>Estimated time: 10-20 seconds</span>
        </p>
      </div>
    </div>
  );
};

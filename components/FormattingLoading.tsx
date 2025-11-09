import React from 'react';
import { SpinnerIcon, FormatIcon } from './icons';

export const FormattingLoading: React.FC = () => {
  return (
    <div className="absolute inset-0 h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center bg-slate-50 dark:bg-slate-900/50">
      <div className="flex items-center gap-3">
        <SpinnerIcon className="h-8 w-8 animate-spin text-brand-primary" />
        <FormatIcon className="h-8 w-8 text-brand-primary" />
      </div>
      <p className="mt-4 text-lg font-semibold text-light-text dark:text-dark-text">Formatting in progress...</p>
      <p className="mt-1 text-sm">Please wait while the code is being beautified.</p>
    </div>
  );
};

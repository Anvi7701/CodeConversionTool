import React from 'react';
import { SpinnerIcon, CheckIcon } from './icons';

export const ValidationLoading: React.FC = () => {
  return (
    <div className="absolute inset-0 h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center bg-slate-50 dark:bg-slate-900/50">
      <div className="flex items-center gap-3">
        <SpinnerIcon className="h-8 w-8 animate-spin text-sky-500" />
        <CheckIcon className="h-8 w-8 text-sky-500" />
      </div>
      <p className="mt-4 text-lg font-semibold text-light-text dark:text-dark-text">Validation in progress...</p>
      <p className="mt-1 text-sm">Please wait while your code is being analyzed.</p>
    </div>
  );
};

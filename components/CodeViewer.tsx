import React from 'react';

interface CodeViewerProps {
  code: string;
  language: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language }) => {
  return (
    <div className="absolute inset-0 flex flex-col">
      <pre className="p-4 font-mono text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/50 rounded-md overflow-auto h-full w-full whitespace-pre-wrap break-words">
        <code>{code}</code>
      </pre>
    </div>
  );
};

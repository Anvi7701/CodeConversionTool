import React, { useState } from 'react';
import { Tooltip } from './Tooltip';

interface CodeViewerProps {
  code: string;
  language: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const fileDetails: { [key: string]: { ext: string; mime: string; name: string } } = {
      javascript: { ext: 'js', mime: 'text/javascript', name: 'formatted' },
      typescript: { ext: 'ts', mime: 'text/typescript', name: 'data' },
      python: { ext: 'py', mime: 'text/x-python', name: 'data' },
      java: { ext: 'java', mime: 'text/x-java-source', name: 'JsonData' },
      csharp: { ext: 'cs', mime: 'text/plain', name: 'JsonParser' },
      go: { ext: 'go', mime: 'text/x-go', name: 'main' },
      swift: { ext: 'swift', mime: 'text/plain', name: 'DataModel' },
      ruby: { ext: 'rb', mime: 'text/x-ruby', name: 'data_model' },
      dart: { ext: 'dart', mime: 'text/plain', name: 'data_model' },
      xml: { ext: 'xml', mime: 'application/xml', name: 'data' },
      wsdl: { ext: 'wsdl', mime: 'application/xml', name: 'definitions' },
      soap: { ext: 'xml', mime: 'application/soap+xml', name: 'envelope' },
      json: { ext: 'json', mime: 'application/json', name: 'schema' },
      csv: { ext: 'csv', mime: 'text/csv', name: 'data' },
      html: { ext: 'html', mime: 'text/html', name: 'document' },
      angular: { ext: 'html', mime: 'text/html', name: 'template' },
      css: { ext: 'css', mime: 'text/css', name: 'styles' },
      yaml: { ext: 'yaml', mime: 'text/yaml', name: 'data' },
      graphql: { ext: 'graphql', mime: 'application/graphql', name: 'schema' },
    };

    const details = fileDetails[language] || { ext: 'txt', mime: 'text/plain', name: 'code' };
    const filename = `${details.name}.${details.ext}`;

    const blob = new Blob([code], { type: `${details.mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="absolute top-2 right-6 z-10 flex items-center gap-1.5">
        <Tooltip content={`Download ${language} file`}>
            <button
                onClick={handleDownload}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all text-xl cursor-pointer"
                aria-label="Download"
                title={`Download ${language} file`}
            >
                💾
            </button>
        </Tooltip>
        <Tooltip content={isCopied ? "Copied!" : "Copy to clipboard"}>
            <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all text-xl cursor-pointer"
                aria-label="Copy"
                title="Copy to clipboard"
            >
                {isCopied ? '✓' : '📋'}
            </button>
        </Tooltip>
      </div>
      <pre className="p-4 font-mono text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/50 rounded-md overflow-auto h-full w-full whitespace-pre-wrap break-words">
        <code>{code}</code>
      </pre>
    </div>
  );
};

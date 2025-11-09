

import React, { useState } from 'react';
import { CopyIcon, CheckIcon, DownloadIcon } from './icons';
import { Tooltip } from './Tooltip';

interface JsonSyntaxHighlighterProps {
  jsonString: string;
}

export const JsonSyntaxHighlighter: React.FC<JsonSyntaxHighlighterProps> = ({ jsonString }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const highlight = (json: string) => {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-blue-700 dark:text-blue-400'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-purple-800 dark:text-purple-300 font-semibold'; // key
          } else {
            cls = 'text-green-700 dark:text-green-400'; // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-indigo-700 dark:text-indigo-400 font-semibold'; // boolean
        } else if (/null/.test(match)) {
          cls = 'text-slate-500 font-semibold'; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const highlightedHtml = highlight(jsonString);

  return (
    <div className="absolute inset-0 flex flex-col">
       <div className="absolute top-2 right-6 z-10 flex items-center gap-2">
          <Tooltip content="Download formatted JSON">
            <button
              onClick={handleDownload}
              className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-sky-100/70 dark:bg-sky-900/30 hover:bg-sky-200/70 dark:hover:bg-sky-800/40"
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip content={isCopied ? "Copied!" : "Copy formatted JSON"}>
              <button
                onClick={handleCopy}
                className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-sky-100/70 dark:bg-sky-900/30 hover:bg-sky-200/70 dark:hover:bg-sky-800/40"
              >
                {isCopied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
            </button>
          </Tooltip>
        </div>
      <pre className="p-4 font-mono text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/50 rounded-md overflow-auto h-full w-full">
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </div>
  );
};

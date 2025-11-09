

import React, { useState } from 'react';
import { CodeViewer } from './CodeViewer';
import { Tooltip } from './Tooltip';
import { AnalysisViewer } from './AnalysisViewer';

export interface Analysis {
  executionOutput?: string;
  explanation: string;
  suggestions: string[];
}

interface HtmlRendererProps {
  htmlString: string;
  analysis: Analysis | null;
}

type HtmlView = 'preview' | 'source' | 'analysis';

export const HtmlRenderer: React.FC<HtmlRendererProps> = ({ htmlString, analysis }) => {
  const [activeView, setActiveView] = useState<HtmlView>('preview');

  const getButtonClass = (view: HtmlView) => 
    `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
      activeView === view
        ? 'bg-brand-primary text-white'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <span className="text-sm font-semibold">HTML Output</span>
        <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-900 rounded-lg">
          <Tooltip content="View the rendered HTML">
            <button onClick={() => setActiveView('preview')} className={getButtonClass('preview')}>Preview</button>
          </Tooltip>
          <Tooltip content="View the HTML source code">
            <button onClick={() => setActiveView('source')} className={getButtonClass('source')}>Source</button>
          </Tooltip>
           <Tooltip content="View AI analysis and suggestions">
            <button onClick={() => setActiveView('analysis')} disabled={!analysis} className={`${getButtonClass('analysis')} disabled:opacity-50 disabled:cursor-not-allowed`}>
              Analysis
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex-grow relative">
        {activeView === 'preview' ? (
          <iframe
            srcDoc={htmlString}
            title="HTML Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts"
          />
        ) : activeView === 'source' ? (
          <CodeViewer code={htmlString} language="html" />
        ) : (
           <AnalysisViewer analysis={analysis} />
        )}
      </div>
    </div>
  );
};

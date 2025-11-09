

import React from 'react';
import { Explanation, Selection } from '../types';
import { InfoIcon, DownloadIcon, SummaryIcon, SpinnerIcon } from './icons';
import { Tooltip } from './Tooltip';

type Tab = 'details' | 'summary';

interface ExplanationPanelProps {
  selectedNode: Selection | null;
  explanations: Map<string, Explanation>;
  isLoading: boolean;
  summary: string | null;
  isSummaryLoading: boolean;
  fileName?: string;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onGenerateSummary: () => Promise<void>;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
  </div>
);


export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ 
    selectedNode, 
    explanations, 
    isLoading, 
    summary, 
    isSummaryLoading,
    fileName,
    activeTab, 
    onTabChange,
    onGenerateSummary
}) => {
  const currentExplanation = selectedNode ? explanations.get(selectedNode.path) : null;

  const handleDownloadSummary = () => {
    if (!summary) return;

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const downloadFileName = fileName ? `${fileName.replace(/\.json$/, '')}_summary.txt` : 'summary.txt';
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderDetailsTab = () => {
    if (!selectedNode) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <InfoIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">Select a node</h3>
          <p className="text-slate-500 dark:text-slate-400">Click a key in the JSON tree for an instant explanation, or use the "Generate Summary" button for a high-level overview of the file.</p>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Selected Key</h3>
          <p className="text-lg font-mono bg-slate-100 dark:bg-slate-800/50 rounded p-2 break-all">
            {selectedNode.path}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Value</h3>
          <div className="text-lg font-mono bg-slate-100 dark:bg-slate-800/50 rounded p-2 max-h-40 overflow-auto">
            <pre><code>{JSON.stringify(selectedNode.value, null, 2)}</code></pre>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Node Explanation</h3>
          <div className="text-base leading-relaxed bg-teal-50 dark:bg-teal-900/30 p-4 rounded-md border border-teal-200 dark:border-teal-800 min-h-[6rem]">
            {isLoading ? (
              <LoadingSkeleton />
            ) : currentExplanation ? (
              <p>
                {currentExplanation.explanation}
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic">
                An explanation will be generated for this node.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderSummaryTab = () => {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">JSON Summary</h3>
            {summary && !isSummaryLoading && (
                <Tooltip content="Download Summary">
                    <button 
                        onClick={handleDownloadSummary} 
                        className="p-2 rounded-md transition-colors text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white"
                    >
                        <DownloadIcon className="h-4 w-4" />
                    </button>
                </Tooltip>
            )}
        </div>
        <div className="text-base leading-relaxed bg-sky-50 dark:bg-sky-900/30 p-4 rounded-md border border-sky-200 dark:border-sky-800 min-h-[6rem]">
          {isSummaryLoading ? (
            <LoadingSkeleton />
          ) : summary ? (
            <p>{summary}</p>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <InfoIcon className="h-10 w-10 text-slate-400 dark:text-slate-500 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Get a high-level overview of this JSON file's purpose.
              </p>
              <Tooltip content="Generate a high-level summary of the entire file.">
                 <button
                      onClick={onGenerateSummary}
                      disabled={isSummaryLoading}
                      className="flex items-center justify-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md shadow-sm transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                      <SummaryIcon className="-ml-1 mr-2 h-5 w-5 text-white" />
                      Generate Summary
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getTabClassName = (tabName: Tab) => 
    `px-4 py-2 text-sm rounded-t-lg transition-colors ${
      activeTab === tabName
        ? 'font-semibold border-b-2 border-brand-primary text-brand-primary dark:text-brand-secondary'
        : 'font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent'
    }`;


  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Explanation</h2>
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button onClick={() => onTabChange('details')} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
            activeTab === 'details' ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'
          }`}>
            Node Details
          </button>
          <button onClick={() => onTabChange('summary')} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
            activeTab === 'summary' ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'
          }`}>
            JSON Summary
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        {activeTab === 'details' ? renderDetailsTab() : renderSummaryTab()}
      </div>
    </div>
  );
};

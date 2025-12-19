

import React, { useState, useCallback, useRef } from 'react';
import { JsonViewer } from './JsonViewer';
import { ExplanationPanel } from './ExplanationPanel';
import { Explanation, Selection, GraphData } from '../types';
import { TreeIcon, GraphIcon, CopyIcon, CheckIcon, UploadIcon } from './icons';
import { GraphViewer } from './GraphViewer';
import { Tooltip } from './Tooltip';
import type { Theme } from './ThemeToggle';
// removed unused CodeEditor import

type ViewMode = 'tree' | 'graph';
type ExplanationTab = 'details' | 'summary';


interface ExplainerViewProps {
    jsonData: object | null;
    graphData: GraphData | null;
    explanations: Map<string, Explanation>;
    summary: string | null;
    selectedNode: Selection | null;
    isExplanationLoading: boolean;
    isSummaryLoading: boolean;
    fileName: string;
    activeView: ViewMode;
    setActiveView: (view: ViewMode) => void;
    activeExplanationTab: ExplanationTab;
    setActiveExplanationTab: (tab: ExplanationTab) => void;
    onNodeSelect: (selection: Selection) => void;
    collapsedNodes: Set<string>;
    onExpandAllGraphNodes: () => void;
    onCollapseAllGraphNodes: () => void;
    onGraphNodeToggle: (nodeId: string) => void;
    theme: Theme;
    onJsonUpload: (data: object, fileName: string) => void;
    onJsonError: (error: string) => void;
    onGenerateSummary: () => Promise<void>;
}

export const ExplainerView: React.FC<ExplainerViewProps> = ({
    jsonData,
    graphData,
    explanations,
    summary,
    selectedNode,
    isExplanationLoading,
    isSummaryLoading,
    fileName,
    activeView,
    setActiveView,
    activeExplanationTab,
    setActiveExplanationTab,
    onNodeSelect,
    collapsedNodes,
    onExpandAllGraphNodes,
    onCollapseAllGraphNodes,
    onGraphNodeToggle,
    theme,
    onJsonUpload,
    onJsonError,
    onGenerateSummary,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputFileName, setInputFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (!jsonData) return;
    const jsonString = JSON.stringify(jsonData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (typeof text === 'string') {
        setInputText(text);
        setInputFileName(file.name);
      } else {
        onJsonError('Failed to read file content.');
      }
    };
    reader.onerror = () => {
      onJsonError('Failed to read the file.');
    };
    reader.readAsText(file);
  }, [onJsonError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedExtensions = ['.json', '.txt'];
      
      const fileNameLower = file.name.toLowerCase();
      const lastDotIndex = fileNameLower.lastIndexOf('.');
      const fileExtension = lastDotIndex === -1 ? '' : fileNameLower.substring(lastDotIndex);

      if (!allowedExtensions.includes(fileExtension)) {
        onJsonError(`Invalid file type. Please upload a .json or .txt file.`);
        if (e.target) e.target.value = '';
        return;
      }
      processFile(file);
    }
     // Reset the input value so the same file can be selected again
    if(e.target) {
      e.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleInputChange = (value: string) => {
    setInputText(value);
    // If user types, it's no longer the uploaded file's content
    if (inputFileName) {
        setInputFileName(null);
    }
  };

  const handleValidate = () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      onJsonError("Input is empty. Please paste or upload some JSON.");
      return;
    }
    try {
      const data = JSON.parse(trimmedInput);
      onJsonUpload(data, inputFileName || 'Pasted JSON');
      setInputText('');
      setInputFileName(null);
    } catch (e) {
      onJsonError("Invalid JSON syntax in the input text. Please check for errors.");
    }
  };

  const viewSwitcherTooltip = !jsonData ? "Load JSON to enable views" : undefined;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold truncate" title={jsonData ? fileName : 'Input JSON'}>
                  {jsonData ? fileName : 'Input JSON'}
                </h2>
                {!jsonData && (
                  <Tooltip content="Upload a JSON file">
                    <button onClick={handleUploadClick} className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">
                      <UploadIcon className="h-5 w-5" />
                    </button>
                  </Tooltip>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".json,.txt"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-2">
                {jsonData && activeView === 'graph' && (
                  <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-2">
                    <Tooltip content="Expand all graph nodes">
                      <button onClick={onExpandAllGraphNodes} className="px-3 py-1 text-sm font-medium rounded-md transition-colors text-sky-800 dark:text-sky-200 bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200/70 dark:hover:bg-sky-800/50">
                        Expand All
                      </button>
                    </Tooltip>
                    <Tooltip content="Collapse all expandable nodes">
                      <button onClick={onCollapseAllGraphNodes} className="px-3 py-1 text-sm font-medium rounded-md transition-colors text-sky-800 dark:text-sky-200 bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200/70 dark:hover:bg-sky-800/50">
                        Collapse All
                      </button>
                    </Tooltip>
                  </div>
                )}
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Tooltip content={viewSwitcherTooltip || "View JSON as a hierarchical tree"}>
                    <div className="inline-block">
                        <button
                          disabled={!jsonData}
                          onClick={() => setActiveView('tree')}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                            activeView === 'tree' ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'
                          } ${!jsonData ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <TreeIcon className="h-5 w-5" /> Tree View
                        </button>
                    </div>
                  </Tooltip>
                  <Tooltip content={viewSwitcherTooltip || "Visualize JSON as an interactive graph"}>
                    <div className="inline-block">
                        <button
                          disabled={!jsonData}
                          onClick={() => setActiveView('graph')}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                            activeView === 'graph' ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'
                          } ${!jsonData ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <GraphIcon className="h-5 w-5" /> Graph View
                        </button>
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>

            {jsonData ? (
                <div className="flex-grow p-4 overflow-auto relative">
                    {activeView === 'tree' ? (
                    <>
                        <div className="absolute top-2 right-6 z-10">
                        <Tooltip content={isCopied ? "Copied!" : "Copy entire JSON"}>
                            <button
                            onClick={handleCopy}
                            className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                            {isCopied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
                            </button>
                        </Tooltip>
                        </div>
                        <JsonViewer data={jsonData} onSelect={onNodeSelect} selectedNodePath={selectedNode?.path ?? ''} />
                    </>
                    ) : graphData ? (
                    <GraphViewer 
                        data={graphData} 
                        onSelect={onNodeSelect} 
                        selectedNodePath={selectedNode?.path ?? ''}
                        collapsedNodes={collapsedNodes}
                        onNodeToggle={onGraphNodeToggle}
                        theme={theme}
                    />
                    ) : (
                    <div className="text-center p-8 text-gray-500">Could not render graph.</div>
                    )}
                </div>
            ) : (
                <div className="flex-grow p-6 overflow-hidden flex flex-col">
                    <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 p-4">
                        <textarea
                            value={inputText}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="Paste or upload your JSON here..."
                            className="w-full h-64 bg-transparent resize-none p-2 border border-slate-200 dark:border-slate-700 rounded"
                        />
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <button onClick={handleValidate} className="px-3 py-1 bg-slate-100 rounded">Validate</button>
                            <button onClick={() => { setInputText(''); setInputFileName(null); }} className="px-3 py-1 bg-slate-100 rounded">Clear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden">
          <ExplanationPanel 
            selectedNode={selectedNode}
            explanations={explanations}
            isLoading={isExplanationLoading}
            summary={summary}
            isSummaryLoading={isSummaryLoading}
            fileName={fileName}
            activeTab={activeExplanationTab}
            onTabChange={setActiveExplanationTab}
            onGenerateSummary={onGenerateSummary}
          />
        </div>
      </div>
  );
};

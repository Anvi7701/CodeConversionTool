import React, { useState, useMemo, useRef, useEffect } from 'react';
import SEO from './SEO';
import GraphViewer, { GraphViewerRef } from './GraphViewer';
import { convertJsonToGraphData } from '../utils/graphUtils';
import { StructureAnalyzerErrorModal } from './StructureAnalyzerErrorModal';
import { parseJsonSafe } from '../utils/parseJsonSafe';
import type { FixChange } from '../utils/simpleJsonFixer';
import { Tooltip } from './Tooltip';

export const JsonGraphViewerPage: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [graphCollapsedNodes, setGraphCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNodePath, setSelectedNodePath] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const graphViewerRef = useRef<GraphViewerRef>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphSectionRef = useRef<HTMLDivElement>(null);

  // Parse JSON and convert to graph data
  const parsedJson = useMemo(() => {
    if (!inputJson.trim()) return null;
    try {
      const parsed = JSON.parse(inputJson);
      setParseError(null);
      return parsed;
    } catch (err: any) {
      setParseError(err.message);
      return null;
    }
  }, [inputJson]);

  const graphData = useMemo(() => {
    if (!parsedJson || !showGraph) return null;
    try {
      return convertJsonToGraphData(parsedJson, graphCollapsedNodes);
    } catch (error) {
      console.error('Failed to convert JSON to graph:', error);
      return null;
    }
  }, [parsedJson, graphCollapsedNodes, showGraph]);

  // Handler for node selection in graph
  const handleNodeSelect = (selection: { path: string; key: string; value: any }) => {
    setSelectedNodePath(selection.path);
  };

  // Handler for node toggle in graph
  const handleNodeToggle = (nodeId: string) => {
    setGraphCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Get all node IDs for expand/collapse all
  const getAllNodeIds = (obj: any, parentPath = 'root'): string[] => {
    const ids: string[] = [];
    
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = `${parentPath}.${key}`;
        ids.push(currentPath);
        if (typeof value === 'object' && value !== null) {
          ids.push(...getAllNodeIds(value, currentPath));
        }
      });
    }
    
    return ids;
  };

  // Get nodes deeper than 1st level (for initial collapse)
  const getDeepNodeIds = (obj: any, parentPath = 'root'): string[] => {
    const ids: string[] = [];
    
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = `${parentPath}.${key}`;
        if (typeof value === 'object' && value !== null) {
          ids.push(currentPath);
          ids.push(...getDeepNodeIds(value, currentPath));
        }
      });
    }
    
    return ids;
  };

  // Expand all nodes in graph
  const handleGraphExpandAll = () => {
    setGraphCollapsedNodes(new Set());
  };

  // Collapse all nodes in graph
  const handleGraphCollapseAll = () => {
    if (parsedJson) {
      const allIds = getAllNodeIds(parsedJson);
      setGraphCollapsedNodes(new Set(allIds));
    }
  };

  // Sort graph data
  const handleSortGraph = () => {
    if (!parsedJson) return;
    
    const sortObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sortObject);
      }
      
      if (obj !== null && typeof obj === 'object') {
        const sorted: any = {};
        Object.keys(obj).sort().forEach(key => {
          sorted[key] = sortObject(obj[key]);
        });
        return sorted;
      }
      
      return obj;
    };
    
    const sorted = sortObject(parsedJson);
    const formatted = JSON.stringify(sorted, null, 2);
    setInputJson(formatted);
  };

  // Load sample JSON
  const handleLoadSample = () => {
    const sampleJson = {
      company: {
        name: "Tech Corp",
        established: 2010,
        public: true,
        metadata: {
          location: "San Francisco",
          employees: [
            { id: 1, name: "Alice", role: "CEO" },
            { id: 2, name: "Bob", role: "CTO" },
            { id: 3, name: "Charlie", role: "Developer" }
          ]
        },
        departments: [
          { name: "Engineering", head: "Bob", budget: 500000 },
          { name: "Sales", head: "Dave", budget: 300000 },
          { name: "Marketing", head: "Eve", budget: 250000 }
        ]
      },
      settings: {
        theme: "dark",
        notifications: true,
        privacy: {
          shareData: false,
          analytics: true
        }
      }
    };
    setInputJson(JSON.stringify(sampleJson, null, 2));
    setShowGraph(true);
    setParseError(null);
    setShowErrorModal(false);
    // Scroll to graph after brief delay
    setTimeout(() => {
      graphSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  // Handle file upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const text = content.trim();
          const parseResult = parseJsonSafe(text);
          if (parseResult.ok) {
            // Valid JSON, set input and auto-generate graph
            setInputJson(text);
            setParseError(null);
            setShowErrorModal(false);
            setShowGraph(true);
            // Scroll to graph after brief delay
            setTimeout(() => {
              graphSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
          } else {
            // Invalid JSON, show error modal
            setInputJson(text);
            setShowErrorModal(true);
            setParseError('Invalid JSON');
            setShowGraph(false);
          }
        } catch (err: any) {
          setInputJson(content);
          setShowErrorModal(true);
          setParseError(err.message);
        }
      }
    };
    reader.onerror = () => {
      setShowErrorModal(true);
      setParseError('Failed to read file');
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate JSON
  const handleValidate = () => {
    const trimmedInput = inputJson.trim();
    if (!trimmedInput) return;

    setIsValidating(true);

    // Validate JSON using parseJsonSafe
    const parseResult = parseJsonSafe(trimmedInput);
    
    if (parseResult.ok) {
      // JSON is valid - show success modal and auto-generate graph
      setShowSuccessModal(true);
      setShowErrorModal(false);
      setParseError(null);
      setShowGraph(true);
      // Scroll to graph after brief delay
      setTimeout(() => {
        graphSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } else {
      // JSON has errors - show error modal
      setShowErrorModal(true);
      setShowSuccessModal(false);
      setParseError('Invalid JSON');
    }

    setIsValidating(false);
  };

  // Handle when Auto Fix is applied from error modal
  const handleFixApplied = (fixedJson: string, changes: FixChange[]) => {
    setInputJson(fixedJson);
    setShowErrorModal(false);
    setParseError(null);
    setShowGraph(false);
  };

  // Generate Graph
  const handleGenerateGraph = () => {
    const trimmedInput = inputJson.trim();
    if (!trimmedInput) return;

    // Validate JSON first
    const parseResult = parseJsonSafe(trimmedInput);
    if (!parseResult.ok) {
      // Show error modal instead of inline error
      setShowErrorModal(true);
      setShowGraph(false);
      setParseError('Invalid JSON');
      return;
    }

    setIsGenerating(true);
    setShowErrorModal(false);
    setParseError(null);
    setShowGraph(true);
    
    // Brief delay for UX, then scroll to graph
    setTimeout(() => {
      setIsGenerating(false);
      // Scroll to Interactive Graph View section
      graphSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  // Handle fullscreen toggle for graph viewer
  const handleToggleGraphFullscreen = () => {
    if (!graphSectionRef.current) return;
    
    if (!isGraphFullscreen) {
      graphSectionRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Sync fullscreen state with browser fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsGraphFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <>
      <SEO
        title="JSON Graph Viewer - Interactive JSON Visualizer | Explore JSON Structure Visually"
        description="Visualize JSON data as an interactive graph with nodes and connections. Free online JSON graph viewer to explore, analyze, and navigate complex JSON structures visually. Perfect for developers to understand JSON hierarchy, relationships, and data flow with an intuitive tree diagram visualization."
        keywords="json graph viewer, json visualizer, json tree diagram, interactive json explorer, json node visualization, json structure viewer, visual json editor, json hierarchy viewer, json data flow diagram, json relationship graph, json network diagram, json mind map, visualize json structure, json graph tool, json tree view, json explorer, json schema visualizer, json data mapper"
        canonical="https://yourdomain.com/json-graph-viewer"
        ogImage="https://yourdomain.com/images/json-graph-viewer.jpg"
        ogUrl="https://yourdomain.com/json-graph-viewer"
      />

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-lg">📊</span>
            JSON Graph Viewer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Visualize your JSON data as an interactive graph with nodes and connections. Explore complex JSON structures visually.
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <div className="flex items-center justify-start gap-2 mb-3">
            <button
              onClick={handleLoadSample}
              className="btn btn-blue"
            >
              <i className="fa-solid fa-file-code" aria-hidden="true"></i>
              <span>Load Sample</span>
            </button>
            <button
              onClick={handleUploadClick}
              className="btn btn-orange"
            >
              <i className="fa-solid fa-upload" aria-hidden="true"></i>
              <span>Upload JSON</span>
            </button>
            <button
              onClick={handleValidate}
              disabled={!inputJson.trim() || isValidating}
              className="btn btn-green"
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" aria-hidden="true"></i>
                  <span>Validate</span>
                </>
              )}
            </button>
            <button
              onClick={handleGenerateGraph}
              disabled={!inputJson.trim() || isGenerating}
              className="btn btn-purple"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-chart-simple" aria-hidden="true"></i>
                  <span>Graph View</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setInputJson('');
                setParseError(null);
                setShowGraph(false);
              }}
              disabled={!inputJson.trim()}
              className="btn btn-red"
            >
              <i className="fa-solid fa-times" aria-hidden="true"></i>
              <span>Clear</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            onPaste={(e) => {
              // Auto-generate graph after paste if JSON is valid
              setTimeout(() => {
                const text = e.currentTarget.value.trim();
                if (text) {
                  const parseResult = parseJsonSafe(text);
                  if (parseResult.ok) {
                    setShowGraph(true);
                    setParseError(null);
                    setShowErrorModal(false);
                    setTimeout(() => {
                      graphSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                  }
                }
              }, 100);
            }}
            placeholder='Paste or upload your JSON here, e.g., {"name": "John", "age": 30, "skills": ["JavaScript", "React"]}'
            className="w-full h-48 px-4 py-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Graph Viewer Section */}
        {graphData && parsedJson ? (
          <div ref={graphSectionRef} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden relative">
            {/* Graph Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-800">
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Interactive Graph View
              </h2>
              
              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGraphExpandAll}
                  className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border-2 border-blue-200 dark:border-blue-700 flex items-center gap-1.5"
                  title="Expand all nodes"
                >
                  <span>➕</span>
                  <span className="hidden sm:inline">Expand All</span>
                </button>
                
                <button
                  onClick={handleGraphCollapseAll}
                  className="px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors border-2 border-orange-200 dark:border-orange-700 flex items-center gap-1.5"
                  title="Collapse all nodes"
                >
                  <span>➖</span>
                  <span className="hidden sm:inline">Collapse All</span>
                </button>
                
                <button
                  onClick={handleSortGraph}
                  className="px-3 py-1.5 text-xs font-bold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors border-2 border-green-200 dark:border-green-700 flex items-center gap-1.5"
                  title="Sort JSON keys alphabetically"
                >
                  <span>🔼</span>
                  <span className="hidden sm:inline">Sort</span>
                </button>
                
                <button
                  onClick={() => {
                    // Force re-render by toggling collapsed state
                    setGraphCollapsedNodes(new Set(graphCollapsedNodes));
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors border-2 border-purple-200 dark:border-purple-700 flex items-center gap-1.5"
                  title="Reset view and center graph"
                >
                  <span>🎯</span>
                  <span className="hidden sm:inline">Center</span>
                </button>
                
                <div className="relative">
                  <button
                    onClick={(e) => {
                      setIsDownloadOpen(!isDownloadOpen);
                      // Store button position for dropdown positioning
                      const rect = e.currentTarget.getBoundingClientRect();
                      (e.currentTarget as any).buttonRect = rect;
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors border-2 border-cyan-200 dark:border-cyan-700 flex items-center gap-1.5"
                    title="Download Graph"
                    id="download-graph-button"
                  >
                    <span>💾</span>
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  
                  {isDownloadOpen && (
                    <div 
                      className={`w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden ${
                        isGraphFullscreen ? 'absolute top-full right-0 mt-2' : 'fixed'
                      }`}
                      style={isGraphFullscreen ? { 
                        zIndex: 9999
                      } : { 
                        zIndex: 9999,
                        top: `${document.getElementById('download-graph-button')?.getBoundingClientRect().top! - 100}px`,
                        right: `${window.innerWidth - document.getElementById('download-graph-button')?.getBoundingClientRect().right!}px`
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={async () => {
                          await graphViewerRef.current?.downloadSVG();
                          setIsDownloadOpen(false);
                          setShowDownloadSuccess(true);
                          setTimeout(() => setShowDownloadSuccess(false), 3000);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors flex items-center gap-2"
                      >
                        <span className="text-sm">📄</span>
                        <span>Download as SVG</span>
                      </button>
                      <button 
                        onClick={async () => {
                          await graphViewerRef.current?.downloadPNG();
                          setIsDownloadOpen(false);
                          setShowDownloadSuccess(true);
                          setTimeout(() => setShowDownloadSuccess(false), 3000);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors flex items-center gap-2"
                      >
                        <span className="text-sm">🖼️</span>
                        <span>Download as PNG</span>
                      </button>
                      <button 
                        onClick={async () => {
                          await graphViewerRef.current?.downloadJPEG();
                          setIsDownloadOpen(false);
                          setShowDownloadSuccess(true);
                          setTimeout(() => setShowDownloadSuccess(false), 3000);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors flex items-center gap-2"
                      >
                        <span className="text-sm">📸</span>
                        <span>Download as JPEG</span>
                      </button>
                    </div>
                  )}
                </div>

                <Tooltip content={isGraphFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                  <button
                    onClick={handleToggleGraphFullscreen}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border-2 border-indigo-200 dark:border-indigo-700 flex items-center gap-1.5"
                    title={isGraphFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    disabled={!showGraph}
                  >
                    <i className={`fa-solid ${isGraphFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Graph Viewer */}
            <div ref={graphContainerRef} className="h-[600px] relative">
              <GraphViewer
                ref={graphViewerRef}
                data={graphData}
                onSelect={handleNodeSelect}
                selectedNodePath={selectedNodePath}
                collapsedNodes={graphCollapsedNodes}
                onNodeToggle={handleNodeToggle}
                theme="system"
                isDownloadOpen={isDownloadOpen}
                setIsDownloadOpen={setIsDownloadOpen}
              />
              
              {/* Color Legend */}
              <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 max-w-[200px]" style={{ zIndex: 10, pointerEvents: 'auto' }}>
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1">
                  <span className="text-sm">🎨</span>
                  <span>Legend</span>
                </h3>
                
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#0ea5e9] border border-[#0369a1] flex-shrink-0"></div>
                    <span className="text-slate-600 dark:text-slate-300">Objects <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-0.5 rounded">&#123;&#125;</code></span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#10b981] border border-[#047857] flex-shrink-0"></div>
                    <span className="text-slate-600 dark:text-slate-300">Arrays <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-0.5 rounded">[]</code></span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b] border border-[#92400e] flex-shrink-0"></div>
                    <span className="text-slate-600 dark:text-slate-300">Strings <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-0.5 rounded">"txt"</code></span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#6366f1] border border-[#3730a3] flex-shrink-0"></div>
                    <span className="text-slate-600 dark:text-slate-300">Numbers <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-0.5 rounded">123</code></span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#a855f7] border border-[#6b21a8] flex-shrink-0"></div>
                    <span className="text-slate-600 dark:text-slate-300">Booleans</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Success Toast - positioned inside graph section for fullscreen */}
            {showDownloadSuccess && (
              <div className="absolute top-4 right-4 z-[100] animate-fade-in">
                <div className="bg-green-500 dark:bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                  <i className="fa-solid fa-check-circle text-xl"></i>
                  <span className="font-medium">File downloaded successfully!</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No JSON Data to Visualize
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Paste valid JSON data above to see the interactive graph visualization
            </p>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Interactive Exploration</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Click nodes to expand/collapse, zoom with mouse wheel, and drag nodes to explore your JSON structure dynamically.
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Color-Coded Types</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Different colors for objects, arrays, strings, numbers, and booleans make it easy to understand data types at a glance.
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-3">💾</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Export Options</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Download your graph as SVG or PNG image, copy to clipboard, or save directly to your file system.
            </p>
          </div>
        </div>
      </div>

      {/* Error Modal - Shows when JSON has syntax errors */}
      <StructureAnalyzerErrorModal
        open={showErrorModal}
        jsonInput={inputJson}
        onClose={() => setShowErrorModal(false)}
        onFixApplied={handleFixApplied}
      />

      {/* Success Modal - Shows when JSON validation is successful */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border border-green-300 dark:border-green-700">
            {/* Header */}
            <div className="px-5 py-3 bg-green-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <h3 className="text-lg font-semibold">Validation Successful</h3>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 text-center">
                Your JSON is valid and well-formed! You can now proceed to generate the graph visualization.
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Success Toast - for normal view when not in fullscreen */}
      {showDownloadSuccess && !isGraphFullscreen && (
        <div className="fixed top-4 right-4 z-[10000] animate-fade-in">
          <div className="bg-green-500 dark:bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <i className="fa-solid fa-check-circle text-xl"></i>
            <span className="font-medium">File downloaded successfully!</span>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useMemo } from 'react';
import SEO from './SEO';
import { GraphViewer } from './GraphViewer';
import { convertJsonToGraphData } from '../utils/graphUtils';

export const JsonGraphViewerPage: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [graphCollapsedNodes, setGraphCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNodePath, setSelectedNodePath] = useState<string>('');

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
    if (!parsedJson) return null;
    try {
      return convertJsonToGraphData(parsedJson, graphCollapsedNodes);
    } catch (error) {
      console.error('Failed to convert JSON to graph:', error);
      return null;
    }
  }, [parsedJson, graphCollapsedNodes]);

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
  };

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <span className="text-4xl">📊</span>
            JSON Graph Viewer
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Visualize your JSON data as an interactive graph with nodes and connections. Explore complex JSON structures visually.
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Paste Your JSON Data
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleLoadSample}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-700"
              >
                Load Sample
              </button>
              <button
                onClick={() => setInputJson('')}
                disabled={!inputJson.trim()}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder='Paste your JSON here, e.g., {"name": "John", "age": 30, "skills": ["JavaScript", "React"]}'
            className="w-full h-48 px-4 py-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          {parseError && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">❌ JSON Parse Error:</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{parseError}</p>
            </div>
          )}
        </div>

        {/* Graph Viewer Section */}
        {graphData && parsedJson ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            {/* Graph Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-800">
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Interactive Graph View
              </h2>
              
              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGraphExpandAll}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-700 flex items-center gap-1.5"
                  title="Expand all nodes"
                >
                  <span>➕</span>
                  <span className="hidden sm:inline">Expand All</span>
                </button>
                
                <button
                  onClick={handleGraphCollapseAll}
                  className="px-3 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-orange-200 dark:border-orange-700 flex items-center gap-1.5"
                  title="Collapse all nodes"
                >
                  <span>➖</span>
                  <span className="hidden sm:inline">Collapse All</span>
                </button>
                
                <button
                  onClick={handleSortGraph}
                  className="px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-green-200 dark:border-green-700 flex items-center gap-1.5"
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
                  className="px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors border border-purple-200 dark:border-purple-700 flex items-center gap-1.5"
                  title="Reset view and center graph"
                >
                  <span>🎯</span>
                  <span className="hidden sm:inline">Center</span>
                </button>
              </div>
            </div>

            {/* Graph Viewer */}
            <div className="h-[600px] relative">
              <GraphViewer
                data={graphData}
                onSelect={handleNodeSelect}
                selectedNodePath={selectedNodePath}
                collapsedNodes={graphCollapsedNodes}
                onNodeToggle={handleNodeToggle}
                theme="system"
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
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No JSON Data to Visualize
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Paste valid JSON data above to see the interactive graph visualization
            </p>
            <button
              onClick={handleLoadSample}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Try Sample JSON
            </button>
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
    </>
  );
};

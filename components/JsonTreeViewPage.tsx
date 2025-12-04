import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SEO from './SEO';
import { TreeView } from './UnifiedJsonViewRenderer';

const JsonTreeViewPage: React.FC = () => {
  const location = useLocation() as { state?: { inputJson?: string } };
  const initialJson = typeof location.state?.inputJson === 'string' ? location.state!.inputJson! : '';
  const [inputJson, setInputJson] = useState<string>(initialJson);
  const [parseError, setParseError] = useState<string | null>(null);

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

  const handleLoadSample = () => {
    const sample = {
      store: {
        book: [
          { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
          { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
          { category: 'fiction', author: 'Herman Melville', title: 'Moby Dick', isbn: '0-553-21311-3', price: 8.99 },
          { category: 'fiction', author: 'J. R. R. Tolkien', title: 'The Lord of the Rings', isbn: '0-395-19395-8', price: 22.99 }
        ],
        bicycle: { color: 'red', price: 19.95 }
      }
    };
    setInputJson(JSON.stringify(sample, null, 2));
  };

  const handleClear = () => setInputJson('');

  return (
    <>
      <SEO
        title="JSON Tree View - Interactive JSON Hierarchy Viewer | Explore Nested JSON Structures"
        description="Free online JSON Tree View tool to visualize and explore nested JSON structures with expand/collapse nodes. Perfect for developers analyzing complex JSON data, APIs, and configuration files. SEO-optimized with detailed long-tail keywords and social sharing metadata."
        keywords="json tree view, interactive json hierarchy viewer, visualize nested json, expand collapse json nodes, json explorer tool, json inspector, json structure analyzer, json nesting visualizer, hierarchical json viewer, json browser, view json as tree, developer tools for json, api json viewer, json formatter and viewer, explore json keys and values"
        canonical="https://yourdomain.com/json-tree-view"
        ogImage="https://yourdomain.com/images/json-tree-view.jpg"
        ogUrl="https://yourdomain.com/json-tree-view"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <span className="text-4xl">🌳</span>
            JSON Tree View
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Visualize and explore your JSON data as an interactive tree with expandable nodes, perfect for understanding complex nested structures.
          </p>
        </div>

        {/* Input section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Paste Your JSON Data
            </label>
            <div className="flex gap-2">
              <button onClick={handleLoadSample} className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-700">
                Load Sample
              </button>
              <button onClick={handleClear} disabled={!inputJson.trim()} className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder='Paste your JSON here, e.g., {"name":"Alice","skills":["JS","React"],"active":true}'
            className="w-full h-48 px-4 py-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          {parseError && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">❌ JSON Parse Error:</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{parseError}</p>
            </div>
          )}
        </div>

        {/* Tree view section */}
        {parsedJson ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Interactive Tree</h2>
              <div className="flex items-center gap-2">
                <span className="icon-btn icon-green" role="button" tabIndex={0} title="Expand All">
                  <i className="fa-solid fa-arrows-up-to-line" aria-hidden="true"></i>
                </span>
                <span className="icon-btn icon-orange" role="button" tabIndex={0} title="Collapse All">
                  <i className="fa-solid fa-arrows-down-to-line" aria-hidden="true"></i>
                </span>
              </div>
            </div>
            <div className="p-3">
              {/* TreeView renders the JSON hierarchy */}
              <TreeView data={parsedJson as any} />
            </div>
          </div>
        ) : (
          <div className="p-4 text-slate-600 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
            Paste valid JSON above to view the interactive tree.
          </div>
        )}
      </div>
    </>
  );
};

export default JsonTreeViewPage;

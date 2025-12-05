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
        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <span className="text-3xl">🌳</span>
            JSON Tree View
          </h1>
          <p className="text-slate-600 dark:text-slate-300">Side-by-side editor and tree output, matching the beautifier layout.</p>
        </div>

        {/* Two-pane layout with rails */}
        <div className="w-full flex flex-col lg:flex-row gap-6 min-h-[600px]">
          {/* Left Pane: Input with left rail */}
          <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-3 relative z-10 h-[600px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 relative z-50">
                <h2 className="text-lg font-semibold">Input</h2>
                {/* Input toolbar pills: Sort, Validate, Collapse, Expand */}
                <div className="flex items-center gap-1 ml-2">
                  <span className="icon-btn icon-cyan" role="button" tabIndex={0} title="Sort Input JSON" onClick={() => { try { const obj = JSON.parse(inputJson); const sortObj = (o:any):any => Array.isArray(o)? o.map(sortObj) : (o && typeof o==='object'? Object.keys(o).sort().reduce((acc,k)=>{ acc[k]=sortObj(o[k]); return acc; },{} as any) : o); const formatted = JSON.stringify(sortObj(obj), null, 2); setInputJson(formatted); setParseError(null);} catch(e:any){ setParseError(e.message);} }}>
                    <i className="fa-solid fa-sort" aria-hidden="true"></i>
                  </span>
                  <span className="icon-btn icon-green" role="button" tabIndex={0} title="Validate Input JSON" onClick={() => { try { JSON.parse(inputJson); setParseError(null);} catch(e:any){ setParseError(e.message);} }}>
                    <i className="fa-solid fa-check" aria-hidden="true"></i>
                  </span>
                  <span className="icon-btn icon-orange" role="button" tabIndex={0} title="Collapse All" onClick={() => { /* no-op for textarea */ }}>
                    <i className="fa-solid fa-arrows-down-to-line" aria-hidden="true"></i>
                  </span>
                  <span className="icon-btn icon-green" role="button" tabIndex={0} title="Expand All" onClick={() => { /* no-op for textarea */ }}>
                    <i className="fa-solid fa-arrows-up-to-line" aria-hidden="true"></i>
                  </span>
                </div>
              </div>
              {/* Left rail icons */}
              <div className="flex items-center gap-1">
                <span className="icon-plain no-ring text-slate-600" role="button" tabIndex={0} title="Upload" onClick={handleLoadSample}><i className="fa-solid fa-upload" aria-hidden="true"></i></span>
                <span className="icon-plain no-ring text-slate-600" role="button" tabIndex={0} title="Clear" onClick={handleClear}><i className="fa-solid fa-eraser" aria-hidden="true"></i></span>
                <span className="icon-plain no-ring text-slate-600" role="button" tabIndex={0} title="Copy" onClick={() => navigator.clipboard.writeText(inputJson)}><i className="fa-solid fa-copy" aria-hidden="true"></i></span>
              </div>
            </div>

            {/* Input editor */}
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder='Enter your JSON here...'
              className="w-full flex-1 px-4 py-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            {parseError && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">❌ JSON Parse Error:</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{parseError}</p>
              </div>
            )}
          </div>

          {/* Right Pane: Output Tree with right rail */}
          <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-3 relative z-10 h-[600px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Output</h2>
                {/* Output toolbar pills: Collapse/Expand Tree, Validate */}
                <div className="flex items-center gap-1 ml-2">
                  <span className="icon-btn icon-green" role="button" tabIndex={0} title="Expand All" onClick={() => {/* TreeView internal expand could be handled via props; placeholder here */}}>
                    <i className="fa-solid fa-arrows-up-to-line" aria-hidden="true"></i>
                  </span>
                  <span className="icon-btn icon-orange" role="button" tabIndex={0} title="Collapse All" onClick={() => {/* TreeView internal collapse */}}>
                    <i className="fa-solid fa-arrows-down-to-line" aria-hidden="true"></i>
                  </span>
                  <span className="icon-btn icon-green" role="button" tabIndex={0} title="Validate Output JSON" onClick={() => { /* output is parsedJson */ }}>
                    <i className="fa-solid fa-check" aria-hidden="true"></i>
                  </span>
                </div>
              </div>
              {/* Right rail icons */}
              <div className="flex items-center gap-1">
                <span className="icon-plain no-ring text-slate-600" role="button" tabIndex={0} title="Download" onClick={() => { const blob = new Blob([inputJson], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'input.json'; a.click(); }}><i className="fa-solid fa-download" aria-hidden="true"></i></span>
                <span className="icon-plain no-ring text-slate-600" role="button" tabIndex={0} title="Save" onClick={() => { /* placeholder */ }}><i className="fa-solid fa-floppy-disk" aria-hidden="true"></i></span>
                <span className="icon-plain no-ring text-slate-600" role="button" tabIndex={0} title="Print" onClick={() => window.print()}><i className="fa-solid fa-print" aria-hidden="true"></i></span>
              </div>
            </div>

            {/* Output TreeView */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-auto">
              <div className="p-3">
                {parsedJson ? (
                  <TreeView data={parsedJson as any} />
                ) : (
                  <div className="p-4 text-slate-600 dark:text-slate-300">Paste valid JSON in the input to view the tree.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JsonTreeViewPage;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { JSONPath } from 'jsonpath-plus';

interface JSONPathQueryModalProps {
  inputJson: string;
  onApply: (resultText: string) => void;
  onClose: () => void;
  onHighlightPath?: (path: string) => void;
}

interface CommonQuery {
  label: string;
  query: string;
  description: string;
}

const COMMON_QUERIES: CommonQuery[] = [
  { label: 'Root ($)', query: '$', description: 'Return the root element' },
  { label: 'All nodes', query: '$..*', description: 'Return all descendant nodes' },
  { label: 'All keys named "id"', query: '$..id', description: 'Find values for key id anywhere' },
  { label: 'Array indices', query: '$[0,1,2]', description: 'First three items of a root array' },
  { label: 'Filter books by price', query: '$.store.book[?(@.price < 10)]', description: 'Filter objects with condition' },
  { label: 'Titles under store', query: '$.store.book[*].title', description: 'Project nested field values' },
];

export const JSONPathQueryModal: React.FC<JSONPathQueryModalProps> = ({ inputJson, onApply, onClose, onHighlightPath }) => {
  const [query, setQuery] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'values' | 'paths' | 'count'>('values');
  const [valuesResult, setValuesResult] = useState<any[]>([]);
  const [pathsResult, setPathsResult] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const queryInputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('jsonpath_query_history');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        setQueryHistory(Array.isArray(arr) ? arr.slice(0, 10) : []);
      } catch {
        setQueryHistory([]);
      }
    }
  }, []);

  const saveToHistory = (q: string) => {
    if (!q.trim()) return;
    setQueryHistory(prev => {
      const filtered = prev.filter(item => item !== q);
      const newHistory = [q, ...filtered].slice(0, 10);
      localStorage.setItem('jsonpath_query_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Execute JSONPath query with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        // Clear results when query is empty
        setValuesResult([]);
        setPathsResult([]);
        setError('');
        return;
      }
      try {
        const parsed = JSON.parse(inputJson);
        const values = JSONPath({ path: query, json: parsed, resultType: 'value' }) as any[];
        const pathsRaw = JSONPath({ path: query, json: parsed, resultType: 'path' }) as string[];
        const paths = (pathsRaw || []).map(p => normalizeJsonPath(p));
        setValuesResult(values || []);
        setPathsResult(paths || []);
        setError('');
      } catch (err: any) {
        if (err?.message && err.message.includes('JSON')) {
          setError('Invalid JSON input. Please ensure your input is valid JSON.');
        } else {
          setError(`JSONPath Error: ${err?.message || 'Invalid query syntax'}`);
        }
        setValuesResult([]);
        setPathsResult([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, inputJson]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizeJsonPath = (pathExpr: string): string => {
    // Convert jsonpath-plus path like $['store']['book'][0]['title'] to $.store.book[0].title
    try {
      let p = pathExpr.trim();
      p = p.replace(/\['([^']+)'\]/g, '.$1');
      p = p.replace(/\["([^"]+)"\]/g, '.$1');
      p = p.replace(/\[\s*(\d+)\s*\]/g, '[$1]');
      p = p.replace(/\$\./, '$.');
      p = p.replace(/\$\$\./, '$.');
      // Remove accidental double dots
      p = p.replace(/\.\.+/g, '.');
      // Fix cases starting with $ but next token missing dot
      if (p.startsWith('$[')) {
        // leave as-is if bracket notation is first
      } else if (p.startsWith('$') && !p.startsWith('$.')) {
        p = '$.' + p.slice(1);
      }
      return p;
    } catch {
      return pathExpr;
    }
  };

  const handleSelectCommonQuery = (selectedQuery: string) => {
    setQuery(selectedQuery);
    setShowDropdown(false);
    queryInputRef.current?.focus();
  };

  const handleSelectFromHistory = (historicalQuery: string) => {
    setQuery(historicalQuery);
    setShowHistory(false);
    queryInputRef.current?.focus();
  };

  const handleApply = () => {
    if (!error) {
      saveToHistory(query);
      const payload = activeTab === 'values' ? valuesResult : activeTab === 'paths' ? pathsResult : { count: valuesResult.length };
      onApply(JSON.stringify(payload, null, 2));
    }
  };

  const handleCopy = async () => {
    const payload = activeTab === 'values' ? valuesResult : activeTab === 'paths' ? pathsResult : { count: valuesResult.length };
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const exportCSV = () => {
    try {
      const rows: string[] = [];
      if (activeTab === 'values') {
        if (Array.isArray(valuesResult) && valuesResult.length > 0 && typeof valuesResult[0] === 'object' && valuesResult[0] !== null && !Array.isArray(valuesResult[0])) {
          // array of objects
          const cols = Array.from(valuesResult.reduce((set: Set<string>, obj: any) => {
            Object.keys(obj || {}).forEach(k => set.add(k));
            return set;
          }, new Set<string>()));
          rows.push(cols.join(','));
          for (const obj of valuesResult) {
            const vals = cols.map(k => escapeCsv(String(obj?.[k] ?? '')));
            rows.push(vals.join(','));
          }
        } else {
          // primitives or arrays -> single column
          rows.push('value');
          for (const v of valuesResult) {
            rows.push(escapeCsv(typeof v === 'string' ? v : JSON.stringify(v)));
          }
        }
      } else if (activeTab === 'paths') {
        rows.push('path');
        for (const p of pathsResult) rows.push(escapeCsv(p));
      } else {
        rows.push('metric,value');
        rows.push('count,' + valuesResult.length);
      }
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jsonpath_results.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export CSV failed:', e);
    }
  };

  const escapeCsv = (s: string): string => {
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  const handleHighlightClick = (path: string) => {
    if (onHighlightPath) onHighlightPath(path);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Query with JSONPath</h2>
            <a
              href="https://github.com/JSONPath-Plus/JSONPath/blob/master/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Docs →
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden p-6 flex flex-col gap-4">
          {/* Query Input Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">JSONPath Query</label>
              <div className="flex gap-2">
                {/* History */}
                <div className="relative" ref={historyRef}>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    disabled={queryHistory.length === 0}
                    className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📜 History
                  </button>
                  {showHistory && queryHistory.length > 0 && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1">Recent Queries</div>
                        {queryHistory.map((hq, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectFromHistory(hq)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-sm font-mono text-slate-700 dark:text-slate-300 truncate"
                          >
                            {hq}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Common Queries */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                  >
                    📚 Common Queries
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-10">
                      <div className="p-2">
                        {COMMON_QUERIES.map((cq, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectCommonQuery(cq.query)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md mb-1"
                          >
                            <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{cq.label}</div>
                            <div className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">{cq.query}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cq.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="relative">
              <textarea
                ref={queryInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter JSONPath query (e.g., $.store.book[*].title, $..id, [*] etc.)"
                className="w-full h-24 p-3 pr-10 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-800 dark:text-slate-200"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Clear query"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('values')} className={`px-3 py-1 rounded-md text-sm ${activeTab === 'values' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>Values</button>
            <button onClick={() => setActiveTab('paths')} className={`px-3 py-1 rounded-md text-sm ${activeTab === 'paths' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>Paths</button>
            <button onClick={() => setActiveTab('count')} className={`px-3 py-1 rounded-md text-sm ${activeTab === 'count' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>Count</button>
            <div className="ml-auto flex gap-2">
              <button onClick={handleCopy} disabled={!!error} className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50">📋 Copy</button>
              <button onClick={exportCSV} disabled={!!error} className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50">⬇ Export CSV</button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-grow bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-4 overflow-auto">
            {activeTab === 'values' && (
              <pre className="text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{valuesResult.length ? JSON.stringify(valuesResult, null, 2) : 'Values will appear here...'}</pre>
            )}
            {activeTab === 'paths' && (
              <div className="flex flex-col gap-1">
                {pathsResult.length === 0 && <div className="text-sm text-slate-600 dark:text-slate-400">Paths will appear here...</div>}
                {pathsResult.map((p, i) => (
                  <button key={i} onClick={() => handleHighlightClick(p)} className="text-left px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-sm text-blue-700 dark:text-blue-300">
                    {p}
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'count' && (
              <div className="text-sm text-slate-800 dark:text-slate-200">Matches: {valuesResult.length}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600">Ctrl+Enter</kbd> to apply
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md transition-colors">Cancel</button>
            <button onClick={handleApply} disabled={!!error} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 font-semibold">✓ Apply to Output</button>
          </div>
        </div>
      </div>
    </div>
  );
};

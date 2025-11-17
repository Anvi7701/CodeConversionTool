import React, { useState, useEffect, useCallback, useRef } from 'react';
import jmespath from 'jmespath';

interface JMESPathTransformProps {
  inputJson: string;
  onApply: (result: string) => void;
  onClose: () => void;
}

interface CommonQuery {
  label: string;
  query: string;
  description: string;
}

const COMMON_QUERIES: CommonQuery[] = [
  { label: 'Identity (@)', query: '@', description: 'Return the current element unchanged' },
  { label: 'Filter by condition', query: '[?id > `1`]', description: 'Filter array items by condition' },
  { label: 'Project fields', query: '[*].name', description: 'Extract specific field from all items' },
  { label: 'Multi-field projection', query: '[*].[name, id]', description: 'Extract multiple fields' },
  { label: 'First element', query: '[0]', description: 'Get the first element of an array' },
  { label: 'Last element', query: '[-1]', description: 'Get the last element of an array' },
  { label: 'Array length', query: 'length(@)', description: 'Get the length of an array' },
  { label: 'Sort by field', query: 'sort_by(@, &name)', description: 'Sort array by a specific field' },
  { label: 'Nested selection', query: 'store.books[*].title', description: 'Access nested properties' },
  { label: 'Keys', query: 'keys(@)', description: 'Get all keys of an object' },
  { label: 'Values', query: 'values(@)', description: 'Get all values of an object' },
];

const JMESPATH_KEYWORDS = [
  '@', 'length', 'keys', 'values', 'sort', 'sort_by', 'max', 'min', 'sum', 'avg',
  'type', 'to_string', 'to_number', 'join', 'reverse', 'contains', 'starts_with',
  'ends_with', 'merge', 'max_by', 'min_by', 'group_by', 'map', 'not_null', 'flatten'
];

export const JMESPathTransform: React.FC<JMESPathTransformProps> = ({ inputJson, onApply, onClose }) => {
  const [query, setQuery] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const queryInputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Load query history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('jmespath_query_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setQueryHistory(Array.isArray(parsed) ? parsed.slice(0, 10) : []);
      } catch {
        setQueryHistory([]);
      }
    }
  }, []);

  // Save query to history
  const saveToHistory = useCallback((q: string) => {
    if (!q.trim()) return;
    
    setQueryHistory(prev => {
      const filtered = prev.filter(item => item !== q);
      const newHistory = [q, ...filtered].slice(0, 10); // Keep last 10 queries
      localStorage.setItem('jmespath_query_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Execute JMESPath query with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!query.trim()) {
        setPreview(inputJson);
        setError('');
        return;
      }

      try {
        const parsedJson = JSON.parse(inputJson);
        const result = jmespath.search(parsedJson, query);
        setPreview(JSON.stringify(result, null, 2));
        setError('');
      } catch (err: any) {
        if (err.message && err.message.includes('JSON')) {
          setError('Invalid JSON input. Please ensure your input is valid JSON.');
        } else {
          setError(`JMESPath Error: ${err.message || 'Invalid query syntax'}`);
        }
        setPreview('');
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
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
    if (preview && !error) {
      saveToHistory(query);
      onApply(preview);
    }
  };

  const handleCopyResult = async () => {
    if (preview) {
      try {
        await navigator.clipboard.writeText(preview);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  // Syntax highlighting for JMESPath query
  const highlightSyntax = (text: string): string => {
    let highlighted = text;
    
    // Highlight keywords
    JMESPATH_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="text-purple-600 dark:text-purple-400 font-semibold">${keyword}</span>`);
    });
    
    // Highlight operators
    highlighted = highlighted.replace(/([?*&|<>=!+\-])/g, '<span class="text-orange-600 dark:text-orange-400">$1</span>');
    
    // Highlight strings
    highlighted = highlighted.replace(/`([^`]*)`/g, '<span class="text-green-600 dark:text-green-400">`$1`</span>');
    highlighted = highlighted.replace(/'([^']*)'/g, '<span class="text-green-600 dark:text-green-400">\'$1\'</span>');
    highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="text-green-600 dark:text-green-400">"$1"</span>');
    
    // Highlight numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>');
    
    // Highlight brackets
    highlighted = highlighted.replace(/([[\]{}()])/g, '<span class="text-slate-700 dark:text-slate-300 font-bold">$1</span>');
    
    return highlighted;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Transform with JMESPath</h2>
            <a
              href="https://jmespath.org/tutorial.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Learn JMESPath →
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
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                JMESPath Query
              </label>
              <div className="flex gap-2 relative">
                {/* Query History Dropdown */}
                {queryHistory.length > 0 && (
                  <div className="relative" ref={historyRef}>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
                    >
                      📜 History
                    </button>
                    {showHistory && (
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                        <div className="p-2">
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1">Recent Queries</div>
                          {queryHistory.map((hq, index) => (
                            <button
                              key={index}
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
                )}
                
                {/* Common Queries Dropdown */}
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
                        {COMMON_QUERIES.map((cq, index) => (
                          <button
                            key={index}
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

            {/* Query Textarea */}
            <textarea
              ref={queryInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter JMESPath query (e.g., @, [*].name, [?id > `1`])"
              className="w-full h-24 p-3 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-800 dark:text-slate-200"
              spellCheck={false}
            />

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="flex-grow flex flex-col gap-2 min-h-0">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Preview Result
            </label>
            <div className="flex-grow bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-4 overflow-auto">
              <pre className="text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {preview || 'Result will appear here...'}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600">Ctrl+Enter</kbd> to apply
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopyResult}
              disabled={!preview || !!error}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📋 Copy Result
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!preview || !!error}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              ✓ Apply to Output
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

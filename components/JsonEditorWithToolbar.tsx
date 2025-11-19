import React, { useState, useCallback, useRef } from 'react';
import JsonToolbar from './JsonToolbar';
import './JsonToolbar.css';

/**
 * Complete JSON Editor with Modern Toolbar
 * Inspired by jsonformatter.org but with better UX
 */

export const JsonEditorWithToolbar: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [errors, setErrors] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Refs for scroll synchronization
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputLineNumbersRef = useRef<HTMLDivElement>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const outputLineNumbersRef = useRef<HTMLDivElement>(null);

  // Add to history
  const addToHistory = (value: string) => {
    const newHistory = [...history.slice(0, historyIndex + 1), value];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Sync scroll for Input textarea and line numbers
  const handleInputScroll = () => {
    if (inputTextareaRef.current && inputLineNumbersRef.current) {
      inputLineNumbersRef.current.scrollTop = inputTextareaRef.current.scrollTop;
    }
  };

  // Sync scroll for Output textarea and line numbers
  const handleOutputScroll = () => {
    if (outputTextareaRef.current && outputLineNumbersRef.current) {
      outputLineNumbersRef.current.scrollTop = outputTextareaRef.current.scrollTop;
    }
  };

  // Format JSON
  const handleFormat = useCallback((indentSize: number) => {
    try {
      const parsed = JSON.parse(jsonInput);
      const indentChar = indentSize === 0 ? '\t' : ' '.repeat(indentSize);
      const formatted = JSON.stringify(parsed, null, indentChar);
      setJsonOutput(formatted);
      addToHistory(formatted);
      setErrors([]);
    } catch (error) {
      setErrors(['Invalid JSON: ' + (error as Error).message]);
    }
  }, [jsonInput]);

  // Minify JSON
  const handleMinify = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      const minified = JSON.stringify(parsed);
      setJsonOutput(minified);
      addToHistory(minified);
      setErrors([]);
    } catch (error) {
      setErrors(['Invalid JSON: ' + (error as Error).message]);
    }
  }, [jsonInput]);

  // Sort JSON
  const handleSort = useCallback((direction: 'asc' | 'desc', sortBy: 'keys' | 'values') => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      const sortObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(sortObject);
        }
        
        if (obj !== null && typeof obj === 'object') {
          const entries = Object.entries(obj);
          
          if (sortBy === 'keys') {
            entries.sort(([keyA], [keyB]) => {
              return direction === 'asc' 
                ? keyA.localeCompare(keyB)
                : keyB.localeCompare(keyA);
            });
          } else {
            entries.sort(([, valA], [, valB]) => {
              const strA = String(valA);
              const strB = String(valB);
              return direction === 'asc'
                ? strA.localeCompare(strB)
                : strB.localeCompare(strA);
            });
          }
          
          return Object.fromEntries(
            entries.map(([key, val]) => [key, sortObject(val)])
          );
        }
        
        return obj;
      };
      
      const sorted = sortObject(parsed);
      const formatted = JSON.stringify(sorted, null, 2);
      setJsonOutput(formatted);
      addToHistory(formatted);
      setErrors([]);
    } catch (error) {
      setErrors(['Invalid JSON: ' + (error as Error).message]);
    }
  }, [jsonInput]);

  // Repair JSON
  const handleRepair = useCallback(() => {
    let repaired = jsonInput;
    
    // Remove comments
    repaired = repaired.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    
    // Fix single quotes to double quotes
    repaired = repaired.replace(/'/g, '"');
    
    // Remove trailing commas
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // Add missing quotes to keys
    repaired = repaired.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    try {
      const parsed = JSON.parse(repaired);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonOutput(formatted);
      setJsonInput(formatted);
      addToHistory(formatted);
      setErrors([]);
    } catch (error) {
      setErrors(['Could not repair JSON: ' + (error as Error).message]);
    }
  }, [jsonInput]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setJsonOutput(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setJsonOutput(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Generate sample data
  const handleGenerateSample = useCallback((template: string) => {
    const samples: Record<string, any> = {
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        isActive: true,
        address: {
          street: "123 Main St",
          city: "New York",
          country: "USA"
        }
      },
      api: {
        status: "success",
        data: [
          { id: 1, title: "Item 1", price: 29.99 },
          { id: 2, title: "Item 2", price: 49.99 }
        ],
        meta: {
          total: 2,
          page: 1,
          perPage: 10
        }
      },
      config: {
        appName: "My Application",
        version: "1.0.0",
        settings: {
          theme: "dark",
          language: "en",
          notifications: true
        },
        endpoints: {
          api: "https://api.example.com",
          cdn: "https://cdn.example.com"
        }
      },
      array: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" }
      ],
      nested: {
        level1: {
          level2: {
            level3: {
              level4: {
                value: "Deep nested value"
              }
            }
          }
        }
      }
    };
    
    const sample = samples[template] || samples.user;
    const formatted = JSON.stringify(sample, null, 2);
    setJsonInput(formatted);
    setJsonOutput(formatted);
    addToHistory(formatted);
  }, []);

  // View as graph (open in new window)
  const handleViewGraph = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      const graphWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (graphWindow) {
        graphWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>JSON Graph Viewer</title>
            <style>
              body { font-family: monospace; padding: 20px; background: #f5f5f5; }
              .node { margin-left: 20px; }
              .key { color: #881391; font-weight: bold; }
              .string { color: #1A1AA6; }
              .number { color: #116644; }
              .boolean { color: #0E1111; font-weight: bold; }
              .null { color: #808080; }
            </style>
          </head>
          <body>
            <h2>JSON Tree View</h2>
            <div id="tree"></div>
            <script>
              const data = ${JSON.stringify(parsed)};
              
              function renderNode(obj, container) {
                for (const [key, value] of Object.entries(obj)) {
                  const node = document.createElement('div');
                  node.className = 'node';
                  
                  const keySpan = document.createElement('span');
                  keySpan.className = 'key';
                  keySpan.textContent = key + ': ';
                  node.appendChild(keySpan);
                  
                  if (typeof value === 'object' && value !== null) {
                    const toggle = document.createElement('span');
                    toggle.textContent = Array.isArray(value) ? '[...]' : '{...}';
                    toggle.style.cursor = 'pointer';
                    toggle.style.color = '#666';
                    
                    const children = document.createElement('div');
                    children.style.display = 'none';
                    renderNode(value, children);
                    
                    toggle.onclick = () => {
                      children.style.display = children.style.display === 'none' ? 'block' : 'none';
                    };
                    
                    node.appendChild(toggle);
                    node.appendChild(children);
                  } else {
                    const valueSpan = document.createElement('span');
                    valueSpan.className = typeof value;
                    valueSpan.textContent = JSON.stringify(value);
                    node.appendChild(valueSpan);
                  }
                  
                  container.appendChild(node);
                }
              }
              
              renderNode(data, document.getElementById('tree'));
            </script>
          </body>
          </html>
        `);
        graphWindow.document.close();
      }
    } catch (error) {
      setErrors(['Invalid JSON: Cannot generate graph']);
    }
  }, [jsonInput]);

  // Save JSON
  const handleSave = useCallback(() => {
    const blob = new Blob([jsonOutput || jsonInput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [jsonInput, jsonOutput]);

  // Print JSON
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Print JSON</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h2>JSON Document</h2>
          <pre>${jsonOutput || jsonInput}</pre>
          <script>window.print(); window.close();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  }, [jsonInput, jsonOutput]);

  // Validate JSON
  const handleValidate = useCallback(() => {
    try {
      JSON.parse(jsonInput);
      setErrors([]);
      alert('✓ Valid JSON!');
    } catch (error) {
      setErrors(['Invalid JSON: ' + (error as Error).message]);
      alert('✗ Invalid JSON:\n' + (error as Error).message);
    }
  }, [jsonInput]);

  // Clear
  const handleClear = useCallback(() => {
    setJsonInput('');
    setJsonOutput('');
    setErrors([]);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput || jsonInput);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  }, [jsonInput, jsonOutput]);

  // Fullscreen
  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            handleFormat(2);
            break;
          case 'm':
            e.preventDefault();
            handleMinify();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'p':
            e.preventDefault();
            handlePrint();
            break;
          case 'z':
            e.preventDefault();
            handleUndo();
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
        }
      } else if (e.key === 'F11') {
        e.preventDefault();
        handleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        handleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormat, handleMinify, handleSave, handlePrint, handleUndo, handleRedo, handleFullscreen, isFullscreen]);

  return (
    <div className={`json-editor-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <JsonToolbar
        onFormat={handleFormat}
        onMinify={handleMinify}
        onSort={handleSort}
        onRepair={handleRepair}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onGenerateSample={handleGenerateSample}
        onViewGraph={handleViewGraph}
        onSave={handleSave}
        onPrint={handlePrint}
        onValidate={handleValidate}
        onClear={handleClear}
        onCopy={handleCopy}
        onFullscreen={handleFullscreen}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasErrors={errors.length > 0}
        errorCount={errors.length}
        isFullscreen={isFullscreen}
      />

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{errors[0]}</span>
        </div>
      )}

      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="copy-toast">
          ✓ Copied to clipboard!
        </div>
      )}

      {/* Editor Area */}
      <div className="editor-area">
        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-title">📝 Input JSON</span>
            <span className="panel-info">{jsonInput.length} characters</span>
          </div>
          <div className="textarea-with-line-numbers">
            {/* Line Numbers for Input */}
            <div
              ref={inputLineNumbersRef}
              className="line-numbers"
              aria-hidden="true"
            >
              {jsonInput.split('\n').map((_, index) => (
                <div key={index} className="line-number">
                  {index + 1}
                </div>
              ))}
              {jsonInput === '' && <div className="line-number">1</div>}
            </div>
            {/* Input Textarea */}
            <textarea
              ref={inputTextareaRef}
              className="json-textarea"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              onScroll={handleInputScroll}
              placeholder="Paste your JSON here..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-title">✨ Output JSON</span>
            <span className="panel-info">{jsonOutput.length} characters</span>
          </div>
          <div className="textarea-with-line-numbers">
            {/* Line Numbers for Output */}
            <div
              ref={outputLineNumbersRef}
              className="line-numbers"
              aria-hidden="true"
            >
              {jsonOutput.split('\n').map((_, index) => (
                <div key={index} className="line-number">
                  {index + 1}
                </div>
              ))}
              {jsonOutput === '' && <div className="line-number">1</div>}
            </div>
            {/* Output Textarea */}
            <textarea
              ref={outputTextareaRef}
              className="json-textarea"
              value={jsonOutput}
              onScroll={handleOutputScroll}
              readOnly
              placeholder="Formatted JSON will appear here..."
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <style>{`
        .json-editor-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #fafafa;
        }

        .json-editor-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          color: white;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
        }

        .error-icon {
          font-size: 20px;
        }

        .copy-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(17, 153, 142, 0.4);
          animation: slideIn 0.3s ease-out;
          z-index: 10000;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .editor-area {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 20px;
          flex: 1;
          overflow: hidden;
        }

        .editor-panel {
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
        }

        .panel-title {
          font-size: 16px;
        }

        .panel-info {
          font-size: 12px;
          opacity: 0.9;
        }

        .textarea-with-line-numbers {
          flex: 1;
          display: flex;
          overflow: hidden;
          background: #fafafa;
        }

        .line-numbers {
          padding: 20px 12px 20px 20px;
          background: #f0f0f0;
          border-right: 1px solid #d0d0d0;
          text-align: right;
          color: #999;
          font-family: 'Fira Code', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.6;
          user-select: none;
          overflow-y: hidden;
          min-width: 50px;
        }

        .line-number {
          height: 22.4px;
          line-height: 1.6;
        }

        .json-textarea {
          flex: 1;
          padding: 20px;
          border: none;
          font-family: 'Fira Code', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          outline: none;
          background: #fafafa;
        }

        .json-textarea::placeholder {
          color: #999;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .editor-area {
            grid-template-columns: 1fr;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default JsonEditorWithToolbar;

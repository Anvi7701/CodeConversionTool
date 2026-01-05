import React, { useMemo, useRef, useCallback, useState } from 'react';
import { CodeMirrorViewer } from './CodeMirrorViewer';
import { JsonToolbar } from './JsonToolbar';
import './JsonToolbar.css';
import { fixSimpleJsonErrors } from '../utils/simpleJsonFixer';

function sortObject(input: any, direction: 'asc' | 'desc', sortBy: 'keys' | 'values'): any {
  if (Array.isArray(input)) return input.map((v) => sortObject(v, direction, sortBy));
  if (input && typeof input === 'object') {
    const keys = Object.keys(input);
    const compare = (a: string, b: string) => {
      if (sortBy === 'keys') return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      const av = JSON.stringify(input[a]);
      const bv = JSON.stringify(input[b]);
      return direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    };
    const out: any = {};
    keys.sort(compare).forEach((k) => { out[k] = sortObject((input as any)[k], direction, sortBy); });
    return out;
  }
  return input;
}

export interface EditorWithToolbarProps {
  side: 'left' | 'right';
  value: string;
  onChange: (next: string) => void;
  className?: string;
  editorHeight?: string; // e.g. '50vh'
}

export const EditorWithToolbar: React.FC<EditorWithToolbarProps> = ({ side, value, onChange, className = '', editorHeight = '50vh' }) => {
  const parseError = useMemo(() => {
    if (!value || !value.trim()) return null;
    try { JSON.parse(value); return null; } catch (e: any) { return e.message || 'Invalid JSON'; }
  }, [value]);

  const hasErrors = !!parseError;
  const errorCount = parseError ? 1 : 0;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expandAllTrigger, setExpandAllTrigger] = useState(false);
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(false);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const applyingFromHistoryRef = useRef(false);

  const triggerUpload = () => {
    try { fileInputRef.current?.click(); } catch {}
  };

  const handleFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      handleEditorChange(text);
    } catch {}
    // Reset input value so selecting the same file again still triggers change
    try { e.target.value = ''; } catch {}
  };

  const handleGenerateSample = useCallback((template: string) => {
    const samples: Record<string, any> = {
      user: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        isActive: true,
        address: { street: '123 Main St', city: 'New York', country: 'USA' }
      },
      api: {
        status: 'success',
        data: [
          { id: 1, title: 'Item 1', price: 29.99 },
          { id: 2, title: 'Item 2', price: 49.99 }
        ],
        meta: { total: 2, page: 1, perPage: 10 }
      },
      config: {
        appName: 'My Application',
        version: '1.0.0',
        settings: { theme: 'dark', language: 'en', notifications: true },
        endpoints: { api: 'https://api.example.com', cdn: 'https://cdn.example.com' }
      },
      array: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ],
      nested: {
        level1: { level2: { level3: { level4: { value: 'Deep nested value' } } } }
      }
    };
    const sample = samples[template] || samples.user;
    try {
      const formatted = JSON.stringify(sample, null, 2);
      handleEditorChange(formatted);
    } catch {}
  }, [onChange]);

  const handleExpandAll = useCallback(() => {
    setExpandAllTrigger(true);
    setTimeout(() => setExpandAllTrigger(false), 120);
  }, []);

  const handleCollapseAll = useCallback(() => {
    setCollapseAllTrigger(true);
    setTimeout(() => setCollapseAllTrigger(false), 120);
  }, []);

  const handleEditorChange = useCallback((next: string) => {
    if (!applyingFromHistoryRef.current) {
      setHistory(prev => {
        const current = prev[historyIndex] ?? '';
        if (next === current) return prev;
        const newHist = [...prev.slice(0, historyIndex + 1), next];
        setHistoryIndex(newHist.length - 1);
        return newHist;
      });
    }
    onChange(next);
  }, [historyIndex, onChange]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      applyingFromHistoryRef.current = true;
      const prevValue = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onChange(prevValue);
      setTimeout(() => { applyingFromHistoryRef.current = false; }, 0);
    }
  }, [history, historyIndex, onChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      applyingFromHistoryRef.current = true;
      const nextValue = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onChange(nextValue);
      setTimeout(() => { applyingFromHistoryRef.current = false; }, 0);
    }
  }, [history, historyIndex, onChange]);

  // Initialize history when component mounts or when external value changes drastically
  React.useEffect(() => {
    // If value differs from current history position and not due to undo/redo push it
    if (!applyingFromHistoryRef.current) {
      setHistory(prev => {
        const current = prev[historyIndex] ?? '';
        if (value === current) return prev;
        const newHist = [...prev.slice(0, historyIndex + 1), value];
        setHistoryIndex(newHist.length - 1);
        return newHist;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <section className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
      {/* Input toolbar */}
      <div className="p-2 border-b border-slate-700 bg-slate-900/40 sticky top-0 z-10">
        <JsonToolbar
          onFormat={(indent) => {
            try { const obj = JSON.parse(value || ''); handleEditorChange(JSON.stringify(obj, null, indent || 2)); } catch {}
          }}
          onMinify={() => { try { const obj = JSON.parse(value || ''); handleEditorChange(JSON.stringify(obj)); } catch {} }}
          onSort={(dir, by) => { try { const obj = JSON.parse(value || ''); const sorted = sortObject(obj, dir, by); handleEditorChange(JSON.stringify(sorted, null, 2)); } catch {} }}
          onRepair={() => { try { const result = fixSimpleJsonErrors(value || ''); if (result && result.fixed && result.fixed.trim()) handleEditorChange(result.fixed); } catch {} }}
          onValidate={() => { try { JSON.parse(value || ''); } catch (e) { /* no-op: toolbar badge already indicates error */ } }}
          onClear={() => handleEditorChange('')}
          onCopy={() => { try { navigator.clipboard.writeText(value || ''); } catch {} }}
          onGenerateSample={handleGenerateSample}
          onUploadJson={triggerUpload}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          hasErrors={hasErrors}
          errorCount={errorCount}
          disabled={false}
          language="json"
          variant="compact"
          formatLabel="Format"
          sampleVariant="icon"
          validateInPrimaryRibbon={true}
          historyPlacement="secondary"
        />
      </div>

      {/* Editor with a slim left rail */}
      <div className="relative flex" style={{ height: editorHeight }}>
        <div className="flex-shrink-0 w-10 flex flex-col gap-2 items-center justify-start pt-2 pb-2 border-r border-slate-700 bg-slate-900/30">
          <button title="Clear" className="icon-plain no-ring text-slate-300 hover:text-white border border-white/20 rounded-md px-2 py-1" onClick={() => onChange('')}>🧽</button>
          <button title="Copy" className="icon-plain no-ring text-slate-300 hover:text-white border border-white/20 rounded-md px-2 py-1" onClick={() => { try { navigator.clipboard.writeText(value || ''); } catch {} }}>📋</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json,text/plain" className="hidden" onChange={handleFileSelected} />
        </div>
        <div className="flex-1 relative">
          <CodeMirrorViewer code={value} language="json" onChange={handleEditorChange} readOnly={false} expandAll={expandAllTrigger} collapseAll={collapseAllTrigger} />
        </div>
      </div>
    </section>
  );
};

export default EditorWithToolbar;

import React, { useMemo } from 'react';
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

  return (
    <section className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
      {/* Input toolbar */}
      <div className="p-2 border-b border-slate-700 bg-slate-900/40 sticky top-0 z-10">
        <JsonToolbar
          onFormat={(indent) => {
            try { const obj = JSON.parse(value || ''); onChange(JSON.stringify(obj, null, indent || 2)); } catch {}
          }}
          onMinify={() => { try { const obj = JSON.parse(value || ''); onChange(JSON.stringify(obj)); } catch {} }}
          onSort={(dir, by) => { try { const obj = JSON.parse(value || ''); const sorted = sortObject(obj, dir, by); onChange(JSON.stringify(sorted, null, 2)); } catch {} }}
          onRepair={() => { try { const fixed = fixSimpleJsonErrors(value || ''); if (fixed && fixed.trim()) onChange(fixed); } catch {} }}
          onValidate={() => { try { JSON.parse(value || ''); } catch (e) { /* no-op: toolbar badge already indicates error */ } }}
          onClear={() => onChange('')}
          onCopy={() => { try { navigator.clipboard.writeText(value || ''); } catch {} }}
          hasErrors={hasErrors}
          errorCount={errorCount}
          disabled={false}
          language="json"
          variant="compact"
          formatLabel="Format"
        />
      </div>

      {/* Editor with a slim left rail */}
      <div className="relative flex" style={{ height: editorHeight }}>
        <div className="flex-shrink-0 w-10 flex flex-col gap-2 items-center justify-start pt-2 pb-2 border-r border-slate-700 bg-slate-900/30">
          <button title="Clear" className="icon-plain no-ring text-slate-300 hover:text-white border border-white/20 rounded-md px-2 py-1" onClick={() => onChange('')}>🧽</button>
          <button title="Copy" className="icon-plain no-ring text-slate-300 hover:text-white border border-white/20 rounded-md px-2 py-1" onClick={() => { try { navigator.clipboard.writeText(value || ''); } catch {} }}>📋</button>
          <button title="Beautify" className="icon-plain no-ring text-slate-300 hover:text-white border border-white/20 rounded-md px-2 py-1" onClick={() => { try { const o = JSON.parse(value || ''); onChange(JSON.stringify(o, null, 2)); } catch {} }}>🎨</button>
        </div>
        <div className="flex-1 relative">
          <CodeMirrorViewer code={value} language="json" onChange={onChange} readOnly={false} />
        </div>
      </div>
    </section>
  );
};

export default EditorWithToolbar;

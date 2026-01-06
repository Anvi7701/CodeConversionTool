import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CodeMirrorViewer } from './CodeMirrorViewer';
import { EditorWithToolbar } from './EditorWithToolbar';
import { diffJson } from '../lib/diff/engine';
import type { DiffEntry, DiffOptions } from '../lib/diff/types';
import { serializeWithLineMap } from '../lib/diff/engine';
import SEO from './SEO';
import { JsonCompareModal } from './JsonCompareModal';

interface EditorState {
  raw: string;
  formatted: string;
  pathToLine: Map<string, number>;
  highlightLine?: number;
  highlightKey: number;
}

function useEditorState(initial: string): [EditorState, (next: string) => void, (formatted: string, pathToLine: Map<string, number>) => void, (line?: number) => void] {
  const [state, setState] = useState<EditorState>({ raw: initial, formatted: initial, pathToLine: new Map(), highlightKey: 0 });
  const setRaw = (next: string) => setState(s => ({ ...s, raw: next }));
  const setFormatted = (formatted: string, pathToLine: Map<string, number>) => setState(s => ({ ...s, formatted, pathToLine }));
  const setHighlightLine = (line?: number) => setState(s => ({ ...s, highlightLine: line, highlightKey: s.highlightKey + 1 }));
  return [state, setRaw, setFormatted, setHighlightLine];
}

function DiffChip({ label, count, active, onToggle }: { label: string; count: number; active: boolean; onToggle: () => void }) {
  return (
    <button
      className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-200 border-slate-700'}`}
      onClick={onToggle}
      aria-pressed={active}
    >{label} · {count}</button>
  );
}

export default function JsonComparePage() {
  const [left, setLeftRaw, setLeftFormatted, setLeftHighlight] = useEditorState('');
  const [right, setRightRaw, setRightFormatted, setRightHighlight] = useEditorState('');
  const [opts, setOpts] = useState<DiffOptions>({ arrayMatchKey: '', numericTolerance: 0, ignorePaths: [] });
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [activeTypes, setActiveTypes] = useState<Record<string, boolean>>({ added: true, removed: true, changed: true });
  const filteredDiffs = useMemo(() => diffs.filter(d => activeTypes[d.type]), [diffs, activeTypes]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [showModal, setShowModal] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const bothEmpty = (left.raw.trim().length === 0) && (right.raw.trim().length === 0);

  // Counts and filter chips removed from page; retained in Compare popup only

  function formatBothAndDiff() {
    try {
      const lObj = left.raw ? JSON.parse(left.raw) : {};
      const rObj = right.raw ? JSON.parse(right.raw) : {};
      const lSer = serializeWithLineMap(lObj, 2, opts.arrayMatchKey?.trim() || undefined);
      const rSer = serializeWithLineMap(rObj, 2, opts.arrayMatchKey?.trim() || undefined);
      setLeftFormatted(lSer.text, lSer.pathToLine);
      setRightFormatted(rSer.text, rSer.pathToLine);
      const cleaned: DiffOptions = {
        arrayMatchKey: opts.arrayMatchKey?.trim() || undefined,
        numericTolerance: typeof opts.numericTolerance === 'number' ? opts.numericTolerance : undefined,
        ignorePaths: (opts.ignorePaths || []).filter(Boolean)
      };
      const result = diffJson(lObj, rObj, cleaned);
      setDiffs(result.entries);
      setShowModal(true);
    } catch (e: any) {
      alert('Invalid JSON in one of the editors.');
    }
  }

  function gotoDiff(i: number) {
    if (i < 0 || i >= filteredDiffs.length) return;
    setSelectedIdx(i);
    const entry = filteredDiffs[i];
    const lLine = left.pathToLine.get(entry.path);
    const rLine = right.pathToLine.get(entry.path);
    if (typeof lLine === 'number') setLeftHighlight(lLine);
    if (typeof rLine === 'number') setRightHighlight(rLine);
    // Ensure the selected item stays in view within the list
    const container = listRef.current;
    if (container) {
      const el = container.querySelector(`[data-idx="${i}"]`);
      if (el && (el as HTMLElement).scrollIntoView) {
        (el as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }

  // Clamp and initialize selection whenever the filtered list changes
  useEffect(() => {
    if (filteredDiffs.length === 0) {
      setSelectedIdx(-1);
      return;
    }
    if (selectedIdx < 0 || selectedIdx >= filteredDiffs.length) {
      gotoDiff(0);
    }
  }, [filteredDiffs.length]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <SEO title="JSON Compare – Side-by-side Diff for JSON" description="Compare two JSON documents side-by-side. See added, removed, and changed paths with quick navigation and filters." keywords="json compare online, json diff, compare json objects, json side by side" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-100">JSON Compare</h1>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300">Array match key</label>
            <input value={opts.arrayMatchKey || ''} onChange={e => setOpts(o => ({ ...o, arrayMatchKey: e.target.value }))} className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 placeholder-slate-500" placeholder="id" />
            <label className="text-xs text-slate-300">Numeric tolerance</label>
            <input type="number" value={opts.numericTolerance || 0} onChange={e => setOpts(o => ({ ...o, numericTolerance: Number(e.target.value) }))} className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-20 text-slate-800 placeholder-slate-500" />
          </div>
        </header>

        {/* Page-level diff summary and chips removed as requested (kept in modal) */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <EditorWithToolbar side="left" value={left.raw} onChange={setLeftRaw} editorHeight="50vh" onCompare={formatBothAndDiff} highlightUploadSample={bothEmpty} />
          <EditorWithToolbar side="right" value={right.raw} onChange={setRightRaw} editorHeight="50vh" onCompare={formatBothAndDiff} highlightUploadSample={bothEmpty} />
        </div>

        <section className="mt-3 bg-slate-800 rounded-lg border border-slate-700 p-3">
          <div className="flex items-center gap-2 mb-2">
            <DiffChip label="Added" count={diffs.filter(d => d.type === 'added').length} active={activeTypes.added} onToggle={() => setActiveTypes(s => ({ ...s, added: !s.added }))} />
            <DiffChip label="Removed" count={diffs.filter(d => d.type === 'removed').length} active={activeTypes.removed} onToggle={() => setActiveTypes(s => ({ ...s, removed: !s.removed }))} />
            <DiffChip label="Changed" count={diffs.filter(d => d.type === 'changed').length} active={activeTypes.changed} onToggle={() => setActiveTypes(s => ({ ...s, changed: !s.changed }))} />
            <div className="ml-auto flex items-center gap-2">
              <button disabled={filteredDiffs.length === 0} onClick={() => gotoDiff(Math.max(0, selectedIdx - 1))} className="px-2 py-1 text-xs rounded bg-slate-700 disabled:opacity-50">Prev</button>
              <button disabled={filteredDiffs.length === 0} onClick={() => gotoDiff(Math.min(filteredDiffs.length - 1, selectedIdx + 1))} className="px-2 py-1 text-xs rounded bg-slate-700 disabled:opacity-50">Next</button>
            </div>
          </div>
          <div ref={listRef} className="max-h-64 overflow-auto">
            {filteredDiffs.length === 0 && (
              <div className="text-slate-400 text-sm">No differences. Paste JSON above and click Compare.</div>
            )}
            {filteredDiffs.map((d, idx) => (
              <button key={idx} data-idx={idx} onClick={() => gotoDiff(idx)} className={`w-full text-left px-2 py-1 rounded ${idx === selectedIdx ? 'bg-slate-700' : 'hover:bg-slate-700'}`}>
                <span className={`inline-block w-16 text-xs ${d.type === 'added' ? 'text-green-400' : d.type === 'removed' ? 'text-red-400' : 'text-yellow-300'}`}>{d.type.toUpperCase()}</span>
                <span className="text-xs text-slate-200">{d.path || '/'}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-3 bg-slate-800 rounded-lg border border-slate-700 p-3">
          <label className="block text-xs text-slate-300 mb-1">Ignore paths (one per line)</label>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs h-24 text-slate-100 placeholder-slate-500"
            value={(opts.ignorePaths || []).join('\n')}
            onChange={e => setOpts(o => ({ ...o, ignorePaths: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))}
            placeholder="/users/0/name\n/settings/theme"
          />
        </section>
      </div>

      {showModal && (
        <JsonCompareModal
          leftText={left.formatted}
          rightText={right.formatted}
          leftPathToLine={left.pathToLine}
          rightPathToLine={right.pathToLine}
          diffs={diffs}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

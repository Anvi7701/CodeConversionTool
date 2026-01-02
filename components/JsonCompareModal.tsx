import React, { useMemo, useRef, useState, useEffect } from 'react';
import { CodeMirrorViewer } from './CodeMirrorViewer';
import type { DiffEntry } from '../lib/diff/types';

interface JsonCompareModalProps {
  leftText: string;
  rightText: string;
  leftPathToLine: Map<string, number>;
  rightPathToLine: Map<string, number>;
  diffs: DiffEntry[];
  onClose: () => void;
}

type DiffCategory = 'missing' | 'incorrectType' | 'unequal';

function categorizeDiff(d: DiffEntry): DiffCategory {
  if (d.type === 'added' || d.type === 'removed') return 'missing';
  const lt = typeof d.leftValue;
  const rt = typeof d.rightValue;
  if (lt !== rt) return 'incorrectType';
  return 'unequal';
}

export const JsonCompareModal: React.FC<JsonCompareModalProps> = ({ leftText, rightText, leftPathToLine, rightPathToLine, diffs, onClose }) => {
  const [filters, setFilters] = useState<{ missing: boolean; incorrectType: boolean; unequal: boolean }>({ missing: true, incorrectType: true, unequal: true });
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [leftHighlight, setLeftHighlight] = useState<number | undefined>(undefined);
  const [leftKey, setLeftKey] = useState(0);
  const [rightHighlight, setRightHighlight] = useState<number | undefined>(undefined);
  const [rightKey, setRightKey] = useState(0);
  const [decorKey, setDecorKey] = useState(0);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const withCategory = useMemo(() => diffs.map(d => ({ d, c: categorizeDiff(d) })), [diffs]);
  const counts = useMemo(() => {
    return {
      missing: withCategory.filter(x => x.c === 'missing').length,
      incorrectType: withCategory.filter(x => x.c === 'incorrectType').length,
      unequal: withCategory.filter(x => x.c === 'unequal').length,
      total: diffs.length,
    };
  }, [withCategory, diffs.length]);
  const filtered = useMemo(() => withCategory.filter(x => filters[x.c]).map(x => x.d), [withCategory, filters]);

  function findNearestLine(path: string, map: Map<string, number>): number | undefined {
    if (map.has(path)) return map.get(path);
    let current = path;
    while (current && current !== '') {
      const idx = current.lastIndexOf('/');
      if (idx <= 0) break;
      current = current.slice(0, idx);
      if (map.has(current)) return map.get(current);
    }
    return undefined;
  }

  const leftBackgrounds = useMemo(() => {
    const lines: Record<number, string> = {};
    for (const d of filtered) {
      const cat = categorizeDiff(d);
      if (cat === 'missing') {
        const ln = findNearestLine(d.path, leftPathToLine);
        if (typeof ln === 'number') lines[ln] = 'diff-missing';
      } else if (cat === 'incorrectType') {
        const ln = findNearestLine(d.path, leftPathToLine);
        if (typeof ln === 'number') lines[ln] = 'diff-incorrect';
      } else {
        const ln = findNearestLine(d.path, leftPathToLine);
        if (typeof ln === 'number') lines[ln] = 'diff-unequal';
      }
    }
    return Object.entries(lines).map(([line, cls]) => ({ line: Number(line), className: cls }));
  }, [filtered, leftPathToLine]);

  const rightBackgrounds = useMemo(() => {
    const lines: Record<number, string> = {};
    for (const d of filtered) {
      const cat = categorizeDiff(d);
      if (cat === 'missing') {
        const ln = findNearestLine(d.path, rightPathToLine);
        if (typeof ln === 'number') lines[ln] = 'diff-missing';
      } else if (cat === 'incorrectType') {
        const ln = findNearestLine(d.path, rightPathToLine);
        if (typeof ln === 'number') lines[ln] = 'diff-incorrect';
      } else {
        const ln = findNearestLine(d.path, rightPathToLine);
        if (typeof ln === 'number') lines[ln] = 'diff-unequal';
      }
    }
    return Object.entries(lines).map(([line, cls]) => ({ line: Number(line), className: cls }));
  }, [filtered, rightPathToLine]);

  function goto(i: number) {
    if (i < 0 || i >= filtered.length) return;
    setSelectedIdx(i);
    const entry = filtered[i];
    const l = leftPathToLine.get(entry.path);
    const r = rightPathToLine.get(entry.path);
    if (typeof l === 'number') { setLeftHighlight(l); setLeftKey(k => k + 1); }
    if (typeof r === 'number') { setRightHighlight(r); setRightKey(k => k + 1); }
    setDecorKey(k => k + 1);
  }

  function next() {
    const base = selectedIdx < 0 ? 0 : selectedIdx;
    const n = (base + 1) >= filtered.length ? filtered.length - 1 : base + 1;
    goto(n);
  }

  function prev() {
    const base = selectedIdx < 0 ? 0 : selectedIdx;
    const n = (base - 1) < 0 ? 0 : base - 1;
    goto(n);
  }

  // Clamp and initialize selection when the filtered list changes
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedIdx(-1);
      return;
    }
    if (selectedIdx < 0 || selectedIdx >= filtered.length) {
      goto(0);
    }
  }, [filtered.length]);

  // Ensure the selected item in the sidebar stays in view
  useEffect(() => {
    const container = sidebarRef.current;
    if (!container || selectedIdx < 0) return;
    const el = container.querySelector(`[data-idx="${selectedIdx}"]`);
    if (el && (el as HTMLElement).scrollIntoView) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  // Keyboard shortcuts: ArrowLeft/ArrowRight navigate, Esc closes, 1/2/3 toggle filters
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goto(Math.max(0, (selectedIdx === -1 ? 0 : selectedIdx) - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goto(Math.min(filtered.length - 1, (selectedIdx === -1 ? 0 : selectedIdx) + 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '1') {
        setFilters(f => ({ ...f, missing: !f.missing }));
      } else if (e.key === '2') {
        setFilters(f => ({ ...f, incorrectType: !f.incorrectType }));
      } else if (e.key === '3') {
        setFilters(f => ({ ...f, unequal: !f.unequal }));
      }
      setDecorKey(k => k + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered.length, selectedIdx, onClose]);

  function messageFor(entry: DiffEntry): string {
    const cat = categorizeDiff(entry);
    if (cat === 'missing') {
      return entry.type === 'added' ? 'Missing in base; present in compare.' : 'Present in base; missing in compare.';
    }
    if (cat === 'incorrectType') {
      return `Type mismatch: ${typeof entry.leftValue} vs ${typeof entry.rightValue}.`;
    }
    return 'Values are unequal.';
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col text-slate-800">
      {/* Header banner */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow">
        <div className="font-semibold text-lg">JSON Compare</div>
        <button onClick={onClose} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded">Back To Compare</button>
      </div>

      {/* Controls row */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-6 text-sm text-slate-800">
        <div className="px-3 py-1 border rounded bg-slate-50 text-slate-800 font-medium">Found {counts.total} differences</div>
        <div className="flex items-center gap-3">
          <span className="text-slate-800">Show:</span>
          {/* Missing properties chip (matches red row tint) */}
          <button
            type="button"
            onClick={() => setFilters(f => ({ ...f, missing: !f.missing }))}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs ${filters.missing ? 'ring-1 ring-red-400' : ''}`}
            style={{ backgroundColor: 'rgba(255, 0, 0, 0.12)', borderColor: 'rgba(255, 0, 0, 0.35)' }}
            aria-pressed={filters.missing}
          >
            <input type="checkbox" checked={filters.missing} readOnly className="accent-red-600" />
            <span>{counts.missing} missing properties</span>
          </button>
          {/* Incorrect types chip (matches blue row tint) */}
          <button
            type="button"
            onClick={() => setFilters(f => ({ ...f, incorrectType: !f.incorrectType }))}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs ${filters.incorrectType ? 'ring-1 ring-blue-400' : ''}`}
            style={{ backgroundColor: 'rgba(0, 128, 255, 0.12)', borderColor: 'rgba(0, 128, 255, 0.35)' }}
            aria-pressed={filters.incorrectType}
          >
            <input type="checkbox" checked={filters.incorrectType} readOnly className="accent-blue-600" />
            <span>{counts.incorrectType} incorrect types</span>
          </button>
          {/* Unequal values chip (matches amber row tint) */}
          <button
            type="button"
            onClick={() => setFilters(f => ({ ...f, unequal: !f.unequal }))}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs ${filters.unequal ? 'ring-1 ring-amber-400' : ''}`}
            style={{ backgroundColor: 'rgba(255, 200, 0, 0.15)', borderColor: 'rgba(255, 200, 0, 0.4)' }}
            aria-pressed={filters.unequal}
          >
            <input type="checkbox" checked={filters.unequal} readOnly className="accent-amber-600" />
            <span>{counts.unequal} unequal values</span>
          </button>
        </div>
      </div>

      {/* Body area */}
      <div className="flex-1 bg-slate-100 grid grid-cols-12">
        {/* Editors */}
        <div className="col-span-9 grid grid-cols-2 gap-2 p-2 overflow-hidden">
          <section className="bg-white border rounded relative h-full">
            <div className="absolute inset-0">
              <CodeMirrorViewer
                code={leftText}
                language="json"
                readOnly={true}
                highlightLine={leftHighlight}
                highlightTrigger={leftKey}
                lineBackgrounds={leftBackgrounds}
                backgroundsKey={decorKey}
              />
            </div>
          </section>
          <section className="bg-white border rounded relative h-full">
            <div className="absolute inset-0">
              <CodeMirrorViewer
                code={rightText}
                language="json"
                readOnly={true}
                highlightLine={rightHighlight}
                highlightTrigger={rightKey}
                lineBackgrounds={rightBackgrounds}
                backgroundsKey={decorKey}
              />
            </div>
          </section>
        </div>

        {/* Sidebar with navigation and messages */}
        <aside className="col-span-3 border-l bg-white flex flex-col text-slate-800">
          <div className="p-3 border-b flex items-center justify-between text-xs">
            <div>{selectedIdx >= 0 ? `${selectedIdx + 1} of ${filtered.length}` : filtered.length === 0 ? '0 of 0' : `1 of ${filtered.length}`}</div>
            <div className="flex gap-2">
              <button className="px-2 py-1 border rounded" disabled={filtered.length === 0} onClick={prev}>{'<'}</button>
              <button className="px-2 py-1 border rounded" disabled={filtered.length === 0} onClick={next}>{'>'}</button>
            </div>
          </div>
          <div ref={sidebarRef} className="p-3 text-sm max-h-64 overflow-auto">
            {filtered.length === 0 && <div className="text-slate-600">No differences with current filters.</div>}
            {filtered.length > 0 && (
              <div className="space-y-2">
                {filtered.map((d, idx) => (
                  <button key={idx} data-idx={idx} onClick={() => goto(idx)} className={`w-full text-left px-2 py-1 rounded ${idx === selectedIdx ? 'bg-slate-200' : 'hover:bg-slate-100'}`}>
                    <div className="text-xs font-mono text-slate-800">{d.path || '/'}</div>
                    <div className="text-xs text-slate-700">{messageFor(d)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

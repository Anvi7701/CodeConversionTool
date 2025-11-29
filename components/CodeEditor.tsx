import React, { useRef, useEffect, useState, useMemo, useImperativeHandle } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { foldGutter, foldAll, unfoldAll } from '@codemirror/language';
import { lineNumbers } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

interface ErrorPosition {
  line: number;
  column: number;
  message?: string;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onPaste?: (pastedText: string) => void;
  placeholder?: string;
  errorLine?: number | null;
  errorLines?: ErrorPosition[]; // Support multiple error lines
  lineStyleMap?: Record<number, 'simple' | 'complex' | 'comment'>;
  highlightLine?: number | null;
  highlightStyle?: 'simple' | 'complex' | 'comment' | null;
  highlightPulse?: boolean;
  disableAutoScroll?: boolean;
  renderLeftRail?: React.ReactNode; // Optional vertical action rail inside editor
  editorApiRef?: React.Ref<{ foldAll: () => void; unfoldAll: () => void }>; // Expose folding API to parent
}

// Simple CSS-injected line decorations for error/comment/simple markers
const markerClassFor = (style?: 'simple' | 'complex' | 'comment') => {
  if (style === 'complex') return 'cm-ln-bg-complex';
  if (style === 'comment') return 'cm-ln-bg-comment';
  if (style === 'simple') return 'cm-ln-bg-simple';
  return '';
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, onPaste, placeholder, errorLine, errorLines, lineStyleMap, highlightLine, highlightStyle, highlightPulse, disableAutoScroll, renderLeftRail, editorApiRef }) => {
  const viewRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build line decorations for error/comment/simple markers
  const decorations = useMemo(() => {
    if (!lineStyleMap && !errorLines) return [];
    const map: Record<number, 'simple' | 'complex' | 'comment'> = { ...(lineStyleMap || {}) };
    if (errorLines) {
      for (const e of errorLines) {
        if (!map[e.line]) map[e.line] = 'complex';
      }
    }
    return Object.entries(map).map(([line, style]) => ({ line: Number(line), style }));
  }, [lineStyleMap, errorLines]);

  // Custom theme & gutter styling
  const theme = useMemo(() => EditorView.theme({
    '&': { height: '100%' },
    '.cm-content': { fontFamily: 'monospace', fontSize: '13px' },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 3px 0 2px', color: '#000' },
    // Match Output formatter gutter background (slate tone) and sizing per individual gutters
    '.cm-gutters': { border: 'none', gap: '0px' },
    '.cm-gutter': { background: 'rgba(226, 232, 240, 0.6)', border: 'none' },
    '.cm-gutter.cm-lineNumbers': { width: '24px', minWidth: '24px' },
    '.cm-gutter.cm-foldGutter': { width: '18px', minWidth: '18px' },
    '.dark .cm-gutter': { background: 'rgba(51, 65, 85, 0.35)' },
    '.dark .cm-lineNumbers .cm-gutterElement': { color: '#fff' },
    '.cm-scroller': { fontFamily: 'monospace', overflow: 'auto' },
    '.cm-line': { lineHeight: '20px' },
    // Single solid arrow styling
    '.cm-foldGutter .cm-gutterElement': { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    '.cm-foldGutter .cm-gutterElement > span': { color: '#000', fontWeight: 700, fontSize: '14px' },
    '.cm-foldGutter .cm-gutterElement > span + span': { display: 'none' },
    '.dark .cm-foldGutter .cm-gutterElement > span': { color: '#fff' },
  }), []);

  // Dynamic extension to apply background classes to lines
  // NOTE: Line background markers removed for now to resolve TS issues.
  const markerExtension = useMemo(() => [], [decorations]);

  // Imperative folding API
  useImperativeHandle(editorApiRef, () => ({
    foldAll: () => {
      if (!viewRef.current) return;
      const view = viewRef.current;
      foldAll(view);
    },
    unfoldAll: () => {
      if (!viewRef.current) return;
      const view = viewRef.current;
      unfoldAll(view);
    }
  }), []);

  // Scroll to highlight/error line
  useEffect(() => {
    if (disableAutoScroll) return;
    const targetLine = highlightLine || errorLine || (errorLines && errorLines.length ? errorLines[0].line : null);
    if (targetLine && viewRef.current) {
      const lineInfo = viewRef.current.state.doc.line(targetLine);
      viewRef.current.dispatch({ effects: EditorView.scrollIntoView(lineInfo.from) });
    }
  }, [highlightLine, errorLine, errorLines, disableAutoScroll]);

  // Handle paste to parent
  const handlePaste = (text: string) => {
    if (onPaste) onPaste(text);
  };

  const extensions = useMemo(() => {
    // Match Output's customFoldGutter using markerDOM (single solid arrow, black)
    const customFold = foldGutter({
      markerDOM: (open) => {
        const marker = document.createElement('span');
        marker.textContent = open ? '▼' : '▶';
        marker.style.cursor = 'pointer';
        marker.style.userSelect = 'none';
        marker.style.color = '#000'; // black arrow
        marker.title = open ? 'Fold' : 'Unfold';
        return marker;
      }
    });

    const ex: any[] = [
      lineNumbers(),
      customFold,
      theme
    ];
    if (language === 'json') ex.push(json());
    return ex;
  }, [language, theme]);

  return (
    <div ref={containerRef} className={`flex-grow w-full flex border border-slate-200 dark:border-slate-700 focus-within:ring-1 focus-within:ring-slate-300 dark:focus-within:ring-slate-600 focus-within:border-slate-300 dark:focus-within:border-slate-600 rounded-md min-h-0 relative`}>
      {renderLeftRail && (
        <div className="left-rail flex flex-col gap-2 pt-2 pl-2 pr-2 items-center bg-slate-50/60 dark:bg-slate-800/40 -ml-5">
          {renderLeftRail}
        </div>
      )}
      {renderLeftRail && <div className="w-px self-stretch bg-slate-300 dark:bg-slate-600" aria-hidden="true" />}
      <div className="flex-grow min-h-0 relative overflow-auto">
        <CodeMirror
          value={value}
          height="100%"
          extensions={extensions}
          basicSetup={{
            lineNumbers: false,
            highlightActiveLineGutter: false,
            foldGutter: false,
            highlightActiveLine: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true
          }}
          onCreateEditor={(view) => { viewRef.current = view; }}
          onChange={(val) => onChange(val)}
          placeholder={placeholder || (language ? `Enter your ${language.toUpperCase()} code here...` : 'Enter your code here...')}
          theme={undefined}
          editable={true}
          autoFocus={false}
          onPaste={(e) => {
            const text = e.clipboardData?.getData('text') || '';
            if (text && onPaste) onPaste(text);
          }}
        />
        {highlightLine && highlightStyle && (
          <div className={`absolute inset-x-0 pointer-events-none ${highlightPulse ? 'animate-pulse' : ''}`} style={{
            top: ((highlightLine - 1) * 20) + 'px',
            height: '20px',
            backgroundColor: highlightStyle === 'simple' ? 'rgba(16,185,129,0.15)' : highlightStyle === 'complex' ? 'rgba(239,68,68,0.15)' : 'rgba(168,85,247,0.15)'
          }} />
        )}
      </div>
    </div>
  );
};

// Inject minimal marker background styles (fallback simple CSS)
const styleElId = '__codeeditor_marker_styles';
if (typeof document !== 'undefined' && !document.getElementById(styleElId)) {
  const el = document.createElement('style');
  el.id = styleElId;
  el.textContent = `
    .cm-lineNumbers .cm-gutterElement { position: relative; }
    .cm-ln-bg-simple { background: rgba(16,185,129,0.12); color: rgb(16,185,129); }
    .dark .cm-ln-bg-simple { background: rgba(16,185,129,0.18); color: rgb(110,231,183); }
    .cm-ln-bg-complex { background: rgba(239,68,68,0.12); color: rgb(239,68,68); }
    .dark .cm-ln-bg-complex { background: rgba(239,68,68,0.18); color: rgb(252,165,165); }
    .cm-ln-bg-comment { background: rgba(168,85,247,0.12); color: rgb(168,85,247); }
    .dark .cm-ln-bg-comment { background: rgba(168,85,247,0.18); color: rgb(216,180,254); }
  `;
  document.head.appendChild(el);
}

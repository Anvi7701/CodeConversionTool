import React, { useRef, useEffect, useState, useMemo, useImperativeHandle } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { foldGutter, foldCode, unfoldCode } from '@codemirror/language';
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
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 4px' },
    '.cm-gutters': { background: 'transparent', border: 'none' },
    '.cm-scroller': { fontFamily: 'monospace' },
    '.cm-line': { lineHeight: '20px' },
    '.cm-foldGutter': { cursor: 'pointer' }
  }), []);

  // Dynamic extension to apply background classes to lines
  const markerExtension = useMemo(() => {
    return EditorView.decorations.compute([EditorState.doc], state => {
      const decos: any[] = [];
      for (const { line, style } of decorations) {
        if (line < 1 || line > state.doc.lines) continue;
        const lineInfo = state.doc.line(line);
        const cls = markerClassFor(style);
        if (cls) {
          decos.push(EditorView.decorations.of(EditorView.decorations({}))); // placeholder (avoid build errors if empty)
        }
      }
      return EditorView.decorations({});
    });
  }, [decorations]);

  // Imperative folding API
  useImperativeHandle(editorApiRef, () => ({
    foldAll: () => {
      if (!viewRef.current) return;
      const view = viewRef.current;
      for (let i = 1; i <= view.state.doc.lines; i++) {
        const line = view.state.doc.line(i);
        foldCode(view, line.from);
      }
    },
    unfoldAll: () => {
      if (!viewRef.current) return;
      const view = viewRef.current;
      for (let i = 1; i <= view.state.doc.lines; i++) {
        const line = view.state.doc.line(i);
        unfoldCode(view, line.from);
      }
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
    const ex: any[] = [lineNumbers(), foldGutter(), theme];
    if (language === 'json') ex.push(json());
    return ex;
  }, [language, theme]);

  return (
    <div ref={containerRef} className={`flex-grow w-full overflow-hidden flex border border-slate-200 dark:border-slate-700 focus-within:ring-1 focus-within:ring-slate-300 dark:focus-within:ring-slate-600 focus-within:border-slate-300 dark:focus-within:border-slate-600 rounded-md min-h-0 relative`}>
      {renderLeftRail && (
        <div className="flex flex-col gap-1.5 pt-2 pl-1.5 pr-1.5 items-center bg-slate-50/60 dark:bg-slate-800/40" style={{ width: '34px' }}>
          {renderLeftRail}
        </div>
      )}
      {renderLeftRail && <div className="w-px self-stretch bg-slate-300 dark:bg-slate-600" aria-hidden="true" />}
      <div className="flex-grow min-h-0 relative">
        <CodeMirror
          value={value}
          height="100%"
          extensions={extensions}
          basicSetup={{}} // keep minimal to avoid altering behavior elsewhere
          onCreateEditor={(view) => { viewRef.current = view; }}
          onChange={(val) => onChange(val)}
          placeholder={placeholder || (language ? `Enter your ${language.toUpperCase()} code here...` : 'Enter your code here...')}
          theme={undefined}
          editable={true}
          autoFocus={false}
          onPaste={handlePaste}
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

import React, { useRef, useEffect, useState, useMemo, useImperativeHandle } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { foldGutter, foldAll, unfoldAll } from '@codemirror/language';
import { lineNumbers } from '@codemirror/view';
import { EditorView, Decoration } from '@codemirror/view';
import { EditorState, StateField, StateEffect } from '@codemirror/state';
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
  showLineNumbers?: boolean; // Toggle input line numbers
  // Optional: override gutter background colors (light/dark) per page theme
  gutterColorLight?: string; // e.g., 'rgba(243, 232, 255, 0.6)' (purple-100)
  gutterColorDark?: string;  // e.g., 'rgba(76, 29, 149, 0.35)' (purple-900 tint)
}

// Simple CSS-injected line decorations for error/comment/simple markers
const markerClassFor = (style?: 'simple' | 'complex' | 'comment') => {
  if (style === 'complex') return 'cm-ln-bg-complex';
  if (style === 'comment') return 'cm-ln-bg-comment';
  if (style === 'simple') return 'cm-ln-bg-simple';
  return '';
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, onPaste, placeholder, errorLine, errorLines, lineStyleMap, highlightLine, highlightStyle, highlightPulse, disableAutoScroll, renderLeftRail, editorApiRef, showLineNumbers = true, gutterColorLight, gutterColorDark }) => {
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
    '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '14px', backgroundColor: '#ffffff' },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 4px', color: '#000' },
    // Gutter styling
    // Previous default (record for revert):
    //   light: 'rgba(226, 232, 240, 0.6)'  // slate-200/opacity
    //   dark:  'rgba(51, 65, 85, 0.35)'    // slate-700/opacity
    '.cm-gutters': { border: 'none', gap: '0px' },
    '.cm-gutter': { background: gutterColorLight ?? 'rgba(241, 245, 249, 0.5)', border: 'none' },
    '.cm-gutter.cm-foldGutter': { width: '18px', minWidth: '18px' },
    '.dark .cm-gutter': { background: gutterColorDark ?? 'rgba(51, 65, 85, 0.25)' },
    '.dark .cm-lineNumbers .cm-gutterElement': { color: '#fff' },
    // Surrounding area/background outside the text content
    '.cm-scroller': { fontFamily: 'inherit', overflow: 'auto', maxHeight: '100%' },
    // Make the editor container a subtle light cyan so it's clearly visible
    '.cm-editor': { backgroundColor: 'rgba(236, 254, 255, 0.8)', height: '100%' },
    // Dark theme variants
    '.dark .cm-editor': { backgroundColor: 'rgba(30, 41, 59, 0.45)' },
    '.dark .cm-content': { backgroundColor: '#0b0b0c' },
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

  // Scroll to and highlight line
  useEffect(() => {
    if (!viewRef.current) return;
    
    const targetLine = highlightLine || errorLine || (errorLines && errorLines.length ? errorLines[0].line : null);
    if (targetLine) {
      try {
        const view = viewRef.current;
        const lineInfo = view.state.doc.line(targetLine);
        
        // Step 1: Use EditorView.scrollIntoView to scroll AND render the target line.
        // CodeMirror 6 virtualizes content, so the line DOM may not exist until scrolled into view.
        view.dispatch({ 
          effects: EditorView.scrollIntoView(lineInfo.from, { y: 'nearest' })
        });
        
        // Step 2: After scrolling, wait for rendering, then apply highlight.
        // Use a longer delay to ensure CM6 has finished rendering the scrolled-to content.
        setTimeout(() => {
          const v = viewRef.current;
          if (!v) return;

          // Remove previous highlights across the entire editor
          const container = v.dom as HTMLElement;
          container
            .querySelectorAll('.cm-line.search-highlight, .cm-line.search-highlight-pulse')
            .forEach((el) => el.classList.remove('search-highlight', 'search-highlight-pulse'));

          // Use requestAnimationFrame to ensure DOM is painted after scroll
          requestAnimationFrame(() => {
            const vInner = viewRef.current;
            if (!vInner) return;
            
            try {
              // Re-get lineInfo in case doc changed (unlikely but safe)
              const currentLineInfo = vInner.state.doc.line(targetLine);
              const info = vInner.domAtPos(currentLineInfo.from);
              let target: HTMLElement | null = null;
              if (info) {
                const node = info.node as Node;
                const baseEl = node.nodeType === Node.TEXT_NODE 
                  ? (node.parentElement as HTMLElement | null) 
                  : (node as HTMLElement | null);
                target = baseEl ? (baseEl.closest('.cm-line') as HTMLElement | null) : null;
              }

              if (target) {
                target.classList.add('search-highlight');
                if (highlightPulse) {
                  target.classList.add('search-highlight-pulse');
                }
              }
            } catch (innerErr) {
              console.error('Error applying highlight after scroll:', innerErr);
            }
          });
        }, 80);
      } catch (e) {
        console.error('Error highlighting line:', e);
      }
    }
  }, [highlightLine, errorLine, errorLines, disableAutoScroll, highlightPulse]);

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
      customFold,
      theme
    ];
    if (language === 'json') ex.push(json());
    return ex;
  }, [language, theme]);

  return (
    <div ref={containerRef} className="absolute inset-0">
        <CodeMirror
          value={value}
          height="100%"
          extensions={extensions}
          basicSetup={{
          lineNumbers: true,
            highlightActiveLineGutter: false,
            foldGutter: false,
            highlightActiveLine: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true
          }}
          onCreateEditor={(view) => { viewRef.current = view; }}
          onChange={(val) => onChange(val)}
          style={{ height: '100%', fontSize: '14px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
          placeholder={placeholder || (language ? `Enter your ${language.toUpperCase()} code here...` : 'Enter your code here...')}
          theme={undefined}
          editable={true}
          autoFocus={false}
          onPaste={(e) => {
            const text = e.clipboardData?.getData('text') || '';
            if (text && onPaste) onPaste(text);
          }}
        />
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
    
    /* Search highlight styles */
    .cm-line.search-highlight {
      background-color: rgba(250,204,21,0.3) !important;
    }
    .cm-line.search-highlight-pulse {
      animation: search-highlight-pulse 0.8s ease-in-out 2;
    }
    @keyframes search-highlight-pulse {
      0%, 100% { background-color: rgba(250,204,21,0.3) !important; }
      50% { background-color: rgba(250,204,21,0.65) !important; }
    }
  `;
  document.head.appendChild(el);
}

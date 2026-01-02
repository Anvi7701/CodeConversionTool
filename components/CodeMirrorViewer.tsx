import React, { useMemo, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, Decoration, DecorationSet, WidgetType, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { foldGutter, foldKeymap, foldAll, unfoldAll, foldCode } from '@codemirror/language';
import { keymap } from '@codemirror/view';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';

// Create custom fold gutter with solid arrow icons (matching Input editor)
const customFoldGutter = foldGutter({
  markerDOM: (open) => {
    const marker = document.createElement('span');
    marker.textContent = open ? '▼' : '▶';
    marker.style.cursor = 'pointer';
    marker.style.userSelect = 'none';
    marker.style.color = '#000';
    marker.style.fontWeight = '700';
    marker.style.fontSize = '14px';
    marker.title = open ? 'Fold' : 'Unfold';
    return marker;
  }
});

// Boolean checkbox widget for CodeMirror
class BooleanCheckboxWidget extends WidgetType {
  constructor(readonly value: boolean, readonly pos: number, readonly onChange: (pos: number, newValue: boolean) => void) {
    super();
  }

  eq(other: BooleanCheckboxWidget) {
    return other.value === this.value && other.pos === this.pos;
  }

  toDOM() {
    const wrap = document.createElement('span');
    wrap.className = 'inline-flex items-center gap-1.5 align-middle mx-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30';
    wrap.style.verticalAlign = 'middle';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.value;
    checkbox.className = 'w-3.5 h-3.5 cursor-pointer accent-purple-600 dark:accent-purple-400 rounded';
    checkbox.title = this.value ? 'Checked (true) - Click to toggle' : 'Unchecked (false) - Click to toggle';
    checkbox.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onChange(this.pos, !this.value);
    };
    
    wrap.appendChild(checkbox);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

// Create decorations for boolean values with checkboxes
function createBooleanDecorations(view: EditorView, onChange: (pos: number, newValue: boolean) => void) {
  const decorations: any[] = [];
  const doc = view.state.doc;
  const text = doc.toString();
  
  // Match boolean values in JSON (true/false not in strings)
  const booleanRegex = /\b(true|false)\b/g;
  let match;
  
  while ((match = booleanRegex.exec(text)) !== null) {
    const pos = match.index;
    const value = match[1] === 'true';
    
    // Check if it's inside a string by counting quotes before this position
    const beforeText = text.substring(0, pos);
    const quoteCount = (beforeText.match(/"/g) || []).length;
    const isInString = quoteCount % 2 !== 0;
    
    if (!isInString) {
      const deco = Decoration.widget({
        widget: new BooleanCheckboxWidget(value, pos, onChange),
        side: -1
      });
      decorations.push(deco.range(pos));
    }
  }
  
  return Decoration.set(decorations);
}

// ViewPlugin for managing boolean decorations
const booleanDecorationsPlugin = (onChange: (pos: number, newValue: boolean) => void) => ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createBooleanDecorations(view, onChange);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = createBooleanDecorations(update.view, onChange);
      }
    }
  },
  {
    decorations: v => v.decorations
  }
);

interface CodeMirrorViewerProps {
  code: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  expandAll?: boolean;
  collapseAll?: boolean;
  collapseFirstLevel?: boolean;
  highlightLine?: number;
  highlightTrigger?: number;
  lineBackgrounds?: Array<{ line: number; className: string }>;
  backgroundsKey?: number;
}

export const CodeMirrorViewer: React.FC<CodeMirrorViewerProps> = ({ 
  code, 
  language, 
  onChange, 
  readOnly = false,
  expandAll: expandAllTrigger,
  collapseAll: collapseAllTrigger,
  collapseFirstLevel: collapseFirstLevelTrigger,
  highlightLine,
  highlightTrigger = 0,
  lineBackgrounds,
  backgroundsKey = 0,
}) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  // Local theme to match Input gutter styles (24px line numbers, 18px fold gutter)
  const theme = useMemo(() => EditorView.theme({
    '&': { height: '100%' },
    '.cm-editor': { backgroundColor: '#ffffff', height: '100%' },
    '.cm-content': { backgroundColor: '#ffffff' },
    '.cm-gutters': { border: 'none', gap: '0px' },
    '.cm-gutter': { background: 'rgba(226, 232, 240, 0.6)', border: 'none' },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 4px', color: '#000' },
    '.cm-gutter.cm-foldGutter': { width: '18px', minWidth: '18px' },
    '.cm-foldGutter .cm-gutterElement': { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    '.cm-foldGutter .cm-gutterElement > span + span': { display: 'none' },
    '.cm-scroller': { overflow: 'auto' },
    '.dark .cm-editor': { backgroundColor: '#1e293b' },
    '.dark .cm-content': { backgroundColor: '#1e293b' },
    '.dark .cm-gutter': { background: 'rgba(51, 65, 85, 0.35)' },
    '.dark .cm-lineNumbers .cm-gutterElement': { color: '#fff' },
    '.dark .cm-foldGutter .cm-gutterElement > span': { color: '#fff' },
  }), []);

  // Handle expand all
  useEffect(() => {
    if (expandAllTrigger && editorRef.current?.view) {
      unfoldAll(editorRef.current.view);
    }
  }, [expandAllTrigger]);

  // Handle collapse all
  useEffect(() => {
    if (collapseAllTrigger && editorRef.current?.view) {
      foldAll(editorRef.current.view);
    }
  }, [collapseAllTrigger]);

  // Collapse to first level for JSON: fold immediate children under root
  useEffect(() => {
    if (!editorRef.current?.view || !collapseFirstLevelTrigger) return;
    const view = editorRef.current.view;
    try {
      // First, unfold everything to start clean
      unfoldAll(view);

      const text = view.state.doc.toString();
      let depth = 0;
      let inString = false;
      let escape = false;
      const rootType = (() => {
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') continue;
          if (ch === '[') return 'array';
          if (ch === '{') return 'object';
          return 'unknown';
        }
        return 'unknown';
      })();

      const positions: number[] = [];
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
          if (!escape && ch === '"') inString = false;
          escape = ch === '\\' && !escape;
          continue;
        } else {
          if (ch === '"') { inString = true; escape = false; continue; }
        }

        if (ch === '{' || ch === '[') {
          // When we see an opening brace/bracket, record after increasing depth
          depth++;
          // If parent is root (depth === 1 after increment), record position to fold this child
          if (depth === 2) {
            // For array root, children are objects/arrays at depth 2
            // For object root, properties have a key and ':' then a value; we will fold starting at value brace
            positions.push(i);
          }
        } else if (ch === '}' || ch === ']') {
          depth = Math.max(0, depth - 1);
        }
      }

      // Apply folding at recorded positions
      for (const pos of positions) {
        try { foldCode(view, pos); } catch {}
      }
    } catch (err) {
      console.error('Error collapsing to first level:', err);
    }
  }, [collapseFirstLevelTrigger]);
  
  // Handle boolean toggle in CodeMirror
  const handleBooleanToggle = (pos: number, newValue: boolean) => {
    if (!onChange || !editorRef.current?.view) return;
    
    const view = editorRef.current.view;
    const doc = view.state.doc;
    const text = doc.toString();
    
    // Find the boolean value at the position
    const boolMatch = text.substring(pos).match(/^(true|false)/);
    if (!boolMatch) return;
    
    const oldValue = boolMatch[1];
    const newValueStr = newValue ? 'true' : 'false';
    
    // Replace the boolean value
    const newText = text.substring(0, pos) + newValueStr + text.substring(pos + oldValue.length);
    onChange(newText);
  };
  
  // Map language names to CodeMirror extensions
  const languageExtension = useMemo(() => {
    switch (language.toLowerCase()) {
      case 'json':
        return json();
      case 'xml':
        return xml();
      case 'html':
        return html();
      case 'python':
        return python();
      case 'css':
        return css();
      case 'javascript':
      case 'js':
        return javascript();
      default:
        return json(); // Default to JSON
    }
  }, [language]);

  // Line background decorations for diff categories
  const lineBackgroundPlugin = useMemo(() => {
    const items = (lineBackgrounds || []).slice();
    const build = (view: EditorView) => {
      const ranges = items.map((it) => {
        const clampedLine = Math.max(1, Math.min(view.state.doc.lines, it.line));
        const info = view.state.doc.line(clampedLine);
        return Decoration.line({ class: it.className }).range(info.from);
      });
      return Decoration.set(ranges, true);
    };
    return ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
          this.decorations = build(view);
        }
        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = build(update.view);
          }
        }
      },
      { decorations: (v) => (v as any).decorations }
    );
    // Recreate when inputs change
  }, [backgroundsKey, lineBackgrounds]);

  // Configure extensions
  const extensions = useMemo(() => {
    const baseExtensions = [
      languageExtension,
      customFoldGutter, // Use custom fold gutter (same as Text view)
      keymap.of(foldKeymap), // Keyboard shortcuts for folding
      EditorView.lineWrapping, // Wrap long lines
      ...(readOnly ? [EditorView.editable.of(false)] : []), // Only add read-only if specified
      theme,
    ];
    
    // Add boolean checkbox plugin for JSON when editable
    if (language.toLowerCase() === 'json' && onChange && !readOnly) {
      baseExtensions.push(booleanDecorationsPlugin(handleBooleanToggle));
    }

    // Add diff line backgrounds if provided
    if (lineBackgrounds && lineBackgrounds.length) {
      baseExtensions.push(lineBackgroundPlugin);
    }
    
    return baseExtensions;
  }, [languageExtension, readOnly, language, onChange, lineBackgroundPlugin, lineBackgrounds]);

  // Highlight search result line
  useEffect(() => {
    if (!editorRef.current || !highlightLine) return;
    
    const view = editorRef.current.view;
    if (!view) return;
    
    try {
      const lineInfo = view.state.doc.line(highlightLine);
      
      // Remove any existing highlights first
      const container = view.dom as HTMLElement;
      container
        .querySelectorAll('.cm-line.search-highlight, .cm-line.search-highlight-pulse')
        .forEach((el) => el.classList.remove('search-highlight', 'search-highlight-pulse'));
      
      // Scroll to the line and ensure it's rendered.
      // For CodeMirror 6 virtualization, we need to actually bring the line into the viewport.
      // Using 'start' ensures the line is scrolled to the top of the viewport, guaranteeing render.
      view.dispatch({ 
        effects: EditorView.scrollIntoView(lineInfo.from, { y: 'start' })
      });
      
      // After scrolling, wait for rendering, then apply highlight.
      setTimeout(() => {
        const v = editorRef.current?.view;
        if (!v) return;

        // Use requestAnimationFrame to ensure DOM is painted after scroll
        requestAnimationFrame(() => {
          const vInner = editorRef.current?.view;
          if (!vInner) return;
          
          try {
            // Re-get lineInfo in case doc changed
            const currentLineInfo = vInner.state.doc.line(highlightLine);
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
              target.classList.add('search-highlight-pulse');
            }
          } catch (innerErr) {
            console.error('Error applying highlight after scroll:', innerErr);
          }
        });
      }, 100);
    } catch (e) {
      console.error('Error highlighting line in CodeMirrorViewer:', e);
    }
  }, [highlightLine, highlightTrigger]);

  return (
    <div className="absolute inset-0 overflow-auto">
      <style>{`
        .cm-line.search-highlight {
          background-color: rgba(255, 255, 0, 0.3);
        }
        .cm-line.search-highlight-pulse {
          animation: search-highlight-pulse 0.8s ease-in-out 2;
        }
        @keyframes search-highlight-pulse {
          0%, 100% { background-color: rgba(255, 255, 0, 0.3); }
          50% { background-color: rgba(255, 255, 0, 0.7); }
        }
        /* Inline diff backgrounds */
        .cm-line.diff-missing { background-color: rgba(255, 0, 0, 0.12); }
        .cm-line.diff-incorrect { background-color: rgba(0, 128, 255, 0.12); }
        .cm-line.diff-unequal { background-color: rgba(255, 200, 0, 0.15); }
      `}</style>
      <CodeMirror
        ref={editorRef}
        value={code}
        onChange={onChange}
        extensions={extensions}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: !readOnly,
          highlightActiveLine: !readOnly,
          foldGutter: false, // Disable default fold gutter (using custom one in extensions)
          dropCursor: !readOnly,
          allowMultipleSelections: !readOnly,
          indentOnInput: !readOnly,
        }}
        theme={undefined}
        style={{
          fontSize: '14px',
          height: '100%',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        className="h-full"
      />
    </div>
  );
};

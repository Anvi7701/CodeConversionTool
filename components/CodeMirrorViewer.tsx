import React, { useMemo, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, Decoration, DecorationSet, WidgetType, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { foldGutter, foldKeymap, foldAll, unfoldAll } from '@codemirror/language';
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
}

export const CodeMirrorViewer: React.FC<CodeMirrorViewerProps> = ({ 
  code, 
  language, 
  onChange, 
  readOnly = false,
  expandAll: expandAllTrigger,
  collapseAll: collapseAllTrigger,
}) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  // Local theme to match Input gutter styles (24px line numbers, 18px fold gutter)
  const theme = useMemo(() => EditorView.theme({
    '&': { height: '100%' },
    '.cm-gutters': { border: 'none', gap: '0px' },
    '.cm-gutter': { background: 'rgba(226, 232, 240, 0.6)', border: 'none' },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 4px', color: '#000' },
    '.cm-gutter.cm-foldGutter': { width: '18px', minWidth: '18px' },
    '.cm-foldGutter .cm-gutterElement': { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    '.cm-foldGutter .cm-gutterElement > span + span': { display: 'none' },
    '.cm-scroller': { overflow: 'auto' },
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
    
    return baseExtensions;
  }, [languageExtension, readOnly, language, onChange]);

  return (
    <div className="absolute inset-0 overflow-auto">
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

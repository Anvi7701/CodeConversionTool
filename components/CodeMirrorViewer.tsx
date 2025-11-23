import React, { useMemo, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { foldGutter, foldKeymap, foldAll, unfoldAll } from '@codemirror/language';
import { keymap } from '@codemirror/view';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';

// Create custom fold gutter with solid arrow icons
const customFoldGutter = foldGutter({
  markerDOM: (open) => {
    const marker = document.createElement('span');
    marker.textContent = open ? '▼' : '▶';
    marker.style.cursor = 'pointer';
    marker.style.userSelect = 'none';
    marker.title = open ? 'Fold' : 'Unfold';
    return marker;
  }
});

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
  collapseAll: collapseAllTrigger
}) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

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
    return [
      languageExtension,
      customFoldGutter, // Use custom fold gutter (same as Text view)
      keymap.of(foldKeymap), // Keyboard shortcuts for folding
      EditorView.lineWrapping, // Wrap long lines
      ...(readOnly ? [EditorView.editable.of(false)] : []), // Only add read-only if specified
    ];
  }, [languageExtension, readOnly]);

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
        theme="light"
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

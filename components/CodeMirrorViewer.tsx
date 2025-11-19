import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { foldGutter, foldKeymap } from '@codemirror/language';
import { keymap } from '@codemirror/view';

interface CodeMirrorViewerProps {
  code: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export const CodeMirrorViewer: React.FC<CodeMirrorViewerProps> = ({ 
  code, 
  language, 
  onChange, 
  readOnly = false 
}) => {
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
      foldGutter(), // Adds fold icons in gutter
      keymap.of(foldKeymap), // Keyboard shortcuts for folding
      EditorView.lineWrapping, // Wrap long lines
      ...(readOnly ? [EditorView.editable.of(false)] : []), // Only add read-only if specified
    ];
  }, [languageExtension, readOnly]);

  return (
    <div className="absolute inset-0 overflow-auto">
      <CodeMirror
        value={code}
        onChange={onChange}
        extensions={extensions}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: !readOnly,
          highlightActiveLine: !readOnly,
          foldGutter: true,
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

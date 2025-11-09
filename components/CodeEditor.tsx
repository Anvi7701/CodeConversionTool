import React, { useRef, useEffect } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onPaste?: (pastedText: string) => void;
  placeholder?: string;
  errorLine?: number | null;
}

// Memoized component for line numbers to prevent re-rendering on every keystroke
const LineNumbers: React.FC<{ lineCount: number, errorLine: number | null }> = React.memo(({ lineCount, errorLine }) => {
  const lines = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);
  return (
    <>
      {lines.map((num) => (
        <div key={num} className={`h-5 leading-5 rounded-l-md -mr-4 pr-4 ${num === errorLine ? 'bg-red-500/20 text-red-400' : ''}`}>
          {num}
        </div>
      ))}
    </>
  );
});

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, onPaste, placeholder, errorLine }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    syncScroll();
  }, [value]);

  useEffect(() => {
    if (errorLine && textareaRef.current) {
      // Estimate line height (should match CSS)
      const lineHeight = 20; 
      const lineEl = textareaRef.current;
      // Scroll the error line to the middle of the view
      const scrollTop = (errorLine - 1) * lineHeight - lineEl.clientHeight / 2;
      lineEl.scrollTop = Math.max(0, scrollTop);
    }
  }, [errorLine]);

  const handleGutterWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop += e.deltaY;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (onPaste) {
      const pastedText = e.clipboardData.getData('text');
      onPaste(pastedText);
    }
  };

  const lineCount = value.split('\n').length;

  return (
    <div className="h-full w-full overflow-hidden flex border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-brand-primary rounded-md">
      <div
        ref={lineNumbersRef}
        onWheel={handleGutterWheel}
        className="p-4 text-right bg-slate-50 dark:bg-slate-800/50 text-slate-400 select-none overflow-y-hidden font-mono text-sm"
        aria-hidden="true"
      >
        <LineNumbers lineCount={lineCount} errorLine={errorLine} />
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onPaste={onPaste ? handlePaste : undefined}
        placeholder={placeholder || (language ? `Enter your ${language.toUpperCase()} code here...` : 'Enter your code here...')}
        spellCheck="false"
        className="flex-grow p-4 font-mono text-sm bg-transparent dark:text-dark-text resize-none focus:outline-none w-full h-full leading-5"
      />
    </div>
  );
};

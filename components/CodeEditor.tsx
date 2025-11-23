import React, { useRef, useEffect } from 'react';

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
}

// Simple line numbers component without folding
const LineNumbers: React.FC<{ 
  lineCount: number;
  errorLine: number | null;
  errorLines?: ErrorPosition[];
}> = React.memo(({ lineCount, errorLine, errorLines }) => {
  const lines = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);
  
  // Create a set of error line numbers for quick lookup
  const errorLineNumbers = new Set<number>();
  if (errorLines && errorLines.length > 0) {
    errorLines.forEach(error => errorLineNumbers.add(error.line));
  } else if (errorLine) {
    errorLineNumbers.add(errorLine);
  }
  
  return (
    <>
      {lines.map((num) => {
        const hasError = errorLineNumbers.has(num);
        return (
          <div 
            key={num} 
            className={`h-5 leading-5 rounded-l-md -mr-4 pr-3 flex items-center justify-end relative ${
              hasError ? 'bg-red-500/20 text-red-400' : ''
            }`}
          >
            {hasError && (
              <span className="absolute -left-1 text-red-500 animate-pulse">▶</span>
            )}
            <span>{num}</span>
          </div>
        );
      })}
    </>
  );
});

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, onPaste, placeholder, errorLine, errorLines }) => {
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
    } else if (errorLines && errorLines.length > 0 && textareaRef.current) {
      // Scroll to the first error line if multiple errors exist
      const firstErrorLine = errorLines[0].line;
      const lineHeight = 20;
      const lineEl = textareaRef.current;
      const scrollTop = (firstErrorLine - 1) * lineHeight - lineEl.clientHeight / 2;
      lineEl.scrollTop = Math.max(0, scrollTop);
    }
  }, [errorLine, errorLines]);

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
    <div className="flex-grow w-full overflow-hidden flex border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-brand-primary rounded-md min-h-0">
      <div
        ref={lineNumbersRef}
        onWheel={handleGutterWheel}
        className="p-4 text-right bg-slate-50 dark:bg-slate-800/50 text-slate-400 select-none overflow-y-hidden font-mono text-sm"
        aria-hidden="true"
      >
        <LineNumbers 
          lineCount={lineCount} 
          errorLine={errorLine}
          errorLines={errorLines}
        />
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onPaste={onPaste ? handlePaste : undefined}
        placeholder={placeholder || (language ? `Enter your ${language.toUpperCase()} code here...` : 'Enter your code here...')}
        spellCheck="false"
        className="flex-grow p-4 font-mono text-sm bg-transparent dark:text-dark-text resize-none focus:outline-none w-full min-h-0 leading-5"
      />
    </div>
  );
};

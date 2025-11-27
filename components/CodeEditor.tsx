import React, { useRef, useEffect, useState, useMemo } from 'react';

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
}

const LineNumbers: React.FC<{ 
  lineCount: number;
  errorLine: number | null;
  errorLines?: ErrorPosition[];
  lineStyleMap?: Record<number, 'simple' | 'complex' | 'comment'>;
}> = React.memo(({ lineCount, errorLine, errorLines, lineStyleMap }) => {
  const lines = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);
  const errorLineNumbers = new Set<number>();
  if (errorLines && errorLines.length > 0) {
    errorLines.forEach(error => errorLineNumbers.add(error.line));
  } else if (errorLine) {
    errorLineNumbers.add(errorLine);
  }

  const getMarkerClasses = (num: number) => {
    const style = lineStyleMap ? lineStyleMap[num] : undefined;
    if (style === 'complex') return 'bg-red-500/15 text-red-600';
    if (style === 'comment') return 'bg-purple-500/15 text-purple-600';
    if (style === 'simple') return 'bg-green-500/15 text-green-600';
    if (errorLineNumbers.has(num)) return 'bg-red-500/15 text-red-600';
    return '';
  };

  const getTriangleColor = (num: number) => {
    const style = lineStyleMap ? lineStyleMap[num] : undefined;
    if (style === 'simple') return 'text-green-600';
    if (style === 'comment') return 'text-purple-600';
    if (style === 'complex') return 'text-red-600';
    if (errorLineNumbers.has(num)) return 'text-red-600';
    return '';
  };

  return (
    <>
      {lines.map((num) => {
        const hasError = errorLineNumbers.has(num) || !!(lineStyleMap && lineStyleMap[num]);
        return (
          <div 
            key={num} 
            className={`h-5 leading-5 rounded-l-md -mr-4 pr-3 flex items-center justify-end relative ${getMarkerClasses(num)}`}
          >
            {hasError && (
              <span className={`absolute -left-1 ${getTriangleColor(num)}`}>▶</span>
            )}
            <span>{num}</span>
          </div>
        );
      })}
    </>
  );
});

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, onPaste, placeholder, errorLine, errorLines, lineStyleMap, highlightLine, highlightStyle, highlightPulse }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [gutterWidth, setGutterWidth] = useState<number>(72);
  const [scrollTop, setScrollTop] = useState(0);
  const [topPadding, setTopPadding] = useState<number>(16); // matches p-4 default

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      setScrollTop(textareaRef.current.scrollTop);
    }
  };

  useEffect(() => {
    syncScroll();
    // Measure gutter width once mounted and whenever font/zoom changes could affect layout
    if (lineNumbersRef.current) {
      const rect = lineNumbersRef.current.getBoundingClientRect();
      setGutterWidth(Math.ceil(rect.width));
    }
    // Measure textarea top padding to correct vertical offset
    if (textareaRef.current) {
      const cs = window.getComputedStyle(textareaRef.current);
      const pad = parseFloat(cs.paddingTop || '16');
      if (!Number.isNaN(pad)) setTopPadding(pad);
    }
  }, [value]);

  useEffect(() => {
    const syncProgrammaticScroll = (targetTop: number) => {
      if (!textareaRef.current || !lineNumbersRef.current) return;
      const clamped = Math.max(0, targetTop);
      textareaRef.current.scrollTop = clamped;
      lineNumbersRef.current.scrollTop = clamped;
      setScrollTop(clamped);
    };

    if (highlightLine && textareaRef.current) {
      const lineHeight = 20;
      const lineEl = textareaRef.current;
      const desired = (highlightLine - 1) * lineHeight - lineEl.clientHeight / 2;
      syncProgrammaticScroll(desired);
    } else if (errorLine && textareaRef.current) {
      const lineHeight = 20;
      const lineEl = textareaRef.current;
      const desired = (errorLine - 1) * lineHeight - lineEl.clientHeight / 2;
      syncProgrammaticScroll(desired);
    } else if (errorLines && errorLines.length > 0 && textareaRef.current) {
      const firstErrorLine = errorLines[0].line;
      const lineHeight = 20;
      const lineEl = textareaRef.current;
      const desired = (firstErrorLine - 1) * lineHeight - lineEl.clientHeight / 2;
      syncProgrammaticScroll(desired);
    }
  }, [highlightLine, errorLine, errorLines]);

  const handleGutterWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop += e.deltaY;
      setScrollTop(textareaRef.current.scrollTop);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (onPaste) {
      const pastedText = e.clipboardData.getData('text');
      onPaste(pastedText);
    }
  };

  const lineCount = value.split('\n').length;
  const lineHeight = 20; // matches leading-5 in textarea
  const highlightTop = useMemo(() => {
    if (!highlightLine || !textareaRef.current) return null;
    const top = topPadding + (highlightLine - 1) * lineHeight - scrollTop;
    return Math.max(-lineHeight, Math.min(top, (textareaRef.current.clientHeight || 0)));
  }, [highlightLine, scrollTop, topPadding]);
  const highlightColor = useMemo(() => {
    if (highlightStyle === 'simple') return 'bg-green-100 dark:bg-green-900/30';
    if (highlightStyle === 'complex') return 'bg-red-100 dark:bg-red-900/30';
    if (highlightStyle === 'comment') return 'bg-purple-100 dark:bg-purple-900/30';
    return '';
  }, [highlightStyle]);

  return (
    <div className="flex-grow w-full overflow-hidden flex border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-brand-primary rounded-md min-h-0 relative">
      <div
        ref={lineNumbersRef}
        onWheel={handleGutterWheel}
        className="p-4 text-right bg-slate-50 dark:bg-slate-800/50 text-slate-400 select-none overflow-y-hidden font-mono text-sm"
        aria-hidden="true"
      >
        <LineNumbers lineCount={lineCount} errorLine={errorLine ?? null} errorLines={errorLines} lineStyleMap={lineStyleMap} />
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onPaste={onPaste ? handlePaste : undefined}
        placeholder={placeholder || (language ? `Enter your ${language.toUpperCase()} code here...` : 'Enter your code here...')}
        spellCheck="false"
        className="relative z-10 flex-grow p-4 font-mono text-sm bg-transparent dark:text-dark-text resize-none focus:outline-none w-full min-h-0 leading-5"
      />
      {highlightLine && highlightTop !== null && highlightColor && (
        <div
          className={`absolute ${highlightColor} rounded-sm pointer-events-none transition-colors z-0 ${highlightPulse ? 'animate-pulse' : ''}`}
          style={{ top: `${highlightTop}px`, height: `${lineHeight}px`, left: `${gutterWidth}px`, right: 0 }}
        />
      )}
    </div>
  );
};

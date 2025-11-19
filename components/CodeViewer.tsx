import React, { useRef, useEffect } from 'react';

interface CodeViewerProps {
  code: string;
  language: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language }) => {
  const codeRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll between line numbers and code
  const handleScroll = () => {
    if (codeRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = codeRef.current.scrollTop;
    }
  };

  useEffect(() => {
    handleScroll();
  }, [code]);

  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);

  return (
    <div className="absolute inset-0 flex">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="p-4 text-right bg-slate-100 dark:bg-slate-800/50 text-slate-400 select-none overflow-y-hidden font-mono text-sm leading-relaxed min-w-[50px]"
        aria-hidden="true"
      >
        {lines.map((num) => (
          <div key={num} className="leading-relaxed">
            {num}
          </div>
        ))}
      </div>
      {/* Code Content */}
      <pre
        ref={codeRef}
        onScroll={handleScroll}
        className="flex-1 p-4 font-mono text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/50 overflow-auto whitespace-pre-wrap break-words"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

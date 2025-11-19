import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  detectJsonFoldRegions, 
  getFoldRegionAtLine, 
  FoldRegion, 
  getVisibleLines 
} from '../utils/codeFolding';

interface CodeViewerProps {
  code: string;
  language: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language }) => {
  const codeRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [collapsedRegions, setCollapsedRegions] = useState<Set<number>>(new Set());

  // Detect fold regions for JSON
  const foldRegions = useMemo(() => {
    if (language === 'json' && code.trim()) {
      return detectJsonFoldRegions(code);
    }
    return [];
  }, [code, language]);

  // Calculate visible lines with line number mapping
  const { visibleLines, lineNumberMap } = useMemo(() => {
    if (language === 'json' && collapsedRegions.size > 0) {
      return getVisibleLines(code, collapsedRegions, foldRegions);
    }
    return { 
      visibleLines: code.split('\n'), 
      lineNumberMap: new Map(code.split('\n').map((_, i) => [i, i])) 
    };
  }, [code, language, foldRegions, collapsedRegions]);

  // Toggle fold state
  const handleToggleFold = (lineIndex: number) => {
    const region = getFoldRegionAtLine(foldRegions, lineIndex);
    if (!region) return;

    setCollapsedRegions(prev => {
      const next = new Set(prev);
      if (next.has(lineIndex)) {
        next.delete(lineIndex);
      } else {
        next.add(lineIndex);
      }
      return next;
    });
  };

  // Reset collapsed regions when language changes or code is cleared
  useEffect(() => {
    if (language !== 'json' || !code.trim()) {
      setCollapsedRegions(new Set());
    }
  }, [language, code]);

  // Sync scroll between line numbers and code
  const handleScroll = () => {
    if (codeRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = codeRef.current.scrollTop;
    }
  };

  useEffect(() => {
    handleScroll();
  }, [code]);

  // LineNumbers component with fold icons
  interface LineNumbersProps {
    lineCount: number;
    foldRegions: FoldRegion[];
    collapsedRegions: Set<number>;
    onToggleFold: (line: number) => void;
    language: string;
  }

  const LineNumbers: React.FC<LineNumbersProps> = ({ 
    lineCount, 
    foldRegions, 
    collapsedRegions, 
    onToggleFold, 
    language 
  }) => {
    const lines = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i);
    
    return (
      <>
        {lines.map((lineIndex) => {
          // Check if this line is inside a collapsed region (should be hidden)
          const isInsideCollapsed = Array.from(collapsedRegions).some(startLine => {
            const region = getFoldRegionAtLine(foldRegions, startLine);
            return region && lineIndex > region.startLine && lineIndex <= region.endLine;
          });
          
          // Don't render line numbers for lines inside collapsed regions
          if (isInsideCollapsed) {
            return null;
          }
          
          const region = getFoldRegionAtLine(foldRegions, lineIndex);
          const showFoldIcon = language === 'json' && region && (region.endLine - region.startLine > 0);
          const isCollapsed = collapsedRegions.has(lineIndex);

          return (
            <div key={lineIndex} className="leading-relaxed flex items-center justify-end">
              {showFoldIcon && (
                <span
                  onClick={() => onToggleFold(lineIndex)}
                  className="cursor-pointer hover:text-brand-primary mr-1 inline-block w-3 text-center"
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? '▶' : '▼'}
                </span>
              )}
              <span className={showFoldIcon ? '' : 'mr-4'}>
                {lineIndex + 1}
              </span>
            </div>
          );
        })}
      </>
    );
  };

  const displayCode = visibleLines.join('\n');
  const lineCount = code.split('\n').length; // Use original line count for line numbers

  return (
    <div className="absolute inset-0 flex">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="p-4 text-right bg-slate-100 dark:bg-slate-800/50 text-slate-400 select-none overflow-y-hidden font-mono text-sm leading-relaxed min-w-[50px]"
        aria-hidden="true"
      >
        <LineNumbers 
          lineCount={lineCount} 
          foldRegions={foldRegions}
          collapsedRegions={collapsedRegions}
          onToggleFold={handleToggleFold}
          language={language}
        />
      </div>
      {/* Code Content */}
      <pre
        ref={codeRef}
        onScroll={handleScroll}
        className="flex-1 p-4 font-mono text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/50 overflow-auto whitespace-pre-wrap break-words"
      >
        <code>{displayCode}</code>
      </pre>
    </div>
  );
};

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { detectJsonFoldRegions, getFoldRegionAtLine, FoldRegion, getVisibleLines } from '../utils/codeFolding';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onPaste?: (pastedText: string) => void;
  placeholder?: string;
  errorLine?: number | null;
}

// Line numbers component with fold icons
const LineNumbers: React.FC<{ 
  lineCount: number;
  errorLine: number | null;
  foldRegions: FoldRegion[];
  collapsedRegions: Set<number>;
  onToggleFold: (line: number) => void;
  language: string;
}> = React.memo(({ lineCount, errorLine, foldRegions, collapsedRegions, onToggleFold, language }) => {
  const lines = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);
  
  // Only show fold icons for JSON
  const showFoldIcons = language === 'json';
  
  return (
    <>
      {lines.map((num) => {
        const lineIndex = num - 1;
        const region = getFoldRegionAtLine(foldRegions, lineIndex);
        const hasFoldIcon = showFoldIcons && region && region.endLine > region.startLine;
        const isCollapsed = hasFoldIcon && collapsedRegions.has(lineIndex);
        
        return (
          <div 
            key={num} 
            className={`h-5 leading-5 rounded-l-md -mr-4 pr-1 flex items-center justify-end gap-1 ${
              num === errorLine ? 'bg-red-500/20 text-red-400' : ''
            }`}
          >
            {hasFoldIcon && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFold(lineIndex);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors text-xs leading-none"
                title={isCollapsed ? 'Unfold' : 'Fold'}
                style={{ width: '12px', height: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isCollapsed ? '▶' : '▼'}
              </button>
            )}
            <span className={hasFoldIcon ? '' : 'pr-3'}>{num}</span>
          </div>
        );
      })}
    </>
  );
});

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, onPaste, placeholder, errorLine }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  
  // Folding state - only for JSON
  const [collapsedRegions, setCollapsedRegions] = useState<Set<number>>(new Set());
  
  // Detect fold regions (memoized to avoid recalculation on every render)
  const foldRegions = useMemo(() => {
    if (language === 'json' && value.trim()) {
      try {
        return detectJsonFoldRegions(value);
      } catch (error) {
        console.error('Error detecting fold regions:', error);
        return [];
      }
    }
    return [];
  }, [value, language]);
  
  // Get visible content after applying folds
  const { visibleLines, lineNumberMap } = useMemo(() => {
    if (language === 'json' && collapsedRegions.size > 0) {
      return getVisibleLines(value, collapsedRegions, foldRegions);
    }
    return { visibleLines: value.split('\n'), lineNumberMap: new Map() };
  }, [value, collapsedRegions, foldRegions, language]);
  
  // For editable textarea, we need a different approach
  // Instead of hiding lines, we'll use CSS or overlay approach
  // For now, show all lines but update line numbers to indicate folded state
  const displayValue = value;

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
  
  // Reset collapsed regions when language changes or code becomes empty
  useEffect(() => {
    if (language !== 'json' || !value.trim()) {
      setCollapsedRegions(new Set());
    }
  }, [language, value]);

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
  
  const handleToggleFold = (line: number) => {
    setCollapsedRegions(prev => {
      const next = new Set(prev);
      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }
      return next;
    });
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
          foldRegions={foldRegions}
          collapsedRegions={collapsedRegions}
          onToggleFold={handleToggleFold}
          language={language}
        />
      </div>
      <textarea
        ref={textareaRef}
        value={displayValue}
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


import React, { useEffect, useRef, useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

// Global tooltip coordination: ensure only one tooltip shows at a time
let tooltipIdCounter = 0;

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const myIdRef = useRef<number>(++tooltipIdCounter);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const custom = e as CustomEvent<{ id: number }>;
      const activeId = custom.detail?.id;
      if (activeId !== myIdRef.current) {
        setIsVisible(false);
      }
    };
    window.addEventListener('tooltip-open', onOpen as EventListener);
    return () => window.removeEventListener('tooltip-open', onOpen as EventListener);
  }, []);

  return (
    <div
      className={`relative inline-flex ${className || ''}`}
      data-has-tooltip
      onMouseEnter={(e) => {
        // Show this tooltip and broadcast to close others
        setIsVisible(true);
        const evt = new CustomEvent('tooltip-open', { detail: { id: myIdRef.current } });
        window.dispatchEvent(evt);
      }}
      onMouseLeave={() => setIsVisible(false)}
      style={{ display: 'inline-flex' }}
    >
      {children}
      {isVisible && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs font-medium rounded-md shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 whitespace-nowrap pointer-events-none"
          style={{ zIndex: 999999 }}
        >
          {content}
          <div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px] w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white dark:border-b-slate-800"
          />
        </div>
      )}
    </div>
  );
};

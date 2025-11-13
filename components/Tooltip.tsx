
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`relative inline-flex ${className || ''}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      style={{ display: 'inline-flex' }}
    >
      {children}
      {isVisible && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 dark:bg-black text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap pointer-events-none"
          style={{ zIndex: 999999 }}
        >
          {content}
          <div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px] w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-black"
          />
        </div>
      )}
    </div>
  );
};

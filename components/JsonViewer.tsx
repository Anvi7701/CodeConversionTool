

import React, { useState, FC } from 'react';
import type { Selection } from '../types';

interface JsonNodeProps {
  nodeKey: string;
  value: any;
  currentPath: string;
  onSelect: (selection: Selection) => void;
  selectedNodePath: string;
  isRoot?: boolean;
}

const getPrimitiveTypeStyle = (value: any) => {
  const type = typeof value;
  if (value === null) return 'text-slate-500';
  if (type === 'string') return 'text-green-700 dark:text-green-400';
  if (type === 'number') return 'text-blue-700 dark:text-blue-400';
  if (type === 'boolean') return 'text-purple-700 dark:text-purple-400';
  return 'text-light-text dark:text-dark-text';
};

const JsonNode: FC<JsonNodeProps> = ({ nodeKey, value, currentPath, onSelect, selectedNodePath, isRoot = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const isObject = typeof value === 'object' && value !== null;
  const isSelected = currentPath === selectedNodePath;

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      path: currentPath,
      key: nodeKey,
      value: value,
    });
  };
  
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };
  
  if (isObject) {
    const entries = Object.entries(value);
    const itemType = Array.isArray(value) ? 'Array' : 'Object';
    const bracketOpen = Array.isArray(value) ? '[' : '{';
    const bracketClose = Array.isArray(value) ? ']' : '}';

    return (
      <div className={!isRoot ? 'ml-6' : ''}>
        <div 
          className={`flex items-start cursor-pointer rounded p-0.5 break-all ${isSelected ? 'bg-teal-200/50 dark:bg-teal-800/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          onClick={handleNodeClick}
        >
          <button onClick={handleToggleExpand} className="w-5 h-5 text-left flex-shrink-0 text-slate-500 dark:text-slate-400 focus:outline-none">{entries.length > 0 ? (isExpanded ? '▼' : '▶') : <span className="inline-block w-4"></span>}</button>
          <span className="font-semibold text-slate-800 dark:text-slate-300">{isRoot ? nodeKey : `"${nodeKey}"`}</span>
          <span className="mx-1">:</span>
          <span className="text-slate-500 dark:text-slate-400">{isExpanded ? '' : `${itemType}(${entries.length})`}</span>
        </div>

        {isExpanded && (
          <div className="border-l border-slate-200 dark:border-slate-700">
            {entries.map(([key, val]) => (
              <JsonNode
                key={key}
                nodeKey={key}
                value={val}
                currentPath={`${currentPath}.${key}`}
                onSelect={onSelect}
                selectedNodePath={selectedNodePath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Primitive value
  return (
    <div className="ml-6 flex items-start">
      <div 
        className={`flex items-start cursor-pointer rounded p-0.5 break-all ${isSelected ? 'bg-teal-200/50 dark:bg-teal-800/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
        onClick={handleNodeClick}
      >
        <span className="w-5 h-5 flex-shrink-0"></span>
        <span className="font-semibold text-slate-800 dark:text-slate-300">{`"${nodeKey}"`}</span>
        <span className="mx-1">:</span>
        <span className={getPrimitiveTypeStyle(value)}>{JSON.stringify(value)}</span>
      </div>
    </div>
  );
};

interface JsonViewerProps {
    data: object;
    onSelect: (selection: Selection) => void;
    selectedNodePath: string;
}

export const JsonViewer: FC<JsonViewerProps> = ({ data, onSelect, selectedNodePath }) => {
    return (
        <div className="font-mono text-sm leading-relaxed select-text">
            <JsonNode
                isRoot
                nodeKey="root"
                value={data}
                currentPath="root"
                onSelect={onSelect}
                selectedNodePath={selectedNodePath}
            />
        </div>
    );
};

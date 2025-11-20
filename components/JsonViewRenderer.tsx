import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { foldGutter, foldKeymap, foldAll, unfoldAll } from '@codemirror/language';
import { keymap } from '@codemirror/view';

// Custom fold markers - single solid arrows
const customFoldGutter = foldGutter({
  markerDOM: (open) => {
    const marker = document.createElement('span');
    marker.textContent = open ? '▼' : '▶';
    marker.style.color = '#64748b';
    marker.style.fontSize = '11px';
    marker.style.cursor = 'pointer';
    marker.style.fontWeight = 'bold';
    marker.style.transition = 'color 0.2s ease';
    marker.onmouseenter = () => marker.style.color = '#0d9488';
    marker.onmouseleave = () => marker.style.color = '#64748b';
    return marker;
  }
});

// Tree View Component with Advanced Actions
interface TreeNodeProps {
  keyName: string;
  value: any;
  level: number;
  isLast: boolean;
  path: string;
  parentData: any;
  parentKey: string | number;
  expandAll?: boolean;
  collapseAll?: boolean;
  onUpdate?: (newData: any) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  keyName, 
  value, 
  level, 
  isLast, 
  path, 
  parentData,
  parentKey,
  expandAll, 
  collapseAll,
  onUpdate 
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const [showActions, setShowActions] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Handle expand/collapse all
  useEffect(() => {
    if (expandAll) setIsExpanded(true);
  }, [expandAll]);

  useEffect(() => {
    if (collapseAll) setIsExpanded(false);
  }, [collapseAll]);
  
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  // Type conversion handlers
  const convertType = (newType: string) => {
    if (!onUpdate) return;
    
    let newValue: any;
    switch (newType) {
      case 'string':
        newValue = String(value);
        break;
      case 'number':
        newValue = Number(value) || 0;
        break;
      case 'boolean':
        newValue = Boolean(value);
        break;
      case 'null':
        newValue = null;
        break;
      case 'object':
        newValue = {};
        break;
      case 'array':
        newValue = [];
        break;
      default:
        return;
    }
    
    if (Array.isArray(parentData)) {
      const newArray = [...parentData];
      newArray[parentKey as number] = newValue;
      onUpdate(newArray);
    } else {
      const newObj = { ...parentData };
      newObj[parentKey] = newValue;
      onUpdate(newObj);
    }
    setShowTypeSelector(false);
  };

  // Insert handler
  const handleInsert = () => {
    if (!onUpdate) return;
    
    if (Array.isArray(value)) {
      const newArray = [...value, ''];
      if (Array.isArray(parentData)) {
        const updated = [...parentData];
        updated[parentKey as number] = newArray;
        onUpdate(updated);
      } else {
        const updated = { ...parentData };
        updated[parentKey] = newArray;
        onUpdate(updated);
      }
    } else if (isObject) {
      const newObj = { ...value, [`newKey${Object.keys(value).length + 1}`]: '' };
      if (Array.isArray(parentData)) {
        const updated = [...parentData];
        updated[parentKey as number] = newObj;
        onUpdate(updated);
      } else {
        const updated = { ...parentData };
        updated[parentKey] = newObj;
        onUpdate(updated);
      }
    }
    setShowActions(false);
  };

  // Duplicate handler
  const handleDuplicate = () => {
    if (!onUpdate || !parentData) return;
    
    if (Array.isArray(parentData)) {
      const newArray = [...parentData];
      newArray.splice((parentKey as number) + 1, 0, JSON.parse(JSON.stringify(value)));
      onUpdate(newArray);
    } else {
      const newObj = { ...parentData };
      let newKey = `${parentKey}_copy`;
      let counter = 1;
      while (newObj[newKey]) {
        newKey = `${parentKey}_copy${counter}`;
        counter++;
      }
      newObj[newKey] = JSON.parse(JSON.stringify(value));
      onUpdate(newObj);
    }
    setShowActions(false);
  };

  // Remove handler
  const handleRemove = () => {
    if (!onUpdate || !parentData) return;
    
    if (confirm(`Are you sure you want to remove "${keyName}"?`)) {
      if (Array.isArray(parentData)) {
        const newArray = parentData.filter((_, index) => index !== parentKey);
        onUpdate(newArray);
      } else {
        const newObj = { ...parentData };
        delete newObj[parentKey];
        onUpdate(newObj);
      }
    }
    setShowActions(false);
  };

  // Sort handler (for objects and arrays)
  const handleSort = () => {
    if (!onUpdate) return;
    
    if (Array.isArray(value)) {
      const sorted = [...value].sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
      });
      
      if (Array.isArray(parentData)) {
        const updated = [...parentData];
        updated[parentKey as number] = sorted;
        onUpdate(updated);
      } else {
        const updated = { ...parentData };
        updated[parentKey] = sorted;
        onUpdate(updated);
      }
    } else if (isObject) {
      const sortedKeys = Object.keys(value).sort();
      const sorted: any = {};
      sortedKeys.forEach(key => {
        sorted[key] = value[key];
      });
      
      if (Array.isArray(parentData)) {
        const updated = [...parentData];
        updated[parentKey as number] = sorted;
        onUpdate(updated);
      } else {
        const updated = { ...parentData };
        updated[parentKey] = sorted;
        onUpdate(updated);
      }
    }
    setShowActions(false);
  };

  const renderValue = () => {
    if (value === null) return <span className="text-slate-400">null</span>;
    if (typeof value === 'boolean') return <span className="text-purple-600 dark:text-purple-400">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    if (typeof value === 'string') return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
    return null;
  };

  const getCollectionInfo = () => {
    if (isArray) return `[${value.length}]`;
    if (isObject) return `{${Object.keys(value).length}}`;
    return '';
  };

  const getValueType = (): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  return (
    <div className={`font-mono text-sm ${level === 0 ? '' : 'ml-4'}`}>
      <div 
        className="flex items-start gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 py-0.5 px-1 rounded group relative"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowTypeSelector(false);
        }}
      >
        {isExpandable ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 w-4 h-5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0"></span>
        )}
        <div className="flex-1 break-all">
          <span className="text-slate-700 dark:text-slate-300 font-semibold">{keyName}</span>
          <span className="text-slate-500 dark:text-slate-500">: </span>
          {!isExpandable && renderValue()}
          {isExpandable && !isExpanded && (
            <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">{getCollectionInfo()}</span>
          )}
        </div>
        
        {/* Action buttons - shown on hover */}
        {showActions && onUpdate && level > 0 && (
          <div className="flex items-center gap-1 ml-2 relative">
            {/* Type Selector */}
            <div className="relative">
              <button
                onClick={() => setShowTypeSelector(!showTypeSelector)}
                className="px-2 py-0.5 text-xs bg-slate-600 hover:bg-slate-700 text-white rounded"
                title="Change type"
              >
                {getValueType()}
              </button>
              {showTypeSelector && (
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-lg z-10 min-w-[100px]">
                  <button onClick={() => convertType('string')} className="block w-full text-left px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">String</button>
                  <button onClick={() => convertType('number')} className="block w-full text-left px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">Number</button>
                  <button onClick={() => convertType('boolean')} className="block w-full text-left px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">Boolean</button>
                  <button onClick={() => convertType('null')} className="block w-full text-left px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">Null</button>
                  <button onClick={() => convertType('object')} className="block w-full text-left px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">Object</button>
                  <button onClick={() => convertType('array')} className="block w-full text-left px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">Array</button>
                </div>
              )}
            </div>
            
            {/* Sort button (only for objects and arrays) */}
            {(isObject || isArray) && (
              <button
                onClick={handleSort}
                className="px-2 py-0.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                title="Sort"
              >
                ↕
              </button>
            )}
            
            {/* Insert button (only for objects and arrays) */}
            {(isObject || isArray) && (
              <button
                onClick={handleInsert}
                className="px-2 py-0.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded"
                title="Insert"
              >
                +
              </button>
            )}
            
            {/* Duplicate button */}
            <button
              onClick={handleDuplicate}
              className="px-2 py-0.5 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded"
              title="Duplicate"
            >
              ⎘
            </button>
            
            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="px-2 py-0.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
              title="Remove"
            >
              ×
            </button>
          </div>
        )}
      </div>
      {isExpanded && isExpandable && (
        <div className="border-l border-slate-300 dark:border-slate-600 ml-2 pl-1">
          {isArray
            ? value.map((item: any, index: number) => (
                <TreeNode
                  key={`${path}.${index}`}
                  keyName={`[${index}]`}
                  value={item}
                  level={level + 1}
                  isLast={index === value.length - 1}
                  path={`${path}.${index}`}
                  parentData={value}
                  parentKey={index}
                  expandAll={expandAll}
                  collapseAll={collapseAll}
                  onUpdate={onUpdate}
                />
              ))
            : Object.entries(value).map(([key, val], index, arr) => (
                <TreeNode
                  key={`${path}.${key}`}
                  keyName={key}
                  value={val}
                  level={level + 1}
                  isLast={index === arr.length - 1}
                  path={`${path}.${key}`}
                  parentData={value}
                  parentKey={key}
                  expandAll={expandAll}
                  collapseAll={collapseAll}
                  onUpdate={onUpdate}
                />
              ))}
        </div>
      )}
    </div>
  );
};

export const TreeView: React.FC<{ 
  data: any; 
  expandAll?: boolean; 
  collapseAll?: boolean;
  onEdit?: (jsonString: string) => void;
}> = ({ data, expandAll, collapseAll, onEdit }) => {
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [treeData, setTreeData] = useState(data);
  const [remountKey, setRemountKey] = useState(0); // Simple counter to force remount

  // Sync with prop changes
  useEffect(() => {
    setTreeData(data);
    setRemountKey(prev => prev + 1); // Increment to force remount
  }, [data]);

  const handleEditClick = () => {
    setEditValue(JSON.stringify(treeData, null, 2));
    setEditMode(true);
  };

  const handleSave = () => {
    try {
      // Validate JSON before saving
      JSON.parse(editValue);
      if (onEdit) {
        onEdit(editValue);
      }
      setEditMode(false);
    } catch (error) {
      alert('Invalid JSON. Please fix errors before saving.');
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditValue('');
  };

  // Handle updates from TreeNode actions
  const handleTreeUpdate = (newData: any) => {
    setTreeData(newData);
    setRemountKey(prev => prev + 1); // Increment to force remount
    if (onEdit) {
      onEdit(JSON.stringify(newData, null, 2));
    }
  };

  if (editMode && onEdit) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-900">
        <div className="flex gap-2 p-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
          >
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded text-sm"
          >
            Cancel
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={editValue}
            onChange={(value) => setEditValue(value)}
            extensions={[
              json(),
              EditorView.lineWrapping,
            ]}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true,
            }}
            theme="light"
            style={{
              fontSize: '14px',
              height: '100%',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {onEdit && (
        <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex gap-2">
          <button
            onClick={handleEditClick}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
          >
            ✏️ Edit JSON
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
            Hover over nodes to see actions
          </span>
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">
        <TreeNode 
          key={remountKey}
          keyName="root" 
          value={treeData} 
          level={0} 
          isLast={true} 
          path="root" 
          parentData={null}
          parentKey="root"
          expandAll={expandAll} 
          collapseAll={collapseAll}
          onUpdate={handleTreeUpdate}
        />
      </div>
    </div>
  );
};

// Form View Component
interface FormFieldProps {
  keyName: string;
  value: any;
  level: number;
  path: string;
  expandAll?: boolean;
  collapseAll?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ keyName, value, level, path, expandAll, collapseAll }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1);

  // Handle expand/collapse all
  useEffect(() => {
    if (expandAll) setIsExpanded(true);
  }, [expandAll]);

  useEffect(() => {
    if (collapseAll) setIsExpanded(false);
  }, [collapseAll]);
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);

  const renderFieldValue = () => {
    if (value === null) return <span className="text-slate-400 italic">null</span>;
    if (typeof value === 'boolean') return <span className="text-purple-600 dark:text-purple-400 font-medium">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-blue-600 dark:text-blue-400 font-medium">{value}</span>;
    if (typeof value === 'string') return <span className="text-slate-800 dark:text-slate-200">{value}</span>;
    return null;
  };

  if (isObject) {
    return (
      <div className={`${level > 0 ? 'ml-6 mt-3' : 'mt-2'} p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/50`}>
        <div 
          className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-sm cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'} {keyName}
        </div>
        {isExpanded && (
          <div className="space-y-2">
            {Object.entries(value).map(([key, val]) => (
              <FormField key={`${path}.${key}`} keyName={key} value={val} level={level + 1} path={`${path}.${key}`} expandAll={expandAll} collapseAll={collapseAll} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isArray) {
    return (
      <div className={`${level > 0 ? 'ml-6 mt-3' : 'mt-2'} p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/50`}>
        <div 
          className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-sm cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'} {keyName} <span className="text-xs text-slate-500">({value.length} items)</span>
        </div>
        {isExpanded && (
          <div className="space-y-2">
            {value.map((item, index) => (
              <FormField key={`${path}.${index}`} keyName={`Item ${index + 1}`} value={item} level={level + 1} path={`${path}.${index}`} expandAll={expandAll} collapseAll={collapseAll} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-2 py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[120px]">{keyName}:</label>
      <div className="flex-1 text-sm">{renderFieldValue()}</div>
    </div>
  );
};

export const FormView: React.FC<{ data: any; expandAll?: boolean; collapseAll?: boolean }> = ({ data, expandAll, collapseAll }) => {
  return (
    <div className="h-full overflow-auto p-4 bg-white dark:bg-slate-900">
      {typeof data === 'object' && data !== null ? (
        Array.isArray(data) ? (
          <div className="space-y-2">
            {data.map((item, index) => (
              <FormField key={index} keyName={`Item ${index + 1}`} value={item} level={0} path={`${index}`} expandAll={expandAll} collapseAll={collapseAll} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <FormField key={key} keyName={key} value={value} level={0} path={key} expandAll={expandAll} collapseAll={collapseAll} />
            ))}
          </div>
        )
      ) : (
        <div className="text-slate-600 dark:text-slate-400">Invalid JSON data</div>
      )}
    </div>
  );
};

// Text View Component - Now editable with CodeMirror
export const TextView: React.FC<{ 
  code: string; 
  onChange?: (value: string) => void;
  expandAll?: boolean;
  collapseAll?: boolean;
}> = ({ code, onChange, expandAll: expandAllTrigger, collapseAll: collapseAllTrigger }) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  // Handle expand all
  useEffect(() => {
    if (expandAllTrigger && editorRef.current?.view) {
      unfoldAll(editorRef.current.view);
    }
  }, [expandAllTrigger]);

  // Handle collapse all
  useEffect(() => {
    if (collapseAllTrigger && editorRef.current?.view) {
      foldAll(editorRef.current.view);
    }
  }, [collapseAllTrigger]);

  return (
    <div className="h-full overflow-auto bg-white dark:bg-slate-900">
      <CodeMirror
        ref={editorRef}
        value={code}
        onChange={onChange}
        extensions={[
          json(),
          EditorView.lineWrapping,
          customFoldGutter,
          keymap.of(foldKeymap),
        ]}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: false, // IMPORTANT: Disable default, use custom fold gutter
        }}
        theme="light"
        style={{
          fontSize: '14px',
          height: '100%',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      />
    </div>
  );
};

// View Format Component (similar to browser console)
interface ViewNodeProps {
  value: any;
  level: number;
  keyName?: string;
  expandAll?: boolean;
  collapseAll?: boolean;
}

const ViewNode: React.FC<ViewNodeProps> = ({ value, level, keyName, expandAll, collapseAll }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1); // Auto-expand first level only

  // Handle expand/collapse all
  useEffect(() => {
    if (expandAll) setIsExpanded(true);
  }, [expandAll]);

  useEffect(() => {
    if (collapseAll) setIsExpanded(false);
  }, [collapseAll]);
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const renderPrimitive = () => {
    if (value === null) return <span className="text-slate-400 italic">null</span>;
    if (value === undefined) return <span className="text-slate-400 italic">undefined</span>;
    if (typeof value === 'boolean') return <span className="text-purple-600 dark:text-purple-400">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    if (typeof value === 'string') return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
    return null;
  };

  const getPreview = () => {
    if (isArray) {
      if (value.length === 0) return '[]';
      return `Array(${value.length})`;
    }
    if (isObject) {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      return `Object`;
    }
    return '';
  };

  return (
    <div className="font-mono text-sm">
      <div className="flex items-start gap-1 py-0.5">
        {isExpandable && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 w-4 h-5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        {keyName && (
          <>
            <span className="text-purple-700 dark:text-purple-400">{keyName}</span>
            <span className="text-slate-500">: </span>
          </>
        )}
        {!isExpandable && renderPrimitive()}
        {isExpandable && !isExpanded && (
          <span className="text-slate-500 dark:text-slate-400">{getPreview()}</span>
        )}
        {isExpandable && isExpanded && (
          <span className="text-slate-500 dark:text-slate-400">{isArray ? '[' : '{'}</span>
        )}
      </div>
      {isExpanded && isExpandable && (
        <div className="ml-6">
          {isArray
            ? value.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-slate-500 dark:text-slate-500 text-xs">{index}:</span>
                  <ViewNode value={item} level={level + 1} expandAll={expandAll} collapseAll={collapseAll} />
                </div>
              ))
            : Object.entries(value).map(([key, val]) => (
                <ViewNode key={key} keyName={key} value={val} level={level + 1} expandAll={expandAll} collapseAll={collapseAll} />
              ))}
          <span className="text-slate-500 dark:text-slate-400">{isArray ? ']' : '}'}</span>
        </div>
      )}
    </div>
  );
};

export const ConsoleView: React.FC<{ data: any; expandAll?: boolean; collapseAll?: boolean }> = ({ data, expandAll, collapseAll }) => {
  return (
    <div className="h-full overflow-auto p-4 bg-white dark:bg-slate-900">
      <ViewNode value={data} level={0} expandAll={expandAll} collapseAll={collapseAll} />
    </div>
  );
};

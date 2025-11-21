// Clean restored implementation
import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { foldGutter, foldKeymap, foldAll, unfoldAll } from '@codemirror/language';
import { keymap } from '@codemirror/view';

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

// Path-based immutable TreeNode implementation to prevent ancestor duplication
interface TreeNodeProps {
  keyName: string;
  value: any;
  level: number;
  isLast: boolean;
  // full path segments from root (excluding the synthetic 'root' label) e.g. ['users', 0, 'name']
  segments: (string | number)[];
  rootData: any;
  onRootUpdate: (newRoot: any) => void;
  expandAll?: boolean;
  collapseAll?: boolean;
}
const TreeNode: React.FC<TreeNodeProps> = ({ keyName, value, level, isLast, segments, rootData, onRootUpdate, expandAll, collapseAll }) => {
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showTransformMenu, setShowTransformMenu] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editedValue, setEditedValue] = useState('');
  const valueInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [editedKey, setEditedKey] = useState(keyName);
  const keyInputRef = useRef<HTMLInputElement | null>(null);
  const rowMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (expandAll) setIsExpanded(true); }, [expandAll]);
  useEffect(() => { if (collapseAll) setIsExpanded(false); }, [collapseAll]);
  useEffect(() => { if (isEditingValue && valueInputRef.current) valueInputRef.current.focus(); }, [isEditingValue]);
  useEffect(() => { if (isEditingKey && keyInputRef.current) keyInputRef.current.focus(); }, [isEditingKey]);
  useEffect(() => { const h = (e: MouseEvent) => { if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) { setShowTypeSelector(false); setShowTransformMenu(false);} }; if (showTypeSelector||showTransformMenu) document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [showTypeSelector, showTransformMenu]);
  const comparator = (a: any, b: any) => typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
  const deepClone = (v: any) => JSON.parse(JSON.stringify(v));

  // Helpers for path-based immutable updates
  const getDataAtPath = (root: any, segs: (string | number)[]) => {
    let cur = root;
    for (const s of segs) {
      if (cur == null) return undefined;
      cur = cur[s as any];
    }
    return cur;
  };
  const setValueAtPath = (root: any, segs: (string | number)[], newVal: any): any => {
    if (segs.length === 0) return newVal; // replacing root
    const [head, ...rest] = segs;
    if (rest.length === 0) {
      if (Array.isArray(root)) {
        const arr = [...root];
        arr[Number(head)] = newVal;
        return arr;
      }
      if (root && typeof root === 'object') {
        return { ...root, [head as any]: newVal };
      }
      return root; // cannot set
    }
    if (Array.isArray(root)) {
      const arr = [...root];
      const idx = Number(head);
      arr[idx] = setValueAtPath(arr[idx], rest, newVal);
      return arr;
    }
    if (root && typeof root === 'object') {
      return { ...root, [head as any]: setValueAtPath(root[head as any], rest, newVal) };
    }
    return root;
  };
  const removeAtPath = (root: any, segs: (string | number)[]): any => {
    if (segs.length === 0) return root; // don't remove root
    const parentSegs = segs.slice(0, -1);
    const last = segs[segs.length - 1];
    const parent = getDataAtPath(root, parentSegs);
    if (Array.isArray(parent)) {
      const idx = Number(last);
      const newParent = parent.filter((_: any, i: number) => i !== idx);
      return setValueAtPath(root, parentSegs, newParent);
    }
    if (parent && typeof parent === 'object') {
      const { [last as any]: _removed, ...rest } = parent;
      return setValueAtPath(root, parentSegs, rest);
    }
    return root;
  };
  const duplicateAtPath = (root: any, segs: (string | number)[]): any => {
    const parentSegs = segs.slice(0, -1);
    const last = segs[segs.length - 1];
    const parent = getDataAtPath(root, parentSegs);
    const nodeVal = getDataAtPath(root, segs);
    if (Array.isArray(parent)) {
      const idx = Number(last);
      const newParent = [...parent];
      newParent.splice(idx + 1, 0, deepClone(nodeVal));
      return setValueAtPath(root, parentSegs, newParent);
    }
    if (parent && typeof parent === 'object') {
      // Insert the duplicated key IMMEDIATELY AFTER the original key, preserving order.
      // Generate a unique key name: original + _copy, _copy2, ...
      const base = `${String(last)}_copy`;
      let newKey = base;
      let i = 2;
      while (newKey in parent) newKey = `${base}${i++}`;
      const keys = Object.keys(parent);
      const targetIndex = keys.indexOf(String(last));
      if (targetIndex === -1) {
        // Fallback: append at end (shouldn't normally happen)
        return setValueAtPath(root, parentSegs, { ...parent, [newKey]: deepClone(nodeVal) });
      }
      const newObj: Record<string, any> = {};
      keys.forEach((k, idx) => {
        newObj[k] = parent[k];
        if (idx === targetIndex) {
          newObj[newKey] = deepClone(nodeVal);
        }
      });
      return setValueAtPath(root, parentSegs, newObj);
    }
    return root;
  };
  const renameKeyAtPath = (root: any, segs: (string | number)[], newKey: string): any => {
    const parentSegs = segs.slice(0, -1);
    const last = segs[segs.length - 1];
    const parent = getDataAtPath(root, parentSegs);
    if (!parent || Array.isArray(parent)) return root; // cannot rename array index
    if (!newKey || newKey === last) return root;
    // uniqueness handling (only if different from existing except the target key)
    if (newKey in parent && newKey !== last) {
      const base = newKey;
      let c = 1; let candidate = newKey;
      while (candidate in parent && candidate !== last) candidate = `${base}_${c++}`;
      newKey = candidate;
    }
    const keys = Object.keys(parent);
    const targetIndex = keys.indexOf(String(last));
    if (targetIndex === -1) return root;
    const newObj: Record<string, any> = {};
    keys.forEach((k, i) => {
      if (i === targetIndex) {
        newObj[newKey] = parent[k];
      } else {
        newObj[k] = parent[k];
      }
    });
    return setValueAtPath(root, parentSegs, newObj);
  };
  const insertIntoValue = () => {
    let newVal = value;
    if (Array.isArray(value)) newVal = [...value, ''];
    else if (isObject) newVal = { ...value, [`newKey${Object.keys(value).length + 1}`]: '' };
    onRootUpdate(setValueAtPath(rootData, segments, newVal));
  };
  const sortValue = () => {
    if (Array.isArray(value)) {
      onRootUpdate(setValueAtPath(rootData, segments, [...value].sort(comparator)));
    } else if (isObject) {
      const keys = Object.keys(value).sort();
      const sorted: Record<string, any> = {};
      keys.forEach(k => sorted[k] = value[k]);
      onRootUpdate(setValueAtPath(rootData, segments, sorted));
    }
  };
  const updateSelf = (nv: any) => {
    onRootUpdate(setValueAtPath(rootData, segments, nv));
  };
  const convertType = (t: string) => { let nv:any; switch(t){case'string':nv=String(value);break;case'number':nv=Number(value)||0;break;case'boolean':nv=Boolean(value);break;case'null':nv=null;break;case'object':nv={};break;case'array':nv=[];break;default:return;} updateSelf(nv); setShowTypeSelector(false); };
  const startEditValue = () => { setEditedValue(value===null?'null': typeof value==='object'?JSON.stringify(value):String(value)); setIsEditingValue(true); };
  const saveEditValue = () => { let parsed:any=editedValue; if(/^\s*[{\[]/.test(editedValue.trim())){ try{ parsed=JSON.parse(editedValue);}catch{}} else if(editedValue==='null') parsed=null; else if(editedValue==='true') parsed=true; else if(editedValue==='false') parsed=false; else if(!isNaN(Number(editedValue))) parsed=Number(editedValue); updateSelf(parsed); setIsEditingValue(false); };
  const cancelEditValue = () => setIsEditingValue(false);
  const startEditKey = () => { if(Array.isArray(getDataAtPath(rootData, segments.slice(0,-1)))|| level===0) return; setEditedKey(String(segments[segments.length-1])); setIsEditingKey(true); };
  const saveEditKey = () => {
    if (level === 0) { setIsEditingKey(false); return; }
    const parent = getDataAtPath(rootData, segments.slice(0,-1));
    if (Array.isArray(parent)) { setIsEditingKey(false); return; }
    if (!editedKey) { setIsEditingKey(false); return; }
    const newRoot = renameKeyAtPath(rootData, segments, editedKey);
    onRootUpdate(newRoot);
    setIsEditingKey(false);
  };
  const cancelEditKey = () => setIsEditingKey(false);
  const handleInsert = () => { insertIntoValue(); };
  const handleDuplicate = () => { onRootUpdate(duplicateAtPath(rootData, segments)); };
  const handleRemove = () => { if(!confirm(`Remove "${keyName}"?`)){ return;} onRootUpdate(removeAtPath(rootData, segments)); };
  const handleSort = () => { sortValue(); };
  const transformArray = (mode:string) => { if(!isArray) return; let next=value.slice(); switch(mode){case'filter-nulls':next=next.filter((v:any)=>v!==null);break;case'filter-falsy':next=next.filter(Boolean);break;case'sort-asc':next=[...next].sort(comparator);break;case'sort-desc':next=[...next].sort((a:any,b:any)=>comparator(b,a));break;case'unique':{ const seen=new Set<string>(); const out:any[]=[]; for(const item of next){ const k=typeof item==='object'?JSON.stringify(item):String(item); if(!seen.has(k)){ seen.add(k); out.push(item);} } next=out; break;} case'flatten1':next=([] as any[]).concat(...next);break;case'map-number':next=next.map((v:any)=> typeof v==='number'?v: (typeof v==='string' && !isNaN(Number(v))?Number(v):v));break;case'map-string':next=next.map((v:any)=> typeof v==='string'?v: v===null?'null': typeof v==='object'?JSON.stringify(v):String(v));break;default:return;} updateSelf(next); setShowTransformMenu(false); };
  const handleExtract = async () => { try{ await navigator.clipboard.writeText(JSON.stringify(value,null,2)); alert('Copied node JSON'); } catch{ alert('Copy failed'); } };
  const renderValue = () => isEditingValue ? (<input ref={valueInputRef} className="px-1 py-0.5 text-sm border rounded bg-white dark:bg-slate-900" value={editedValue} onChange={e=>setEditedValue(e.target.value)} onBlur={saveEditValue} onKeyDown={e=>{ if(e.key==='Enter') saveEditValue(); else if(e.key==='Escape') cancelEditValue(); }} />) : value===null ? <span onClick={startEditValue} className="cursor-text text-slate-400" title="Click to edit">null</span> : typeof value==='boolean'? <span onClick={startEditValue} className="cursor-text text-purple-600 dark:text-purple-400" title="Click to edit">{String(value)}</span> : typeof value==='number'? <span onClick={startEditValue} className="cursor-text text-blue-600 dark:text-blue-400" title="Click to edit">{value}</span> : typeof value==='string'? <span onClick={startEditValue} className="cursor-text text-green-600 dark:text-green-400" title="Click to edit">"{value}"</span> : null;
  const getCollectionInfo = () => isArray?`[${value.length}]`: isObject?`{${Object.keys(value).length}}`:'';
  const getValueType = () => value===null?'null': isArray?'array': typeof value;
  const parentContainer = level === 0 ? null : getDataAtPath(rootData, segments.slice(0,-1));
  const containerType: 'array' | 'object' | 'other' = Array.isArray(parentContainer)?'array': (parentContainer && typeof parentContainer==='object')?'object':'other';
  const handleDragStart: React.DragEventHandler<HTMLDivElement> = e => {
    if (containerType === 'other' || level === 0) return;
    e.dataTransfer.setData('application/json', JSON.stringify({ parentSegs: segments.slice(0,-1), containerType, sourceSeg: segments[segments.length-1] }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver: React.DragEventHandler<HTMLDivElement> = e => {
    try {
      const d = e.dataTransfer.getData('application/json');
      if (!d) return;
      const p = JSON.parse(d);
      const sameParent = JSON.stringify(p.parentSegs) === JSON.stringify(segments.slice(0,-1)) && p.containerType === containerType;
      if (sameParent) e.preventDefault();
    } catch {}
  };
  const handleDrop: React.DragEventHandler<HTMLDivElement> = e => {
    const d = e.dataTransfer.getData('application/json');
    if (!d) return;
    const p = JSON.parse(d);
    const sameParent = JSON.stringify(p.parentSegs) === JSON.stringify(segments.slice(0,-1)) && p.containerType === containerType;
    if (!sameParent) return;
    if (containerType === 'array' && Array.isArray(parentContainer)) {
      const src = Number(p.sourceSeg);
      const dst = Number(segments[segments.length-1]);
      if (Number.isNaN(src) || Number.isNaN(dst) || src === dst) return;
      const newParent = [...parentContainer];
      const [m] = newParent.splice(src,1);
      newParent.splice(dst,0,m);
      onRootUpdate(setValueAtPath(rootData, segments.slice(0,-1), newParent));
    } else if (containerType === 'object' && parentContainer && typeof parentContainer === 'object') {
      const srcKey = String(p.sourceSeg);
      const dstKey = String(segments[segments.length-1]);
      if (srcKey === dstKey) return;
      const keys = Object.keys(parentContainer);
      const si = keys.indexOf(srcKey);
      const di = keys.indexOf(dstKey);
      if (si === -1 || di === -1) return;
      keys.splice(di,0,keys.splice(si,1)[0]);
      const reordered: Record<string,any> = {};
      keys.forEach(k => reordered[k] = parentContainer[k]);
      onRootUpdate(setValueAtPath(rootData, segments.slice(0,-1), reordered));
    }
  };
  return (
    <div className={`font-mono text-sm ${level===0?'':'ml-4'}`}>
      <div className="flex items-start gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 py-0.5 pl-1 pr-2 rounded group relative" draggable={level>0 && (containerType==='array'||containerType==='object')} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} ref={rowMenuRef}>
        {isExpandable ? <button onClick={()=>setIsExpanded(e=>!e)} className="flex-shrink-0 w-4 h-5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400">{isExpanded?'▼':'▶'}</button> : <span className="w-4 flex-shrink-0" />}
        <div className="flex-1 break-all">
          {isEditingKey ? (
            <input ref={keyInputRef} className="px-1 py-0.5 text-sm border rounded font-semibold bg-white dark:bg-slate-900" value={editedKey} onChange={e=>setEditedKey(e.target.value)} onBlur={saveEditKey} onKeyDown={e=>{ if(e.key==='Enter') saveEditKey(); else if(e.key==='Escape') cancelEditKey(); }} />
          ) : (
            <span onClick={startEditKey} title={Array.isArray(parentContainer)||level===0? '' : 'Click to rename key'} className="text-slate-700 dark:text-slate-300 font-semibold cursor-text select-text">{keyName}</span>
          )}
          <span className="text-slate-500 dark:text-slate-500">: </span>
          {!isExpandable && renderValue()}
          {isExpandable && !isExpanded && <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">{getCollectionInfo()}</span>}
        </div>
        {level>0 && (
          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Row actions">
            <div className="relative">
              <button onClick={()=>{ setShowTypeSelector(p=>!p); setShowTransformMenu(false); }} className="w-6 h-6 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold" title={`Type: ${getValueType()}`}>{isArray?'[]': isObject?'{}': 'T'}</button>
              {showTypeSelector && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-lg z-30 p-1 flex flex-col min-w-[140px]">
                  <button onClick={()=>convertType('string')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">String</button>
                  <button onClick={()=>convertType('number')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Number</button>
                  <button onClick={()=>convertType('boolean')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Boolean</button>
                  <button onClick={()=>convertType('null')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Null</button>
                  <button onClick={()=>convertType('object')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Object</button>
                  <button onClick={()=>convertType('array')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Array</button>
                </div>
              )}
            </div>
            {(isObject||isArray) && <button onClick={handleSort} className="w-6 h-6 flex items-center justify-center rounded bg-blue-200 dark:bg-blue-700 text-[11px]" title="Sort">↕</button>}
            {isArray && (
              <div className="relative">
                <button onClick={()=>{ setShowTransformMenu(p=>!p); setShowTypeSelector(false); }} className="w-6 h-6 flex items-center justify-center rounded bg-teal-200 dark:bg-teal-700 text-[11px]" title="Transform">✨</button>
                {showTransformMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-lg z-30 p-1 flex flex-col min-w-[160px] max-h-64 overflow-auto">
                    <span className="px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400">Filter</span>
                    <button onClick={()=>transformArray('filter-nulls')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Remove nulls</button>
                    <button onClick={()=>transformArray('filter-falsy')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Remove falsy</button>
                    <span className="px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400 mt-1">Sort</span>
                    <button onClick={()=>transformArray('sort-asc')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Ascending</button>
                    <button onClick={()=>transformArray('sort-desc')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Descending</button>
                    <span className="px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400 mt-1">Map</span>
                    <button onClick={()=>transformArray('map-number')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">To number</button>
                    <button onClick={()=>transformArray('map-string')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">To string</button>
                    <span className="px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400 mt-1">Other</span>
                    <button onClick={()=>transformArray('unique')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Unique values</button>
                    <button onClick={()=>transformArray('flatten1')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs">Flatten one level</button>
                  </div>
                )}
              </div>
            )}
            {(isObject||isArray) && <button onClick={handleInsert} className="w-6 h-6 flex items-center justify-center rounded bg-green-200 dark:bg-green-700 text-[12px]" title="Insert">＋</button>}
            <button onClick={handleExtract} className="w-6 h-6 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-700 text-[12px]" title="Copy JSON">⤴</button>
            <button onClick={handleDuplicate} className="w-6 h-6 flex items-center justify-center rounded bg-purple-200 dark:bg-purple-700 text-[12px]" title="Duplicate">⎘</button>
            <button onClick={handleRemove} className="w-6 h-6 flex items-center justify-center rounded bg-red-200 dark:bg-red-700 text-[13px] font-bold" title="Remove">×</button>
          </div>
        )}
      </div>
      {isExpanded && isExpandable && (
        <div className="border-l border-slate-300 dark:border-slate-600 ml-2 pl-1">
          {isArray ? value.map((item:any, index:number)=> (
            <TreeNode
              key={segments.concat(index).join('.')}
              keyName={`[${index}]`}
              value={item}
              level={level+1}
              isLast={index===value.length-1}
              segments={segments.concat(index)}
              rootData={rootData}
              onRootUpdate={onRootUpdate}
              expandAll={expandAll}
              collapseAll={collapseAll}
            />
          )) : Object.entries(value).map(([childKey, childVal], index, arr)=> (
            <TreeNode
              key={segments.concat(childKey).join('.')}
              keyName={childKey}
              value={childVal}
              level={level+1}
              isLast={index===arr.length-1}
              segments={segments.concat(childKey)}
              rootData={rootData}
              onRootUpdate={onRootUpdate}
              expandAll={expandAll}
              collapseAll={collapseAll}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView: React.FC<{ data:any; expandAll?:boolean; collapseAll?:boolean; onEdit?: (jsonString:string)=>void; }> = ({ data, expandAll, collapseAll, onEdit }) => {
  const [editMode,setEditMode]=useState(false);
  const [editValue,setEditValue]=useState('');
  const [treeData,setTreeData]=useState(data);
  // Track scroll container to preserve scroll position across updates
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Update local treeData when upstream data prop changes without forcing full remount
  useEffect(()=>{ setTreeData(data); },[data]);
  const handleEditClick=()=>{ setEditValue(JSON.stringify(treeData,null,2)); setEditMode(true); };
  const handleSave=()=>{ try{ JSON.parse(editValue); onEdit?.(editValue); setEditMode(false);} catch{ alert('Invalid JSON. Fix errors before saving.'); } };
  const handleCancel=()=>{ setEditMode(false); setEditValue(''); };
  const handleTreeUpdate=(newData:any)=>{
    // Capture current scroll position before state update
    const prevScroll = scrollRef.current?.scrollTop || 0;
    setTreeData(newData);
    onEdit?.(JSON.stringify(newData,null,2));
    // Restore scroll after React paints
    requestAnimationFrame(()=>{
      if(scrollRef.current) scrollRef.current.scrollTop = prevScroll;
    });
  };
  if(editMode && onEdit){ return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="flex gap-2 p-2 border-b border-slate-200 dark:border-slate-700">
        <button onClick={handleSave} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm">Save Changes</button>
        <button onClick={handleCancel} className="px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded text-sm">Cancel</button>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror value={editValue} onChange={v=>setEditValue(v)} extensions={[json(), EditorView.lineWrapping]} basicSetup={{ lineNumbers:true, highlightActiveLine:true, highlightActiveLineGutter:true, foldGutter:true }} theme="light" style={{ fontSize:'14px', height:'100%', fontFamily:'ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace' }} />
      </div>
    </div>
  ); }
  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {onEdit && (
        <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex gap-2 items-center">
          <button onClick={handleEditClick} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">✏️ Edit JSON</button>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">Click keys/values to edit • Actions on left</span>
        </div>
      )}
      <div className="flex-1 overflow-auto p-4" ref={scrollRef}>
        <TreeNode key="root" keyName="root" value={treeData} level={0} isLast={true} segments={[]} rootData={treeData} onRootUpdate={handleTreeUpdate} expandAll={expandAll} collapseAll={collapseAll} />
      </div>
    </div>
  );
};

interface FormFieldProps { keyName:string; value:any; level:number; path:string; expandAll?:boolean; collapseAll?:boolean; }
const FormField: React.FC<FormFieldProps> = ({ keyName, value, level, path, expandAll, collapseAll }) => {
  const [isExpanded,setIsExpanded]=useState(level<1);
  useEffect(()=>{ if(expandAll) setIsExpanded(true); },[expandAll]);
  useEffect(()=>{ if(collapseAll) setIsExpanded(false); },[collapseAll]);
  const isObject= typeof value==='object' && value!==null && !Array.isArray(value);
  const isArray= Array.isArray(value);
  const renderVal=()=> value===null? <span className="text-slate-400 italic">null</span>: typeof value==='boolean'? <span className="text-purple-600 dark:text-purple-400 font-medium">{String(value)}</span>: typeof value==='number'? <span className="text-blue-600 dark:text-blue-400 font-medium">{value}</span>: typeof value==='string'? <span className="text-slate-800 dark:text-slate-200">{value}</span>: null;
  if(isObject) return (
    <div className={`${level>0?'ml-6 mt-3':'mt-2'} p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/50`}>
      <div onClick={()=>setIsExpanded(e=>!e)} className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-sm cursor-pointer hover:text-slate-900 dark:hover:text-slate-100">{isExpanded?'▼':'▶'} {keyName}</div>
      {isExpanded && <div className="space-y-2">{Object.entries(value).map(([k,v])=> <FormField key={`${path}.${k}`} keyName={k} value={v} level={level+1} path={`${path}.${k}`} expandAll={expandAll} collapseAll={collapseAll} />)}</div>}
    </div>
  );
  if(isArray) return (
    <div className={`${level>0?'ml-6 mt-3':'mt-2'} p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/50`}>
      <div onClick={()=>setIsExpanded(e=>!e)} className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-sm cursor-pointer hover:text-slate-900 dark:hover:text-slate-100">{isExpanded?'▼':'▶'} {keyName} <span className="text-xs text-slate-500">({value.length} items)</span></div>
      {isExpanded && <div className="space-y-2">{value.map((item:any,i:number)=> <FormField key={`${path}.${i}`} keyName={`Item ${i+1}`} value={item} level={level+1} path={`${path}.${i}`} expandAll={expandAll} collapseAll={collapseAll} />)}</div>}
    </div>
  );
  return (
    <div className="flex items-baseline gap-2 py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[120px]">{keyName}:</label>
      <div className="flex-1 text-sm">{renderVal()}</div>
    </div>
  );
};
export const FormView: React.FC<{ data:any; expandAll?:boolean; collapseAll?:boolean }> = ({ data, expandAll, collapseAll }) => (
  <div className="h-full overflow-auto p-4 bg-white dark:bg-slate-900">
    {typeof data==='object' && data!==null ? (Array.isArray(data) ? (
      <div className="space-y-2">{data.map((item:any,i:number)=><FormField key={i} keyName={`Item ${i+1}`} value={item} level={0} path={`${i}`} expandAll={expandAll} collapseAll={collapseAll} />)}</div>
    ) : (
      <div className="space-y-2">{Object.entries(data).map(([k,v])=> <FormField key={k} keyName={k} value={v} level={0} path={k} expandAll={expandAll} collapseAll={collapseAll} />)}</div>
    )) : <div className="text-slate-600 dark:text-slate-400">Invalid JSON data</div>}
  </div>
);
export const TextView: React.FC<{ code:string; onChange?: (v:string)=>void; expandAll?:boolean; collapseAll?:boolean }> = ({ code, onChange, expandAll:expandAllTrigger, collapseAll:collapseAllTrigger }) => {
  const editorRef=useRef<ReactCodeMirrorRef>(null);
  useEffect(()=>{ if(expandAllTrigger && editorRef.current?.view) unfoldAll(editorRef.current.view); },[expandAllTrigger]);
  useEffect(()=>{ if(collapseAllTrigger && editorRef.current?.view) foldAll(editorRef.current.view); },[collapseAllTrigger]);
  return (
    <div className="h-full overflow-auto bg-white dark:bg-slate-900">
      <CodeMirror ref={editorRef} value={code} onChange={onChange} extensions={[json(), EditorView.lineWrapping, customFoldGutter, keymap.of(foldKeymap)]} basicSetup={{ lineNumbers:true, highlightActiveLine:true, highlightActiveLineGutter:true, foldGutter:false }} theme="light" style={{ fontSize:'14px', height:'100%', fontFamily:'ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace' }} />
    </div>
  );
};
interface ViewNodeProps { value:any; level:number; keyName?:string; expandAll?:boolean; collapseAll?:boolean }
const ViewNode: React.FC<ViewNodeProps> = ({ value, level, keyName, expandAll, collapseAll }) => {
  const [isExpanded,setIsExpanded]=useState(level<1);
  useEffect(()=>{ if(expandAll) setIsExpanded(true); },[expandAll]);
  useEffect(()=>{ if(collapseAll) setIsExpanded(false); },[collapseAll]);
  const isObject= typeof value==='object' && value!==null && !Array.isArray(value);
  const isArray= Array.isArray(value);
  const isExpandable=isObject||isArray;
  const renderPrimitive=()=> value===null? <span className="text-slate-400 italic">null</span>: value===undefined? <span className="text-slate-400 italic">undefined</span>: typeof value==='boolean'? <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>: typeof value==='number'? <span className="text-blue-600 dark:text-blue-400">{value}</span>: typeof value==='string'? <span className="text-green-600 dark:text-green-400">"{value}"</span>: null;
  const getPreview=()=> isArray? (value.length===0?'[]':`Array(${value.length})`): isObject? (Object.keys(value).length===0?'{}':'Object'): '';
  return (
    <div className="font-mono text-sm">
      <div className="flex items-start gap-1 py-0.5">
        {isExpandable && <button onClick={()=>setIsExpanded(e=>!e)} className="flex-shrink-0 w-4 h-5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400">{isExpanded?'▼':'▶'}</button>}
        {keyName && <><span className="text-purple-700 dark:text-purple-400">{keyName}</span><span className="text-slate-500">: </span></>}
        {!isExpandable && renderPrimitive()}
        {isExpandable && !isExpanded && <span className="text-slate-500 dark:text-slate-400">{getPreview()}</span>}
        {isExpandable && isExpanded && <span className="text-slate-500 dark:text-slate-400">{isArray?'[':'{'}</span>}
      </div>
      {isExpanded && isExpandable && (
        <div className="ml-6">
          {isArray ? value.map((item:any,idx:number)=>(
            <div key={idx} className="flex items-start gap-2">
              <span className="text-slate-500 dark:text-slate-500 text-xs">{idx}:</span>
              <ViewNode value={item} level={level+1} expandAll={expandAll} collapseAll={collapseAll} />
            </div>
          )) : Object.entries(value).map(([k,v]) => (
            <ViewNode key={k} keyName={k} value={v} level={level+1} expandAll={expandAll} collapseAll={collapseAll} />
          ))}
          <span className="text-slate-500 dark:text-slate-400">{isArray?']':'}'}</span>
        </div>
      )}
    </div>
  );
};
export const ConsoleView: React.FC<{ data:any; expandAll?:boolean; collapseAll?:boolean }> = ({ data, expandAll, collapseAll }) => (
  <div className="h-full overflow-auto p-4 bg-white dark:bg-slate-900">
    <ViewNode value={data} level={0} expandAll={expandAll} collapseAll={collapseAll} />
  </div>
);

import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView, Decoration, DecorationSet, WidgetType, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { foldGutter, foldKeymap, foldAll, unfoldAll } from '@codemirror/language';
import { keymap } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { TableView } from './TableView';

// Create custom fold gutter with solid arrow icons
const customFoldGutter = foldGutter({
  markerDOM: (open) => {
    const marker = document.createElement('span');
    marker.textContent = open ? '▼' : '▶';
    marker.style.cursor = 'pointer';
    marker.style.userSelect = 'none';
    marker.title = open ? 'Fold' : 'Unfold';
    return marker;
  }
});

// Boolean checkbox widget for CodeMirror
class BooleanCheckboxWidget extends WidgetType {
  constructor(readonly value: boolean, readonly pos: number, readonly onChange: (pos: number, newValue: boolean) => void) {
    super();
  }

  eq(other: BooleanCheckboxWidget) {
    return other.value === this.value && other.pos === this.pos;
  }

  toDOM() {
    const wrap = document.createElement('span');
    wrap.className = 'inline-flex items-center gap-1.5 align-middle mx-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30';
    wrap.style.verticalAlign = 'middle';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.value;
    checkbox.className = 'w-3.5 h-3.5 cursor-pointer accent-purple-600 dark:accent-purple-400 rounded';
    checkbox.title = this.value ? 'Checked (true) - Click to toggle' : 'Unchecked (false) - Click to toggle';
    checkbox.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onChange(this.pos, !this.value);
    };
    
    wrap.appendChild(checkbox);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

// State effect for toggling boolean
const toggleBooleanEffect = StateEffect.define<{ pos: number; newValue: boolean }>();

// Create decorations for boolean values with checkboxes
function createBooleanDecorations(view: EditorView, onChange: (pos: number, newValue: boolean) => void) {
  const decorations: any[] = [];
  const doc = view.state.doc;
  const text = doc.toString();
  
  // Match boolean values in JSON (true/false not in strings)
  const booleanRegex = /\b(true|false)\b/g;
  let match;
  
  while ((match = booleanRegex.exec(text)) !== null) {
    const pos = match.index;
    const value = match[1] === 'true';
    
    // Check if it's inside a string by counting quotes before this position
    const beforeText = text.substring(0, pos);
    const quoteCount = (beforeText.match(/"/g) || []).length;
    const isInString = quoteCount % 2 !== 0;
    
    if (!isInString) {
      const deco = Decoration.widget({
        widget: new BooleanCheckboxWidget(value, pos, onChange),
        side: -1
      });
      decorations.push(deco.range(pos));
    }
  }
  
  return Decoration.set(decorations);
}

// ViewPlugin for managing boolean decorations
const booleanDecorationsPlugin = (onChange: (pos: number, newValue: boolean) => void) => ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createBooleanDecorations(view, onChange);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = createBooleanDecorations(update.view, onChange);
      }
    }
  },
  {
    decorations: v => v.decorations
  }
);

interface TreeNodeProps { keyName: string; value: any; level: number; isLast: boolean; segments: (string|number)[]; rootData: any; onRootUpdate:(d:any)=>void; expandAll?:boolean; collapseAll?:boolean; selectedPath?:string; onSelectPath?:(segments:(string|number)[])=>void; }
const TreeNode: React.FC<TreeNodeProps> = ({ keyName, value, level, isLast, segments, rootData, onRootUpdate, expandAll, collapseAll, selectedPath, onSelectPath }) => {
  const [isExpanded,setIsExpanded]=useState(level<1);
  const [isEditingValue,setIsEditingValue]=useState(false);
  const [editedValue,setEditedValue]=useState('');
  const [isEditingKey,setIsEditingKey]=useState(false);
  const [editedKey,setEditedKey]=useState(keyName);
  const [showMenu,setShowMenu]=useState(false);
  const [openType,setOpenType]=useState(false);
  const [openStructure,setOpenStructure]=useState(false);
  const [openTransform,setOpenTransform]=useState(false);
  const dragPayloadRef = useRef<any|null>(null);
  const [showInsertLine,setShowInsertLine] = useState(false);
  const menuRef=useRef<HTMLDivElement|null>(null);
  const keyInputRef=useRef<HTMLInputElement|null>(null);
  const valueInputRef=useRef<HTMLInputElement|null>(null);
  const isObject= typeof value==='object' && value!==null && !Array.isArray(value);
  const isArray= Array.isArray(value);
  const isExpandable=isObject||isArray;
  useEffect(()=>{ if(expandAll) setIsExpanded(true); },[expandAll]);
  useEffect(()=>{ if(collapseAll) setIsExpanded(false); },[collapseAll]);
  useEffect(()=>{ if(isEditingValue && valueInputRef.current) valueInputRef.current.focus(); },[isEditingValue]);
  useEffect(()=>{ if(isEditingKey && keyInputRef.current) keyInputRef.current.focus(); },[isEditingKey]);
  useEffect(()=>{ const h=(e:MouseEvent)=>{ if(showMenu){ if(menuRef.current && menuRef.current.contains(e.target as Node)) return; setShowMenu(false);} }; if(showMenu) document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h); },[showMenu]);
  const getDataAtPath=(root:any,segs:(string|number)[])=> segs.reduce((c:any,s)=> c==null? undefined: c[s as any], root);
  const setValueAtPath=(root:any,segs:(string|number)[],nv:any):any=>{ if(segs.length===0) return nv; const [head,...rest]=segs; if(rest.length===0){ if(Array.isArray(root)){ const arr=[...root]; arr[Number(head)]=nv; return arr;} if(root && typeof root==='object') return { ...root,[head as any]: nv }; return root; } if(Array.isArray(root)){ const arr=[...root]; arr[Number(head)]=setValueAtPath(arr[Number(head)],rest,nv); return arr;} if(root && typeof root==='object') return { ...root,[head as any]: setValueAtPath(root[head as any],rest,nv) }; return root; };
  const deepClone=(v:any)=> JSON.parse(JSON.stringify(v));
  const removeAtPath=(root:any,segs:(string|number)[])=>{ if(segs.length===0) return root; const parentSegs=segs.slice(0,-1); const last=segs[segs.length-1]; const parent=getDataAtPath(root,parentSegs); if(Array.isArray(parent)){ return setValueAtPath(root,parentSegs,parent.filter((_:any,i:number)=> i!==Number(last))); } if(parent && typeof parent==='object'){ const { [last as any]: _r, ...rest }=parent; return setValueAtPath(root,parentSegs,rest); } return root; };
  const duplicateAtPath=(root:any,segs:(string|number)[])=>{ const parentSegs=segs.slice(0,-1); const last=segs[segs.length-1]; const parent=getDataAtPath(root,parentSegs); const nodeVal=getDataAtPath(root,segs); if(Array.isArray(parent)){ const idx=Number(last); const newParent=[...parent]; newParent.splice(idx+1,0,deepClone(nodeVal)); return setValueAtPath(root,parentSegs,newParent); } if(parent && typeof parent==='object'){ const base=`${String(last)}_copy`; let newKey=base; let i=2; while(newKey in parent) newKey=`${base}${i++}`; const keys=Object.keys(parent); const targetIndex=keys.indexOf(String(last)); const newObj:Record<string,any>={}; keys.forEach((k,idx)=>{ newObj[k]=parent[k]; if(idx===targetIndex) newObj[newKey]=deepClone(nodeVal); }); return setValueAtPath(root,parentSegs,newObj); } return root; };
  const renameKeyAtPath=(root:any,segs:(string|number)[],newKey:string)=>{ const parentSegs=segs.slice(0,-1); const last=segs[segs.length-1]; const parent=getDataAtPath(root,parentSegs); if(!parent||Array.isArray(parent)) return root; if(!newKey|| newKey===last) return root; if(newKey in parent && newKey!==last){ const base=newKey; let c=1; let candidate=newKey; while(candidate in parent && candidate!==last) candidate=`${base}_${c++}`; newKey=candidate; } const keys=Object.keys(parent); const targetIndex=keys.indexOf(String(last)); if(targetIndex===-1) return root; const newObj:Record<string,any>={}; keys.forEach((k,i)=>{ if(i===targetIndex) newObj[newKey]=parent[k]; else newObj[k]=parent[k]; }); return setValueAtPath(root,parentSegs,newObj); };
  const updateSelf=(nv:any)=> onRootUpdate(setValueAtPath(rootData,segments,nv));
  const insertIntoValue=()=>{ let nv=value; if(Array.isArray(value)) nv=[...value,'']; else if(isObject) nv={ ...value, [`newKey${Object.keys(value).length+1}`]: '' }; updateSelf(nv); };
  const sortValue=()=>{ if(Array.isArray(value)) updateSelf([...value].sort((a:any,b:any)=> String(a).localeCompare(String(b)))); else if(isObject){ const keys=Object.keys(value).sort(); const sorted:any={}; keys.forEach(k=> sorted[k]=value[k]); updateSelf(sorted); } };
  const convertType=(t:string)=>{ let nv:any; switch(t){ case'string':nv=String(value);break; case'number':nv=Number(value)||0;break; case'boolean':nv=Boolean(value);break; case'null':nv=null;break; case'object':nv={};break; case'array':nv=[];break; default:return;} updateSelf(nv); setShowMenu(false); };
  const arrayTransform=(mode:string)=>{ if(!isArray) return; let next=value.slice(); const cmp=(a:any,b:any)=> typeof a==='number'&& typeof b==='number'? a-b: String(a).localeCompare(String(b)); switch(mode){ case'filter-nulls': next=next.filter((v:any)=> v!==null); break; case'filter-falsy': next=next.filter(Boolean); break; case'sort-asc': next=[...next].sort(cmp); break; case'sort-desc': next=[...next].sort((a:any,b:any)=> cmp(b,a)); break; case'unique': { const out:any[]=[]; const seen=new Set<string>(); for(const item of next){ const k= typeof item==='object'? JSON.stringify(item): String(item); if(!seen.has(k)){ seen.add(k); out.push(item);} } next=out; break;} case'flatten1': next=([] as any[]).concat(...next); break; case'map-number': next=next.map((v:any)=> typeof v==='number'? v: (typeof v==='string' && !isNaN(Number(v))? Number(v): v)); break; case'map-string': next=next.map((v:any)=> typeof v==='string'? v: v===null?'null': typeof v==='object'? JSON.stringify(v): String(v)); break; default:return; } updateSelf(next); setShowMenu(false); };
  const extractJSON= async()=>{ try{ await navigator.clipboard.writeText(JSON.stringify(value,null,2)); alert('Copied node JSON'); } catch{ alert('Copy failed'); } setShowMenu(false); };
  const startEditValue=()=>{ setEditedValue(value===null?'null': typeof value==='object'? JSON.stringify(value): String(value)); setIsEditingValue(true); };
  const saveEditValue=()=>{ let parsed:any=editedValue; const t=editedValue.trim(); if(/^[{[]/.test(t)){ try{ parsed=JSON.parse(editedValue);}catch{} } else if(t==='null') parsed=null; else if(t==='true') parsed=true; else if(t==='false') parsed=false; else if(!isNaN(Number(t))) parsed=Number(t); updateSelf(parsed); setIsEditingValue(false); };
  const cancelEditValue=()=> setIsEditingValue(false);
  const startEditKey=()=>{ if(Array.isArray(getDataAtPath(rootData,segments.slice(0,-1)))|| level===0) return; setEditedKey(String(segments[segments.length-1])); setIsEditingKey(true); };
  const saveEditKey=()=>{ if(level===0){ setIsEditingKey(false); return;} const parent=getDataAtPath(rootData,segments.slice(0,-1)); if(Array.isArray(parent)){ setIsEditingKey(false); return;} if(!editedKey){ setIsEditingKey(false); return;} onRootUpdate(renameKeyAtPath(rootData,segments,editedKey)); setIsEditingKey(false); };
  const cancelEditKey=()=> setIsEditingKey(false);
  const handleInsert=()=>{ insertIntoValue(); setShowMenu(false); };
  const handleDuplicate=()=>{ onRootUpdate(duplicateAtPath(rootData,segments)); setShowMenu(false); };
  const handleRemove=()=>{ if(!confirm(`Remove "${keyName}"?`)) return; onRootUpdate(removeAtPath(rootData,segments)); setShowMenu(false); };
  const handleSort=()=>{ sortValue(); setShowMenu(false); };
  const parentContainer= level===0? null: getDataAtPath(rootData,segments.slice(0,-1));
  const containerType: 'array'|'object'|'other'= Array.isArray(parentContainer)?'array': (parentContainer && typeof parentContainer==='object')?'object':'other';
  const handleDragStart:React.DragEventHandler<HTMLElement>=e=>{
    if (containerType === 'other' || level === 0) return;
    const payload = { parentSegs: segments.slice(0,-1), containerType, sourceSeg: segments[segments.length-1] };
    dragPayloadRef.current = payload;
    try { e.dataTransfer.setData('application/json', JSON.stringify(payload)); } catch {}
    try { e.dataTransfer.setData('text/plain', 'json-node-drag'); } catch {}
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver:React.DragEventHandler<HTMLDivElement>=e=>{
    try {
      const p = dragPayloadRef.current ?? ((): any => { const d = e.dataTransfer.getData('application/json'); return d ? JSON.parse(d) : null; })();
      const sameParent = p && JSON.stringify(p.parentSegs)===JSON.stringify(segments.slice(0,-1)) && p.containerType===containerType;
      if (sameParent || !p) {
        e.preventDefault();
        try { e.dataTransfer.dropEffect = 'move'; } catch {}
        if (sameParent) setShowInsertLine(true);
      }
    } catch {}
  };
  const handleDrop:React.DragEventHandler<HTMLDivElement>=e=>{
    const d=e.dataTransfer.getData('application/json');
    const p = d ? JSON.parse(d) : dragPayloadRef.current;
    dragPayloadRef.current = null;
    if(!p) return;
    const sameParent= JSON.stringify(p.parentSegs)=== JSON.stringify(segments.slice(0,-1)) && p.containerType===containerType;
    if(!sameParent) return;
    setShowInsertLine(false);
    if(containerType==='array' && Array.isArray(parentContainer)){
      const src=Number(p.sourceSeg); const dst=Number(segments[segments.length-1]);
      if(Number.isNaN(src)|| Number.isNaN(dst)|| src===dst) return;
      const newParent=[...parentContainer]; const [m]=newParent.splice(src,1); newParent.splice(dst,0,m);
      onRootUpdate(setValueAtPath(rootData,segments.slice(0,-1),newParent));
    } else if(containerType==='object' && parentContainer && typeof parentContainer==='object'){
      const srcKey=String(p.sourceSeg); const dstKey=String(segments[segments.length-1]);
      if(srcKey===dstKey) return;
      const keys=Object.keys(parentContainer); const si=keys.indexOf(srcKey); const di=keys.indexOf(dstKey);
      if(si===-1 || di===-1) return;
      keys.splice(di,0,keys.splice(si,1)[0]);
      const reordered:Record<string,any>={}; keys.forEach(k=> reordered[k]=parentContainer[k]);
      onRootUpdate(setValueAtPath(rootData,segments.slice(0,-1),reordered));
    }
  };
  const handleDragLeave:React.DragEventHandler<HTMLDivElement>=()=>{ if(showInsertLine) setShowInsertLine(false); };
  const handleBooleanToggle = () => {
    updateSelf(!value);
  };
  const renderValue=()=> isEditingValue? (<input ref={valueInputRef} className="px-1 py-0.5 text-sm border rounded bg-white dark:bg-slate-900" value={editedValue} onChange={e=>setEditedValue(e.target.value)} onBlur={saveEditValue} onKeyDown={e=>{ if(e.key==='Enter') saveEditValue(); else if(e.key==='Escape') cancelEditValue(); }} />): value===null? <span onClick={startEditValue} className="cursor-text text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 inline-block hover:scale-105" title="Click to edit">null</span>: typeof value==='boolean'? (<div className="inline-flex items-center gap-2 px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30"><input type="checkbox" checked={value} onChange={handleBooleanToggle} className="w-4 h-4 cursor-pointer accent-purple-600 dark:accent-purple-400 rounded" title={value ? 'Checked (true)' : 'Unchecked (false)'} /><span className="text-purple-600 dark:text-purple-400 font-semibold text-sm select-none">{String(value)}</span></div>): typeof value==='number'? <span onClick={startEditValue} className="cursor-text text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold px-1.5 py-0.5 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-all duration-200 inline-block hover:scale-105 hover:shadow-sm" title="Click to edit">{value}</span>: typeof value==='string'? <span onClick={startEditValue} className="cursor-text text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 px-1.5 py-0.5 rounded hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200 inline-block hover:scale-105 hover:shadow-sm" title="Click to edit">"{value}"</span>: null;
  const getCollectionInfo=()=> isArray?`[${value.length}]`: isObject?`{${Object.keys(value).length}}`: '';
  
  // Determine if current node is a primitive (not object/array)
  const isPrimitive = !isObject && !isArray;
  
  // Track path and highlighting
  const currentPath = segments.join('.');
  const isHighlighted = selectedPath === currentPath;
  const handleNodeClick = (e: React.MouseEvent) => {
    if (onSelectPath && !e.defaultPrevented) {
      e.stopPropagation();
      onSelectPath(segments);
    }
  };
  
  // Get type-specific styling for colorful display
  const getValueTypeStyle = () => {
    if (typeof value === 'string') return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-2 border-green-400 dark:border-green-500';
    if (typeof value === 'number') return 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-2 border-blue-400 dark:border-blue-500';
    if (typeof value === 'boolean') return 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-l-2 border-purple-400 dark:border-purple-500';
    if (value === null) return 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/20 dark:to-gray-800/20 border-l-2 border-slate-400 dark:border-slate-500';
    if (isArray) return 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-l-2 border-teal-400 dark:border-teal-500';
    if (isObject) return 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-l-2 border-orange-400 dark:border-orange-500';
    return '';
  };
  
  return (
    <div className={`font-mono text-sm ${level===0?'':'ml-4'}`}>
      <div className={`flex items-start gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 py-0.5 pl-1 pr-2 rounded group relative transition-all duration-200 hover:shadow-sm ${getValueTypeStyle()} ${isHighlighted ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}`} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave} onClick={handleNodeClick}>
        {showInsertLine && (
          <div className="absolute left-1 -top-1 w-[6px] h-[6px] rounded-full bg-purple-500 dark:bg-purple-400 shadow-sm pointer-events-none animate-pulse" aria-hidden="true" />
        )}
        {isExpandable? <button onClick={()=>setIsExpanded(e=>!e)} className="flex-shrink-0 w-4 h-5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-all duration-200 hover:scale-110">{isExpanded?'▼':'▶'}</button>: <span className="w-4 flex-shrink-0"/>}
        {level>0 && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button aria-label="Open actions menu" onClick={()=>setShowMenu(m=>!m)} className="w-5 h-5 flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300 hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-md hover:scale-105">▦</button>
            {showMenu && (
              <div className="absolute top-full left-0 mt-1 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-xl z-50 p-1 flex flex-col w-[160px] max-h-[60vh] overflow-auto font-mono text-sm">
                {/* Type conversion - available for all nodes */}
                <button aria-label="Type: convert value type" onClick={()=>setOpenType(o=>{ const next=!o; if(next){ setOpenStructure(false); setOpenTransform(false); } return next; })} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200" data-section="type"><span>Type</span><span className="text-[20px]">{openType?'▾':'▸'}</span></button>
                {openType && (
                  <>
                    <button onClick={()=>convertType('string')} className={`text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 ${typeof value==='string'?'!bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white font-semibold shadow-md':''}`}>String</button>
                    <button onClick={()=>convertType('number')} className={`text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 ${typeof value==='number'?'!bg-gradient-to-r !from-blue-500 !to-cyan-500 !text-white font-semibold shadow-md':''}`}>Number</button>
                    <button onClick={()=>convertType('boolean')} className={`text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 ${typeof value==='boolean'?'!bg-gradient-to-r !from-purple-500 !to-pink-500 !text-white font-semibold shadow-md':''}`}>Boolean</button>
                    <button onClick={()=>convertType('null')} className={`text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800/30 dark:hover:to-gray-800/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 ${value===null?'!bg-gradient-to-r !from-slate-500 !to-gray-500 !text-white font-semibold shadow-md':''}`}>Null</button>
                    <button onClick={()=>convertType('object')} className={`text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 dark:hover:from-orange-900/30 dark:hover:to-amber-900/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 ${isObject?'!bg-gradient-to-r !from-orange-500 !to-amber-500 !text-white font-semibold shadow-md':''}`}>Object {"{}"}</button>
                    <button onClick={()=>convertType('array')} className={`text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 ${isArray?'!bg-gradient-to-r !from-teal-500 !to-cyan-500 !text-white font-semibold shadow-md':''}`}>Array []</button>
                  </>
                )}
                
                {/* Structure section - show different options based on node type */}
                {!isPrimitive && (
                  <>
                    <button aria-label="Structure: insert, sort, duplicate, remove" onClick={()=>setOpenStructure(o=>{ const next=!o; if(next){ setOpenType(false); setOpenTransform(false); } return next; })} className="mt-2 flex items-center justify-between px-2 py-1 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200" data-section="structure"><span>Structure</span><span className="text-[20px]">{openStructure?'▾':'▸'}</span></button>
                    {openStructure && (
                      <>
                        <button onClick={handleSort} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 hover:shadow-sm">Sort</button>
                        <button onClick={handleInsert} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 hover:shadow-sm">Insert</button>
                        <button onClick={handleDuplicate} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 hover:shadow-sm">Duplicate</button>
                        <button onClick={handleRemove} className="text-left px-2 py-1 rounded border border-transparent hover:border-red-400/50 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/30 dark:hover:to-rose-900/30 text-red-600 dark:text-red-400 font-semibold text-sm transition-all duration-200 hover:shadow-sm">Remove</button>
                      </>
                    )}
                  </>
                )}
                
                {/* For primitives, show simplified structure options */}
                {isPrimitive && (
                  <>
                    <button aria-label="Structure: duplicate, remove" onClick={()=>setOpenStructure(o=>{ const next=!o; if(next){ setOpenType(false); setOpenTransform(false); } return next; })} className="mt-2 flex items-center justify-between px-2 py-1 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200" data-section="structure"><span>Structure</span><span className="text-[20px]">{openStructure?'▾':'▸'}</span></button>
                    {openStructure && (
                      <>
                        <button onClick={handleDuplicate} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200 hover:shadow-sm">Duplicate</button>
                        <button onClick={handleRemove} className="text-left px-2 py-1 rounded border border-transparent hover:border-red-400/50 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/30 dark:hover:to-rose-900/30 text-red-600 dark:text-red-400 font-semibold text-sm transition-all duration-200 hover:shadow-sm">Remove</button>
                      </>
                    )}
                  </>
                )}
                
                {/* Transform section - only for arrays */}
                {isArray && (
                  <>
                    <button aria-label="Transform: array filters, sort, map, unique, flatten" onClick={()=>setOpenTransform(o=>{ const next=!o; if(next){ setOpenType(false); setOpenStructure(false); } return next; })} className="mt-2 flex items-center justify-between px-2 py-1 rounded hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30 font-semibold text-slate-700 dark:text-slate-300 text-sm transition-all duration-200" data-section="transform"><span>Transform</span><span className="text-[20px]">{openTransform?'▾':'▸'}</span></button>
                    {openTransform && (
                      <>
                        <button onClick={()=>arrayTransform('filter-nulls')} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800/30 dark:hover:to-gray-800/30 text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200 hover:shadow-sm">Filter nulls</button>
                        <button onClick={()=>arrayTransform('filter-falsy')} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800/30 dark:hover:to-gray-800/30 text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200 hover:shadow-sm">Filter falsy</button>
                        <button onClick={()=>arrayTransform('sort-asc')} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200 hover:shadow-sm">Sort ascending</button>
                        <button onClick={()=>arrayTransform('sort-desc')} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200 hover:shadow-sm">Sort descending</button>
                        <button onClick={()=>arrayTransform('map-number')} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200 hover:shadow-sm">Map to numbers</button>
                        <button onClick={()=>arrayTransform('map-string')} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200 hover:shadow-sm">Map to strings</button>
                        <button onClick={()=>arrayTransform('unique')} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200 hover:shadow-sm">Unique values</button>
                        <button onClick={()=>arrayTransform('flatten1')} className="text-left px-2 py-1 rounded hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30 text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200 hover:shadow-sm">Flatten depth 1</button>
                      </>
                    )}
                  </>
                )}
                
                {/* Other section - available for all nodes */}
                <div className="mt-2 border-t border-slate-200 dark:border-slate-600 pt-2">
                  <span className="px-2 py-1 font-semibold text-slate-700 dark:text-slate-300 text-sm">Other</span>
                  <button onClick={extractJSON} className="text-left w-full px-2 py-1 rounded hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/30 dark:hover:to-blue-900/30 text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap transition-all duration-200 hover:shadow-sm">Extract JSON</button>
                </div>
              </div>
            )}
          </div>
        )}
        {level>0 && (containerType==='array' || containerType==='object') && (
          <button aria-label="Drag to reorder" draggable onDragStart={handleDragStart} className="ml-1 w-5 h-5 flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 bg-white/60 dark:bg-slate-700/80 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-grab active:cursor-grabbing">⠿</button>
        )}
        <div className="flex-1 break-all">
          {isEditingKey? (
            <input ref={keyInputRef} className="px-1 py-0.5 text-sm border rounded font-semibold bg-white dark:bg-slate-900" value={editedKey} onChange={e=>setEditedKey(e.target.value)} onBlur={saveEditKey} onKeyDown={e=>{ if(e.key==='Enter') saveEditKey(); else if(e.key==='Escape') cancelEditKey(); }} />
          ): (
            <span onClick={startEditKey} title={Array.isArray(getDataAtPath(rootData,segments.slice(0,-1)))|| level===0? '': 'Click to rename key'} className="text-teal-700 dark:text-teal-400 font-bold cursor-text select-text bg-teal-50/50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all duration-200 inline-block">
              {keyName}
              {isExpandable && <span className="ml-1 text-[10px] font-normal text-slate-500 dark:text-slate-400 align-middle" title={`Children: ${isArray? value.length: Object.keys(value).length}`}>{getCollectionInfo()}</span>}
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-500 mx-1">:</span>
          {!isExpandable && renderValue()}
          {isExpandable && !isExpanded && <span className="text-slate-400 dark:text-slate-500 text-xs ml-1 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded" title={`Children: ${isArray? value.length: Object.keys(value).length}`}>{isArray?`[${value.length}]`: `{${Object.keys(value).length}}`}</span>}
        </div>
      </div>
      {isExpanded && isExpandable && (
        <div className="border-l border-slate-300 dark:border-slate-600 ml-2 pl-1">
          {isArray? value.map((item:any,index:number)=>(
            <TreeNode key={segments.concat(index).join('.')} keyName={`[${index}]`} value={item} level={level+1} isLast={index===value.length-1} segments={segments.concat(index)} rootData={rootData} onRootUpdate={onRootUpdate} expandAll={expandAll} collapseAll={collapseAll} selectedPath={selectedPath} onSelectPath={onSelectPath} />
          )): Object.entries(value).map(([childKey,childVal],index,arr)=>(
            <TreeNode key={segments.concat(childKey).join('.')} keyName={childKey} value={childVal} level={level+1} isLast={index===arr.length-1} segments={segments.concat(childKey)} rootData={rootData} onRootUpdate={onRootUpdate} expandAll={expandAll} collapseAll={collapseAll} selectedPath={selectedPath} onSelectPath={onSelectPath} />
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
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const scrollRef=useRef<HTMLDivElement|null>(null);
  const dropdownRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{ setTreeData(data); },[data]);
  const handleEditClick=()=>{ setEditValue(JSON.stringify(treeData,null,2)); setEditMode(true); };
  const handleSave=()=>{ try{ JSON.parse(editValue); onEdit?.(editValue); setEditMode(false);} catch{ alert('Invalid JSON. Fix errors before saving.'); } };
  const handleCancel=()=>{ setEditMode(false); setEditValue(''); };
  const handleTreeUpdate=(newData:any)=>{ const prev=scrollRef.current?.scrollTop||0; setTreeData(newData); onEdit?.(JSON.stringify(newData,null,2)); requestAnimationFrame(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=prev; }); };
  
  // Handle path selection
  const handleSelectPath = (segments: (string|number)[]) => {
    setSelectedPath(segments.join('.'));
  };
  
  // Get children of a node at path
  const getChildrenAtPath = (segments: (string|number)[]) => {
    let current = treeData;
    for (const seg of segments) {
      if (current && typeof current === 'object') {
        current = current[seg as any];
      } else {
        return [];
      }
    }
    if (Array.isArray(current)) {
      return current.map((_, idx) => ({ key: `[${idx}]`, segments: [...segments, idx] }));
    } else if (current && typeof current === 'object') {
      return Object.keys(current).map(key => ({ key, segments: [...segments, key] }));
    }
    return [];
  };
  
  // Parse selected path into segments
  const pathSegments = selectedPath ? selectedPath.split('.').filter(Boolean) : [];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);
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
      {/* Edit Instructions - Compact */}
      {onEdit && (
        <div className="px-4 py-1.5 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/30">
          <span className="text-xs text-blue-600 dark:text-blue-400">✏️ Click keys/values to edit • Actions left column</span>
        </div>
      )}
      
      {/* Breadcrumb Section */}
      {selectedPath && (
        <div className="px-4 py-2 border-b border-slate-400 dark:border-slate-500 bg-slate-200 dark:bg-slate-700">
          <div className="flex items-center text-sm flex-wrap font-mono">
            <button
              onClick={() => { setSelectedPath(''); setOpenDropdown(null); }}
              className="px-1.5 py-0.5 rounded hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 font-medium transition-colors"
            >
              object
            </button>
            {pathSegments.map((segment, idx) => {
              const segmentsUpToHere = pathSegments.slice(0, idx + 1);
              const pathUpToHere = segmentsUpToHere.join('.');
              const children = getChildrenAtPath(segmentsUpToHere.map(s => isNaN(Number(s)) ? s : Number(s)));
              const hasChildren = children.length > 0;
              
              return (
                <div key={idx} className="flex items-center">
                  <div className="relative inline-flex">
                    <button
                      onClick={(e) => { 
                        if (hasChildren) {
                          e.stopPropagation(); 
                          setOpenDropdown(openDropdown === idx ? null : idx);
                        }
                      }}
                      className="px-0.5 py-0.5 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {hasChildren && openDropdown === idx && (
                      <div ref={dropdownRef} className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-xl z-50 min-w-[160px] max-h-[300px] overflow-y-auto">
                        {children.map((child, childIdx) => (
                          <button
                            key={childIdx}
                            onClick={() => {
                              handleSelectPath(child.segments);
                              setOpenDropdown(null);
                              setTimeout(() => {
                                const selectedElement = scrollRef.current?.querySelector('.ring-2.ring-blue-500');
                                if (selectedElement) {
                                  selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }, 50);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 text-sm border-b border-slate-300 dark:border-slate-500 last:border-b-0 transition-colors font-mono"
                          >
                            {child.key}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { 
                      setSelectedPath(pathUpToHere); 
                      setOpenDropdown(null);
                      setTimeout(() => {
                        const selectedElement = scrollRef.current?.querySelector('.ring-2.ring-blue-500');
                        if (selectedElement) {
                          selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 50);
                    }}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 font-medium transition-colors"
                  >
                    {segment}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-4" ref={scrollRef}>
        <TreeNode key="root" keyName="root" value={treeData} level={0} isLast={true} segments={[]} rootData={treeData} onRootUpdate={handleTreeUpdate} expandAll={expandAll} collapseAll={collapseAll} selectedPath={selectedPath} onSelectPath={handleSelectPath} />
      </div>
    </div>
  );
};

interface FormFieldProps { keyName:string; value:any; level:number; path:(string|number)[]; expandAll?:boolean; collapseAll?:boolean; onValueChange?: (path: (string|number)[], newValue: any) => void; }
const FormField:React.FC<FormFieldProps>=({ keyName,value,level,path,expandAll,collapseAll,onValueChange })=>{
  const [isExpanded,setIsExpanded]=useState(level<1);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef(value);
  
  // Get type-specific styling for colorful display
  const getFieldBgClass = () => {
    if (typeof value === 'string') return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-1 border-green-400 dark:border-green-500';
    if (typeof value === 'number') return 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-1 border-blue-400 dark:border-blue-500';
    if (typeof value === 'boolean') return 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-l-1 border-purple-400 dark:border-purple-500';
    if (value === null) return 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/20 dark:to-gray-800/20 border-l-1 border-slate-400 dark:border-slate-500';
    return 'bg-white dark:bg-slate-800/50';
  };
  
  useEffect(()=>{ if(expandAll) setIsExpanded(true); },[expandAll]);
  useEffect(()=>{ if(collapseAll) setIsExpanded(false); },[collapseAll]);
  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);
  
  // Close editing mode when value changes from parent
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsEditing(false);
      prevValueRef.current = value;
    }
  }, [value]);
  
  const isObject= typeof value==='object' && value!==null && !Array.isArray(value);
  const isArray= Array.isArray(value);
  
  const startEdit = () => {
    if (isObject || isArray || !onValueChange) return; // Don't edit complex types in form view
    const stringValue = value === null ? 'null' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    setEditValue(stringValue);
    setIsEditing(true);
  };
  
  const saveEdit = () => {
    if (!onValueChange) return;
    
    let parsed: any = editValue;
    const trimmed = editValue.trim();
    
    // Try to parse the value intelligently
    if (trimmed === 'null') {
      parsed = null;
    } else if (trimmed === 'true') {
      parsed = true;
    } else if (trimmed === 'false') {
      parsed = false;
    } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
      parsed = Number(trimmed);
    } else if (/^[{[]/.test(trimmed)) {
      try {
        parsed = JSON.parse(editValue);
      } catch {
        // Keep as string if JSON parsing fails
      }
    }
    
    onValueChange(path, parsed);
    setIsEditing(false);
  };
  
  const cancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleBooleanToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onValueChange) {
      onValueChange(path, e.target.checked);
    }
  };
  
  const renderVal=()=> {
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveEdit();
            } else if (e.key === 'Escape') {
              cancelEdit();
            }
          }}
          className="flex-1 px-2 py-1 text-sm border-2 border-blue-400 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
      );
    }
    
    const canEdit = onValueChange && !isObject && !isArray;
    const hoverClass = canEdit ? 'cursor-pointer hover:scale-105 hover:shadow-sm px-1.5 py-0.5 rounded transition-all duration-200' : 'px-1.5 py-0.5';
    const title = canEdit ? 'Click to edit' : '';
    
    return value===null? <span className={`text-slate-500 dark:text-slate-400 italic font-medium ${hoverClass} ${canEdit ? 'hover:bg-gradient-to-r hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-gray-700' : ''}`} onClick={startEdit} title={title}>null</span>: typeof value==='boolean'? (<div className="inline-flex items-center gap-2"><input type="checkbox" checked={value} onChange={handleBooleanToggle} disabled={!onValueChange} className="w-4 h-4 cursor-pointer accent-purple-600 dark:accent-purple-400 rounded disabled:opacity-50 disabled:cursor-not-allowed" title={value ? 'Checked (true)' : 'Unchecked (false)'} /><span className="font-bold text-purple-700 dark:text-purple-300 select-none">{String(value)}</span></div>): typeof value==='number'? <span className={`text-blue-700 dark:text-blue-300 font-bold ${hoverClass} ${canEdit ? 'hover:bg-gradient-to-r hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/40 dark:hover:to-cyan-900/40' : ''}`} onClick={startEdit} title={title}>{value}</span>: typeof value==='string'? <span className={`text-green-700 dark:text-green-300 font-medium ${hoverClass} ${canEdit ? 'hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40' : ''}`} onClick={startEdit} title={title}>{value}</span>: null;
  };
  
  if(isObject) return (
    <div className={`${level>0?'ml-4 mt-1.5':'mt-1'} font-mono text-sm bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-l-1 border-orange-400 dark:border-orange-500 rounded-md p-2 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div onClick={()=>setIsExpanded(e=>!e)} className="font-bold text-orange-700 dark:text-orange-300 mb-1 cursor-pointer hover:text-orange-900 dark:hover:text-orange-100 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02]">
        <span className="inline-block transition-transform duration-200" style={{transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}}>▶</span>
        <span>{keyName}</span>
        <span className="text-xs bg-orange-200 dark:bg-orange-800 px-1.5 py-0.5 rounded-full">{Object.keys(value).length} props</span>
      </div>
      {isExpanded && <div className="space-y-1 mt-1">{Object.entries(value).map(([k,v])=> <FormField key={`${path.join('.')}.${k}`} keyName={k} value={v} level={level+1} path={[...path, k]} expandAll={expandAll} collapseAll={collapseAll} onValueChange={onValueChange} />)}</div>}
    </div>
  );
  if(isArray) return (
    <div className={`${level>0?'ml-4 mt-1.5':'mt-1'} font-mono text-sm bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 border-l-1 border-teal-400 dark:border-teal-500 rounded-md p-2 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div onClick={()=>setIsExpanded(e=>!e)} className="font-bold text-teal-700 dark:text-teal-300 mb-1 cursor-pointer hover:text-teal-900 dark:hover:text-teal-100 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02]">
        <span className="inline-block transition-transform duration-200" style={{transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}}>▶</span>
        <span>{keyName}</span>
        <span className="text-xs bg-teal-200 dark:bg-teal-800 px-1.5 py-0.5 rounded-full">{value.length} items</span>
      </div>
      {isExpanded && <div className="space-y-1 mt-1">{value.map((item:any,i:number)=> <FormField key={`${path.join('.')}.${i}`} keyName={`Item ${i+1}`} value={item} level={level+1} path={[...path, i]} expandAll={expandAll} collapseAll={collapseAll} onValueChange={onValueChange} />)}</div>}
    </div>
  );
  return (
    <div className={`font-mono text-sm flex items-baseline gap-2 py-1 px-2 rounded-md shadow-sm hover:shadow-md transition-all duration-200 ${getFieldBgClass()}`}>
      <label className="font-semibold text-teal-700 dark:text-teal-300 min-w-[100px] bg-teal-50/50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded">{keyName}:</label>
      <div className="flex-1">{renderVal()}</div>
    </div>
  );
};
export const FormView:React.FC<{ data:any; expandAll?:boolean; collapseAll?:boolean; onEdit?: (jsonString: string) => void; }>=({ data,expandAll,collapseAll,onEdit })=> {
  const [formData, setFormData] = useState(data);
  
  useEffect(() => {
    setFormData(data);
  }, [data]);
  
  const setValueAtPath = (root: any, path: (string|number)[], newValue: any): any => {
    if (path.length === 0) return newValue;
    
    const [head, ...rest] = path;
    
    if (rest.length === 0) {
      if (Array.isArray(root)) {
        const arr = [...root];
        arr[Number(head)] = newValue;
        return arr;
      }
      if (root && typeof root === 'object') {
        return { ...root, [head]: newValue };
      }
      return root;
    }
    
    if (Array.isArray(root)) {
      const arr = [...root];
      arr[Number(head)] = setValueAtPath(arr[Number(head)], rest, newValue);
      return arr;
    }
    
    if (root && typeof root === 'object') {
      return { ...root, [head]: setValueAtPath(root[head], rest, newValue) };
    }
    
    return root;
  };
  
  const handleValueChange = (path: (string|number)[], newValue: any) => {
    const newData = setValueAtPath(formData, path, newValue);
    setFormData(newData);
    
    if (onEdit) {
      onEdit(JSON.stringify(newData, null, 2));
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {onEdit && (
        <div className="mb-2 pb-2 border-b-2 border-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-800 dark:to-cyan-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-2 shadow-sm mx-3 mt-2">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">✏️ Click any value to edit • Press Enter to save, Esc to cancel</span>
        </div>
      )}
      <div className="flex-1 overflow-auto p-3">
        {typeof formData==='object' && formData!==null ? (Array.isArray(formData)? (
          <div className="space-y-1">{formData.map((item:any,i:number)=><FormField key={i} keyName={`Item ${i+1}`} value={item} level={0} path={[i]} expandAll={expandAll} collapseAll={collapseAll} onValueChange={onEdit ? handleValueChange : undefined} />)}</div>
        ): (
          <div className="space-y-1">{Object.entries(formData).map(([k,v])=> <FormField key={k} keyName={k} value={v} level={0} path={[k]} expandAll={expandAll} collapseAll={collapseAll} onValueChange={onEdit ? handleValueChange : undefined} />)}</div>
        )): <div className="text-slate-600 dark:text-slate-400">Invalid JSON data</div>}
      </div>
    </div>
  );
};
export const TextView:React.FC<{ code:string; onChange?:(v:string)=>void; expandAll?:boolean; collapseAll?:boolean; }>=({ code,onChange })=>{
  // Text View must not show line-number gutter or fold/unfold controls
  const theme = React.useMemo(() => EditorView.theme({
    '&': { height: '100%' },
    '.cm-editor': { backgroundColor: '#ffffff', height: '100%' },
    '.cm-content': { backgroundColor: '#ffffff' },
    '.cm-scroller': { overflow: 'auto' },
    '.dark .cm-editor': { backgroundColor: '#1e293b' },
    '.dark .cm-content': { backgroundColor: '#1e293b' },
  }), []);

  return (
    <div className="h-full overflow-auto bg-white dark:bg-slate-900">
      <CodeMirror 
        value={code} 
        onChange={onChange} 
        extensions={[
          // Keep JSON highlighting for readability, but omit folding and gutters
          json(),
          EditorView.lineWrapping,
          theme,
        ]} 
        basicSetup={{
          lineNumbers: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: false,
          foldGutter: false,
          dropCursor: !!onChange,
          allowMultipleSelections: !!onChange,
          indentOnInput: !!onChange,
        }} 
        theme={undefined}
        style={{ fontSize:'14px', height:'100%', fontFamily:'ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace' }} 
      />
    </div>
  );
};
interface ViewNodeProps { value:any; level:number; keyName?:string; expandAll?:boolean; collapseAll?:boolean }
const ViewNode:React.FC<ViewNodeProps>=({ value,level,keyName,expandAll,collapseAll })=>{
  const [isExpanded,setIsExpanded]=useState(level<1);
  useEffect(()=>{ if(expandAll) setIsExpanded(true); },[expandAll]);
  useEffect(()=>{ if(collapseAll) setIsExpanded(false); },[collapseAll]);
  const isObject= typeof value==='object' && value!==null && !Array.isArray(value);
  const isArray= Array.isArray(value);
  const isExpandable=isObject|| isArray;
  const renderPrimitive=()=> value===null? <span className="text-slate-400 italic">null</span>: value===undefined? <span className="text-slate-400 italic">undefined</span>: typeof value==='boolean'? <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>: typeof value==='number'? <span className="text-blue-600 dark:text-blue-400">{value}</span>: typeof value==='string'? <span className="text-green-600 dark:text-green-400">"{value}"</span>: null;
  const getPreview=()=> isArray? (value.length===0?'[]': `Array(${value.length})`): isObject? (Object.keys(value).length===0?'{}':'Object'): '';
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
          {isArray? value.map((item:any,idx:number)=>(
            <div key={idx} className="flex items-start gap-2">
              {/* Removed array index label to avoid perceived line numbers in View mode */}
              <ViewNode value={item} level={level+1} expandAll={expandAll} collapseAll={collapseAll} />
            </div>
          )): Object.entries(value).map(([k,v])=> (
            <ViewNode key={k} keyName={k} value={v} level={level+1} expandAll={expandAll} collapseAll={collapseAll} />
          ))}
          <span className="text-slate-500 dark:text-slate-400">{isArray?']':'}'}</span>
        </div>
      )}
    </div>
  );
};
export const ConsoleView:React.FC<{ data:any; expandAll?:boolean; collapseAll?:boolean }>=({ data,expandAll,collapseAll })=> (
  <div className="h-full overflow-auto p-4 bg-white dark:bg-slate-900">
    <ViewNode value={data} level={0} expandAll={expandAll} collapseAll={collapseAll} />
  </div>
);

// Export TableView and its ref type for use in parent components
export { TableView };
export type { TableViewRef } from './TableView';

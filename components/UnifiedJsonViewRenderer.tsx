import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { foldGutter, foldKeymap, foldAll, unfoldAll } from '@codemirror/language';
import { keymap } from '@codemirror/view';

const customFoldGutter = foldGutter();

interface TreeNodeProps { keyName: string; value: any; level: number; isLast: boolean; segments: (string|number)[]; rootData: any; onRootUpdate:(d:any)=>void; expandAll?:boolean; collapseAll?:boolean; }
const TreeNode: React.FC<TreeNodeProps> = ({ keyName, value, level, isLast, segments, rootData, onRootUpdate, expandAll, collapseAll }) => {
  const [isExpanded,setIsExpanded]=useState(level<1);
  const [isEditingValue,setIsEditingValue]=useState(false);
  const [editedValue,setEditedValue]=useState('');
  const [isEditingKey,setIsEditingKey]=useState(false);
  const [editedKey,setEditedKey]=useState(keyName);
  const [showMenu,setShowMenu]=useState(false);
  const [openType,setOpenType]=useState(false);
  const [openStructure,setOpenStructure]=useState(false);
  const [openTransform,setOpenTransform]=useState(false);
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
  useEffect(()=>{ const h=(e:MouseEvent)=>{ if(menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); }; if(showMenu) document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h); },[showMenu]);
  // Path helpers
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
  // Editing
  const startEditValue=()=>{ setEditedValue(value===null?'null': typeof value==='object'? JSON.stringify(value): String(value)); setIsEditingValue(true); };
  const saveEditValue=()=>{ let parsed:any=editedValue; const t=editedValue.trim(); if(/^[{[]/.test(t)){ try{ parsed=JSON.parse(editedValue);}catch{} } else if(t==='null') parsed=null; else if(t==='true') parsed=true; else if(t==='false') parsed=false; else if(!isNaN(Number(t))) parsed=Number(t); updateSelf(parsed); setIsEditingValue(false); };
  const cancelEditValue=()=> setIsEditingValue(false);
  const startEditKey=()=>{ if(Array.isArray(getDataAtPath(rootData,segments.slice(0,-1)))|| level===0) return; setEditedKey(String(segments[segments.length-1])); setIsEditingKey(true); };
  const saveEditKey=()=>{ if(level===0){ setIsEditingKey(false); return;} const parent=getDataAtPath(rootData,segments.slice(0,-1)); if(Array.isArray(parent)){ setIsEditingKey(false); return;} if(!editedKey){ setIsEditingKey(false); return;} onRootUpdate(renameKeyAtPath(rootData,segments,editedKey)); setIsEditingKey(false); };
  const cancelEditKey=()=> setIsEditingKey(false);
  // Row actions
  const handleInsert=()=>{ insertIntoValue(); setShowMenu(false); };
  const handleDuplicate=()=>{ onRootUpdate(duplicateAtPath(rootData,segments)); setShowMenu(false); };
  const handleRemove=()=>{ if(!confirm(`Remove "${keyName}"?`)) return; onRootUpdate(removeAtPath(rootData,segments)); setShowMenu(false); };
  const handleSort=()=>{ sortValue(); setShowMenu(false); };
  // Drag & drop
  const parentContainer= level===0? null: getDataAtPath(rootData,segments.slice(0,-1));
  const containerType: 'array'|'object'|'other'= Array.isArray(parentContainer)?'array': (parentContainer && typeof parentContainer==='object')?'object':'other';
  const handleDragStart:React.DragEventHandler<HTMLElement>=e=>{ if(containerType==='other'|| level===0) return; e.dataTransfer.setData('application/json', JSON.stringify({ parentSegs: segments.slice(0,-1), containerType, sourceSeg: segments[segments.length-1] })); e.dataTransfer.effectAllowed='move'; };
  const handleDragOver:React.DragEventHandler<HTMLDivElement>=e=>{ try{ const d=e.dataTransfer.getData('application/json'); if(!d) return; const p=JSON.parse(d); const sameParent= JSON.stringify(p.parentSegs)=== JSON.stringify(segments.slice(0,-1)) && p.containerType===containerType; if(sameParent) e.preventDefault(); }catch{} };
  const handleDrop:React.DragEventHandler<HTMLDivElement>=e=>{ const d=e.dataTransfer.getData('application/json'); if(!d) return; const p=JSON.parse(d); const sameParent= JSON.stringify(p.parentSegs)=== JSON.stringify(segments.slice(0,-1)) && p.containerType===containerType; if(!sameParent) return; if(containerType==='array' && Array.isArray(parentContainer)){ const src=Number(p.sourceSeg); const dst=Number(segments[segments.length-1]); if(Number.isNaN(src)|| Number.isNaN(dst)|| src===dst) return; const newParent=[...parentContainer]; const [m]=newParent.splice(src,1); newParent.splice(dst,0,m); onRootUpdate(setValueAtPath(rootData,segments.slice(0,-1),newParent)); } else if(containerType==='object' && parentContainer && typeof parentContainer==='object'){ const srcKey=String(p.sourceSeg); const dstKey=String(segments[segments.length-1]); if(srcKey===dstKey) return; const keys=Object.keys(parentContainer); const si=keys.indexOf(srcKey); const di=keys.indexOf(dstKey); if(si===-1 || di===-1) return; keys.splice(di,0,keys.splice(si,1)[0]); const reordered:Record<string,any>={}; keys.forEach(k=> reordered[k]=parentContainer[k]); onRootUpdate(setValueAtPath(rootData,segments.slice(0,-1),reordered)); } };
  const renderValue=()=> isEditingValue? (<input ref={valueInputRef} className="px-1 py-0.5 text-sm border rounded bg-white dark:bg-slate-900" value={editedValue} onChange={e=>setEditedValue(e.target.value)} onBlur={saveEditValue} onKeyDown={e=>{ if(e.key==='Enter') saveEditValue(); else if(e.key==='Escape') cancelEditValue(); }} />): value===null? <span onClick={startEditValue} className="cursor-text text-slate-400" title="Click to edit">null</span>: typeof value==='boolean'? <span onClick={startEditValue} className="cursor-text text-purple-600 dark:text-purple-400" title="Click to edit">{String(value)}</span>: typeof value==='number'? <span onClick={startEditValue} className="cursor-text text-blue-600 dark:text-blue-400" title="Click to edit">{value}</span>: typeof value==='string'? <span onClick={startEditValue} className="cursor-text text-green-600 dark:text-green-400" title="Click to edit">"{value}"</span>: null;
  const getCollectionInfo=()=> isArray?`[${value.length}]`: isObject?`{${Object.keys(value).length}}`: '';
  return (
    <div className={`font-mono text-sm ${level===0?'':'ml-4'}`}>
      <div className="flex items-start gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 py-0.5 pl-1 pr-2 rounded group relative" onDragOver={handleDragOver} onDrop={handleDrop}>
        {isExpandable? <button onClick={()=>setIsExpanded(e=>!e)} className="flex-shrink-0 w-4 h-5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400">{isExpanded?'▼':'▶'}</button>: <span className="w-4 flex-shrink-0"/>}
        {level>0 && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              title="Drag to move this field (Alt+Shift+Arrows)"
              onClick={()=>setShowMenu(m=>!m)}
              draggable={containerType==='array'|| containerType==='object'}
              onDragStart={handleDragStart}
              className="w-5 h-5 flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
            >
              ▦
            </button>
            {showMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-lg z-30 p-1 flex flex-col min-w-[170px] max-h-[70vh] overflow-auto font-mono text-sm">
                {/* Type section */}
                <button onClick={()=>setOpenType(o=>{ const next=!o; if(next){ setOpenStructure(false); setOpenTransform(false); } return next; })} className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300" data-section="type">
                  <span>Type</span>
                  <span className="text-xs">{openType?'▾':'▸'}</span>
                </button>
                {openType && (
                  <>
                    <button onClick={()=>convertType('string')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">String</button>
                    <button onClick={()=>convertType('number')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Number</button>
                    <button onClick={()=>convertType('boolean')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Boolean</button>
                    <button onClick={()=>convertType('null')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Null</button>
                    <button onClick={()=>convertType('object')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Object {"{}"}</button>
                    <button onClick={()=>convertType('array')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Array []</button>
                  </>
                )}
                {/* Structure section */}
                {(isObject || isArray) && (
                  <>
                    <button onClick={()=>setOpenStructure(o=>{ const next=!o; if(next){ setOpenType(false); setOpenTransform(false); } return next; })} className="mt-2 flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300" data-section="structure">
                      <span>Structure</span>
                      <span className="text-xs">{openStructure?'▾':'▸'}</span>
                    </button>
                    {openStructure && (
                      <>
                        <button onClick={handleSort} className="text-left px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300">Sort</button>
                        <button onClick={handleInsert} className="text-left px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-700 dark:text-slate-300">Insert</button>
                        <button onClick={handleDuplicate} className="text-left px-2 py-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-700 dark:text-slate-300">Duplicate</button>
                        <button onClick={handleRemove} className="text-left px-2 py-1 rounded border border-transparent hover:border-red-400/50 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold">Remove</button>
                      </>
                    )}
                  </>
                )}
                {/* Transform section */}
                {isArray && (
                  <>
                    <button onClick={()=>setOpenTransform(o=>{ const next=!o; if(next){ setOpenType(false); setOpenStructure(false); } return next; })} className="mt-2 flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300" data-section="transform">
                      <span>Transform</span>
                      <span className="text-xs">{openTransform?'▾':'▸'}</span>
                    </button>
                    {openTransform && (
                      <>
                        <button onClick={()=>arrayTransform('filter-nulls')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Filter nulls</button>
                        <button onClick={()=>arrayTransform('filter-falsy')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Filter falsy</button>
                        <button onClick={()=>arrayTransform('sort-asc')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Sort ascending</button>
                        <button onClick={()=>arrayTransform('sort-desc')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Sort descending</button>
                        <button onClick={()=>arrayTransform('map-number')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Map to numbers</button>
                        <button onClick={()=>arrayTransform('map-string')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Map to strings</button>
                        <button onClick={()=>arrayTransform('unique')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Unique values</button>
                        <button onClick={()=>arrayTransform('flatten1')} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Flatten depth 1</button>
                      </>
                    )}
                  </>
                )}
                {/* Other section */}
                <div className="mt-2">
                  <span className="px-2 py-1 font-semibold text-slate-700 dark:text-slate-300">Other</span>
                  <button onClick={extractJSON} className="text-left w-full px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Extract JSON</button>
                </div>
              </div>
            )}
          </div>
        )}
  <div className="flex-1 break-all">
          {isEditingKey? (
            <input ref={keyInputRef} className="px-1 py-0.5 text-sm border rounded font-semibold bg-white dark:bg-slate-900" value={editedKey} onChange={e=>setEditedKey(e.target.value)} onBlur={saveEditKey} onKeyDown={e=>{ if(e.key==='Enter') saveEditKey(); else if(e.key==='Escape') cancelEditKey(); }} />
          ): (
            <span onClick={startEditKey} title={Array.isArray(getDataAtPath(rootData,segments.slice(0,-1)))|| level===0? '': 'Click to rename key'} className="text-slate-700 dark:text-slate-300 font-semibold cursor-text select-text">
              {keyName}
              {isExpandable && <span className="ml-1 text-[10px] font-normal text-slate-500 dark:text-slate-400 align-middle" title={`Children: ${isArray? value.length: Object.keys(value).length}`}>{getCollectionInfo()}</span>}
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-500">: </span>
          {!isExpandable && renderValue()}
          {isExpandable && !isExpanded && <span className="text-slate-400 dark:text-slate-500 text-xs ml-1" title={`Children: ${isArray? value.length: Object.keys(value).length}`}>{isArray?`[${value.length}]`: `{${Object.keys(value).length}}`}</span>}
        </div>
      </div>
      {isExpanded && isExpandable && (
        <div className="border-l border-slate-300 dark:border-slate-600 ml-2 pl-1">
          {isArray? value.map((item:any,index:number)=>(
            <TreeNode key={segments.concat(index).join('.')} keyName={`[${index}]`} value={item} level={level+1} isLast={index===value.length-1} segments={segments.concat(index)} rootData={rootData} onRootUpdate={onRootUpdate} expandAll={expandAll} collapseAll={collapseAll} />
          )): Object.entries(value).map(([childKey,childVal],index,arr)=>(
            <TreeNode key={segments.concat(childKey).join('.')} keyName={childKey} value={childVal} level={level+1} isLast={index===arr.length-1} segments={segments.concat(childKey)} rootData={rootData} onRootUpdate={onRootUpdate} expandAll={expandAll} collapseAll={collapseAll} />
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
  const scrollRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{ setTreeData(data); },[data]);
  const handleEditClick=()=>{ setEditValue(JSON.stringify(treeData,null,2)); setEditMode(true); };
  const handleSave=()=>{ try{ JSON.parse(editValue); onEdit?.(editValue); setEditMode(false);} catch{ alert('Invalid JSON. Fix errors before saving.'); } };
  const handleCancel=()=>{ setEditMode(false); setEditValue(''); };
  const handleTreeUpdate=(newData:any)=>{ const prev=scrollRef.current?.scrollTop||0; setTreeData(newData); onEdit?.(JSON.stringify(newData,null,2)); requestAnimationFrame(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=prev; }); };
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
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">Click keys/values to edit • Actions left column</span>
        </div>
      )}
      <div className="flex-1 overflow-auto p-4" ref={scrollRef}>
        <TreeNode key="root" keyName="root" value={treeData} level={0} isLast={true} segments={[]} rootData={treeData} onRootUpdate={handleTreeUpdate} expandAll={expandAll} collapseAll={collapseAll} />
      </div>
    </div>
  );
};

interface FormFieldProps { keyName:string; value:any; level:number; path:string; expandAll?:boolean; collapseAll?:boolean; }
const FormField:React.FC<FormFieldProps>=({ keyName,value,level,path,expandAll,collapseAll })=>{
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
export const FormView:React.FC<{ data:any; expandAll?:boolean; collapseAll?:boolean; }>=({ data,expandAll,collapseAll })=> (
  <div className="h-full overflow-auto p-4 bg-white dark:bg-slate-900">
    {typeof data==='object' && data!==null ? (Array.isArray(data)? (
      <div className="space-y-2">{data.map((item:any,i:number)=><FormField key={i} keyName={`Item ${i+1}`} value={item} level={0} path={`${i}`} expandAll={expandAll} collapseAll={collapseAll} />)}</div>
    ): (
      <div className="space-y-2">{Object.entries(data).map(([k,v])=> <FormField key={k} keyName={k} value={v} level={0} path={k} expandAll={expandAll} collapseAll={collapseAll} />)}</div>
    )): <div className="text-slate-600 dark:text-slate-400">Invalid JSON data</div>}
  </div>
);
export const TextView:React.FC<{ code:string; onChange?:(v:string)=>void; expandAll?:boolean; collapseAll?:boolean; }>=({ code,onChange,expandAll:expandAllTrigger,collapseAll:collapseAllTrigger })=>{
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
              <span className="text-slate-500 dark:text-slate-500 text-xs">{idx}:</span>
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

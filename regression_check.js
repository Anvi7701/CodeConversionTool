// Regression check for JSON tree operations
// Pure logic replicas extracted from component for validation.
import assert from 'assert';

function deepClone(v){ return JSON.parse(JSON.stringify(v)); }
function getDataAtPath(root,segs){ return segs.reduce((c,s)=> c==null? undefined: c[s], root); }
function setValueAtPath(root,segs,nv){ if(segs.length===0) return nv; const [head,...rest]=segs; if(rest.length===0){ if(Array.isArray(root)){ const arr=[...root]; arr[Number(head)]=nv; return arr;} if(root && typeof root==='object') return { ...root,[head]: nv }; return root; } if(Array.isArray(root)){ const arr=[...root]; arr[Number(head)]=setValueAtPath(arr[Number(head)],rest,nv); return arr;} if(root && typeof root==='object') return { ...root,[head]: setValueAtPath(root[head],rest,nv) }; return root; }
function removeAtPath(root,segs){ if(segs.length===0) return root; const parentSegs=segs.slice(0,-1); const last=segs[segs.length-1]; const parent=getDataAtPath(root,parentSegs); if(Array.isArray(parent)){ return setValueAtPath(root,parentSegs,parent.filter((_,i)=> i!==Number(last))); } if(parent && typeof parent==='object'){ const { [last]: _r, ...rest }=parent; return setValueAtPath(root,parentSegs,rest); } return root; }
function duplicateAtPath(root,segs){ const parentSegs=segs.slice(0,-1); const last=segs[segs.length-1]; const parent=getDataAtPath(root,parentSegs); const nodeVal=getDataAtPath(root,segs); if(Array.isArray(parent)){ const idx=Number(last); const newParent=[...parent]; newParent.splice(idx+1,0,deepClone(nodeVal)); return setValueAtPath(root,parentSegs,newParent); } if(parent && typeof parent==='object'){ const base=`${String(last)}_copy`; let newKey=base; let i=2; while(newKey in parent) newKey=`${base}${i++}`; const keys=Object.keys(parent); const targetIndex=keys.indexOf(String(last)); const newObj={}; keys.forEach((k,idx)=>{ newObj[k]=parent[k]; if(idx===targetIndex) newObj[newKey]=deepClone(nodeVal); }); return setValueAtPath(root,parentSegs,newObj); } return root; }
function renameKeyAtPath(root,segs,newKey){ const parentSegs=segs.slice(0,-1); const last=segs[segs.length-1]; const parent=getDataAtPath(root,parentSegs); if(!parent||Array.isArray(parent)) return root; if(!newKey|| newKey===last) return root; if(newKey in parent && newKey!==last){ const base=newKey; let c=1; let candidate=newKey; while(candidate in parent && candidate!==last) candidate=`${base}_${c++}`; newKey=candidate; } const keys=Object.keys(parent); const targetIndex=keys.indexOf(String(last)); if(targetIndex===-1) return root; const newObj={}; keys.forEach((k,i)=>{ if(i===targetIndex) newObj[newKey]=parent[k]; else newObj[k]=parent[k]; }); return setValueAtPath(root,parentSegs,newObj); }
function convertType(value,t){ switch(t){ case 'string': return String(value); case 'number': return Number(value)||0; case 'boolean': return Boolean(value); case 'null': return null; case 'object': return {}; case 'array': return []; default: return value; } }
function arrayTransform(value,mode){ if(!Array.isArray(value)) throw new Error('arrayTransform requires array'); let next=value.slice(); const cmp=(a,b)=> typeof a==='number'&& typeof b==='number'? a-b: String(a).localeCompare(String(b)); switch(mode){ case 'filter-nulls': next=next.filter(v=> v!==null); break; case 'filter-falsy': next=next.filter(Boolean); break; case 'sort-asc': next=[...next].sort(cmp); break; case 'sort-desc': next=[...next].sort((a,b)=> cmp(b,a)); break; case 'unique': { const out=[]; const seen=new Set(); for(const item of next){ const k= typeof item==='object'? JSON.stringify(item): String(item); if(!seen.has(k)){ seen.add(k); out.push(item);} } next=out; break;} case 'flatten1': next=[].concat(...next); break; case 'map-number': next=next.map(v=> typeof v==='number'? v: (typeof v==='string' && !isNaN(Number(v))? Number(v): v)); break; case 'map-string': next=next.map(v=> typeof v==='string'? v: v===null?'null': typeof v==='object'? JSON.stringify(v): String(v)); break; default: throw new Error('unknown mode'); } return next; }
function reorderArray(parent,src,dst){ const newParent=[...parent]; const [m]=newParent.splice(src,1); newParent.splice(dst,0,m); return newParent; }
function reorderObject(parent,srcKey,dstKey){ const keys=Object.keys(parent); const si=keys.indexOf(srcKey); const di=keys.indexOf(dstKey); if(si===-1||di===-1) return parent; keys.splice(di,0,keys.splice(si,1)[0]); const reordered={}; keys.forEach(k=> reordered[k]=parent[k]); return reordered; }

// Tests
(function(){
  const original={ a:1, b:2, c:3 };
  const renamed=renameKeyAtPath(original,['b'],'x');
  assert.deepStrictEqual(Object.keys(renamed),['a','x','c'],'Order preserved on rename');
  assert.strictEqual(renamed.x,2,'Value preserved on rename');

  const dupObj=duplicateAtPath(original,['b']);
  assert.deepStrictEqual(Object.keys(dupObj),['a','b','b_copy','c'],'Duplicate adjacent with new key');
  assert.strictEqual(dupObj.b_copy,2,'Duplicate value matches');

  const arr=[10,20,30];
  const dupArr=duplicateAtPath(arr,[1]);
  assert.deepStrictEqual(dupArr,[10,20,20,30],'Array duplicate adjacent');

  const removed=removeAtPath(original,['b']);
  assert.deepStrictEqual(Object.keys(removed),['a','c'],'Remove deletes key');

  const updated=setValueAtPath(original,['b'],42);
  assert.strictEqual(updated.b,42,'setValueAtPath updates value');

  // Type conversions
  assert.strictEqual(convertType(5,'string'),'5');
  assert.strictEqual(convertType('8','number'),8);
  assert.strictEqual(convertType('','boolean'),false);
  assert.strictEqual(convertType('x','object') instanceof Object,true);
  assert.ok(Array.isArray(convertType('x','array')));

  // Array transforms
  const base=[1,null,2,'3',3,3,false,'x'];
  assert.deepStrictEqual(arrayTransform(base,'filter-nulls'),[1,2,'3',3,3,false,'x']);
  assert.deepStrictEqual(arrayTransform(base,'filter-falsy'),[1,2,'3',3,3,'x']);
  assert.deepStrictEqual(arrayTransform([3,1,2],'sort-asc'),[1,2,3]);
  assert.deepStrictEqual(arrayTransform([3,1,2],'sort-desc'),[3,2,1]);
  // unique should treat numeric 1 and string '1' as same key per implementation (String(item))
  assert.deepStrictEqual(arrayTransform([1,1,'1',{a:1},{a:1}], 'unique'),[1,{a:1}]);
  assert.deepStrictEqual(arrayTransform([[1,2],[3],[4]],'flatten1'),[1,2,3,4]);
  assert.deepStrictEqual(arrayTransform(['1','2','x'],'map-number'),[1,2,'x']);
  assert.deepStrictEqual(arrayTransform([1,{a:2},null],'map-string'),['1','{"a":2}','null']);

  // Reorders
  assert.deepStrictEqual(reorderArray([0,1,2,3],1,3),[0,2,3,1]);
  const objReordered=reorderObject({a:1,b:2,c:3,d:4},'b','d');
  assert.deepStrictEqual(Object.keys(objReordered),['a','c','d','b'],'Object reorder moves b to after d');

  console.log('ALL REGRESSION LOGIC TESTS PASSED');
})();

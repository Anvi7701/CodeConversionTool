import { DiffEntry, DiffOptions, DiffResult } from './types';

function isObject(val: any) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function isArray(val: any) {
  return Array.isArray(val);
}

function equalWithTolerance(a: any, b: any, tolerance?: number): boolean {
  if (typeof a === 'number' && typeof b === 'number' && typeof tolerance === 'number') {
    return Math.abs(a - b) <= tolerance;
  }
  return a === b;
}

function shouldIgnore(path: string, opts?: DiffOptions) {
  if (!opts?.ignorePaths || opts.ignorePaths.length === 0) return false;
  return opts.ignorePaths.includes(path);
}

function escapePointerToken(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

function join(path: string, token: string) {
  const escaped = escapePointerToken(token);
  return path === '' ? `/${escaped}` : `${path}/${escaped}`;
}

function diffObjects(left: any, right: any, path: string, opts: DiffOptions, out: DiffEntry[]) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  const allKeys = new Set<string>([...leftKeys, ...rightKeys]);
  for (const key of allKeys) {
    const p = join(path, key);
    if (shouldIgnore(p, opts)) continue;
    const l = left[key];
    const r = right[key];
    if (!(key in left)) {
      out.push({ type: 'added', path: p, rightValue: r });
    } else if (!(key in right)) {
      out.push({ type: 'removed', path: p, leftValue: l });
    } else {
      diffAny(l, r, p, opts, out);
    }
  }
}

function diffArrays(left: any[], right: any[], path: string, opts: DiffOptions, out: DiffEntry[]) {
  const matchKey = opts.arrayMatchKey;
  if (matchKey && left.every(isObject) && right.every(isObject)) {
    const leftMap = new Map<string | number, { idx: number; obj: any }>();
    for (let i = 0; i < left.length; i++) {
      const key = left[i]?.[matchKey];
      if (key !== undefined) leftMap.set(key, { idx: i, obj: left[i] });
    }
    const rightMap = new Map<string | number, { idx: number; obj: any }>();
    for (let i = 0; i < right.length; i++) {
      const key = right[i]?.[matchKey];
      if (key !== undefined) rightMap.set(key, { idx: i, obj: right[i] });
    }
    const allKeys = new Set<string | number>([...leftMap.keys(), ...rightMap.keys()]);
    for (const k of allKeys) {
      const l = leftMap.get(k);
      const r = rightMap.get(k);
      const token = String(k);
      const p = join(path, token);
      if (shouldIgnore(p, opts)) continue;
      if (!l && r) {
        out.push({ type: 'added', path: p, rightValue: r.obj });
      } else if (l && !r) {
        out.push({ type: 'removed', path: p, leftValue: l.obj });
      } else if (l && r) {
        diffAny(l.obj, r.obj, p, opts, out);
      }
    }
    return;
  }

  const maxLen = Math.max(left.length, right.length);
  for (let i = 0; i < maxLen; i++) {
    const p = join(path, String(i));
    if (shouldIgnore(p, opts)) continue;
    if (i >= left.length) {
      out.push({ type: 'added', path: p, rightValue: right[i] });
    } else if (i >= right.length) {
      out.push({ type: 'removed', path: p, leftValue: left[i] });
    } else {
      diffAny(left[i], right[i], p, opts, out);
    }
  }
}

function diffAny(left: any, right: any, path: string, opts: DiffOptions, out: DiffEntry[]) {
  if (left === undefined && right !== undefined) {
    out.push({ type: 'added', path, rightValue: right });
    return;
  }
  if (left !== undefined && right === undefined) {
    out.push({ type: 'removed', path, leftValue: left });
    return;
  }

  if (isObject(left) && isObject(right)) {
    diffObjects(left, right, path, opts, out);
    return;
  }
  if (isArray(left) && isArray(right)) {
    diffArrays(left, right, path, opts, out);
    return;
  }
  if (!equalWithTolerance(left, right, opts.numericTolerance)) {
    out.push({ type: 'changed', path, leftValue: left, rightValue: right });
  }
}

export function diffJson(left: any, right: any, opts: DiffOptions = {}): DiffResult {
  const entries: DiffEntry[] = [];
  diffAny(left, right, '', opts, entries);
  const counts = {
    added: entries.filter(e => e.type === 'added').length,
    removed: entries.filter(e => e.type === 'removed').length,
    changed: entries.filter(e => e.type === 'changed').length,
  };
  return { entries, counts };
}

export interface LineMapResult {
  text: string;
  pathToLine: Map<string, number>;
}

export function serializeWithLineMap(value: any, indent = 2): LineMapResult {
  let line = 1;
  const pathToLine = new Map<string, number>();
  const indentStr = (lvl: number) => ' '.repeat(lvl * indent);

  function writeLine(buf: string[]): void {
    buf.push('\n');
    line++;
  }

  function serialize(val: any, buf: string[], lvl: number, path: string) {
    if (val === null) { buf.push('null'); return; }
    const t = typeof val;
    if (t === 'number' || t === 'boolean') { buf.push(String(val)); return; }
    if (t === 'string') { buf.push(JSON.stringify(val)); return; }
    if (Array.isArray(val)) {
      buf.push('['); writeLine(buf);
      for (let i = 0; i < val.length; i++) {
        buf.push(indentStr(lvl + 1));
        const p = join(path, String(i));
        pathToLine.set(p, line);
        serialize(val[i], buf, lvl + 1, p);
        if (i < val.length - 1) { buf.push(','); writeLine(buf); }
      }
      writeLine(buf); buf.push(indentStr(lvl)); buf.push(']');
      return;
    }
    if (isObject(val)) {
      buf.push('{'); writeLine(buf);
      const keys = Object.keys(val);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        buf.push(indentStr(lvl + 1));
        const p = join(path, k);
        pathToLine.set(p, line);
        buf.push(JSON.stringify(k)); buf.push(': ');
        serialize(val[k], buf, lvl + 1, p);
        if (i < keys.length - 1) { buf.push(','); writeLine(buf); }
      }
      writeLine(buf); buf.push(indentStr(lvl)); buf.push('}');
      return;
    }
    buf.push('null');
  }

  const buffer: string[] = [];
  serialize(value, buffer, 0, '');
  const text = buffer.join('');
  return { text, pathToLine };
}

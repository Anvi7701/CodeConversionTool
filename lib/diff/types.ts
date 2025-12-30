export type DiffType = 'added' | 'removed' | 'changed';

export interface DiffEntry {
  type: DiffType;
  path: string; // JSON Pointer-like path, e.g. /users/0/name
  leftValue?: any;
  rightValue?: any;
}

export interface DiffOptions {
  arrayMatchKey?: string; // key to match objects in arrays, e.g. 'id'
  numericTolerance?: number; // ignore numeric changes within tolerance
  ignorePaths?: string[]; // list of JSON Pointer paths to ignore
}

export interface DiffResult {
  entries: DiffEntry[];
  counts: { added: number; removed: number; changed: number };
}

export type ToonOptions = {
  path?: string;                // Optional JSONPath-like root (simple dot path with [] for arrays)
  flattenDepth?: number;        // How deep to flatten objects into columns
  arrayJoin?: string;           // How to join array values inside a field
  nullToken?: string;           // Representation for null/undefined/missing
  headerName?: string;          // Token name for header (e.g., item)
  maxColumns?: number;          // Optional cap to avoid huge headers
};

const defaultOptions: Required<Omit<ToonOptions, 'path'>> = {
  flattenDepth: 1,
  arrayJoin: '|',
  nullToken: '-',
  headerName: 'item',
  maxColumns: 1000,
};

function getByPath(input: any, path?: string): any {
  if (!path) return input;
  // Very small path parser: data.item[] or data.items[0]
  const parts = path.split('.');
  let cur: any = input;
  for (const p of parts) {
    if (cur == null) return cur;
    const m = p.match(/^(\w+)(?:\[(\d+)?\])?$/);
    if (!m) return undefined;
    const key = m[1];
    cur = cur[key];
    if (m[2] !== undefined) {
      const idx = parseInt(m[2], 10);
      if (!Array.isArray(cur)) return undefined;
      cur = cur[idx];
    }
  }
  return cur;
}

function findFirstArray(input: any): any[] | null {
  if (Array.isArray(input)) return input;
  if (input && typeof input === 'object') {
    for (const k of Object.keys(input)) {
      const v = (input as any)[k];
      const found = findFirstArray(v);
      if (found) return found;
    }
  }
  return null;
}

function collectColumns(rows: any[], depth: number, maxColumns: number): string[] {
  const cols = new Set<string>();
  const walk = (obj: any, prefix = '', d = 0) => {
    if (!obj || typeof obj !== 'object' || d > depth) return;
    if (Array.isArray(obj)) return; // arrays appear as joined tokens per field
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v) && d < depth) {
        walk(v, key, d + 1);
      } else {
        cols.add(key);
        if (cols.size >= maxColumns) return;
      }
    }
  };
  for (const r of rows) walk(r);
  return Array.from(cols);
}

function getValue(obj: any, path: string) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (!cur) return undefined;
    cur = cur[p];
  }
  return cur;
}

function stringifyField(value: any, arrayJoin: string, nullToken: string): string {
  if (value === null || value === undefined) return nullToken;
  if (Array.isArray(value)) {
    const flat = value.map(v =>
      v === null || v === undefined
        ? nullToken
        : typeof v === 'object'
          ? '[object Object]'
          : String(v)
    );
    return `[${flat.join(arrayJoin)}]`;
  }
  if (typeof value === 'object') return '[object Object]';
  const s = String(value);
  return s.includes(',') || s.includes('\n') ? JSON.stringify(s) : s;
}

export function jsonToToon(input: any, opts: ToonOptions = {}): string {
  const o = { ...defaultOptions, ...opts } as Required<ToonOptions>;
  const root = getByPath(input, o.path) ?? input;
  const rows = findFirstArray(root) ?? (Array.isArray(root) ? root : []);
  if (!Array.isArray(rows) || rows.length === 0) {
    return `${o.headerName}[0]{ }:\n`;
  }

  const columns = collectColumns(rows, o.flattenDepth!, o.maxColumns!);
  const header = `${o.headerName}[${rows.length}]{${columns.join(',')}}:`;
  const body = rows.map(r => {
    const vals = columns.map(c => stringifyField(getValue(r, c), o.arrayJoin!, o.nullToken!));
    return vals.join(',');
  });
  return [header, ...body].join('\n');
}

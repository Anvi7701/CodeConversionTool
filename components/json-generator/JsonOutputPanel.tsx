import React, { useState } from 'react';
import { formatJson, toJsonFile, copyToClipboard } from '../../utils/jsonGeneratorUtils';
import { CodeMirrorViewer } from '../CodeMirrorViewer';

interface Props {
  data: any[] | null;
  template: string;
  qty: number;
}

export const JsonOutputPanel: React.FC<Props> = ({ data, template, qty }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [pretty, setPretty] = useState(true);
  const [collapseTick, setCollapseTick] = useState(0);
  const [expandTick, setExpandTick] = useState(0);

  if (!data) return null;
  const code = pretty ? formatJson(data, 2) : JSON.stringify(data);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <button onClick={() => copyToClipboard(data)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm" aria-label="Copy JSON">Copy</button>
          <button onClick={() => toJsonFile(data, `${template}-${qty}.json`)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm" aria-label="Download JSON">Download</button>
          <button onClick={() => setPretty(p => !p)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm" aria-pressed={pretty}> {pretty ? 'Minified' : 'Pretty'} </button>
          <button
            onClick={() => {
              setCollapsed(c => {
                const next = !c;
                if (next) setCollapseTick(t => t + 1); else setExpandTick(t => t + 1);
                return next;
              });
            }}
            className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm"
            aria-expanded={!collapsed}
          >{collapsed ? 'Expand' : 'Collapse'}</button>
        </div>
      </div>
      <div className="relative h-[400px] rounded-lg border border-slate-700 overflow-hidden">
        <CodeMirrorViewer code={code} language="json" readOnly collapseFirstLevel={collapseTick} expandAll={expandTick} />
      </div>
    </section>
  );
};

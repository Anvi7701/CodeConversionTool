import React from 'react';

export const DescriptionBar: React.FC<{ text?: string }> = ({ text }) => (
  <div className="mt-3 text-slate-400" aria-live="polite">{text || ''}</div>
);

import React from 'react';

interface Props {
  value: number;
  onChange: (n: number) => void;
}

export const QuantityInput: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div>
      <label htmlFor="qty" className="block text-sm text-slate-300 mb-1">Quantity (1–1000)</label>
      <input
        id="qty"
        type="number"
        min={1}
        max={1000}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full rounded-md bg-slate-700 border border-slate-600 p-2 focus:ring-2 focus:ring-blue-500"
        aria-label="Quantity"
      />
    </div>
  );
};

import React from 'react';

export const GenerateButton: React.FC<{ busy?: boolean; onClick: () => void }> = ({ busy, onClick }) => (
  <div className="flex items-end">
    <button
      onClick={onClick}
      aria-busy={!!busy}
      className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {busy ? 'Generating…' : 'Generate JSON'}
    </button>
  </div>
);

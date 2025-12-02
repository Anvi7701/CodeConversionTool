import React from 'react';

interface ValidationModalProps {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  variant?: 'success' | 'error';
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ open, title, message, onClose, variant = 'success' }) => {
  if (!open) return null;

  const headerClass = variant === 'success'
    ? 'bg-green-500 text-white'
    : 'bg-rose-500 text-white';

  const btnClass = variant === 'success'
    ? 'bg-green-600 hover:bg-green-700'
    : 'bg-rose-600 hover:bg-rose-700';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="w-[420px] max-w-[92vw] rounded shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className={`px-4 py-2 text-base font-semibold ${headerClass}`}> 
          {title ?? (variant === 'success' ? 'Validation Result' : 'Error Message')}
        </div>
        <div className="px-4 py-4 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
          {message}
        </div>
        <div className="px-4 pb-4 flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded text-white text-sm font-medium ${btnClass}`}
            aria-label="Close"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;

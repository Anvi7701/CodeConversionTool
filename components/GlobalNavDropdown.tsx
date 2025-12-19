import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface DropdownItem {
  label: string;
  to: string;
  icon?: React.ReactNode;
}

interface GlobalNavDropdownProps {
  label: string;
  ariaLabel?: string;
  items: DropdownItem[];
}

export const GlobalNavDropdown: React.FC<GlobalNavDropdownProps> = ({ label, ariaLabel, items }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as HTMLElement;
      if (panelRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Simple keyboard navigation (ArrowDown focuses first item)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      const first = panelRef.current?.querySelector<HTMLAnchorElement>('a[data-dd-item]');
      first?.focus();
    }
  };

  return (
    <div className="relative" role="none">
      <button
        ref={btnRef}
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel || label}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow ${open ? 'ring-2 ring-blue-500/60' : ''}`}
      >
        <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          {label}
        </span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label={`${label} submenu`}
          className="absolute left-0 mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50"
        >
          <div className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
          {items.map(item => (
            <Link
              key={item.label}
              to={item.to}
              data-dd-item
              role="menuitem"
              tabIndex={0}
              onClick={(e) => {
                // navigate for same-page route reuse with scroll top
                if (location.pathname === item.to) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                setOpen(false);
              }}
              className="group mx-2 my-0.5 flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-800 focus:bg-slate-100 dark:focus:bg-slate-700 outline-none"
            >
              {item.icon && <span className="text-lg leading-none" aria-hidden>{item.icon}</span>}
              <span className="truncate font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

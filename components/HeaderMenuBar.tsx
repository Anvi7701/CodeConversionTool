import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  kind: 'route' | 'command';
  to?: string;
  onClick?: () => void;
  enabled?: boolean;
}

interface MenuGroup {
  label: string;
  ariaLabel?: string;
  items: MenuItem[];
}

interface HeaderMenuBarProps {
  groups: MenuGroup[];
}

export const HeaderMenuBar: React.FC<HeaderMenuBarProps> = ({ groups }) => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const handleGlobalKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpenIndex(null);
  };

  return (
    <nav
      role="menubar"
      aria-label="Main menu"
      className="w-full flex items-center gap-4 bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-2"
      onKeyDown={handleGlobalKey}
    >
      {groups.map((group, idx) => (
        <div key={group.label} className="relative" role="none">
          <button
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={openIndex === idx}
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="px-3 py-1.5 rounded-md text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
          >
            {group.label}
            <span className="ml-1 text-xs">▼</span>
          </button>
          {openIndex === idx && (
            <div
              role="menu"
              aria-label={group.ariaLabel || group.label}
              className="absolute z-50 mt-2 min-w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl p-1"
            >
              {group.items.map((item) => {
                const disabled = item.enabled === false;
                return (
                  <button
                    key={item.label}
                    role="menuitem"
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      setOpenIndex(null);
                      if (item.kind === 'route' && item.to) {
                        navigate(item.to);
                      } else if (item.kind === 'command' && item.onClick) {
                        item.onClick();
                      }
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {item.icon && <span className="text-base">{item.icon}</span>}
                    <span className="text-slate-800 dark:text-slate-200 tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

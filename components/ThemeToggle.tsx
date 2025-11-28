

import React from 'react';
import { SunIcon, MoonIcon, DesktopIcon } from './icons';
import { Tooltip } from './Tooltip';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ToggleButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isActive, onClick, title, children }) => (
    <Tooltip content={title}>
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-md transition-colors ${
                isActive
                    ? 'bg-teal-100 text-brand-primary dark:bg-teal-900/50'
                    : 'text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
        >
            {children}
        </button>
    </Tooltip>
);

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
        <ToggleButton isActive={theme === 'light'} onClick={() => setTheme('light')} aria-label="Light Mode">
            <SunIcon className="h-5 w-5" />
        </ToggleButton>
        <ToggleButton isActive={theme === 'dark'} onClick={() => setTheme('dark')} aria-label="Dark Mode">
            <MoonIcon className="h-5 w-5" />
        </ToggleButton>
        <ToggleButton isActive={theme === 'system'} onClick={() => setTheme('system')} aria-label="System Preference">
            <DesktopIcon className="h-5 w-5" />
        </ToggleButton>
    </div>
  );
};

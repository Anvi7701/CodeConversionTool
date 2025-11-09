import React from 'react';
import { InfoIcon, CloseIcon } from './icons';

interface LanguageDetectionBannerProps {
  detectedLanguage: string;
  onSwitch: () => void;
  onDismiss: () => void;
}

export const LanguageDetectionBanner: React.FC<LanguageDetectionBannerProps> = ({
  detectedLanguage,
  onSwitch,
  onDismiss,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-2 animate-fade-in-down">
        <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-md shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-grow text-sm">
                    It looks like you pasted <span className="font-semibold">{detectedLanguage}</span> code.
                </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={onSwitch}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors text-white bg-blue-600 hover:bg-blue-700"
                >
                    <span>Switch to {detectedLanguage}</span>
                </button>
                 <button
                    onClick={onDismiss}
                    className="p-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    title="Dismiss suggestion"
                >
                    <CloseIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
        <style>{`
            @keyframes fade-in-down {
                0% { opacity: 0; transform: translateY(-10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-down {
                animation: fade-in-down 0.3s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

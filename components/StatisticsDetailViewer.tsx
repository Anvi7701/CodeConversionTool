import React, { useState } from 'react';

interface DetailedItems {
  strings: Array<{ value: string; path: string }>;
  numbers: Array<{ value: number; path: string }>;
  booleans: Array<{ value: boolean; path: string }>;
  nulls: Array<{ path: string }>;
  objects: Array<{ preview: string; path: string }>;
  arrays: Array<{ preview: string; path: string }>;
}

interface StructureAnalysisData {
  isValid: boolean;
  message: string;
  summary: any;
  details: any;
  statistics: {
    strings: number;
    numbers: number;
    booleans: number;
    nulls: number;
    objects: number;
    arrays: number;
  };
  detailedItems?: DetailedItems;
}

interface StatisticsDetailViewerProps {
  data: StructureAnalysisData;
  expandAll?: boolean;
  collapseAll?: boolean;
  onClose?: () => void;
}

type DetailViewType = 'strings' | 'numbers' | 'booleans' | 'nulls' | 'objects' | 'arrays' | null;

export const StatisticsDetailViewer: React.FC<StatisticsDetailViewerProps> = ({ data, expandAll: _expandAll, collapseAll: _collapseAll, onClose }) => {
  const [activeView, setActiveView] = useState<DetailViewType>(null);

  const handleStatClick = (type: string) => {
    setActiveView(type as DetailViewType);
  };

  const handleReturn = () => {
    setActiveView(null);
  };

  const renderDetailView = () => {
    if (!activeView || !data.detailedItems) return null;

    const items = data.detailedItems[activeView];
    const typeLabels: Record<string, string> = {
      strings: 'Strings',
      numbers: 'Numbers',
      booleans: 'Booleans',
      nulls: 'Nulls',
      objects: 'Objects',
      arrays: 'Arrays',
    };

    const typeColors: Record<string, string> = {
      strings: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      numbers: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      booleans: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      nulls: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      objects: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      arrays: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    };

    return (
      <div className="h-full overflow-auto p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="mb-4 flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg shadow border border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {typeLabels[activeView]} Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Found {items.length} {activeView} in your JSON structure
            </p>
          </div>
          <button
            onClick={handleReturn}
            className="px-3 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 dark:from-slate-500 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-700 text-white rounded-lg text-xs font-medium transition-all shadow hover:shadow-md flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Return to Report
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item: any, index: number) => (
            <div 
              key={index}
              className={`p-2.5 ${typeColors[activeView]} border rounded-lg shadow-sm hover:shadow transition-shadow`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-mono bg-white dark:bg-slate-900/50 px-1.5 py-0.5 rounded">
                    📍 {item.path}
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    {activeView === 'strings' && (
                      <span className="text-green-700 dark:text-green-300 font-semibold">"{item.value}"</span>
                    )}
                    {activeView === 'numbers' && (
                      <span className="text-blue-700 dark:text-blue-300 font-semibold">{item.value}</span>
                    )}
                    {activeView === 'booleans' && (
                      <span className="text-purple-700 dark:text-purple-300 font-semibold">{String(item.value)}</span>
                    )}
                    {activeView === 'nulls' && (
                      <span className="text-slate-500 dark:text-slate-400 italic font-semibold">null</span>
                    )}
                    {activeView === 'objects' && (
                      <span className="text-orange-700 dark:text-orange-300 font-semibold">{item.preview}</span>
                    )}
                    {activeView === 'arrays' && (
                      <span className="text-teal-700 dark:text-teal-300 font-semibold">{item.preview}</span>
                    )}
                  </div>
                </div>
                <div className="text-[10px] bg-slate-700 dark:bg-slate-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  #{index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFullReport = () => {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white shadow hover:shadow-lg transition-all flex items-center justify-center text-xs font-bold"
          title="Clear report"
          aria-label="Clear report"
        >
          ✕
        </button>
        
        <div className="max-w-7xl mx-auto p-4 pr-12">
          {/* Header Section */}
          <div className="mb-4 text-center">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
              📈 JSON Structure Analysis Report
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Comprehensive analysis of your JSON structure and statistics
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Section: Structure Information */}
            <div className="space-y-3">
              {/* Validation Status Card */}
              <div className={`p-3 rounded-lg shadow border ${
                data.isValid 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700' 
                  : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-300 dark:border-red-700'
              }`}>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  {data.isValid ? '✅' : '❌'} Validation Status
                </h2>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Status:</span>
                    <span className={`font-bold text-xs ${
                      data.isValid 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {data.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  <div className="mt-2 p-1.5 bg-white dark:bg-slate-800/50 rounded">
                    <p className={`text-xs font-bold ${
                      data.isValid 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {data.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-3 rounded-lg shadow bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-300 dark:border-blue-700">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  📋 Summary
                </h2>
                <div className="space-y-1.5">
                  {Object.entries(data.summary).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-800/50 rounded">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-bold text-xs text-blue-700 dark:text-blue-300">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details Card */}
              <div className="p-3 rounded-lg shadow bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-300 dark:border-purple-700">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  🔍 Details
                </h2>
                <div className="space-y-1.5">
                  {Object.entries(data.details)
                    .filter(([key]) => !['objectKeys', 'valueTypes'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-800/50 rounded">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-bold text-xs text-purple-700 dark:text-purple-300">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Section: Statistics */}
            <div>
              <div className="p-3 rounded-lg shadow bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-300 dark:border-amber-700 sticky top-4">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  📈 Statistics
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Click on any value to see detailed breakdown
                </p>
                
                <div className="space-y-2">
                  {/* Strings */}
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded border-l-3 border-green-500 dark:border-green-400 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">📝</span>
                      <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Strings</span>
                    </div>
                    {data.statistics.strings > 0 ? (
                      <button
                        onClick={() => handleStatClick('strings')}
                        className="text-base font-bold text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 underline decoration-2 underline-offset-2 transition-colors"
                        title="Click to view all strings"
                      >
                        {data.statistics.strings}
                      </button>
                    ) : (
                      <span className="text-base font-bold text-slate-400 dark:text-slate-500">0</span>
                    )}
                  </div>

                  {/* Numbers */}
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded border-l-3 border-blue-500 dark:border-blue-400 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔢</span>
                      <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Numbers</span>
                    </div>
                    {data.statistics.numbers > 0 ? (
                      <button
                        onClick={() => handleStatClick('numbers')}
                        className="text-base font-bold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline decoration-2 underline-offset-2 transition-colors"
                        title="Click to view all numbers"
                      >
                        {data.statistics.numbers}
                      </button>
                    ) : (
                      <span className="text-base font-bold text-slate-400 dark:text-slate-500">0</span>
                    )}
                  </div>

                  {/* Booleans */}
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded border-l-3 border-purple-500 dark:border-purple-400 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">✓</span>
                      <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Booleans</span>
                    </div>
                    {data.statistics.booleans > 0 ? (
                      <button
                        onClick={() => handleStatClick('booleans')}
                        className="text-base font-bold text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 underline decoration-2 underline-offset-2 transition-colors"
                        title="Click to view all booleans"
                      >
                        {data.statistics.booleans}
                      </button>
                    ) : (
                      <span className="text-base font-bold text-slate-400 dark:text-slate-500">0</span>
                    )}
                  </div>

                  {/* Nulls */}
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800/60 dark:to-gray-800/60 rounded border-l-3 border-slate-500 dark:border-slate-400 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">∅</span>
                      <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Nulls</span>
                    </div>
                    {data.statistics.nulls > 0 ? (
                      <button
                        onClick={() => handleStatClick('nulls')}
                        className="text-base font-bold text-slate-700 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200 underline decoration-2 underline-offset-2 transition-colors"
                        title="Click to view all nulls"
                      >
                        {data.statistics.nulls}
                      </button>
                    ) : (
                      <span className="text-base font-bold text-slate-400 dark:text-slate-500">0</span>
                    )}
                  </div>

                  {/* Objects */}
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded border-l-3 border-orange-500 dark:border-orange-400 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">📦</span>
                      <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Objects</span>
                    </div>
                    {data.statistics.objects > 0 ? (
                      <button
                        onClick={() => handleStatClick('objects')}
                        className="text-base font-bold text-orange-700 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-200 underline decoration-2 underline-offset-2 transition-colors"
                        title="Click to view all objects"
                      >
                        {data.statistics.objects}
                      </button>
                    ) : (
                      <span className="text-base font-bold text-slate-400 dark:text-slate-500">0</span>
                    )}
                  </div>

                  {/* Arrays */}
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 rounded border-l-3 border-teal-500 dark:border-teal-400 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">📚</span>
                      <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Arrays</span>
                    </div>
                    {data.statistics.arrays > 0 ? (
                      <button
                        onClick={() => handleStatClick('arrays')}
                        className="text-base font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 underline decoration-2 underline-offset-2 transition-colors"
                        title="Click to view all arrays"
                      >
                        {data.statistics.arrays}
                      </button>
                    ) : (
                      <span className="text-base font-bold text-slate-400 dark:text-slate-500">0</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 p-1.5 bg-white dark:bg-slate-800/50 rounded border border-amber-200 dark:border-amber-800">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center">
                    💡 <span className="font-semibold">Tip:</span> Click on underlined values to explore detailed information
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return activeView ? renderDetailView() : renderFullReport();
};

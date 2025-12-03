#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('components/OnlineFormatterWithToolbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Change 1: Update Output heading - replace Clear button with Save and Copy
old_heading = '''            {/* Output heading with View selector and Exit fullscreen button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Output</h2>
                <Tooltip content="Clear output">
                  <button
                    onClick={handleClearOutput}
                    className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xl cursor-pointer"
                    aria-label="Clear Output"
                    title="Clear all output content"
                  >
                    🗑️
                  </button>
                </Tooltip>
              </div>'''

new_heading = '''            {/* Output heading with View selector and Exit fullscreen button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Output</h2>
                {/* Icon Toolbar - positioned next to "Output" heading */}
                <div className="flex items-center gap-1 opacity-100 pointer-events-auto relative z-50">
                  <Tooltip content="Save to file">
                    <button
                      onClick={handleSave}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                      aria-label="Save"
                      title="Save to file (Ctrl+S)"
                    >
                      💾
                    </button>
                  </Tooltip>
                  <Tooltip content="Copy to clipboard">
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                      aria-label="Copy"
                      title="Copy to clipboard (Ctrl+C)"
                    >
                      📋
                    </button>
                  </Tooltip>
                </div>
              </div>'''

content = content.replace(old_heading, new_heading)

# Change 2: Update output textarea icons - replace D, C, S with Download emoji, Clear emoji only
old_textarea = '''            <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 relative">
              {/* Download, Copy and Save icons - positioned at top right inside the output box */}
              <div className="absolute top-2 right-6 z-10 flex items-center gap-1.5">
                <Tooltip content="Download formatted file">
                  <button
                    onClick={handleDownload}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-green-600 dark:text-green-400"
                    aria-label="Download"
                    title="Download formatted file"
                  >
                    D
                  </button>
                </Tooltip>
                <Tooltip content="Copy to clipboard">
                  <button
                    onClick={handleCopy}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-purple-600 dark:text-purple-400"
                    aria-label="Copy"
                    title="Copy to clipboard"
                  >
                    C
                  </button>
                </Tooltip>
                <Tooltip content="Save to file">
                  <button
                    onClick={handleSave}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-orange-600 dark:text-orange-400"
                    aria-label="Save"
                    title="Save to file"
                  >
                    S
                  </button>
                </Tooltip>
              </div>'''

new_textarea = '''            <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 relative">
              {/* Download and Clear icons - positioned at top right inside the output box */}
              <div className="absolute top-2 right-6 z-10 flex items-center gap-1.5">
                <Tooltip content="Download formatted file">
                  <button
                    onClick={handleDownload}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-green-600 dark:text-green-400"
                    aria-label="Download"
                    title="Download formatted file"
                  >
                    📥
                  </button>
                </Tooltip>
                <Tooltip content="Clear output">
                  <button
                    onClick={handleClearOutput}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-red-600 dark:text-red-400"
                    aria-label="Clear Output"
                    title="Clear all output content"
                  >
                    🧹
                  </button>
                </Tooltip>
              </div>'''

content = content.replace(old_textarea, new_textarea)

with open('components/OnlineFormatterWithToolbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Output section heading updated - Save (💾) and Copy (📋) moved next to 'Output'")
print("✓ Output textarea icons updated - Download (📥) and Clear (🧹) now in textarea")
print("All changes applied successfully!")

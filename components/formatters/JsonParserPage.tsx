import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import './JsonBeautifierPage.css';

export const JsonParserPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Helmet>
        <title>JSON Parser | Free Online JSON Parsing Tool</title>
        <meta name="description" content="Parse JSON online and extract data quickly. Validate and format JSON for easy integration." />
        <meta name="keywords" content="parse JSON online, JSON parser tool, extract JSON data" />
        <link rel="canonical" href="/json-parser" />
        <meta property="og:title" content="JSON Parser | Free Online JSON Parsing Tool" />
        <meta property="og:description" content="Parse JSON online and extract data quickly. Validate and format JSON for easy integration." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Online JSON Parser',
            description: 'Parse JSON online and extract data quickly. Validate and format JSON for easy integration.',
            keywords: 'parse JSON online, JSON parser tool, extract JSON data',
            url: 'https://example.com/json-parser',
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'JSON Parser',
            description: 'Parse JSON online and extract data quickly. Validate and format JSON for easy integration.',
            keywords: 'parse JSON online, JSON parser tool, extract JSON data',
            applicationCategory: 'DeveloperTool',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0' },
          })}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Light hero section (separate from dark tool container) */}
        <section className="mb-4 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">JSON Parser – Parse and Extract JSON Data Online</h1>
            <div className="flex items-center gap-2">
              {/* Mode selection: Fast vs SmartAI */}
              <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
                <button
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-700/40 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100"
                  onClick={() => window.dispatchEvent(new CustomEvent('parser:set-mode', { detail: 'fast' }))}
                  aria-label="Use Fast mode"
                >Fast</button>
                <button
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-700/40 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-l border-slate-300 dark:border-slate-600"
                  onClick={() => window.dispatchEvent(new CustomEvent('parser:set-mode', { detail: 'smart' }))}
                  aria-label="Use Smart AI mode"
                >Smart AI</button>
              </div>
              {/* Format dropdown: indent style */}
              <label className="text-xs text-slate-600 dark:text-slate-300" htmlFor="parser-format">Format</label>
              <select
                id="parser-format"
                className="px-2 py-1 text-xs rounded bg-white border border-slate-300 text-slate-800 dark:bg-slate-700/40 dark:text-slate-100 dark:border-slate-600"
                defaultValue={2}
                onChange={(e) => {
                  const v = e.target.value === 'tabs' ? 0 : Number(e.target.value);
                  window.dispatchEvent(new CustomEvent('parser:set-indent', { detail: v }));
                }}
                aria-label="Set JSON indent style"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value="tabs">Tabs</option>
              </select>
            </div>
          </div>
          <h2 className="text-lg font-semibold mt-1">Parse JSON and extract values easily</h2>
          <p className="text-sm mt-2">Perfect for developers working with APIs and large JSON files.</p>
        </section>

        {/* Dark tool container to match Compare page ribbon/toolbar theme */}
        <section className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
          {/* Use shared formatter/editor only; schema appears in main Output */}
          <OnlineFormatterWithToolbar
            initialLanguage="json"
            showLeftInputActions={true}
            inlineStructureAnalysisIcon={false}
            inlineSortValidateIcons={false}
            hideFormatButtons={true}
            colorTheme="purple"
          />
        </section>
      </div>
    </div>
  );
};

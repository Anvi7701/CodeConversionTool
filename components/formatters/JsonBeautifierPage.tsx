import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';

export const JsonBeautifierPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Online JSON Beautifier — Pretty Print, Minify, Sort, Validate</title>
        <meta name="description" content="Beautify JSON online: pretty print, minify, sort keys, validate syntax, and fix common JSON errors. Fast, accessible, and developer-friendly." />
        <link rel="canonical" href="/json-beautifier" />
        <meta property="og:title" content="Online JSON Beautifier" />
        <meta property="og:description" content="Pretty print and validate JSON with sorting and minify options." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Online JSON Beautifier',
            description: 'Beautify JSON online: pretty print, minify, sort keys, validate syntax.',
            url: 'https://example.com/json-beautifier',
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'JSON Beautifier',
            applicationCategory: 'DeveloperTool',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0' },
          })}
        </script>
      </Helmet>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">JSON Beautifier</h1>
        <h2 className="text-sm text-slate-700 dark:text-slate-300">Pretty print, minify, sort keys, and validate JSON online.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Use the ribbon below to Beautify, Minify, view as Tree, visualize as Graph, or convert your JSON to other formats like XML and CSV.</p>
        <div className="mt-2 text-xs flex flex-wrap gap-3">
          <a href="/json-to-xml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to XML</a>
          <a href="/json-to-csv" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to CSV</a>
          <a href="/json-to-yaml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to YAML</a>
          <a href="/json-to-html" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to HTML</a>
          <a href="/json-to-javascript" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to JavaScript</a>
          <a href="/json-to-python" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to Python</a>
        </div>
      </div>
      {/* Restore full toolbar layout with outside-gutter rails and purple theme */}
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={true}
        colorTheme="purple"
      />
    </>
  );
};

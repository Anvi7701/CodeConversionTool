import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';

export const JsonEditorPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Online JSON Editor — Edit, Validate, Format, Highlight Errors</title>
        <meta name="description" content="Edit JSON online: validate syntax, auto-format, highlight errors, and fix common issues. Keyboard-friendly and fast." />
        <link rel="canonical" href="/json-editor" />
        <meta property="og:title" content="Online JSON Editor" />
        <meta property="og:description" content="Edit and validate JSON with auto-format and error highlighting." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Online JSON Editor',
            description: 'Edit JSON online with validation, auto-format and error highlighting.',
            url: 'https://example.com/json-editor',
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'JSON Editor',
            applicationCategory: 'DeveloperTool',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0' },
          })}
        </script>
      </Helmet>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">JSON Editor</h1>
        <h2 className="text-sm text-slate-700 dark:text-slate-300">Edit, validate, and format JSON with error highlighting.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Use the toolbar to validate and format. Need conversions? Try the links below.</p>
        <div className="mt-2 text-xs flex flex-wrap gap-3">
          <a href="/json-to-xml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to XML</a>
          <a href="/json-to-csv" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to CSV</a>
          <a href="/json-to-yaml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to YAML</a>
          <a href="/json-to-html" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to HTML</a>
          <a href="/json-to-javascript" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to JavaScript</a>
          <a href="/json-to-python" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to Python</a>
        </div>
      </div>
      {/* Restore toolbar layout with outside-gutter rails and purple theme */}
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={false}
        colorTheme="purple"
      />
    </>
  );
};

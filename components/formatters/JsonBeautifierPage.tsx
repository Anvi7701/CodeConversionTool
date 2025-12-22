import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import { CodeBracketIcon } from '../icons';
import './JsonBeautifierPage.css';

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
        <div className="beautifier-title">
          <CodeBracketIcon className="beautifier-title-icon" aria-hidden="true" />
          <h1 className="beautifier-heading">JSON Beautifier</h1>
        </div>
        <h2 className="beautifier-subheading">
          <span>Pretty print</span>, <span>minify</span>, sort keys, and <span>validate</span> JSON online.
        </h2>
        <p className="beautifier-helper mt-2">
          Use the ribbon below to <span className="keyword">Beautify</span>, <span className="keyword">Minify</span>, view as <span className="keyword">Tree View</span>, visualize as <span className="keyword">Graph View</span>, or convert your JSON to <span className="keyword">XML</span> and <span className="keyword">CSV</span>.
        </p>
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

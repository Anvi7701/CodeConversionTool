import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';

export const JsonParserPage: React.FC = () => {
  return (
    <>
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
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">JSON Parser – Parse and Extract JSON Data Online</h1>
        <h2 className="text-sm text-slate-700 dark:text-slate-300">Parse JSON and extract values easily. Perfect for developers working with APIs and large JSON files.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Use the parser to quickly identify issues. For conversions, try the links below.</p>
        <div className="mt-2 text-xs flex flex-wrap gap-3">
          <a href="/json-to-xml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to XML</a>
          <a href="/json-to-csv" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to CSV</a>
          <a href="/json-to-yaml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to YAML</a>
        </div>
      </div>
      {/* Use shared formatter/editor without extra page wrapper to avoid duplicate headings */}
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

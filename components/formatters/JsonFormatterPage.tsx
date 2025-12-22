import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';

export const JsonFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online JSON Formatter & Validator",
    "description": "Format, validate, beautify and minify JSON data online. Free JSON formatter tool with syntax highlighting, error detection, and one-click beautification.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "JSON Beautifier",
      "JSON Validator",
      "JSON Minifier",
      "Syntax Highlighting",
      "Error Detection",
      "Auto-Correction",
      "Graph View",
      "Download JSON",
      "Copy JSON",
      "Sort JSON Keys"
    ]
  };

  return (
    <>
      <SEO
        title="Free Online JSON Formatter & Validator - Beautify, Validate & Minify JSON"
        description="Format and validate JSON online instantly. Free JSON beautifier, validator, and minifier with syntax highlighting, error detection, graph view, and auto-correction. Perfect for developers to beautify, minify, sort, and validate JSON data quickly."
        keywords="json formatter, json beautifier, json validator, json minifier, format json online, beautify json, validate json, json syntax checker, json pretty print, json parser, json editor, online json formatter, free json tool, json viewer, json graph, json syntax highlighting, json error checker, json repair, json sorting, minify json"
        canonical="https://yoursite.com/json-formatter"
        ogUrl="https://yoursite.com/json-formatter"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">JSON Formatter</h1>
        <h2 className="text-sm text-slate-700 dark:text-slate-300">Beautify, validate, minify, and sort JSON data online.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Use the toolbar to format, validate, and analyze JSON. Quickly convert to other formats using the links below.</p>
        <div className="mt-2 text-xs flex flex-wrap gap-3">
          <a href="/json-to-xml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to XML</a>
          <a href="/json-to-csv" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to CSV</a>
          <a href="/json-to-yaml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to YAML</a>
          <a href="/json-to-html" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to HTML</a>
          <a href="/json-to-javascript" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to JavaScript</a>
          <a href="/json-to-python" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to Python</a>
        </div>
      </div>
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

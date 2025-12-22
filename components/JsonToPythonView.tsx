import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToPythonConverter: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON to Python Converter",
    description: "Convert JSON to Python code online. Paste JSON on the left and generate Python dict/list literals with one click.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "JSON to Python conversion",
      "Python dict/list literal output",
      "Copy, download, and save .py",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON to Python Converter – Convert JSON to Python Online"
        description="Convert JSON to Python instantly. Paste JSON and click To Python to generate clean Python dict/list literals. Free, fast, and no sign-up."
        keywords="json to python, convert json to python, json python converter, json to dict, json to python dict, online json to python"
        canonical="https://yoursite.com/json-to-python"
        ogUrl="https://yoursite.com/json-to-python"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Convert JSON to Python</h1>
        <h2 className="text-sm text-slate-700 dark:text-slate-300">Free JSON to Python converter for dict/list literals.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Paste JSON on the left and click To Python to generate Python code. See other converters below.</p>
        <div className="mt-2 text-xs flex flex-wrap gap-3">
          <a href="/json-to-xml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to XML</a>
          <a href="/json-to-csv" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to CSV</a>
          <a href="/json-to-yaml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to YAML</a>
        </div>
      </div>
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left, then click To Python to generate Python code on the right.
      </div>
      {/* Mirror the XML page look & feel with unified toolbar */}
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={true}
        colorTheme="purple"
        hideFormatButtons={true}
        hideStructureAnalysisAndTransform={true}
      />
    </>
  );
};

export default JsonToPythonConverter;

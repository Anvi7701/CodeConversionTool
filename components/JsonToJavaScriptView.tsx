import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToJavaScriptView: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON to JavaScript Converter",
    description: "Convert JSON to clean JavaScript objects or arrays. Paste JSON on the left and generate JS code with one click.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "JSON to JavaScript conversion",
      "Readable, indented JS literals",
      "Copy, download, and save .js",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON to JavaScript Converter – Convert JSON to JS Online"
        description="Convert JSON to JavaScript instantly. Paste JSON and click To JavaScript to generate well-formatted JS literals. Free, fast, and no sign-up."
        keywords="json to javascript, convert json to js, json to js converter, online json to javascript, export default json, const data from json"
        canonical="https://yoursite.com/json-to-javascript"
        ogUrl="https://yoursite.com/json-to-javascript"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Convert JSON to JavaScript</h1>
        <h2 className="text-sm text-slate-700 dark:text-slate-300">Free JSON to JS converter for readable literals.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Paste JSON on the left and click To JavaScript to generate JS code. See other converters below.</p>
        <div className="mt-2 text-xs flex flex-wrap gap-3">
          <a href="/json-to-xml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to XML</a>
          <a href="/json-to-csv" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to CSV</a>
          <a href="/json-to-yaml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to YAML</a>
        </div>
      </div>
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left, then click To JavaScript to generate JS code on the right.
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

export default JsonToJavaScriptView;

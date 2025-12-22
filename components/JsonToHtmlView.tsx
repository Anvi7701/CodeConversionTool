import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToHtmlConverter: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON to HTML Converter",
    description: "Convert JSON to HTML online. Paste JSON on the left and generate clean, semantic HTML output instantly.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "JSON to HTML conversion",
      "Semantic HTML with tables, lists, and description lists",
      "Copy, download, and save HTML",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON to HTML Converter – Convert JSON to HTML Online"
        description="Convert JSON to HTML instantly. Paste JSON and click To HTML to generate semantic, well-formatted HTML output. Free, fast, and no sign-up."
        keywords="json to html, convert json to html, json html converter, online json to html, semantic html from json, array of objects to table html"
        canonical="https://yoursite.com/json-to-html"
        ogUrl="https://yoursite.com/json-to-html"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Convert JSON to HTML</h1>
        <h2 className="text-sm text-slate-700 dark:text-slate-300">Free JSON to HTML converter for semantic, readable markup.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Paste JSON on the left and click To HTML to generate HTML output. See other converters below.</p>
        <div className="mt-2 text-xs flex flex-wrap gap-3">
          <a href="/json-to-xml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to XML</a>
          <a href="/json-to-csv" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to CSV</a>
          <a href="/json-to-yaml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to YAML</a>
        </div>
      </div>
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left, then click To HTML to generate HTML on the right.
      </div>
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

export default JsonToHtmlConverter;

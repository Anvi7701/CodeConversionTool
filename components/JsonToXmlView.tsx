import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToXmlConverter: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON to XML Converter",
    description: "Convert JSON to XML online. Paste JSON on the left and generate XML output with one click.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "JSON to XML conversion",
      "Pretty-printed XML output",
      "Copy, download, and save XML",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON to XML Converter – Convert JSON to XML Online"
        description="Convert JSON to XML instantly. Paste JSON and click To XML to generate well-formatted XML output. Free, fast, and no sign-up."
        keywords="json to xml, convert json to xml, json xml converter, online json to xml"
        canonical="https://yoursite.com/json-to-xml"
        ogUrl="https://yoursite.com/json-to-xml"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Convert JSON to XML</h1>
        <h2 className="text-sm text-slate-700 dark:text-slate-300">Free JSON to XML converter with pretty-printed output.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Paste JSON on the left and click To XML to generate XML on the right. See other converters below.</p>
        <div className="mt-2 text-xs flex flex-wrap gap-3">
          <a href="/json-to-csv" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to CSV</a>
          <a href="/json-to-yaml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to YAML</a>
          <a href="/json-to-html" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to HTML</a>
        </div>
      </div>
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left, then click To XML to generate XML on the right.
      </div>
      {/* Mirror the TOON page look & feel with unified toolbar */}
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

export default JsonToXmlConverter;

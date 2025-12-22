import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToJavaConverter: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON to Java Converter",
    description: "Convert JSON to Java code online. Paste JSON on the left and generate Java POJOs with one click.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "JSON to Java conversion",
      "Deterministic Java class generation",
      "Copy, download, and save .java",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON to Java Converter – Convert JSON to Java Online"
        description="Convert JSON to Java instantly. Paste JSON and click To Java to generate clean Java classes. Free, fast, and no sign-up."
        keywords="json to java, convert json to java, json java converter, online json to java, json to pojo"
        canonical="https://yoursite.com/json-to-java"
        ogUrl="https://yoursite.com/json-to-java"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Convert JSON to Java</h1>
        <h2 className="text-sm text-slate-700 dark:text-slate-300">Free JSON to Java converter with deterministic class generation.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Paste JSON on the left and click To Java to generate Java code on the right. See other converters below.</p>
        <div className="mt-2 text-xs flex flex-wrap gap-3">
          <a href="/json-to-xml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to XML</a>
          <a href="/json-to-csv" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to CSV</a>
          <a href="/json-to-yaml" className="text-blue-600 dark:text-blue-400 hover:underline">Convert JSON to YAML</a>
        </div>
      </div>
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left, then click To Java to generate Java on the right.
      </div>
      {/* Mirror the XML/Python page look & feel with unified toolbar */}
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

export default JsonToJavaConverter;

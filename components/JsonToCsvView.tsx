import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToCsvConverter: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON to CSV Converter",
    description: "Convert JSON to CSV online. Paste JSON on the left and generate CSV output with one click.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "JSON to CSV conversion",
      "CSV output with headers",
      "Copy, download, and save CSV",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON to CSV Converter – Convert JSON to CSV Online"
        description="Convert JSON to CSV instantly. Paste JSON and click To CSV to generate CSV output. Free, fast, and no sign-up."
        keywords="json to csv, convert json to csv, json csv converter, online json to csv"
        canonical="https://yoursite.com/json-to-csv"
        ogUrl="https://yoursite.com/json-to-csv"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left, then click To CSV to generate CSV on the right.
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

export default JsonToCsvConverter;

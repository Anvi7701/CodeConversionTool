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

import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToTableConverter: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON to Table Converter",
    description: "Convert JSON to HTML table instantly. Visualize arrays and objects as a sortable, readable table. Copy, export, and share structured tabular JSON output.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Render JSON as table",
      "Flatten lists into rows",
      "Copy & download table",
      "Accessible and responsive",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON to Table Converter – Convert JSON to Responsive HTML Table Online"
        description="Convert JSON arrays and objects to a clean, responsive HTML table online. Fast JSON to Table converter for developers, analysts, and QA with copy and download support."
        keywords="json to table, convert json to table, json table viewer, json array to table, json to html table online, tabular json, json table converter"
        canonical="https://yoursite.com/json-to-table"
        ogUrl="https://yoursite.com/json-to-table"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left. Output is locked to Table view for an easy-to-read, tabular layout.
      </div>
      {/* Mirror the JSON Beautifier layout and theme; lock to Table view */}
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={true}
        colorTheme="purple"
        hideFormatButtons={true}
        initialViewFormat="table"
        lockViewTo="table"
      />
    </>
  );
};

import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToTreeViewConverter: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON Tree View",
    description: "Visualize JSON as an interactive Tree View. Expand/collapse nodes, explore nested structures, and lock the output to a hierarchical tree for clear inspection.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "JSON Tree View",
      "Expand/collapse nested nodes",
      "Readable hierarchical output",
      "Copy & download",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON Tree View – Explore JSON as an Interactive Tree Online"
        description="Convert JSON to a clean, interactive Tree View online. Perfect for inspecting nested keys/values with expand/collapse controls."
        keywords="json tree view, json viewer, visualize nested json, expand collapse json, hierarchical json viewer, json inspector"
        canonical="https://yoursite.com/json-tree-view"
        ogUrl="https://yoursite.com/json-tree-view"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left. Output is locked to Tree view for a hierarchical explorer.
      </div>
      {/* Mirror the Beautifier layout/theme; lock to Tree view */}
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={true}
        colorTheme="purple"
        hideFormatButtons={true}
        initialViewFormat="tree"
        lockViewTo="tree"
      />
    </>
  );
};

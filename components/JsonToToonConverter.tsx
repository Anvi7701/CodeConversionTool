import React from 'react';
import SEO from './SEO';
import { OnlineFormatter } from './OnlineFormatter';

export const JsonToToonConverter: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free JSON to TOON Converter",
    description: "Convert JSON to Token-Oriented Object Notation (TOON) for AI-optimized data exchange. Flatten nested JSON, choose columns, and generate token-friendly output.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "JSON to TOON conversion",
      "Token-Oriented Object Notation",
      "Flatten nested JSON",
      "Array token joining",
      "Copy & download output",
      "SEO-friendly and fast"
    ]
  } as const;

  return (
    <>
      <SEO
        title="JSON to TOON Converter – Convert JSON to Token-Oriented Object Notation (TOON) Online"
        description="Convert JSON data to Token-Oriented Object Notation (TOON) for AI-optimized data exchange. Free online JSON to TOON converter with flattening and token-friendly output."
        keywords="json to toon, token-oriented object notation, convert json to tokens, flatten json arrays, AI data exchange format, json tokenization, toon converter online"
        canonical="https://yoursite.com/json-to-toon"
        ogUrl="https://yoursite.com/json-to-toon"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left, then choose the View dropdown → TOON to generate token-friendly output.
      </div>
      <OnlineFormatter initialLanguage="json" />
    </>
  );
};

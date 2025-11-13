import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';

export const JsonFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online JSON Formatter & Validator",
    "description": "Format, validate, beautify and minify JSON data online. Free JSON formatter tool with syntax highlighting, error detection, and one-click beautification.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "JSON Beautifier",
      "JSON Validator",
      "JSON Minifier",
      "Syntax Highlighting",
      "Error Detection",
      "Auto-Correction",
      "Graph View",
      "Download JSON",
      "Copy JSON",
      "Sort JSON Keys"
    ]
  };

  return (
    <>
      <SEO
        title="Free Online JSON Formatter & Validator - Beautify, Validate & Minify JSON"
        description="Format and validate JSON online instantly. Free JSON beautifier, validator, and minifier with syntax highlighting, error detection, graph view, and auto-correction. Perfect for developers to beautify, minify, sort, and validate JSON data quickly."
        keywords="json formatter, json beautifier, json validator, json minifier, format json online, beautify json, validate json, json syntax checker, json pretty print, json parser, json editor, online json formatter, free json tool, json viewer, json graph, json syntax highlighting, json error checker, json repair, json sorting, minify json"
        canonical="https://yoursite.com/json-formatter"
        ogUrl="https://yoursite.com/json-formatter"
        ogType="website"
        structuredData={structuredData}
      />
      <OnlineFormatterWithToolbar initialLanguage="json" />
    </>
  );
};

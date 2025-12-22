import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';
import './JsonBeautifierPage.css';

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
      <div className="mb-4">
        <div className="beautifier-title">
          <svg className="beautifier-title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id="beautifierH1Gradient" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#4facfe"/>
                <stop offset="100%" stopColor="#00f2fe"/>
              </linearGradient>
            </defs>
            <path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" fill="none" stroke="url(#beautifierH1Gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="beautifier-heading">JSON Formatter</h1>
        </div>
        <h2 className="beautifier-subheading">
          <span>Pretty print</span>, <span>minify</span>, sort keys, and <span>validate</span> JSON online.
        </h2>
        <p className="beautifier-helper mt-2">
          Use the ribbon below to <span className="keyword">Beautify</span>, <span className="keyword">Minify</span>, view as <span className="keyword">Tree View</span>, visualize as <span className="keyword">Graph View</span>, or convert your JSON to <span className="keyword">XML</span> and <span className="keyword">CSV</span>.
        </p>
        {/* Converter links moved to Footer under "Convert JSON" */}
      </div>
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={true}
        colorTheme="purple"
      />
    </>
  );
};

import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';
import './JsonBeautifierPage.css';

export const JsonFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online JSON Formatter & Validator",
    "description": "Format JSON online for better readability and structure. Validate JSON and copy formatted output instantly.",
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
        title="JSON Formatter | Free Online JSON Formatting Tool"
        description="Format JSON online for better readability and structure. Validate JSON and copy formatted output instantly."
        keywords="format JSON online, JSON formatter tool, JSON formatting free"
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
          <h1 className="beautifier-heading">JSON Formatter – Format JSON Online for Readability</h1>
        </div>
        <h2 className="beautifier-subheading">
          Format JSON data with proper structure and indentation. Validate and copy formatted JSON easily.
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

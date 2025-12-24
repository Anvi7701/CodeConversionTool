import React from 'react';
import SEO from '../SEO';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import './JsonBeautifierPage.css';

export const JsonMinifierPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "JSON Minifier",
    "description": "Minify JSON online by removing spaces and line breaks. Compress JSON for faster performance and optimized code.",
    "keywords": "minify JSON online, compress JSON, JSON minifier tool",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEO
        title="JSON Minifier | Free Online Tool to Minify JSON"
        description="Minify JSON online by removing spaces and line breaks. Compress JSON for faster performance and optimized code."
        keywords="minify JSON online, compress JSON, JSON minifier tool"
        canonical="https://yoursite.com/json-minifier"
        ogUrl="https://yoursite.com/json-minifier"
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
          <h1 className="beautifier-heading">JSON Minifier – Compress and Minify JSON Online</h1>
        </div>
        <h2 className="beautifier-subheading">
          Reduce JSON size by removing whitespace and unnecessary characters. Perfect for APIs and faster loading.
        </h2>
        <p className="beautifier-helper mt-2">
          Paste your JSON and use the ribbon to <span className="keyword">Minify</span> instantly. You can also view your data as <span className="keyword">Tree View</span> or <span className="keyword">Graph View</span> for inspection.
        </p>
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

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import './JsonBeautifierPage.css';

export const JsonBeautifierPage: React.FC = () => {
  return (
    <div className="beautifier-theme">
      <Helmet>
        <title>JSON Beautifier – Free Online JSON Formatter and Minifier</title>
        <meta name="description" content="Beautify, format, and minify JSON online. Validate JSON, view as Tree or Graph, and convert to XML or CSV." />
        <link rel="canonical" href="/json-beautifier" />
        <meta property="og:title" content="JSON Beautifier – Free Online JSON Formatter and Minifier" />
        <meta property="og:description" content="Beautify, format, and minify JSON online. Validate JSON, view as Tree or Graph, and convert to XML or CSV." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Online JSON Beautifier',
            description: 'Beautify JSON online: pretty print, minify, sort keys, validate syntax.',
            url: 'https://example.com/json-beautifier',
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'JSON Beautifier',
            applicationCategory: 'DeveloperTool',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0' },
          })}
        </script>
      </Helmet>
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
          <h1 className="beautifier-heading">JSON Beautifier – Free Online JSON Formatter and Minifier</h1>
        </div>
        <h2 className="beautifier-subheading">
          <span className="accent-beautify">Beautify</span>, <span>format</span>, and <span className="accent-minify">minify</span> JSON online. <span>Validate</span> JSON, view as <span className="accent-tree">Tree View</span> or <span className="accent-graph">Graph View</span>, and convert to <span>XML</span> or <span>CSV</span>.
        </h2>
        <p className="beautifier-helper mt-2">
          Use the ribbon below to <span className="keyword">Beautify</span>, <span className="keyword">Minify</span>, view as <span className="keyword">Tree View</span>, visualize as <span className="keyword">Graph View</span>, or convert your JSON to <span className="keyword">XML</span> and <span className="keyword">CSV</span>.
        </p>
        {/* Converter links moved to Footer under "Convert JSON" */}
      </div>
      {/* Restore full toolbar layout with outside-gutter rails and purple theme */}
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={true}
        colorTheme="purple"
      />
    </div>
  );
};

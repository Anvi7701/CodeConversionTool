import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import './JsonBeautifierPage.css';

export const JsonParserPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>JSON Parser | Free Online JSON Parsing Tool</title>
        <meta name="description" content="Parse JSON online and extract data quickly. Validate and format JSON for easy integration." />
        <meta name="keywords" content="parse JSON online, JSON parser tool, extract JSON data" />
        <link rel="canonical" href="/json-parser" />
        <meta property="og:title" content="JSON Parser | Free Online JSON Parsing Tool" />
        <meta property="og:description" content="Parse JSON online and extract data quickly. Validate and format JSON for easy integration." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Online JSON Parser',
            description: 'Parse JSON online and extract data quickly. Validate and format JSON for easy integration.',
            keywords: 'parse JSON online, JSON parser tool, extract JSON data',
            url: 'https://example.com/json-parser',
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'JSON Parser',
            description: 'Parse JSON online and extract data quickly. Validate and format JSON for easy integration.',
            keywords: 'parse JSON online, JSON parser tool, extract JSON data',
            applicationCategory: 'DeveloperTool',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0' },
          })}
        </script>
      </Helmet>
      <div className="mb-4">
        <div className="beautifier-title">
          <svg className="beautifier-title-icon" xmlns="http://www.w3.org/200/svg" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id="beautifierH1Gradient" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#4facfe"/>
                <stop offset="100%" stopColor="#00f2fe"/>
              </linearGradient>
            </defs>
            <path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" fill="none" stroke="url(#beautifierH1Gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="beautifier-heading">JSON Parser – Parse and Extract JSON Data Online</h1>
        </div>
        <h2 className="beautifier-subheading">Parse JSON and extract values easily. Perfect for developers working with APIs and large JSON files.</h2>
        <p className="beautifier-helper mt-2">
          Use the ribbon below to <span className="keyword">Validate</span>, <span className="keyword">Beautify</span>, view as <span className="keyword">Tree View</span> or <span className="keyword">Graph View</span>, and convert your JSON to <span className="keyword">XML</span> and <span className="keyword">CSV</span>.
        </p>
      </div>
      {/* Use shared formatter/editor only; schema appears in main Output */}
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

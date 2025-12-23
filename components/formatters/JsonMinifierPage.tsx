import React from 'react';
import SEO from '../SEO';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import './JsonBeautifierPage.css';

export const JsonMinifierPage: React.FC = () => {
  const keywords = [
    'How to minify JSON online',
    'Free JSON minifier tool',
    'Best JSON minifier for developers',
    'Minify JSON without losing data',
    'Compress JSON for faster loading'
  ].join(', ');

  return (
    <>
      <SEO
        title="JSON Minifier | Free Online Tool to Minify and Compress JSON"
        description="Use our free JSON Minifier tool to compress and reduce JSON size instantly. Minify JSON online for faster performance and optimized code."
        keywords={keywords}
        canonical="https://yoursite.com/json-minifier"
        ogUrl="https://yoursite.com/json-minifier"
        ogType="website"
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
          <h1 className="beautifier-heading">JSON Minifier – Minify and Compress JSON Online</h1>
        </div>
        <h2 className="beautifier-subheading">
          Quickly <span>reduce</span> <span>JSON size</span>, <span>remove whitespace</span>, and <span>optimize</span> your data for <span>APIs</span> and <span>web apps</span>.
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

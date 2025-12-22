import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import './JsonBeautifierPage.css';

export const JsonEditorPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Online JSON Editor — Edit, Validate, Format, Highlight Errors</title>
        <meta name="description" content="Edit JSON online: validate syntax, auto-format, highlight errors, and fix common issues. Keyboard-friendly and fast." />
        <link rel="canonical" href="/json-editor" />
        <meta property="og:title" content="Online JSON Editor" />
        <meta property="og:description" content="Edit and validate JSON with auto-format and error highlighting." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Online JSON Editor',
            description: 'Edit JSON online with validation, auto-format and error highlighting.',
            url: 'https://example.com/json-editor',
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'JSON Editor',
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
          <h1 className="beautifier-heading">JSON Editor</h1>
        </div>
        <h2 className="beautifier-subheading">
          <span>Edit</span>, <span>validate</span>, and <span>format</span> JSON online with error highlighting.
        </h2>
        <p className="beautifier-helper mt-2">
          Use the ribbon below to <span className="keyword">Beautify</span>, view as <span className="keyword">Tree View</span>, or visualize as <span className="keyword">Graph View</span>.
        </p>
        {/* Converter links moved to Footer under "Convert JSON" */}
      </div>
      {/* Restore toolbar layout with outside-gutter rails and purple theme */}
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={false}
        colorTheme="purple"
      />
    </>
  );
};

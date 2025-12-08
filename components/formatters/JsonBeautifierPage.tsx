import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';

export const JsonBeautifierPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Online JSON Beautifier — Pretty Print, Minify, Sort, Validate</title>
        <meta name="description" content="Beautify JSON online: pretty print, minify, sort keys, validate syntax, and fix common JSON errors. Fast, accessible, and developer-friendly." />
        <link rel="canonical" href="/json-beautifier" />
        <meta property="og:title" content="Online JSON Beautifier" />
        <meta property="og:description" content="Pretty print and validate JSON with sorting and minify options." />
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
      {/* Restore full toolbar layout with outside-gutter rails and purple theme */}
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

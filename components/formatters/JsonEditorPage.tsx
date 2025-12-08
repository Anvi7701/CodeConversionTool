import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';

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

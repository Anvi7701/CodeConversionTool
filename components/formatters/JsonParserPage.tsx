import React from 'react';
import { Helmet } from 'react-helmet-async';
import { JsonFormatterPage } from './JsonFormatterPage';

export const JsonParserPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Online JSON Parser — Parse, Validate, Inspect Structure</title>
        <meta name="description" content="Parse JSON online: validate syntax, inspect structure, and visualize keys with fast error reporting." />
        <link rel="canonical" href="/json-parser" />
        <meta property="og:title" content="Online JSON Parser" />
        <meta property="og:description" content="Parse and validate JSON with structure inspection and fast feedback." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Online JSON Parser',
            description: 'Parse and validate JSON with structure inspection and fast feedback.',
            url: 'https://example.com/json-parser',
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'JSON Parser',
            applicationCategory: 'DeveloperTool',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0' },
          })}
        </script>
      </Helmet>
      {/* Reuse formatter functionality for now */}
      <JsonFormatterPage />
    </>
  );
};

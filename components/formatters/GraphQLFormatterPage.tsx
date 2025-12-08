import React from 'react';
import { OnlineFormatter } from '../OnlineFormatter';
import SEO from '../SEO';

export const GraphQLFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online GraphQL Formatter & Beautifier",
    "description": "Format and beautify GraphQL schemas and queries online. Free GraphQL formatter tool with syntax highlighting.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online GraphQL Formatter & Beautifier - Pretty Print GraphQL Schemas"
        description="Format and beautify GraphQL schemas and queries online instantly. Free GraphQL formatter with proper indentation, syntax highlighting, and code cleanup. Perfect for developers to format GraphQL queries, beautify schemas, and improve code readability."
        keywords="graphql formatter, graphql beautifier, format graphql online, beautify graphql, graphql pretty print, graphql schema formatter, online graphql formatter, free graphql tool, graphql indentation, graphql syntax highlighting, graphql query formatter, graphql viewer, graphql editor, format graphql schema"
        canonical="https://yoursite.com/graphql-formatter"
        ogUrl="https://yoursite.com/graphql-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatter initialLanguage="graphql" />
    </>
  );
};

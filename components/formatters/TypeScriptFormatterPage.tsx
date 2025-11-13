import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';

export const TypeScriptFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online TypeScript Formatter & Beautifier",
    "description": "Format and beautify TypeScript code online. Free TS formatter tool with syntax highlighting and proper indentation.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online TypeScript Formatter & Beautifier - Pretty Print TS Code"
        description="Format and beautify TypeScript code online instantly. Free TS formatter with proper indentation, syntax highlighting, and code cleanup. Perfect for developers to format messy TypeScript, beautify .ts and .tsx files, and improve code readability."
        keywords="typescript formatter, ts beautifier, format typescript online, beautify typescript, typescript pretty print, ts code formatter, online typescript formatter, free ts tool, typescript indentation, typescript syntax highlighting, tsx formatter, typescript viewer, typescript editor, clean typescript code"
        canonical="https://yoursite.com/typescript-formatter"
        ogUrl="https://yoursite.com/typescript-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatterWithToolbar initialLanguage="typescript" />
    </>
  );
};

import React from 'react';
import { OnlineFormatter } from '../OnlineFormatter';
import SEO from '../SEO';

export const JavaFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online Java Code Formatter & Beautifier",
    "description": "Format and beautify Java code online. Free Java formatter tool with proper indentation and syntax highlighting.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online Java Code Formatter & Beautifier - Pretty Print Java"
        description="Format and beautify Java code online instantly. Free Java formatter with proper indentation, syntax highlighting, and code cleanup. Perfect for developers to format messy Java code, beautify Java classes, and improve code readability."
        keywords="java formatter, java beautifier, format java online, beautify java, java code formatter, java pretty print, online java formatter, free java tool, java indentation, java syntax highlighting, java code beautifier, format java code, clean java code, java viewer, java editor"
        canonical="https://yoursite.com/java-formatter"
        ogUrl="https://yoursite.com/java-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatter initialLanguage="java" />
    </>
  );
};

import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';

export const JavaScriptFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online JavaScript Formatter & Beautifier",
    "description": "Format and beautify JavaScript code online. Free JS formatter tool with syntax highlighting and proper indentation.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online JavaScript Formatter & Beautifier - Pretty Print JS Code"
        description="Format and beautify JavaScript code online instantly. Free JS formatter with proper indentation, syntax highlighting, and code cleanup. Perfect for developers to format messy JavaScript, beautify ES6/ES7 code, minify JS, and improve code readability."
        keywords="javascript formatter, js beautifier, format javascript online, beautify javascript, javascript pretty print, js code formatter, online javascript formatter, free js tool, javascript indentation, es6 formatter, javascript syntax highlighting, js viewer, javascript editor, clean javascript code, js minifier, uglify javascript"
        canonical="https://yoursite.com/javascript-formatter"
        ogUrl="https://yoursite.com/javascript-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatterWithToolbar initialLanguage="javascript" />
    </>
  );
};

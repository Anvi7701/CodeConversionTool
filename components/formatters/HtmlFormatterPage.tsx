import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';

export const HtmlFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online HTML Formatter & Beautifier",
    "description": "Format and beautify HTML code online. Free HTML formatter tool with syntax highlighting and indentation.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online HTML Formatter & Beautifier - Pretty Print HTML Code"
        description="Format and beautify HTML code online instantly. Free HTML formatter with proper indentation, syntax highlighting, and code cleanup. Perfect for web developers to format messy HTML, beautify HTML5, and improve code readability."
        keywords="html formatter, html beautifier, format html online, beautify html, html pretty print, html code formatter, online html formatter, free html tool, html indentation, html syntax highlighting, html5 formatter, html viewer, html editor, clean html code, html minifier"
        canonical="https://yoursite.com/html-formatter"
        ogUrl="https://yoursite.com/html-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatterWithToolbar initialLanguage="html" />
    </>
  );
};

import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';

export const CssFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online CSS Formatter & Beautifier",
    "description": "Format and beautify CSS stylesheets online. Free CSS formatter tool with syntax highlighting and proper indentation.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online CSS Formatter & Beautifier - Pretty Print CSS Stylesheets"
        description="Format and beautify CSS code online instantly. Free CSS formatter with proper indentation, syntax highlighting, and style cleanup. Perfect for web developers to format messy CSS, beautify stylesheets, minify CSS, and improve code readability."
        keywords="css formatter, css beautifier, format css online, beautify css, css pretty print, css code formatter, online css formatter, free css tool, css indentation, css syntax highlighting, css3 formatter, css viewer, css editor, clean css code, css minifier, optimize css"
        canonical="https://yoursite.com/css-formatter"
        ogUrl="https://yoursite.com/css-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatterWithToolbar initialLanguage="css" />
    </>
  );
};

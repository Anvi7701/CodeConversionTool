import React from 'react';
import { OnlineFormatter } from '../OnlineFormatter';
import SEO from '../SEO';

export const AngularFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online Angular Template Formatter & Beautifier",
    "description": "Format and beautify Angular HTML templates online. Free Angular formatter tool with syntax highlighting.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online Angular Template Formatter - Beautify Angular HTML"
        description="Format and beautify Angular HTML templates online instantly. Free Angular formatter with proper indentation, syntax highlighting, and code cleanup. Perfect for Angular developers to format component templates, beautify Angular HTML, and improve code readability."
        keywords="angular formatter, angular template formatter, format angular online, beautify angular, angular html formatter, angular component formatter, online angular formatter, free angular tool, angular indentation, angular syntax highlighting, angular template beautifier, format angular template, angular viewer, angular editor"
        canonical="https://yoursite.com/angular-formatter"
        ogUrl="https://yoursite.com/angular-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatter initialLanguage="angular" />
    </>
  );
};

import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';

export const SoapFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online SOAP Message Formatter & Validator",
    "description": "Format and validate SOAP XML messages online. Free SOAP formatter tool for web service testing.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online SOAP Formatter & Validator - Beautify SOAP XML Messages"
        description="Format and validate SOAP messages online instantly. Free SOAP formatter with proper indentation, syntax highlighting, and error detection. Perfect for developers testing web services, debugging SOAP APIs, and working with enterprise integrations."
        keywords="soap formatter, soap beautifier, format soap online, beautify soap, soap validator, soap message formatter, online soap formatter, free soap tool, soap xml formatter, soap indentation, soap syntax highlighting, soap viewer, soap editor, validate soap, soap request formatter, soap response formatter"
        canonical="https://yoursite.com/soap-formatter"
        ogUrl="https://yoursite.com/soap-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatterWithToolbar initialLanguage="soap" />
    </>
  );
};

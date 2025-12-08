import React from 'react';
import { OnlineFormatter } from '../OnlineFormatter';
import SEO from '../SEO';

export const WsdlFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online WSDL Formatter & Validator",
    "description": "Format and validate WSDL files online. Free WSDL formatter tool for web service descriptions.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online WSDL Formatter & Validator - Beautify Web Service Descriptions"
        description="Format and validate WSDL files online instantly. Free WSDL formatter with proper indentation, syntax highlighting, and error detection. Perfect for developers working with web services, SOAP APIs, and enterprise integrations."
        keywords="wsdl formatter, wsdl beautifier, format wsdl online, beautify wsdl, wsdl validator, wsdl syntax checker, online wsdl formatter, free wsdl tool, wsdl indentation, web service formatter, wsdl xml formatter, soap wsdl formatter, wsdl viewer, wsdl editor, validate wsdl"
        canonical="https://yoursite.com/wsdl-formatter"
        ogUrl="https://yoursite.com/wsdl-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatter initialLanguage="wsdl" />
    </>
  );
};

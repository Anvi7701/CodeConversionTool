import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';

export const XmlFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online XML Formatter & Validator",
    "description": "Format, validate, beautify and minify XML data online. Free XML formatter tool with syntax highlighting and error detection.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online XML Formatter & Validator - Beautify, Validate & Minify XML"
        description="Format and validate XML online instantly. Free XML beautifier, validator, and minifier with syntax highlighting, error detection, and auto-correction. Perfect for developers to beautify, minify, and validate XML, SOAP, WSDL data quickly."
        keywords="xml formatter, xml beautifier, xml validator, xml minifier, format xml online, beautify xml, validate xml, xml syntax checker, xml pretty print, xml parser, xml editor, online xml formatter, free xml tool, xml viewer, soap formatter, wsdl formatter, xml syntax highlighting, xml error checker"
        canonical="https://yoursite.com/xml-formatter"
        ogUrl="https://yoursite.com/xml-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatterWithToolbar initialLanguage="xml" />
    </>
  );
};

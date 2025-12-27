import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonTransformPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "JSON Transform",
    "description": "Transform JSON online into XML, CSV, or YAML. Apply custom transformations and export data easily.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="JSON Transform | Free Online JSON Conversion Tool"
        description="Transform JSON online into XML, CSV, or YAML. Apply custom transformations and export data easily."
        keywords="transform JSON online, convert JSON to XML, JSON to CSV tool"
        canonical="https://yourdomain.com/json-transform"
        ogUrl="https://yourdomain.com/json-transform"
        structuredData={structuredData}
      />
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        showMinifyNextToBeautify={true}
        hideFormatButtons={true}
      />
    </>
  );
};

export default JsonTransformPage;

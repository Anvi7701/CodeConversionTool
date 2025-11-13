import React from 'react';
import { OnlineFormatterWithToolbar } from '../OnlineFormatterWithToolbar';
import SEO from '../SEO';

export const YamlFormatterPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Online YAML Formatter & Validator",
    "description": "Format and validate YAML files online. Free YAML formatter tool with syntax highlighting and error detection.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  return (
    <>
      <SEO
        title="Free Online YAML Formatter & Validator - Beautify & Validate YAML Files"
        description="Format and validate YAML files online instantly. Free YAML formatter with proper indentation, syntax highlighting, and error detection. Perfect for DevOps engineers to format Kubernetes configs, Docker Compose files, CI/CD pipelines, and YAML configuration files."
        keywords="yaml formatter, yml beautifier, format yaml online, beautify yaml, yaml validator, yaml syntax checker, yaml pretty print, online yaml formatter, free yaml tool, yaml indentation, kubernetes yaml formatter, docker compose formatter, yaml syntax highlighting, yaml viewer, yaml editor, validate yaml"
        canonical="https://yoursite.com/yaml-formatter"
        ogUrl="https://yoursite.com/yaml-formatter"
        structuredData={structuredData}
      />
      <OnlineFormatterWithToolbar initialLanguage="yaml" />
    </>
  );
};

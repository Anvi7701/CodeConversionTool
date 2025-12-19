import React from 'react';
import SEO from './SEO';
import { OnlineFormatterWithToolbar } from './OnlineFormatterWithToolbar';

export const JsonToPythonPrettyPrintConverter: React.FC = () => {
  return (
    <>
      <SEO
        title="JSON to Python Pretty Print Converter | AI JSON Tools"
        description="Generate Python pretty print scripts from JSON instantly using AI-powered tools. Validate JSON and create clean, readable Python code."
        keywords="json to python converter, pretty print python, AI JSON Tools, convert JSON to Python script"
        canonical="https://yourdomain.com/json-to-python-pretty-print"
        ogImage="https://yourdomain.com/images/json-to-python-pretty-print.jpg"
        ogUrl="https://yourdomain.com/json-to-python-pretty-print"
      />
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Tip: Paste your JSON on the left. Output is locked to Text view and rendered as a Python pretty print script.
      </div>
      {/* Mirror the TOON page layout/theme; lock to Text view with Python script generation */}
      <OnlineFormatterWithToolbar
        initialLanguage="json"
        showLeftInputActions={true}
        inlineStructureAnalysisIcon={false}
        inlineSortValidateIcons={false}
        showMinifyNextToBeautify={true}
        colorTheme="purple"
        hideFormatButtons={true}
        initialViewFormat="text"
        lockViewTo="text"
        textOutputMode="python-pretty"
        hideStructureAnalysisAndTransform={true}
      />
    </>
  );
};

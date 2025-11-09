import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Lazy load components
const JsonExplainerPage = lazy(() => import('./components/JsonExplainerPage.tsx').then(m => ({ default: m.JsonExplainerPage })));
const CodeToJsonConverter = lazy(() => import('./components/CodeToJsonConverter.tsx').then(m => ({ default: m.CodeToJsonConverter })));
const CodeToXmlConverter = lazy(() => import('./components/CodeToXmlConverter.tsx').then(m => ({ default: m.CodeToXmlConverter })));
const CodeToHtmlConverter = lazy(() => import('./components/CodeToHtmlConverter.tsx').then(m => ({ default: m.CodeToHtmlConverter })));
const CodeToPythonConverter = lazy(() => import('./components/CodeToPythonConverter.tsx').then(m => ({ default: m.CodeToPythonConverter })));
const CodeToJsConverter = lazy(() => import('./components/CodeToJsConverter.tsx').then(m => ({ default: m.CodeToJsConverter })));
const JsonToPythonPrettyPrintConverter = lazy(() => import('./components/JsonToPythonPrettyPrintConverter.tsx').then(m => ({ default: m.JsonToPythonPrettyPrintConverter })));
const XmlInspector = lazy(() => import('./components/XmlInspector.tsx').then(m => ({ default: m.XmlInspector })));
const DataToClassConverter = lazy(() => import('./components/DataToClassConverter.tsx').then(m => ({ default: m.DataToClassConverter })));
const OnlineFormatter = lazy(() => import('./components/OnlineFormatter.tsx').then(m => ({ default: m.OnlineFormatter })));

const App: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>AI JSON Tools</title>
      </Helmet>

      {/* Navigation Bar */}
      <nav>
        <Link to="/">JSON Explainer</Link> | 
        <Link to="/code-to-json">Convert To JSON</Link> | 
        <Link to="/code-to-xml">Convert To XML</Link> | 
        <Link to="/code-to-html">Convert To HTML</Link> | 
        <Link to="/code-to-python">Convert To Python</Link> | 
        <Link to="/code-to-js">Convert To JavaScript</Link> | 
        <Link to="/json-to-python-pretty">JSON To Python Pretty</Link> | 
        <Link to="/xml-inspector">XML Inspector</Link> | 
        <Link to="/data-to-class">Data To Class</Link> | 
        <Link to="/online-formatter">Online Formatter</Link>
      </nav>

      {/* Routes */}
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<JsonExplainerPage />} />
          <Route path="/code-to-json" element={<CodeToJsonConverter />} />
          <Route path="/code-to-xml" element={<CodeToXmlConverter />} />
          <Route path="/code-to-html" element={<CodeToHtmlConverter />} />
          <Route path="/code-to-python" element={<CodeToPythonConverter />} />
          <Route path="/code-to-js" element={<CodeToJsConverter />} />
          <Route path="/json-to-python-pretty" element={<JsonToPythonPrettyPrintConverter />} />
          <Route path="/xml-inspector" element={<XmlInspector />} />
          <Route path="/data-to-class" element={<DataToClassConverter />} />
          <Route path="/online-formatter" element={<OnlineFormatter />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
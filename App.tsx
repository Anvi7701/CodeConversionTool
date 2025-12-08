import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { GlobalNavDropdown } from './components/GlobalNavDropdown';

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
const JsonToJavaConverter = lazy(() => import('./components/JsonToJavaConverter.tsx').then(m => ({ default: m.JsonToJavaConverter })));
const JsonToXmlConverter = lazy(() => import('./components/JsonToXmlConverter'));
const JsonToToonConverter = lazy(() => import('./components/JsonToToonConverter').then(m => ({ default: m.JsonToToonConverter })));
const JsonTransformPage = lazy(() => import('./components/JsonTransformPage').then(m => ({ default: m.JsonTransformPage })));

// SEO-optimized formatter pages
const JsonFormatterPage = lazy(() => import('./components/formatters/JsonFormatterPage.tsx').then(m => ({ default: m.JsonFormatterPage })));
const JsonBeautifierPage = lazy(() => import('./components/formatters/JsonBeautifierPage').then(m => ({ default: m.JsonBeautifierPage })));
const JsonEditorPage = lazy(() => import('./components/formatters/JsonEditorPage').then(m => ({ default: m.JsonEditorPage })));
const JsonParserPage = lazy(() => import('./components/formatters/JsonParserPage').then(m => ({ default: m.JsonParserPage })));
const XmlFormatterPage = lazy(() => import('./components/formatters/XmlFormatterPage.tsx').then(m => ({ default: m.XmlFormatterPage })));
const HtmlFormatterPage = lazy(() => import('./components/formatters/HtmlFormatterPage.tsx').then(m => ({ default: m.HtmlFormatterPage })));
const CssFormatterPage = lazy(() => import('./components/formatters/CssFormatterPage.tsx').then(m => ({ default: m.CssFormatterPage })));
const JavaScriptFormatterPage = lazy(() => import('./components/formatters/JavaScriptFormatterPage.tsx').then(m => ({ default: m.JavaScriptFormatterPage })));
const TypeScriptFormatterPage = lazy(() => import('./components/formatters/TypeScriptFormatterPage.tsx').then(m => ({ default: m.TypeScriptFormatterPage })));
const YamlFormatterPage = lazy(() => import('./components/formatters/YamlFormatterPage.tsx').then(m => ({ default: m.YamlFormatterPage })));
const GraphQLFormatterPage = lazy(() => import('./components/formatters/GraphQLFormatterPage.tsx').then(m => ({ default: m.GraphQLFormatterPage })));
const JavaFormatterPage = lazy(() => import('./components/formatters/JavaFormatterPage.tsx').then(m => ({ default: m.JavaFormatterPage })));
const WsdlFormatterPage = lazy(() => import('./components/formatters/WsdlFormatterPage.tsx').then(m => ({ default: m.WsdlFormatterPage })));
const SoapFormatterPage = lazy(() => import('./components/formatters/SoapFormatterPage.tsx').then(m => ({ default: m.SoapFormatterPage })));
const AngularFormatterPage = lazy(() => import('./components/formatters/AngularFormatterPage.tsx').then(m => ({ default: m.AngularFormatterPage })));

// JSON Tools with SEO
const JsonGraphViewerPage = lazy(() => import('./components/JsonGraphViewerPage.tsx').then(m => ({ default: m.JsonGraphViewerPage })));
const JsonStructureAnalyzerPage = lazy(() => import('./components/JsonStructureAnalyzerPage.tsx').then(m => ({ default: m.JsonStructureAnalyzerPage })));
const JsonTreeViewPage = lazy(() => import('./components/JsonTreeViewPage'));

const App: React.FC = () => {
  const location = useLocation();

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    // If we're already on this path, prevent default and scroll to top
    if (location.pathname === path) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <ScrollToTop />
      
      <Helmet>
        <title>AI JSON Tools</title>
      </Helmet>

      {/* Navigation Bar - Hidden in fullscreen mode */}
      <nav className="bg-white dark:bg-dark-card border-b border-slate-200 dark:border-slate-700 py-4 px-4 mb-6 fullscreen-hide">
        <div className="max-w-7xl mx-auto">
          {/* Main Tools Section */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">AI-Powered Tools</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <Link to="/" onClick={(e) => handleNavLinkClick(e, '/')} className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">JSON Explainer</Link>
              <span className="text-slate-400">|</span>
              <Link to="/code-to-json" onClick={(e) => handleNavLinkClick(e, '/code-to-json')} className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">Convert To JSON</Link>
              <span className="text-slate-400">|</span>
              <Link to="/code-to-xml" onClick={(e) => handleNavLinkClick(e, '/code-to-xml')} className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">Convert To XML</Link>
              <span className="text-slate-400">|</span>
              <Link to="/code-to-html" onClick={(e) => handleNavLinkClick(e, '/code-to-html')} className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">Convert To HTML</Link>
              <span className="text-slate-400">|</span>
              <Link to="/code-to-python" onClick={(e) => handleNavLinkClick(e, '/code-to-python')} className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">Convert To Python</Link>
              <span className="text-slate-400">|</span>
              <Link to="/code-to-js" onClick={(e) => handleNavLinkClick(e, '/code-to-js')} className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">Convert To JavaScript</Link>
              <span className="text-slate-400">|</span>
              
              <Link to="/xml-inspector" onClick={(e) => handleNavLinkClick(e, '/xml-inspector')} className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">XML Inspector</Link>
              <span className="text-slate-400">|</span>
              <Link to="/data-to-class" onClick={(e) => handleNavLinkClick(e, '/data-to-class')} className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">Data To Class</Link>
              {/* Hybrid new dropdown: JSON Tools */}
              <span className="inline-flex ml-2">
                <GlobalNavDropdown
                  label="🧰 JSON Tools"
                  items={[
                    { label: 'JSON Beautifier', to: '/json-beautifier', icon: '🎨' },
                    { label: 'JSON Editor', to: '/json-editor', icon: '✏️' },
                    { label: 'JSON Formatter', to: '/json-formatter', icon: '🧹' },
                    { label: 'JSON Graph Viewer', to: '/json-graph-viewer', icon: '📊' },
                    { label: 'JSON Structure Analyzer', to: '/json-structure-analyzer', icon: '🕸️' },
                    { label: 'JSON Transform', to: '/json-transform', icon: '🛠️' },
                    { label: 'JSON to TOON', to: '/json-to-toon', icon: '🎭' },
                    { label: 'JSON To Python Pretty Print', to: '/json-to-python-pretty', icon: '🐍' },
                    { label: 'JSON Parser', to: '/json-parser', icon: '🧪' }
                  ]}
                />
              </span>
            </div>
          </div>

          {/* JSON Visualization & Analysis Section */}
            {/* (Moved JSON Visualization & Analysis links to footer) */}
        </div>
      </nav>

      {/* Routes */}
      <div className="px-4 max-w-7xl mx-auto">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>}>
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
            <Route path="/json-to-java" element={<JsonToJavaConverter />} />
            <Route path="/json-to-xml" element={<JsonToXmlConverter />} />
            <Route path="/json-to-toon" element={<JsonToToonConverter />} />
            
            {/* SEO-optimized formatter routes */}
            <Route path="/json-formatter" element={<JsonFormatterPage />} />
            <Route path="/json-beautifier" element={<JsonBeautifierPage />} />
            <Route path="/json-editor" element={<JsonEditorPage />} />
            <Route path="/json-parser" element={<JsonParserPage />} />
            <Route path="/xml-formatter" element={<XmlFormatterPage />} />
            <Route path="/html-formatter" element={<HtmlFormatterPage />} />
            <Route path="/css-formatter" element={<CssFormatterPage />} />
            <Route path="/javascript-formatter" element={<JavaScriptFormatterPage />} />
            <Route path="/typescript-formatter" element={<TypeScriptFormatterPage />} />
            <Route path="/yaml-formatter" element={<YamlFormatterPage />} />
            <Route path="/graphql-formatter" element={<GraphQLFormatterPage />} />
            <Route path="/java-formatter" element={<JavaFormatterPage />} />
            <Route path="/wsdl-formatter" element={<WsdlFormatterPage />} />
            <Route path="/soap-formatter" element={<SoapFormatterPage />} />
            <Route path="/angular-formatter" element={<AngularFormatterPage />} />
            
            {/* JSON Visualization & Analysis routes */}
            <Route path="/json-graph-viewer" element={<JsonGraphViewerPage />} />
            <Route path="/json-structure-analyzer" element={<JsonStructureAnalyzerPage />} />
            <Route path="/json-tree-view" element={<JsonTreeViewPage />} />
            <Route path="/json-transform" element={<JsonTransformPage />} />
          </Routes>
        </Suspense>
      </div>

      <Footer className="fullscreen-hide" />
    </>
  );
};

export default App;
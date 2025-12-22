import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const location = useLocation();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
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
    <footer className={`w-full bg-white dark:bg-dark-card border-t border-slate-200 dark:border-slate-700 mt-12 py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Convert JSON (renamed from JSON Converters) */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Convert JSON
            </h3>
            <ul className="space-y-2">
              {/** Link removed: JSON to JAVA (page deprecated) */}
              <li>
                <Link 
                  to="/json-to-xml" 
                  onClick={(e) => handleLinkClick(e, '/json-to-xml')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Convert JSON to XML
                </Link>
              </li>
              <li>
                <Link 
                  to="/json-to-csv" 
                  onClick={(e) => handleLinkClick(e, '/json-to-csv')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Convert JSON to CSV
                </Link>
              </li>
              <li>
                <Link 
                  to="/json-to-yaml" 
                  onClick={(e) => handleLinkClick(e, '/json-to-yaml')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Convert JSON to YAML
                </Link>
              </li>
              <li>
                <Link 
                  to="/json-to-html" 
                  onClick={(e) => handleLinkClick(e, '/json-to-html')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Convert JSON to HTML
                </Link>
              </li>
              <li>
                <Link 
                  to="/json-to-javascript" 
                  onClick={(e) => handleLinkClick(e, '/json-to-javascript')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Convert JSON to JavaScript
                </Link>
              </li>
              <li>
                <Link 
                  to="/json-to-python" 
                  onClick={(e) => handleLinkClick(e, '/json-to-python')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Convert JSON to Python
                </Link>
              </li>
              <li>
                <Link 
                  to="/code-to-json" 
                  onClick={(e) => handleLinkClick(e, '/code-to-json')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Code to JSON
                </Link>
              </li>
              <li>
                <Link 
                  to="/json-to-python-pretty" 
                  onClick={(e) => handleLinkClick(e, '/json-to-python-pretty')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  JSON to Python Pretty Print
                </Link>
              </li>
            </ul>
          </div>

          {/* XML Converters */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              XML Converters
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/json-to-xml" 
                  onClick={(e) => handleLinkClick(e, '/json-to-xml')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  JSON to XML
                </Link>
              </li>
              <li>
                <Link 
                  to="/code-to-xml" 
                  onClick={(e) => handleLinkClick(e, '/code-to-xml')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Code to XML
                </Link>
              </li>
              <li>
                <Link 
                  to="/xml-inspector" 
                  onClick={(e) => handleLinkClick(e, '/xml-inspector')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  XML Inspector
                </Link>
              </li>
            </ul>
          </div>

          {/* Code Converters */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Code Converters
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/code-to-python" 
                  onClick={(e) => handleLinkClick(e, '/code-to-python')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Code to Python
                </Link>
              </li>
              <li>
                <Link 
                  to="/code-to-js" 
                  onClick={(e) => handleLinkClick(e, '/code-to-js')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Code to JavaScript
                </Link>
              </li>
              <li>
                <Link 
                  to="/code-to-html" 
                  onClick={(e) => handleLinkClick(e, '/code-to-html')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Code to HTML
                </Link>
              </li>
              <li>
                <Link 
                  to="/data-to-class" 
                  onClick={(e) => handleLinkClick(e, '/data-to-class')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Data to Class
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Tools
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  onClick={(e) => handleLinkClick(e, '/')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  JSON Explainer
                </Link>
              </li>
              <li>
                <Link 
                  to="/online-formatter" 
                  onClick={(e) => handleLinkClick(e, '/online-formatter')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Online Formatter
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* JSON Visualization & Analysis (moved from header) */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            JSON Visualization & Analysis
          </h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/json-graph-viewer"
                onClick={(e) => handleLinkClick(e, '/json-graph-viewer')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                JSON Graph Viewer
              </Link>
            </li>
            <li>
              <Link
                to="/json-structure-analyzer"
                onClick={(e) => handleLinkClick(e, '/json-structure-analyzer')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                JSON Structure Analyzer
              </Link>
            </li>
            <li>
              <Link
                to="/json-to-toon"
                onClick={(e) => handleLinkClick(e, '/json-to-toon')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                JSON to TOON
              </Link>
            </li>
          </ul>
        </div>

        {/* Code Formatters & Beautifiers Section */}
        <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">
            Online Code Formatters & Beautifiers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <Link 
              to="/json-formatter" 
              onClick={(e) => handleLinkClick(e, '/json-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              JSON Formatter
            </Link>
            <Link 
              to="/xml-formatter" 
              onClick={(e) => handleLinkClick(e, '/xml-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              XML Formatter
            </Link>
            <Link 
              to="/html-formatter" 
              onClick={(e) => handleLinkClick(e, '/html-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              HTML Formatter
            </Link>
            <Link 
              to="/css-formatter" 
              onClick={(e) => handleLinkClick(e, '/css-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              CSS Formatter
            </Link>
            <Link 
              to="/javascript-formatter" 
              onClick={(e) => handleLinkClick(e, '/javascript-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              JavaScript Formatter
            </Link>
            <Link 
              to="/typescript-formatter" 
              onClick={(e) => handleLinkClick(e, '/typescript-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              TypeScript Formatter
            </Link>
            <Link 
              to="/yaml-formatter" 
              onClick={(e) => handleLinkClick(e, '/yaml-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              YAML Formatter
            </Link>
            <Link 
              to="/graphql-formatter" 
              onClick={(e) => handleLinkClick(e, '/graphql-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              GraphQL Formatter
            </Link>
            <Link 
              to="/java-formatter" 
              onClick={(e) => handleLinkClick(e, '/java-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              Java Formatter
            </Link>
            <Link 
              to="/wsdl-formatter" 
              onClick={(e) => handleLinkClick(e, '/wsdl-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              WSDL Formatter
            </Link>
            <Link 
              to="/soap-formatter" 
              onClick={(e) => handleLinkClick(e, '/soap-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              SOAP Formatter
            </Link>
            <Link 
              to="/angular-formatter" 
              onClick={(e) => handleLinkClick(e, '/angular-formatter')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-center"
            >
              Angular Formatter
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} AI JSON Tools. Powered by Google Gemini AI.
          </p>
        </div>
      </div>
    </footer>
  );
};

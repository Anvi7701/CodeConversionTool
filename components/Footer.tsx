import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
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
    <footer className="w-full bg-white dark:bg-dark-card border-t border-slate-200 dark:border-slate-700 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* JSON Converters */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              JSON Converters
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/json-to-java" 
                  onClick={(e) => handleLinkClick(e, '/json-to-java')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  JSON to JAVA
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

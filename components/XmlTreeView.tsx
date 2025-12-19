import { useState, FC } from 'react';

// Props for the main component
interface XmlTreeViewProps {
  xmlString: string;
}

// Props for the recursive node component
interface XmlNodeProps {
  node: Node;
}

const XmlNode: FC<XmlNodeProps> = ({ node }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // 1. Text Node
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
    return <div className="ml-6 text-green-700 dark:text-green-400">{node.nodeValue.trim()}</div>;
  }

  // 2. Element Node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName;
    const attributes = Array.from(element.attributes);
    const children = Array.from(element.childNodes).filter(
      (child) => child.nodeType === Node.ELEMENT_NODE || (child.nodeType === Node.TEXT_NODE && child.nodeValue?.trim())
    );

    const hasChildren = children.length > 0;

    return (
      <div className="ml-6">
        <div className="flex items-center cursor-pointer" onClick={() => hasChildren && setIsExpanded(!isExpanded)}>
          {hasChildren ? (
            <span className="w-5 h-5 text-left flex-shrink-0 text-slate-500 dark:text-slate-400">
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <span className="w-5 h-5 flex-shrink-0"></span>
          )}
          <span className="text-slate-500 dark:text-slate-400">&lt;</span>
          <span className="text-purple-800 dark:text-purple-300 font-semibold">{tagName}</span>
          {attributes.map((attr) => (
            <span key={attr.name} className="ml-2">
              <span className="text-indigo-600 dark:text-indigo-400">{attr.name}</span>
              <span className="text-slate-500 dark:text-slate-400">="</span>
              <span className="text-blue-700 dark:text-blue-400">{attr.value}</span>
              <span className="text-slate-500 dark:text-slate-400">"</span>
            </span>
          ))}
          {hasChildren ? (
            <span className="text-slate-500 dark:text-slate-400">&gt;</span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400"> /&gt;</span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="border-l border-slate-200 dark:border-slate-700">
            {children.map((child, index) => (
              <XmlNode key={index} node={child} />
            ))}
          </div>
        )}

        {isExpanded && hasChildren && (
          <div className="flex items-center">
            <span className="w-5 h-5 flex-shrink-0"></span>
             <span className="text-slate-500 dark:text-slate-400">&lt;/</span>
             <span className="text-purple-800 dark:text-purple-300 font-semibold">{tagName}</span>
             <span className="text-slate-500 dark:text-slate-400">&gt;</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback for other node types (comments, etc.)
  return null;
};

export const XmlTreeView: FC<XmlTreeViewProps> = ({ xmlString }) => {
  if (!xmlString || !xmlString.trim()) {
    return (
        <div className="p-4 text-slate-500 dark:text-slate-400 font-mono text-center h-full flex items-center justify-center">
            <p>No XML data to display in Tree View.</p>
        </div>
    );
  }
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      return (
        <div className="p-4 text-red-600 dark:text-red-400 font-mono">
          <strong>Error parsing XML for Tree View:</strong>
          <pre className="mt-2">{parserError.textContent}</pre>
        </div>
      );
    }

    if (!xmlDoc.documentElement) {
         return (
            <div className="p-4 text-red-600 dark:text-red-400 font-mono">
              <strong>Error parsing XML:</strong>
              <pre className="mt-2">Could not find a root element in the provided XML.</pre>
            </div>
        );
    }

    return (
      <div className="font-mono text-sm leading-relaxed select-text p-4 overflow-auto absolute inset-0">
        <XmlNode node={xmlDoc.documentElement} />
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-4 text-red-600 dark:text-red-400 font-mono">
        <strong>An unexpected error occurred while rendering the XML tree:</strong>
        <pre className="mt-2">{error.message}</pre>
      </div>
    );
  }
};

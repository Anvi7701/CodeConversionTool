declare global {
  interface Window {
    prettier: any;
    prettierPlugins: any;
  }
}

// Helper to assemble all loaded Prettier plugins
const getPrettierPlugins = () => {
  const plugins = [];
  // Standard plugins register themselves in this object
  if (window.prettierPlugins) {
    plugins.push(...Object.values(window.prettierPlugins));
  }
  return plugins;
}

export const formatXml = async (xmlString: string): Promise<string> => {
    if (!xmlString || typeof xmlString !== 'string') {
        return '';
    }
    // A simple heuristic for indentation-based formatting as a fallback
    let formatted = '', indent = '';
    const tab = '  ';
    try {
        // Add newlines to make it processable
        xmlString = xmlString.replace(/>\s*</g, '>\n<');
        // Split and process
        xmlString.split('\n').forEach(node => {
            const line = node.trim();
            if (!line) return;

            if (line.match( /^\<\// )) { // Closing tag
                 indent = indent.substring(tab.length);
            }
            
            formatted += indent + line + '\n';
            
            if (line.match( /^<[^\/]/ ) && !line.match( /\/>$/ )) { // Opening tag, not self-closing
                indent += tab;
            }
        });
        return formatted.trim();
    } catch(e) {
        return xmlString; // Return original if formatting fails
    }
};

export const minifyXml = async (xmlString: string): Promise<string> => {
    if (!xmlString || typeof xmlString !== 'string') {
        return '';
    }
    return xmlString
        .replace(/>\s+</g, '><') // Remove whitespace between tags
        .replace(/\s*\n\s*/g, '')   // Remove newlines and surrounding whitespace
        .trim();
};

export const beautifyCss = async (cssString: string): Promise<string> => {
    if (!window.prettier || !window.prettierPlugins) {
      console.warn('Prettier or its plugins not available for formatting.');
      return cssString; // fallback
    }
    return await window.prettier.format(cssString, {
      parser: "css",
      plugins: getPrettierPlugins(),
    });
};

export const beautifyJs = async (jsString: string): Promise<string> => {
    return await window.prettier.format(jsString, {
      parser: "babel",
      plugins: getPrettierPlugins(),
      semi: true,
      singleQuote: true,
    });
};

export const beautifyYaml = async (yamlString: string): Promise<string> => {
    return await window.prettier.format(yamlString, {
      parser: "yaml",
      plugins: getPrettierPlugins(),
    });
};

export const beautifyTs = async (tsString: string): Promise<string> => {
    return await window.prettier.format(tsString, {
      parser: "typescript",
      plugins: getPrettierPlugins(),
      semi: true,
      singleQuote: true,
    });
};

export const beautifyAngular = async (htmlString: string): Promise<string> => {
    return await window.prettier.format(htmlString, {
      // Fix: Use 'html' parser for Angular templates
      parser: "html",
      plugins: getPrettierPlugins(),
    });
};

export const beautifyGraphql = async (graphqlString: string): Promise<string> => {
    return await window.prettier.format(graphqlString, {
      parser: "graphql",
      plugins: getPrettierPlugins(),
    });
};

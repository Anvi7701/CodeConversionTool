import { toXml, toPython, convertJsonToHtml } from './codeGenerator';

/**
 * Converts an XML string into a structured JSON object.
 */
export const convertXmlToJson = (xmlString: string): object => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");

    const parserError = doc.getElementsByTagName("parsererror");
    if (parserError.length) {
        throw new Error("Invalid XML format. " + (parserError[0]?.textContent || ''));
    }
    if (!doc.documentElement) {
        throw new Error("Invalid or empty XML provided.");
    }

    const xmlToJsonRecursive = (xmlNode: Node): any => {
        // Handle text nodes
        if (xmlNode.nodeType === 3 && xmlNode.nodeValue?.trim()) {
            return xmlNode.nodeValue.trim();
        }

        // Handle element nodes
        if (xmlNode.nodeType === 1) {
            const element = xmlNode as Element;
            let obj: any = {};

            // Attributes
            if (element.attributes.length > 0) {
                obj["@attributes"] = {};
                for (let i = 0; i < element.attributes.length; i++) {
                    const attr = element.attributes[i];
                    obj["@attributes"][attr.name] = attr.value;
                }
            }

            // Child nodes
            if (element.hasChildNodes()) {
                const childNodes = Array.from(element.childNodes);
                
                if (childNodes.length === 1 && childNodes[0].nodeType === 3 && childNodes[0].nodeValue?.trim()) {
                    obj['#text'] = childNodes[0].nodeValue.trim();
                } else {
                     childNodes.forEach(child => {
                        const childResult = xmlToJsonRecursive(child);
                        const nodeName = child.nodeName;

                        if (!childResult || nodeName === '#comment') return;

                        if (obj[nodeName] === undefined) {
                            obj[nodeName] = childResult;
                        } else {
                            if (!Array.isArray(obj[nodeName])) {
                                obj[nodeName] = [obj[nodeName]];
                            }
                            obj[nodeName].push(childResult);
                        }
                    });
                }
            }
            
            const keys = Object.keys(obj);
            if (keys.length === 1 && keys[0] === '#text') {
                return obj['#text'];
            }
            
            return obj;
        }

        return null; // Ignore comments, processing instructions, etc.
    };
    
    return {
        [doc.documentElement.nodeName]: xmlToJsonRecursive(doc.documentElement)
    };
};

/**
 * Converts an HTML string into a structured JSON object.
 */
export const convertHtmlToJson = (htmlString: string): object => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const elementToJson = (element: Element): any => {
        // Special handling for tables
        if (element.tagName.toLowerCase() === 'table') {
            const headers = Array.from(element.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
            const rows = Array.from(element.querySelectorAll('tbody tr'));
            return rows.map(row => {
                const rowObj: {[key: string]: string} = {};
                Array.from(row.querySelectorAll('td')).forEach((td, index) => {
                    rowObj[headers[index] || `column_${index+1}`] = td.textContent?.trim() || '';
                });
                return rowObj;
            });
        }
        // Special handling for lists
        if (element.tagName.toLowerCase() === 'ul' || element.tagName.toLowerCase() === 'ol') {
            return Array.from(element.querySelectorAll('li')).map(li => li.textContent?.trim() || '');
        }

        const obj: { [key: string]: any } = {
            tag: element.tagName.toLowerCase(),
        };

        // Handle attributes
        if (element.attributes.length > 0) {
            obj.attributes = {};
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                obj.attributes[attr.name] = attr.value;
            }
        }

        // Handle children
        const children: any[] = [];
        element.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                children.push(elementToJson(child as Element));
            } else if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent?.trim();
                if (text) {
                    children.push(text);
                }
            }
        });

        if (children.length > 0) {
            if (children.length === 1 && typeof children[0] === 'string') {
                obj.text = children[0];
            } else {
                obj.children = children;
            }
        }

        return obj;
    };
    
    // Process only children of the body tag
    const bodyChildren = Array.from(doc.body.children);
    if (bodyChildren.length === 1) {
        return elementToJson(bodyChildren[0]);
    }

    return bodyChildren.map(elementToJson);
};


/**
 * Converts a CSV string into a JSON array of objects.
 */
export const convertCsvToJson = (csvString: string): object[] => {
    const lines = csvString.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    if (lines.length === 1 && lines[0] === '') return [];


    // Advanced CSV parsing to handle quoted fields with commas
    const parseCsvRow = (row: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                if (inQuotes && row[i + 1] === '"') {
                    current += '"';
                    i++; // Skip the second quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const headers = parseCsvRow(lines[0]);
    const jsonData = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue; // Skip empty lines
        const values = parseCsvRow(lines[i]);
        if (values.length > 0) {
            const obj: { [key: string]: string } = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = values[j] || '';
            }
            jsonData.push(obj);
        }
    }

    return jsonData;
};

// --- New functions for Convert to HTML ---

export { convertJsonToHtml }; // Re-export for consistency

export const convertCsvToHtml = async (csvString: string): Promise<string> => {
    const jsonData = convertCsvToJson(csvString);
    // Reuse the JSON to HTML converter which is excellent at handling arrays of objects
    return await convertJsonToHtml(jsonData);
};

export const convertXmlToHtml = async (xmlString: string): Promise<string> => {
    const jsonData = convertXmlToJson(xmlString);
    return await convertJsonToHtml(jsonData);
};


// --- New functions for Convert to XML ---
export const convertJsonToXml = toXml;

export const convertCsvToXml = (csvString: string): string => {
    const jsonData = convertCsvToJson(csvString);
    return toXml({ row: jsonData }); // Wrap array in a root object
};

// --- New functions for Convert to Python ---
export const convertJsonToPython = (jsonObj: any): string => {
  return `data = ${toPython(jsonObj)}`;
};

export const convertCsvToPython = (csvString: string): string => {
  const jsonData = convertCsvToJson(csvString);
  return convertJsonToPython(jsonData);
};

export const convertXmlToPython = (xmlString: string): string => {
  const jsonData = convertXmlToJson(xmlString);
  return convertJsonToPython(jsonData);
};

// --- New functions for Convert to JavaScript ---
export const convertJsonToJs = (jsonObj: any): string => {
  return `const data = ${JSON.stringify(jsonObj, null, 2)};`;
};

export const convertXmlToJs = (xmlString: string): string => {
  const jsonData = convertXmlToJson(xmlString);
  return convertJsonToJs(jsonData);
};

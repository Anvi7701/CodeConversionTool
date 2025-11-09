import hljs from 'highlight.js';
import * as acorn from 'acorn';

/**
 * Detects the programming language of a code snippet using highlight.js.
 * @param code The code snippet to analyze.
 * @param options A list of possible languages to consider.
 * @returns The detected language as a string, or null if not confidently detected.
 */
export const detectLanguageLocally = (code: string, options: readonly string[]): string | null => {
    if (!code || code.trim().length < 20) { // Require a bit more text for accuracy
        return null;
    }
    // highlight.js requires language names to be lowercase
    const languageSubset = options.map(o => o.toLowerCase());
    const result = hljs.highlightAuto(code, languageSubset);

    // Be a bit strict with relevance to avoid false positives on short snippets
    if (result.language && result.relevance > 5 && languageSubset.includes(result.language)) {
         // Return the original casing from the options
        return options.find(o => o.toLowerCase() === result.language) || null;
    }
    return null;
};

/**
 * Validates the syntax of a code snippet for supported languages (JSON, XML, JavaScript) locally.
 * @param code The code snippet to validate.
 * @param language The programming language.
 * @returns A validation result object or null if the language is not supported for local validation.
 */
export const validateSyntaxLocally = (code: string, language: string): { isValid: boolean; reason: string; isFixableSyntaxError: boolean; } | null => {
    switch (language.toLowerCase()) {
        case 'json':
            try {
                JSON.parse(code);
                return { isValid: true, reason: 'Valid JSON syntax.', isFixableSyntaxError: false };
            } catch (e: any) {
                return { isValid: false, reason: e.message, isFixableSyntaxError: true };
            }
        case 'wsdl':
        case 'soap':
        case 'xml':
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(code, "application/xml");
                const errorNode = doc.querySelector('parsererror');
                if (errorNode) {
                    // Extract a cleaner error message if possible
                    const errorMessage = errorNode.textContent?.split('\n')[1] || "Invalid XML syntax.";
                    throw new Error(errorMessage);
                }
                return { isValid: true, reason: 'Valid XML syntax.', isFixableSyntaxError: false };
            } catch (e: any) {
                return { isValid: false, reason: e.message, isFixableSyntaxError: true };
            }
        case 'javascript':
            try {
                acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
                return { isValid: true, reason: 'Valid JavaScript syntax.', isFixableSyntaxError: false };
            } catch (e: any) {
                 // Make the error message more user-friendly
                const message = e.message.replace(/\s\(\d+:\d+\)$/, '');
                return { isValid: false, reason: `SyntaxError: ${message}.`, isFixableSyntaxError: true };
            }
        // These languages are permissive and can be validated by attempting to format them.
        // Returning a success-like object allows the validation step to pass and the formatter to try.
        case 'css':
        case 'yaml':
             try {
                // A simple check for non-empty content for these types
                if (code.trim()) {
                    return { isValid: true, reason: 'Code appears valid. Ready to format.', isFixableSyntaxError: false };
                }
                throw new Error("Input is empty.");
            } catch (e: any) {
                return { isValid: false, reason: e.message, isFixableSyntaxError: false };
            }
        case 'csv':
            return { isValid: true, reason: 'Validation skipped for this format.', isFixableSyntaxError: false };

        default:
            return null; // Fallback to Gemini API for other languages (e.g., HTML, Java)
    }
};

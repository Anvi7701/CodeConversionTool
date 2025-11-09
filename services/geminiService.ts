// Fix: Updated import to use the correct '@google/genai' package and add GenerateContentResponse type.
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { formatXml } from "../utils/formatters";

// Fix: Correctly initialize GoogleGenAI with a named `apiKey` parameter.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('API key is missing. Please set VITE_GEMINI_API_KEY in .env');
}
const ai = new GoogleGenAI({ apiKey });
// Fix: Replaced deprecated 'gemini-1.5-flash-latest' model with 'gemini-2.5-flash'.
const model = "gemini-2.5-flash";


/**
 * A helper function to handle API calls with timeouts and more specific error messages.
 * @param action The async function that makes the API call.
 * @returns The result of the action.
 */
const handleApiCall = async <T>(action: () => Promise<T>): Promise<T> => {
    const timeoutPromise = new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("The AI request timed out after 30 seconds. Please try again.")), 30000)
    );

    try {
        return await Promise.race([action(), timeoutPromise]);
    } catch (error: any) {
        console.error("Gemini API Error:", error);

        let detailedMessage = '';
        if (typeof error === 'string') {
            detailedMessage = error;
        } else if (error instanceof Error) {
            detailedMessage = error.message;
        } else {
            try {
                detailedMessage = JSON.stringify(error);
            } catch {
                detailedMessage = 'An unknown error object was received.';
            }
        }
        
        if (detailedMessage.includes("429") || detailedMessage.includes("RESOURCE_EXHAUSTED")) {
            throw new Error("API rate limit exceeded. Please wait a moment and try again.");
        }
        
        if (detailedMessage.includes("500") || detailedMessage.includes("Internal Server Error")) {
            throw new Error("The AI service is currently experiencing issues (Internal Server Error). Please try again later.");
        }

        if (detailedMessage.includes("timed out")) {
             throw new Error(detailedMessage);
        }

        throw new Error(detailedMessage || "An unexpected error occurred with the AI model.");
    }
};

const analyzeConversionError = async (code: string, fromLanguage: string, toLanguage: string, errorMessage: string): Promise<string> => {
    try {
        // Fix: Updated to use ai.models.generateContent and explicitly typed the response.
        const result = await handleApiCall<GenerateContentResponse>(() => ai.models.generateContent({
            model,
            contents: `You are an expert debugging assistant. A user's code conversion from ${fromLanguage} to ${toLanguage} failed. Your task is to analyze their source code and the error to provide a helpful explanation.

            **Original Error:**
            \`\`\`
            ${errorMessage}
            \`\`\`

            **User's Source Code (${fromLanguage}):**
            \`\`\`${fromLanguage.toLowerCase()}
            ${code}
            \`\`\`

            **Instructions:**
            1. Briefly summarize what the user's code appears to be doing.
            2. Based on the code and the error, explain the most likely reason the conversion failed in simple terms. (e.g., "The AI may have struggled with a complex library.", "The input code might be incomplete or have a syntax error.", "The AI returned a malformed or incomplete response.").
            3. Provide 1-2 actionable suggestions for the user to try. (e.g., "Try simplifying the code to only include the main logic.", "Ensure the code is complete and runnable.").

            **Output Format:**
            Return a markdown-formatted string with the following sections:
            ### Code Summary
            ...
            ### Potential Reason for Failure
            ...
            ### Suggestions
            ...
            `}));
        // Fix: Use direct `.text` accessor instead of the deprecated `.response.text()`.
        return result.text;
    } catch (analysisError: any) {
        console.error("Error during error analysis:", analysisError);
        return `The conversion from ${fromLanguage} to ${toLanguage} failed with the following error:\n\n${errorMessage}\n\nAdditionally, the AI assistant was unable to analyze the error. Please check your input code for completeness and syntax errors.`;
    }
};


export const generateSingleExplanation = async (path: string, value: any): Promise<string> => {
    return handleApiCall(async () => {
        const stringValue = JSON.stringify(value);
        const truncatedValue = stringValue.length > 500 ? stringValue.substring(0, 500) + '...' : stringValue;

        // Fix: Updated to use ai.models.generateContent with 'contents' and 'config'.
        const result = await ai.models.generateContent({
            model,
            contents: `You are an expert software developer explaining a JSON key to a non-technical person. Your task is to provide a simple, concise, one-sentence explanation for the key's purpose.
            
            Analyze the JSON key path and its associated value. Focus on the *purpose* of the key. Keep the explanation to a single sentence.

            **JSON Details:**
            - Key Path: "${path}"
            - Value (potentially truncated): ${truncatedValue}`,
            // Fix: Replaced `generationConfig` with `config`.
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: {
                            type: Type.STRING,
                            description: "A single sentence explaining the key's purpose."
                        }
                    },
                    required: ["explanation"]
                }
            }
        });

        // Fix: Use direct `.text` accessor.
        const resultJson = JSON.parse(result.text);
        return resultJson.explanation;
    });
};

export const generateSummary = async (jsonData: object): Promise<string> => {
    return handleApiCall(async () => {
        const jsonString = JSON.stringify(jsonData);
        const truncatedJson = jsonString.length > 15000 ? jsonString.substring(0, 15000) + '...' : jsonString;

        // Fix: Updated to use ai.models.generateContent with 'contents' and 'config'.
        const result = await ai.models.generateContent({
            model,
            contents: `You are an expert data analyst explaining a JSON file to a non-technical manager.
    
            **Instructions:**
            1. Analyze the provided JSON data.
            2. Provide a high-level, one-paragraph summary in simple English of what this JSON data represents.
            3. Focus on its main purpose, answering the question: "What is this data for?"

            **JSON data to summarize (potentially truncated):**
            \`\`\`json
            ${truncatedJson}
            \`\`\``,
            // Fix: Replaced `generationConfig` with `config`.
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: "A high-level, one-paragraph summary of the JSON data."
                        }
                    },
                    required: ["summary"]
                }
            }
        });

        const resultJson = JSON.parse(result.text);
        return resultJson.summary;
    });
};

export const correctCodeSyntax = async (code: string, language: string): Promise<string> => {
    const truncatedCode = code.length > 15000 ? code.substring(0, 15000) : code;
    return handleApiCall(async () => {
        // Fix: Updated to use ai.models.generateContent with 'contents'.
        const result = await ai.models.generateContent({
            model,
            contents: `You are an expert programmer and syntax linter. Your task is to fix syntax errors in the provided code snippet for the specified language and return only the corrected code.

            **Instructions:**
            1. Analyze the provided code snippet for ${language} syntax errors.
            2. Fix only the syntax issues. Do not change the logic, variable names, or data structures.
            3. Return only the raw, corrected code snippet. Do not include explanations, apologies, or markdown formatting.

            **Language:** ${language}
            **Code with Errors:**
            \`\`\`${language.toLowerCase()}
            ${truncatedCode}
            \`\`\``,
        });
        
        // Fix: Use direct `.text` accessor.
        return result.text.trim().replace(/^```(?:\w+\n)?|```$/g, '');
    });
};

export const formatCodeWithAi = async (code: string, language: string): Promise<string> => {
    const truncatedCode = code.length > 15000 ? code.substring(0, 15000) : code;
    return handleApiCall(async () => {
        const result = await ai.models.generateContent({
            model,
            contents: `You are an expert code formatter following standard style guides. Your task is to format the provided code snippet for the specified language and return only the corrected, formatted code. If the code has minor syntax errors (like unclosed tags), fix them before formatting.

            **Instructions:**
            1. Analyze the provided code snippet for ${language}.
            2. Fix any minor syntax errors you find.
            3. Apply standard formatting conventions including indentation, spacing, and line breaks to improve readability.
            4. Do not change the logic, variable names, or data structures. Only apply formatting and syntax correction.
            5. Return only the raw, formatted code snippet. Do not include explanations, apologies, or markdown formatting like \`\`\`.

            **Language:** ${language}
            **Code to Format:**
            \`\`\`${language.toLowerCase()}
            ${truncatedCode}
            \`\`\``,
        });
        
        return result.text.trim().replace(/^```(?:\w+\n)?|```$/g, '');
    });
};

const getAiPromptForConversion = (fromLanguage: string, toLanguage: string): string => {
    const baseInstruction = `You are an expert polyglot programmer specializing in semantic code translation. Your primary goal is to translate the LOGIC and FUNCTIONALITY of a program from a source language to a target language.
    CRITICAL INSTRUCTION: Do NOT simply extract data structures. You must translate the entire program's behavior, including loops, conditionals, function calls, and algorithms.
    The output must be only the raw code for the target language.`;

    const specializedPrompts: { [key: string]: string } = {
        'json': `You are an expert code analyst. Your task is to represent the code's LOGICAL STRUCTURE as a JSON object.
        CRITICAL INSTRUCTION: Do NOT simply execute the code. You must create a semantic representation of the source program's structure and logic.
        - Represent programming constructs (functions, loops, conditionals, variable declarations, etc.) as nested JSON objects.
        - Each object should have a "type" key (e.g., "function", "loop", "if").
        - Include relevant details as other keys (e.g., "name" for a function, "condition" for an if statement).
        - Nest these objects to match the program's structure.`,
        
        'html': `You are an expert data visualizer. Your task is to analyze a code snippet, identify the primary data structure it contains or produces, and generate a complete, styled HTML document to **visually represent that data**.
        If the data is a list of objects, create an HTML \`<table>\`. If it's a list of simple values, create a \`<ul>\`. If it's a single object, create a \`<dl>\`.
        The output must be a full HTML document, including CSS in a \`<style>\` tag for a clean, professional presentation.`,

        'xml': `You are an expert code analyst. Your task is to represent the code's LOGICAL STRUCTURE as an XML document.
        CRITICAL INSTRUCTION: Do NOT simply execute the code. You must create a semantic representation of the source program's structure and logic.
        - Represent function definitions with a \`<function name="...">\` tag.
        - Represent loops (for, while) with a \`<loop type="...">\` tag.
        - Represent conditional statements (if/else) with an \`<if condition="...">\` tag.
        - Represent variable declarations with a \`<declare var="...">\` tag.
        - Nest these tags to match the program's structure.`
    };

    return specializedPrompts[toLanguage.toLowerCase()] || baseInstruction;
};


const convertCodeWithAi = async (code: string, fromLanguage: string, toLanguage: string): Promise<string> => {
     try {
        const truncatedCode = code.length > 15000 ? code.substring(0, 15000) : code;
        const instruction = getAiPromptForConversion(fromLanguage, toLanguage);
        const prompt = `${instruction}
        **Source Language:** ${fromLanguage}
        **Target Language:** ${toLanguage}
        **Source Code Snippet:** \`\`\`${fromLanguage.toLowerCase()}\n${truncatedCode}\n\`\`\``;
        
        // Fix: Updated to use ai.models.generateContent, explicitly typed the response, and passed contents correctly.
        const result = await handleApiCall<GenerateContentResponse>(() => ai.models.generateContent({ model, contents: prompt }));
        
        // Fix: Use direct `.text` accessor.
        let resultString = result.text.trim().replace(/^```(?:\w+\n)?|```$/g, '');

        if (toLanguage.toLowerCase() === 'json') {
            try {
                JSON.parse(resultString); // Final validation
            } catch {
                 throw new Error("The AI returned an invalid JSON string.");
            }
        }
        if (toLanguage.toLowerCase() === 'xml') {
            resultString = await formatXml(resultString);
        }

        return resultString;
    } catch (error: any) {
        console.error(`Conversion from ${fromLanguage} to ${toLanguage} failed. Analyzing error...`, error);
        const errorMessage = error.message || '';
        if (errorMessage.includes("timed out") || errorMessage.includes("Internal Server Error") || errorMessage.includes("rate limit")) {
            throw error;
        }
        
        const analysis = await analyzeConversionError(code, fromLanguage, toLanguage, errorMessage);
        throw new Error(analysis);
    }
};

export const convertCodeToPython = (code: string, language: string): Promise<string> => {
    return convertCodeWithAi(code, language, 'Python');
};

export const convertCodeToJs = (code: string, language: string): Promise<string> => {
    return convertCodeWithAi(code, language, 'JavaScript');
};

export const convertCodeToJson = (code: string, language: string): Promise<string> => {
    return convertCodeWithAi(code, language, 'JSON');
};

export const convertCodeToXml = (code: string, language: string): Promise<string> => {
    return convertCodeWithAi(code, language, 'XML');
};

export const convertCodeToHtml = (code: string, language: string): Promise<string> => {
    return convertCodeWithAi(code, language, 'HTML');
};

export const validateCodeSyntax = async (code: string, language: string): Promise<{ isValid: boolean; reason: string; isFixableSyntaxError: boolean; suggestedLanguage?: string }> => {
    const truncatedCode = code.length > 15000 ? code.substring(0, 15000) : code;
    return handleApiCall(async () => {
        // Fix: Updated to use ai.models.generateContent with 'contents' and 'config'.
        const result = await ai.models.generateContent({
            model,
            contents: `You are an expert syntax validator. Your task is to analyze a code snippet and determine if it is valid syntax for a specific programming language, and if not, whether the error is a simple fixable syntax error.

            **Instructions:**
            1. Analyze the provided code snippet for the **${language}** language.
            2. Determine if it is syntactically valid.
            3. If it is NOT valid, determine if the problem is a **simple, fixable syntax error** (e.g., missing comma, mismatched bracket, unclosed string) versus a **fundamental structural problem** (e.g., the code is a URL, it's a completely different language, it's just plain text).
            4. If it's not valid ${language}, briefly suggest what the language might be if it's obvious.
            5. Provide a brief, one-sentence reason for your conclusion.

            **Code Snippet:**
            \`\`\`
            ${truncatedCode}
            \`\`\``,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isValid: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING },
                        isFixableSyntaxError: {
                            type: Type.BOOLEAN,
                            description: "Set to true only if the error is a minor syntax issue that can likely be auto-corrected. Set to false for major structural problems."
                        },
                        suggestedLanguage: { type: Type.STRING }
                    },
                    required: ["isValid", "reason", "isFixableSyntaxError"]
                }
            }
        });
        
        // Fix: Use direct `.text` accessor.
        return JSON.parse(result.text) as { isValid: boolean; reason: string; isFixableSyntaxError: boolean; suggestedLanguage?: string };
    });
};

export const analyzeAndExecuteCode = async (code: string, language: string): Promise<{ executionOutput: string; explanation: string; suggestions: string[] }> => {
    const truncatedCode = code.length > 15000 ? code.substring(0, 15000) : code;
    return handleApiCall(async () => {
        // Fix: Updated to use ai.models.generateContent with 'contents' and 'config'.
        const result = await ai.models.generateContent({
            model,
            contents: `You are an expert code analyst and execution engine. Analyze the following ${language} code snippet.

            **Code Snippet:**
            \`\`\`${language.toLowerCase()}
            ${truncatedCode}
            \`\`\`

            **Instructions:**
            1.  **Predict Execution Output:** Predict what this code would print to the console or output if executed. If it produces no direct output (e.g., just defines a variable), state that.
            2.  **Explain the Code:** Briefly explain what this code does, its purpose, and its logic.
            3.  **Provide Suggestions:** Offer 2-3 actionable suggestions for improving the code. Focus on best practices, performance, or readability.

            Return your analysis as a JSON object.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        executionOutput: {
                            type: Type.STRING,
                            description: "The predicted output of the code upon execution."
                        },
                        explanation: {
                            type: Type.STRING,
                            description: "A clear explanation of the code's functionality."
                        },
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "An actionable suggestion for improvement."
                            },
                            description: "A list of suggestions to improve the code."
                        }
                    },
                    required: ["executionOutput", "explanation", "suggestions"]
                }
            }
        });

        // Fix: Use direct `.text` accessor.
        const resultJson = JSON.parse(result.text);
        return resultJson as { executionOutput: string; explanation: string; suggestions: string[] };
    });
};

export const analyzeHtmlCode = async (htmlCode: string): Promise<{ explanation: string; suggestions: string[] }> => {
    // Fix: Corrected typo 'code' to 'htmlCode' and simplified the redundant ternary expression.
    const truncatedCode = htmlCode.length > 15000 ? htmlCode.substring(0, 15000) : htmlCode;
    return handleApiCall(async () => {
        // Fix: Updated to use ai.models.generateContent with 'contents' and 'config'.
        const result = await ai.models.generateContent({
            model,
            contents: `You are an expert web developer and accessibility specialist. Analyze the following HTML code.

            **HTML Snippet:**
            \`\`\`html
            ${truncatedCode}
            \`\`\`

            **Instructions:**
            1.  **Explain the Structure:** Briefly explain the structure of this HTML document and what it represents visually.
            2.  **Provide Suggestions:** Offer 2-3 actionable suggestions for improving the HTML. Focus on semantics, accessibility (e.g., ARIA roles, alt text), or best practices.

            Return your analysis as a JSON object. Note that this is not an executable program, so there is no 'executionOutput'.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: {
                            type: Type.STRING,
                            description: "A clear explanation of the HTML's structure and purpose."
                        },
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "An actionable suggestion for improvement."
                            },
                            description: "A list of suggestions to improve the HTML."
                        }
                    },
                    required: ["explanation", "suggestions"]
                }
            }
        });

        // Fix: Use direct `.text` accessor.
        const resultJson = JSON.parse(result.text);
        return resultJson as { explanation: string; suggestions: string[] };
    });
};

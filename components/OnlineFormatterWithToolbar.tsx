import React, { useState, useRef, useMemo } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { SpinnerIcon, XmlIcon, CodeBracketIcon, UploadIcon, HtmlIcon, CssIcon, FormatIcon, JavascriptIcon, YamlIcon, TypeScriptIcon, AngularIcon, JavaIcon, GraphQLIcon, CheckIcon } from './icons';
import { beautifyAngular, beautifyCss, beautifyGraphql, beautifyJs, beautifyTs, beautifyYaml, formatXml } from '../utils/formatters';
import { beautifyJava } from '../utils/codeGenerator';
import { CodeViewer } from './CodeViewer';
import { ErrorAnalysisDisplay } from './ErrorAnalysisDisplay';
import { validateCodeSyntax, correctCodeSyntax, formatCodeWithAi } from '../services/geminiService';
import { validateSyntaxLocally } from '../utils/localAnalyzers';
import { AutoCorrectionLoading } from './AutoCorrectionLoading';
import { FormattingLoading } from './FormattingLoading';
import { ValidationLoading } from './ValidationLoading';
import { JsonToolbar } from './JsonToolbar';
import { GraphViewer } from './GraphViewer';
import { convertJsonToGraphData } from '../utils/graphUtils';
import type { Selection } from '../types';

type Language = 'json' | 'xml' | 'html' | 'css' | 'javascript' | 'typescript' | 'yaml' | 'wsdl' | 'soap' | 'angular' | 'java' | 'graphql';
type ValidationResult = { isValid: boolean; reason: string; isFixableSyntaxError: boolean; suggestedLanguage?: string };

const languageDetails: { [key in Language]: { label: string; icon: React.ReactNode; extensions: string[] } } = {
  json: { label: 'JSON', icon: <CodeBracketIcon className="h-5 w-5" />, extensions: ['.json', '.txt'] },
  xml: { label: 'XML', icon: <XmlIcon className="h-5 w-5" />, extensions: ['.xml', '.txt'] },
  html: { label: 'HTML', icon: <HtmlIcon className="h-5 w-5" />, extensions: ['.html', '.htm', '.txt'] },
  css: { label: 'CSS', icon: <CssIcon className="h-5 w-5" />, extensions: ['.css', '.txt'] },
  javascript: { label: 'JavaScript', icon: <JavascriptIcon className="h-5 w-5" />, extensions: ['.js', '.txt'] },
  typescript: { label: 'TypeScript', icon: <TypeScriptIcon className="h-5 w-5" />, extensions: ['.ts', '.tsx', '.txt'] },
  yaml: { label: 'YAML', icon: <YamlIcon className="h-5 w-5" />, extensions: ['.yaml', '.yml', '.txt'] },
  wsdl: { label: 'WSDL', icon: <XmlIcon className="h-5 w-5" />, extensions: ['.wsdl', '.xml', '.txt'] },
  soap: { label: 'SOAP', icon: <XmlIcon className="h-5 w-5" />, extensions: ['.xml', '.soap', '.txt'] },
  angular: { label: 'Angular', icon: <AngularIcon className="h-5 w-5" />, extensions: ['.html', '.txt'] },
  java: { label: 'Java', icon: <JavaIcon className="h-5 w-5" />, extensions: ['.java', '.txt'] },
  graphql: { label: 'GraphQL', icon: <GraphQLIcon className="h-5 w-5" />, extensions: ['.graphql', '.gql', '.txt'] },
};

interface OnlineFormatterWithToolbarProps {
  initialLanguage?: Language;
}

export const OnlineFormatterWithToolbar: React.FC<OnlineFormatterWithToolbarProps> = ({ initialLanguage = 'json' }) => {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<Language>(initialLanguage);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History for undo/redo (only for JSON)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Graph viewer state
  const [showGraph, setShowGraph] = useState(false);
  const [graphCollapsedNodes, setGraphCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNodePath, setSelectedNodePath] = useState<string>('');

  const resetState = (keepInput = false) => {
    if (!keepInput) setInputCode('');
    setOutputError(null);
    setOutputCode(null);
    setValidationError(null);
    setSuccessMessage(null);
    setIsValidated(false);
  };
  
  const handleLanguageChange = (lang: Language) => {
    setActiveLanguage(lang);
    resetState();
  };

  const handleInputChange = (value: string) => {
    setInputCode(value);
    setOutputError(null);
    setOutputCode(null);
    setValidationError(null);
    setSuccessMessage(null);
    setIsValidated(false);
  };

  // Add to history
  const addToHistory = (value: string) => {
    if (activeLanguage === 'json') {
      const newHistory = [...history.slice(0, historyIndex + 1), value];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };
  
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (typeof text === 'string') {
        handleInputChange(text);
      } else {
        setOutputError('Failed to read file content.');
      }
    };
    reader.onerror = () => {
      setOutputError('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const exts = languageDetails[activeLanguage].extensions;
      
      const fileNameLower = file.name.toLowerCase();
      const lastDotIndex = fileNameLower.lastIndexOf('.');
      const fileExtension = lastDotIndex === -1 ? '' : fileNameLower.substring(lastDotIndex);

      if (!exts.includes(fileExtension)) {
        setOutputError(`Invalid file type for ${activeLanguage.toUpperCase()}. Expected ${exts.join(', ')}.`);
        if (e.target) e.target.value = '';
        return;
      }
      processFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleValidate = async () => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput) {
      setValidationError({ isValid: false, reason: "Input is empty. Please paste or upload some code.", isFixableSyntaxError: false, suggestedLanguage: undefined });
      return;
    }

    setIsValidating(true);
    resetState(true);

    try {
      const localResult = validateSyntaxLocally(trimmedInput, activeLanguage);
      if (localResult) {
        if (localResult.isValid) {
          setSuccessMessage(localResult.reason);
          setIsValidated(true);
        } else {
          setValidationError({ ...localResult, suggestedLanguage: undefined });
        }
        setIsValidating(false);
        return;
      }

      const result = await validateCodeSyntax(trimmedInput, activeLanguage);
      if (result.isValid) {
        setSuccessMessage("Validation successful! You can now format the code.");
        setIsValidated(true);
      } else {
        setValidationError(result);
      }
    } catch (err: any) {
        setValidationError({
            isValid: false,
            reason: `The validator encountered an issue. Please check the syntax of your ${activeLanguage} code.\n\nDetails: ${err.message}`,
            isFixableSyntaxError: true,
            suggestedLanguage: undefined
        });
    } finally {
      setIsValidating(false);
    }
  };

  const handleAutoCorrect = async () => {
    if (!inputCode) return;
    setIsCorrecting(true);
    setValidationError(null);
    setOutputError(null);
    try {
        const correctedCode = await correctCodeSyntax(inputCode, activeLanguage);
        setInputCode(correctedCode);
        addToHistory(correctedCode);
        setIsValidated(true);
        setSuccessMessage("AI successfully corrected the syntax. You can now format the code.");
    } catch (err: any) {
        setOutputError(err.message || "AI auto-correction failed.");
        setIsValidated(false);
    } finally {
        setIsCorrecting(false);
    }
  };

  const handleFormat = async (indentSize: number = 2) => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput) {
      return;
    }
    
    setIsLoading(true);
    setOutputError(null);
    setValidationError(null);
    setSuccessMessage(null);
    setOutputCode(null);

    try {
      let formattedCode = '';
      const indentChar = indentSize === 0 ? '\t' : ' '.repeat(indentSize);
      
      switch (activeLanguage) {
        case 'json':
          const jsonObj = JSON.parse(trimmedInput);
          formattedCode = JSON.stringify(jsonObj, null, indentChar);
          addToHistory(formattedCode);
          break;
        case 'xml':
        case 'wsdl':
        case 'soap':
          formattedCode = await formatXml(trimmedInput);
          break;
        case 'html':
          formattedCode = await formatCodeWithAi(trimmedInput, 'html');
          break;
        case 'css':
          formattedCode = await beautifyCss(trimmedInput);
          break;
        case 'javascript':
          formattedCode = await beautifyJs(trimmedInput);
          break;
        case 'typescript':
          formattedCode = await beautifyTs(trimmedInput);
          break;
        case 'yaml':
          formattedCode = await beautifyYaml(trimmedInput);
          break;
        case 'angular':
          formattedCode = await beautifyAngular(trimmedInput);
          break;
        case 'java':
          formattedCode = await beautifyJava(trimmedInput);
          break;
        case 'graphql':
          formattedCode = await beautifyGraphql(trimmedInput);
          break;
      }
      setOutputCode(formattedCode);
    } catch (err: any) {
      setValidationError({
          isValid: false,
          reason: `Formatting failed. This is likely due to a syntax error in your code. Please check your input or use the 'Validate' button.\n\nDetails: ${err.message}`,
          isFixableSyntaxError: true,
          suggestedLanguage: undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMinify = () => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput || activeLanguage !== 'json') return;

    try {
      const jsonObj = JSON.parse(trimmedInput);
      const minified = JSON.stringify(jsonObj);
      setOutputCode(minified);
      addToHistory(minified);
      setValidationError(null);
      setOutputError(null);
    } catch (err: any) {
      setValidationError({
        isValid: false,
        reason: `Minify failed: ${err.message}`,
        isFixableSyntaxError: true,
        suggestedLanguage: undefined
      });
    }
  };

  const handleSort = (direction: 'asc' | 'desc', sortBy: 'keys' | 'values') => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput || activeLanguage !== 'json') return;

    try {
      const parsed = JSON.parse(trimmedInput);
      
      const sortObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(sortObject);
        }
        
        if (obj !== null && typeof obj === 'object') {
          const entries = Object.entries(obj);
          
          if (sortBy === 'keys') {
            entries.sort(([keyA], [keyB]) => {
              return direction === 'asc' 
                ? keyA.localeCompare(keyB)
                : keyB.localeCompare(keyA);
            });
          } else {
            entries.sort(([, valA], [, valB]) => {
              const strA = String(valA);
              const strB = String(valB);
              return direction === 'asc'
                ? strA.localeCompare(strB)
                : strB.localeCompare(strA);
            });
          }
          
          return Object.fromEntries(
            entries.map(([key, val]) => [key, sortObject(val)])
          );
        }
        
        return obj;
      };
      
      const sorted = sortObject(parsed);
      const formatted = JSON.stringify(sorted, null, 2);
      setOutputCode(formatted);
      addToHistory(formatted);
      setValidationError(null);
      setOutputError(null);
    } catch (err: any) {
      setValidationError({
        isValid: false,
        reason: `Sort failed: ${err.message}`,
        isFixableSyntaxError: true,
        suggestedLanguage: undefined
      });
    }
  };

  const handleRepair = () => {
    if (!inputCode || activeLanguage !== 'json') return;
    
    let repaired = inputCode;
    
    // Remove comments
    repaired = repaired.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    
    // Fix single quotes to double quotes
    repaired = repaired.replace(/'/g, '"');
    
    // Remove trailing commas
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // Add missing quotes to keys
    repaired = repaired.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    try {
      const parsed = JSON.parse(repaired);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutputCode(formatted);
      setInputCode(formatted);
      addToHistory(formatted);
      setValidationError(null);
      setOutputError(null);
      setSuccessMessage("JSON repaired successfully!");
    } catch (err: any) {
      setValidationError({
        isValid: false,
        reason: `Could not repair JSON: ${err.message}`,
        isFixableSyntaxError: true,
        suggestedLanguage: undefined
      });
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0 && activeLanguage === 'json') {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousCode = history[newIndex];
      setInputCode(previousCode);
      setOutputCode(previousCode);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && activeLanguage === 'json') {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextCode = history[newIndex];
      setInputCode(nextCode);
      setOutputCode(nextCode);
    }
  };

  const handleCopy = async () => {
    try {
      const textToCopy = outputCode || inputCode;
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleClear = () => {
    resetState();
    setHistory([]);
    setHistoryIndex(-1);
  };

  const handleSave = () => {
    const content = outputCode || inputCode;
    if (!content) return;

    const ext = activeLanguage === 'typescript' ? 'ts' : activeLanguage === 'javascript' ? 'js' : activeLanguage;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const content = outputCode || inputCode;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Print ${activeLanguage.toUpperCase()}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 8px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h2>${activeLanguage.toUpperCase()} Document</h2>
          <pre>${content}</pre>
          <script>window.print(); window.close();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const isActionDisabled = isLoading || isValidating || isCorrecting;
  const isJsonLanguage = activeLanguage === 'json';
  const canUndo = historyIndex > 0 && isJsonLanguage;
  const canRedo = historyIndex < history.length - 1 && isJsonLanguage;

  // Parse JSON and convert to graph data (only when showing graph)
  const parsedJson = useMemo(() => {
    if (!isJsonLanguage || !inputCode.trim()) return null;
    try {
      return JSON.parse(inputCode);
    } catch {
      return null;
    }
  }, [inputCode, isJsonLanguage]);

  const graphData = useMemo(() => {
    if (!parsedJson || !showGraph) return null;
    try {
      return convertJsonToGraphData(parsedJson, graphCollapsedNodes);
    } catch (error) {
      console.error('Failed to convert JSON to graph:', error);
      return null;
    }
  }, [parsedJson, graphCollapsedNodes, showGraph]);

  // Handler for node selection in graph
  const handleNodeSelect = (selection: Selection) => {
    setSelectedNodePath(selection.path);
  };

  // Handler for node toggle in graph
  const handleNodeToggle = (nodeId: string) => {
    setGraphCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Handler to show graph view
  const handleShowGraph = () => {
    if (parsedJson) {
      setShowGraph(true);
      // Start with only 1st level expanded (collapse depth 2+)
      const nodesToCollapse = getDeepNodeIds(parsedJson);
      setGraphCollapsedNodes(new Set(nodesToCollapse));
      setSelectedNodePath('');
    }
    // If no valid JSON, do nothing (button will be disabled via toolbar's disabled prop)
  };

  // Get all node IDs for expand/collapse all
  const getAllNodeIds = (obj: any, parentPath = 'root'): string[] => {
    const ids: string[] = [];
    
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = `${parentPath}.${key}`;
        
        if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
          ids.push(currentPath);
          ids.push(...getAllNodeIds(value, currentPath));
        }
      });
    }
    
    return ids;
  };

  // Get nodes deeper than 1st level (for initial collapse)
  const getDeepNodeIds = (obj: any, parentPath = 'root'): string[] => {
    const ids: string[] = [];
    
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = `${parentPath}.${key}`;
        const depth = currentPath.split('.').length - 1; // Subtract 1 for 'root'
        
        if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
          // Collapse everything beyond 1st level (depth > 1)
          if (depth > 1) {
            ids.push(currentPath);
          }
          // Continue traversing to find deeper nodes
          ids.push(...getDeepNodeIds(value, currentPath));
        }
      });
    }
    
    return ids;
  };

  // Expand all nodes
  const handleExpandAll = () => {
    setGraphCollapsedNodes(new Set());
  };

  // Collapse all nodes
  const handleCollapseAll = () => {
    if (parsedJson) {
      const allIds = getAllNodeIds(parsedJson);
      setGraphCollapsedNodes(new Set(allIds));
    }
  };

  // Sort graph data
  const handleSortGraph = () => {
    if (!parsedJson) return;
    
    const sortObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sortObject);
      }
      
      if (obj !== null && typeof obj === 'object') {
        const sorted = Object.keys(obj)
          .sort()
          .reduce((acc, key) => {
            acc[key] = sortObject(obj[key]);
            return acc;
          }, {} as any);
        return sorted;
      }
      
      return obj;
    };
    
    const sorted = sortObject(parsedJson);
    const formatted = JSON.stringify(sorted, null, 2);
    setInputCode(formatted);
    addToHistory(formatted);
  };
  
  return (
    <>
      <SEO
        title="Online Code Formatter | AI JSON Tools"
        description="Format and beautify code instantly for JSON, XML, HTML, CSS, JavaScript, TypeScript, YAML, Java, and more using AI-powered tools. Validate and auto-correct syntax easily."
        keywords="online code formatter, AI code beautifier, format JSON, format XML, format JavaScript"
        canonical="https://yourdomain.com/online-formatter"
        ogImage="https://yourdomain.com/images/online-formatter.jpg"
        ogUrl="https://yourdomain.com/online-formatter"
      />
      
      <div className="w-full flex flex-col gap-6">
        {/* Language selector and file upload */}
        <div className="flex justify-between items-center bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-4">
            <label htmlFor="language-select" className="text-sm font-medium">Format:</label>
            <select
              id="language-select"
              value={activeLanguage}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="px-3 py-2 text-sm rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-brand-primary focus:border-brand-primary"
            >
              {Object.keys(languageDetails).map(lang => (
                <option key={lang} value={lang}>{languageDetails[lang as Language].label}</option>
              ))}
            </select>
          </div>
          
          <Tooltip content="Upload a code file to input">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isActionDisabled} 
              className="px-4 py-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              <UploadIcon className="h-5 w-5 inline mr-2" />
              Upload File
            </button>
          </Tooltip>
          <input ref={fileInputRef} type="file" accept={languageDetails[activeLanguage].extensions.join(',')} className="hidden" onChange={handleFileChange} />
        </div>

        {/* JSON Toolbar - Only show for JSON */}
        {isJsonLanguage && (
          <JsonToolbar
            onFormat={handleFormat}
            onMinify={handleMinify}
            onSort={handleSort}
            onRepair={handleRepair}
            onUndo={canUndo ? handleUndo : undefined}
            onRedo={canRedo ? handleRedo : undefined}
            onViewGraph={handleShowGraph}
            onValidate={handleValidate}
            onClear={handleClear}
            onCopy={handleCopy}
            onSave={handleSave}
            onPrint={handlePrint}
            canUndo={canUndo}
            canRedo={canRedo}
            hasErrors={!!validationError && !validationError.isValid}
            errorCount={validationError ? 1 : 0}
            disabled={isActionDisabled}
            language={activeLanguage}
          />
        )}

        {/* Copy Success Toast */}
        {copySuccess && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            ✓ Copied to clipboard!
          </div>
        )}

        {/* Editor Area */}
        <div className="w-full flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Input</h2>
              <span className="text-sm text-slate-500">{inputCode.length} characters</span>
            </div>

            <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0">
              <textarea
                value={inputCode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={`Enter your ${activeLanguage.toUpperCase()} code here...`}
                className="w-full h-96 bg-transparent resize-none p-4 border-none focus:outline-none font-mono text-sm"
                spellCheck={false}
              />
            </div>

            {/* Legacy buttons for non-JSON languages */}
            {!isJsonLanguage && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleValidate} disabled={isActionDisabled || !inputCode.trim()} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  Validate
                </button>
                <button onClick={() => handleFormat(2)} disabled={isActionDisabled || !inputCode.trim()} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  Format
                </button>
                <button onClick={() => resetState()} disabled={isActionDisabled} className="px-4 py-2 bg-slate-500 text-white rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
            <h2 className="text-xl font-semibold">Formatted Output</h2>

            <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
              <div className="flex-grow relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                {isLoading ? (
                  <FormattingLoading />
                ) : isValidating ? (
                  <ValidationLoading />
                ) : isCorrecting ? (
                  <AutoCorrectionLoading />
                ) : outputError ? (
                  <div className="h-full flex flex-col items-center justify-center text-red-700 dark:text-red-300 p-4 text-center">
                    <p>{outputError}</p>
                  </div>
                ) : validationError ? (
                  <ErrorAnalysisDisplay
                    title={validationError.reason.includes("Formatting failed") ? "Formatting Failed" : "Validation Failed"}
                    analysisText={validationError.reason}
                    showAutoCorrectButton={!!validationError.isFixableSyntaxError}
                    onAutoCorrect={handleAutoCorrect}
                    isCorrecting={isCorrecting}
                  />
                ) : successMessage ? (
                  <div className="h-full flex flex-col items-center justify-center text-green-700 dark:text-green-300 p-4 text-center">
                    <CheckIcon className="h-10 w-10 mb-4" />
                    <p>{successMessage}</p>
                  </div>
                ) : outputCode ? (
                  <CodeViewer code={outputCode} language={activeLanguage} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                    <FormatIcon className="h-10 w-10 mb-4 text-slate-300 dark:text-slate-600" />
                    <p>Formatted code will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Graph Viewer Modal */}
        {showGraph && graphData && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 9998 }}
            onClick={() => setShowGraph(false)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-xl w-[95vw] h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700"
              style={{ zIndex: 9999 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    JSON Graph View
                  </h2>
                </div>
                
                {/* Control Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExpandAll}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-700 flex items-center gap-2"
                    title="Expand all nodes"
                  >
                    <span>➕</span>
                    <span className="hidden sm:inline">Expand All</span>
                  </button>
                  
                  <button
                    onClick={handleCollapseAll}
                    className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-orange-200 dark:border-orange-700 flex items-center gap-2"
                    title="Collapse all nodes"
                  >
                    <span>➖</span>
                    <span className="hidden sm:inline">Collapse All</span>
                  </button>
                  
                  <button
                    onClick={handleSortGraph}
                    className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-green-200 dark:border-green-700 flex items-center gap-2"
                    title="Sort JSON keys alphabetically"
                  >
                    <span>🔼</span>
                    <span className="hidden sm:inline">Sort</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Force re-render by toggling collapsed state
                      setGraphCollapsedNodes(new Set(graphCollapsedNodes));
                    }}
                    className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors border border-purple-200 dark:border-purple-700 flex items-center gap-2"
                    title="Reset view and center graph"
                  >
                    <span>🎯</span>
                    <span className="hidden sm:inline">Center</span>
                  </button>
                  
                  <div className="w-px h-8 bg-slate-300 dark:bg-slate-600" />
                  
                  <button 
                    onClick={() => setShowGraph(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Close (Esc)"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Graph Viewer */}
              <div className="flex-1 overflow-hidden relative">
                <GraphViewer
                  data={graphData}
                  onSelect={handleNodeSelect}
                  selectedNodePath={selectedNodePath}
                  collapsedNodes={graphCollapsedNodes}
                  onNodeToggle={handleNodeToggle}
                  theme="system"
                />
                
                {/* Color Legend - Compact Bottom Right */}
                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 max-w-[200px]">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1">
                    <span className="text-sm">🎨</span>
                    <span>Legend</span>
                  </h3>
                  
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#0ea5e9] border border-[#0369a1] flex-shrink-0"></div>
                      <span className="text-slate-600 dark:text-slate-300">Objects <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-0.5 rounded">&#123;&#125;</code></span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#10b981] border border-[#047857] flex-shrink-0"></div>
                      <span className="text-slate-600 dark:text-slate-300">Arrays <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-0.5 rounded">[]</code></span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#f59e0b] border border-[#92400e] flex-shrink-0"></div>
                      <span className="text-slate-600 dark:text-slate-300">Strings <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-0.5 rounded">"txt"</code></span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#6366f1] border border-[#3730a3] flex-shrink-0"></div>
                      <span className="text-slate-600 dark:text-slate-300">Numbers <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-0.5 rounded">123</code></span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#a855f7] border border-[#6b21a8] flex-shrink-0"></div>
                      <span className="text-slate-600 dark:text-slate-300">Booleans</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

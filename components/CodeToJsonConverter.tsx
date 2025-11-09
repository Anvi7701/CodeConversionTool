import React, { useState, useRef, useEffect } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { JsonSyntaxHighlighter } from './JsonSyntaxHighlighter';
import { SpinnerIcon, JavascriptIcon, PythonIcon, JavaIcon, XmlIcon, CsvIcon, HtmlIcon, CodeBracketIcon, CheckIcon, YamlIcon, CopyIcon, UploadIcon } from './icons';
import { convertCodeToJson, validateCodeSyntax, correctCodeSyntax } from '../services/geminiService';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { convertHtmlToJson, convertXmlToJson, convertCsvToJson } from '../utils/reverseParser';
import { ErrorAnalysisDisplay } from './ErrorAnalysisDisplay';
import { useLanguageDetector } from '../hooks/useLanguageDetector';
import { LanguageDetectionBanner } from './LanguageDetectionBanner';
import { validateSyntaxLocally } from '../utils/localAnalyzers';
import { AutoCorrectionLoading } from './AutoCorrectionLoading';
import { ValidationLoading } from './ValidationLoading';


type InputLanguage = 'html' | 'csv' | 'xml' | 'javascript' | 'python' | 'java' | 'yaml';
type InputCodeMap = { [key in InputLanguage]?: string };
type ValidationResult = { isValid: boolean; reason: string; isFixableSyntaxError: boolean; suggestedLanguage?: string };

const languageDetails: { [key in InputLanguage]: { label: string; icon: React.ReactNode } } = {
  html: { label: 'HTML', icon: <HtmlIcon className="h-5 w-5" /> },
  csv: { label: 'CSV', icon: <CsvIcon className="h-5 w-5" /> },
  xml: { label: 'XML', icon: <XmlIcon className="h-5 w-5" /> },
  javascript: { label: 'JavaScript', icon: <JavascriptIcon className="h-5 w-5" /> },
  python: { label: 'Python', icon: <PythonIcon className="h-5 w-5" /> },
  java: { label: 'Java', icon: <JavaIcon className="h-5 w-5" /> },
  yaml: { label: 'YAML', icon: <YamlIcon className="h-5 w-5" /> },
};

const allowedExtensions: { [key in InputLanguage]: string[] } = {
    html: ['.html', '.htm', '.txt'],
    csv: ['.csv', '.txt'],
    xml: ['.xml', '.txt'],
    javascript: ['.js', '.txt'],
    python: ['.py', '.txt'],
    java: ['.java', '.txt'],
    yaml: ['.yaml', '.yml', '.txt'],
};

const defaultTabOrder: InputLanguage[] = ['html', 'csv', 'xml', 'javascript', 'python', 'java', 'yaml'];

export const CodeToJsonConverter: React.FC = () => {
  const [inputCodes, setInputCodes] = useState<InputCodeMap>(() => {
     try {
      const stored = localStorage.getItem('codeToJsonInputs');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [activeTab, setActiveTab] = useState<InputLanguage>('html');
  const [outputJson, setOutputJson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [tabOrder, setTabOrder] = useState<InputLanguage[]>(() => {
    try {
        const storedOrder = localStorage.getItem('jsonConverterTabOrder');
        if (storedOrder) {
            const parsedOrder = JSON.parse(storedOrder) as InputLanguage[];
            const validOrder = parsedOrder.filter(t => defaultTabOrder.includes(t));
            const allPresent = defaultTabOrder.every(t => validOrder.includes(t));
            return allPresent ? validOrder : defaultTabOrder;
        }
    } catch (e) { console.error("Failed to parse tab order from localStorage", e); }
    return defaultTabOrder;
  });
  
  const { suggestion, handlePaste, handleSwitch, handleDismiss } = useLanguageDetector({
    activeTab,
    onSwitchTab: (lang) => setActiveTab(lang as InputLanguage),
    languageOptions: defaultTabOrder,
  });

  const debounceTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const currentInput = inputCodes[activeTab] || '';

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newTabOrder = [...tabOrder];
    const draggedItemContent = newTabOrder.splice(dragItem.current, 1)[0];
    newTabOrder.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setTabOrder(newTabOrder);
    localStorage.setItem('jsonConverterTabOrder', JSON.stringify(newTabOrder));
  };
  const getDropIndicatorClass = (index: number) => dragOverItem.current === index ? 'border-r-2 border-brand-primary' : 'border-r-2 border-transparent';

  const resetState = () => {
      setOutputJson(null);
      setOutputError(null);
      setValidationError(null);
      setSuccessMessage(null);
      setIsValidated(false);
      setIsConverted(false);
      setIsCopied(false);
  }

  const handleInputChange = (value: string) => {
      const newInputs = {...inputCodes, [activeTab]: value};
      setInputCodes(newInputs);
      resetState();
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
        localStorage.setItem('codeToJsonInputs', JSON.stringify(newInputs));
      }, 500);
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
        const exts = allowedExtensions[activeTab];
        
        const fileNameLower = file.name.toLowerCase();
        const lastDotIndex = fileNameLower.lastIndexOf('.');
        const fileExtension = lastDotIndex === -1 ? '' : fileNameLower.substring(lastDotIndex);

        if (!exts.includes(fileExtension)) {
            setOutputError(`Invalid file type for ${activeTab.toUpperCase()}. Expected ${exts.join(', ')}.`);
            if (e.target) e.target.value = '';
            return;
        }
        processFile(file);
    }
    if (e.target) e.target.value = ''; // Reset to allow same file upload
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };


  const handleTabClick = (lang: InputLanguage) => {
    setActiveTab(lang);
    resetState();
    handleDismiss();
  };
  
  const handleClear = () => {
    handleInputChange('');
    handleDismiss();
  };

  const handleCopyInput = () => {
    if (!currentInput) return;
    navigator.clipboard.writeText(currentInput).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const handleValidate = async () => {
    if (!currentInput.trim()) {
        setOutputError("Input code cannot be empty.");
        return;
    }
    setIsValidating(true);
    resetState();
    try {
        // First, try local validation for supported languages
        const localResult = validateSyntaxLocally(currentInput, activeTab);
        if (localResult) {
            if (localResult.isValid) {
                setSuccessMessage(localResult.reason);
                setIsValidated(true);
            } else {
                setValidationError({...localResult, suggestedLanguage: undefined});
            }
            setIsValidating(false);
            return;
        }

        // Fallback to Gemini API for other languages
        const result = await validateCodeSyntax(currentInput, activeTab);
        if (result.isValid) {
            setSuccessMessage("Validation successful! You can now click 'Convert'.");
            setIsValidated(true);
        } else {
            setValidationError(result);
        }
    } catch (err: any) {
        setOutputError(`The validator found a syntax error in your ${activeTab} code. Please check your input.\n\nDetails: ${err.message}`);
    } finally {
        setIsValidating(false);
    }
  };

  const handleAutoCorrect = async () => {
    if (!currentInput) return;
    setIsCorrecting(true);
    setValidationError(null);
    setOutputError(null);
    try {
        const correctedCode = await correctCodeSyntax(currentInput, activeTab);
        setInputCodes(prev => ({...prev, [activeTab]: correctedCode}));
        setIsValidated(true);
        setSuccessMessage("AI successfully corrected the syntax. You can now click 'Convert'.");
    } catch (err: any) {
        setOutputError(err.message || "AI auto-correction failed.");
        setIsValidated(false);
    } finally {
        setIsCorrecting(false);
    }
  };

  const handleConvert = async () => {
    if (!isValidated) return;
    setIsLoading(true);
    setOutputError(null);
    setValidationError(null);
    setSuccessMessage(null);
    setOutputJson(null);
    
    try {
      let resultJsonObj: object;

      if (activeTab === 'html') {
        resultJsonObj = convertHtmlToJson(currentInput);
      } else if (activeTab === 'csv') {
        resultJsonObj = convertCsvToJson(currentInput);
      } else if (activeTab === 'xml') {
        resultJsonObj = convertXmlToJson(currentInput);
      } else {
        const jsonString = await convertCodeToJson(currentInput, activeTab);
        resultJsonObj = JSON.parse(jsonString);
      }
      
      setOutputJson(JSON.stringify(resultJsonObj, null, 2));
      setIsConverted(true);
    } catch (err: any) {
      const isLocal = ['html', 'csv', 'xml'].includes(activeTab);
      let errorMessage = err.message || `Failed to convert ${activeTab} to JSON.`;
      if (isLocal) {
        errorMessage = `Conversion from ${activeTab} to JSON failed. This usually means the input data has a formatting error.\n\nDetails: ${err.message}`;
      }
      setOutputError(errorMessage);
      setIsConverted(false);
    } finally {
      setIsLoading(false);
      setIsValidated(false); // Require re-validation
    }
  };

  const isActionDisabled = isLoading || isValidating || isCorrecting;
  const hasError = !!outputError || !!validationError;

  let validateTooltip = "Validate the syntax of the input code for the selected language.";
  if (isConverted) {
    validateTooltip = "Conversion complete. Edit, reset, or switch tabs to start a new validation.";
  } else if (hasError) {
      validateTooltip = "An error occurred. Please reset or edit the input to try again.";
  } else if (isValidated) {
      validateTooltip = "Code has been successfully validated. You can now convert it.";
  }

  const convertTooltip = hasError
    ? "An error occurred. Please reset or edit the input to try again."
    : "Convert the validated code to JSON.";

  return (
    <>
      <SEO
    title="Code to JSON Converter | AI JSON Tools"
    description="Convert HTML, CSV, XML, JS, Python, Java, and YAML code to JSON instantly using AI-powered tools."
    keywords="code to json converter, AI JSON Tools, convert code, HTML to JSON, XML to JSON, JS to JSON"
    canonical="https://yourdomain.com/code-to-json"
    ogImage="https://yourdomain.com/images/code-to-json.jpg"
    ogUrl="https://yourdomain.com/code-to-json"
  />
      
<div className="w-full flex flex-col lg:flex-row gap-6">
  <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Input Data / Code</h2>
      <Tooltip content="Upload a file to input">
        <button onClick={handleUploadClick} className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">
          <UploadIcon className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>

    <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />

    <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-x-auto">
      <div className="flex flex-nowrap items-center gap-1 p-1 bg-slate-200 dark:bg-slate-900 rounded-lg w-max" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
        {tabOrder.map((lang, index) => {
          const { label, icon } = languageDetails[lang];
          return (
            <div key={lang} draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDrop} className={`relative cursor-grab ${dragItem.current === index ? 'opacity-50' : ''} ${getDropIndicatorClass(index)}`}>
              <Tooltip content={`Switch to ${label} input`}>
                <button onClick={() => handleTabClick(lang)} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full ${activeTab === lang ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'}`}>
                  {icon} {label}
                </button>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>

    <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 p-4">
      <textarea
        value={currentInput}
        onChange={e => handleInputChange(e.target.value)}
        className="w-full h-64 bg-transparent resize-none p-2 border border-slate-200 dark:border-slate-700 rounded"
      />
      <div className="flex gap-2 mt-2 flex-wrap">
        <button onClick={handleValidate} disabled={isActionDisabled} title={validateTooltip} className="px-3 py-1 bg-slate-100 rounded">Validate</button>
        <button onClick={handleConvert} disabled={!isValidated || isActionDisabled} title={convertTooltip} className="px-3 py-1 bg-slate-100 rounded">Convert</button>
        <button onClick={handleCopyInput} disabled={!currentInput} className="px-3 py-1 bg-slate-100 rounded">{isCopied ? 'Copied' : 'Copy'}</button>
        <button onClick={handleClear} className="px-3 py-1 bg-slate-100 rounded">Clear</button>
      </div>
    </div>
  </div>

  <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
    <div className="flex justify-between items-center flex-wrap gap-2">
      <h2 className="text-xl font-semibold">JSON Output</h2>
    </div>

    <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
      <div className="flex-grow relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
        {isValidating ? (
          <ValidationLoading />
        ) : isCorrecting ? (
          <AutoCorrectionLoading />
        ) : outputError ? (
          <ErrorAnalysisDisplay title="Conversion Failed" analysisText={outputError} />
        ) : validationError ? (
          <ErrorAnalysisDisplay
            title="Validation Failed"
            analysisText={validationError.reason + (validationError.suggestedLanguage && validationError.suggestedLanguage.toLowerCase() !== activeTab.toLowerCase() ? ` It looks like you pasted ${validationError.suggestedLanguage} code.` : '')}
            showAutoCorrectButton={!!validationError.isFixableSyntaxError}
            onAutoCorrect={handleAutoCorrect}
            isCorrecting={isCorrecting}
          />
        ) : successMessage ? (
          <div className="h-full flex flex-col items-center justify-center text-green-700 dark:text-green-300 p-4 text-center">
            <CheckIcon className="h-10 w-10 mb-4" />
            <p>{successMessage}</p>
          </div>
        ) : outputJson ? (
          <JsonSyntaxHighlighter jsonString={outputJson} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
            <CodeBracketIcon className="h-10 w-10 mb-4 text-slate-300 dark:text-slate-600" />
            <p>JSON output will appear here after conversion.</p>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
    </>
  );
};

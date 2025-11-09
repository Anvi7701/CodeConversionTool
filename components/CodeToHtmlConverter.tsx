import React, { useState, useRef, useEffect } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { HtmlRenderer, Analysis } from './HtmlRenderer';
import { SpinnerIcon, XmlIcon, CodeBracketIcon, HtmlIcon, CheckIcon, CopyIcon, UploadIcon } from './icons';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { convertJsonToHtml, convertXmlToHtml } from '../utils/reverseParser';
import { ErrorAnalysisDisplay } from './ErrorAnalysisDisplay';
import { validateCodeSyntax, correctCodeSyntax, analyzeHtmlCode } from '../services/geminiService';
import { validateSyntaxLocally } from '../utils/localAnalyzers';
import { AutoCorrectionLoading } from './AutoCorrectionLoading';
import { ValidationLoading } from './ValidationLoading';

type InputLanguage = 'json' | 'xml';
type InputCodeMap = { [key in InputLanguage]?: string };
type ValidationResult = { isValid: boolean; reason: string; isFixableSyntaxError: boolean; suggestedLanguage?: string };

const languageDetails: { [key in InputLanguage]: { label: string; icon: React.ReactNode } } = {
  json: { label: 'JSON', icon: <CodeBracketIcon className="h-5 w-5" /> },
  xml: { label: 'XML', icon: <XmlIcon className="h-5 w-5" /> },
};

const allowedExtensions: { [key in InputLanguage]: string[] } = {
    json: ['.json', '.txt'],
    xml: ['.xml', '.txt'],
};

const defaultTabOrder: InputLanguage[] = ['json', 'xml'];

export const CodeToHtmlConverter: React.FC = () => {
  const [inputCodes, setInputCodes] = useState<InputCodeMap>(() => {
    try {
     const stored = localStorage.getItem('codeToHtmlInputs');
     return stored ? JSON.parse(stored) : {};
   } catch {
     return {};
   }
 });
  const [activeTab, setActiveTab] = useState<InputLanguage>('json');
  const [outputHtml, setOutputHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<Analysis | null>(null);

  const [tabOrder, setTabOrder] = useState<InputLanguage[]>(() => {
    try {
        const storedOrder = localStorage.getItem('htmlConverterTabOrder');
        if (storedOrder) {
          const parsed = JSON.parse(storedOrder) as InputLanguage[];
          const validOrder = parsed.filter(t => defaultTabOrder.includes(t));
          const allPresent = defaultTabOrder.every(t => validOrder.includes(t));
          return allPresent ? validOrder : defaultTabOrder;
        }
    } catch (e) { console.error("Failed to parse tab order from localStorage", e); }
    return defaultTabOrder;
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
    localStorage.setItem('htmlConverterTabOrder', JSON.stringify(newTabOrder));
  };
  const getDropIndicatorClass = (index: number) => dragOverItem.current === index ? 'border-r-2 border-brand-primary' : 'border-r-2 border-transparent';

  const resetState = () => {
      setOutputHtml(null);
      setOutputError(null);
      setValidationError(null);
      setSuccessMessage(null);
      setIsValidated(false);
      setIsConverted(false);
      setIsCopied(false);
      setAiAnalysis(null);
  }

  const handleInputChange = (value: string) => {
      const newInputs = {...inputCodes, [activeTab]: value};
      setInputCodes(newInputs);
      resetState();
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
        localStorage.setItem('codeToHtmlInputs', JSON.stringify(newInputs));
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
    if (e.target) e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTabClick = (lang: InputLanguage) => {
    setActiveTab(lang);
    resetState();
  };
  
  const handleClear = () => {
    handleInputChange('');
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
    
    // Use the centralized local validator
    setTimeout(() => {
        const result = validateSyntaxLocally(currentInput, activeTab);
        if (result) {
            if (result.isValid) {
                setSuccessMessage("Validation successful! You can now click 'Convert'.");
                setIsValidated(true);
            } else {
                setValidationError({...result, suggestedLanguage: undefined});
            }
        } else {
            // This case should not be reached for JSON/XML, but as a fallback:
            setOutputError(`Local validator is not available for ${activeTab}.`);
        }
        setIsValidating(false);
    }, 50); // Small delay for UX
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
    setOutputHtml(null);
    setAiAnalysis(null);
    
    try {
      let resultHtml: string;

      if (activeTab === 'json') {
        const jsonObj = JSON.parse(currentInput);
        // Fix: Added 'await' to correctly handle the promise returned by convertJsonToHtml.
        resultHtml = await convertJsonToHtml(jsonObj);
      } else { // 'xml'
        // Fix: Added 'await' to correctly handle the promise returned by convertXmlToHtml.
        resultHtml = await convertXmlToHtml(currentInput);
      }
      
      setOutputHtml(resultHtml);

      try {
        const analysis = await analyzeHtmlCode(resultHtml);
        setAiAnalysis(analysis);
      } catch (analysisError: any) {
        console.warn("AI analysis failed, but conversion succeeded.", analysisError);
        setAiAnalysis({
            explanation: 'AI analysis of the generated HTML failed.',
            suggestions: ['The conversion was successful, but the AI could not provide analysis for the generated HTML. This might be a temporary issue.'],
        });
      }

      setIsConverted(true);
    } catch (err: any) {
      setOutputError(`Conversion from ${activeTab} to HTML failed. This usually means the input data has a formatting error.\n\nDetails: ${err.message}`);
      setIsConverted(false);
    } finally {
      setIsLoading(false);
      setIsValidated(false);
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
    : "Convert the validated code to HTML.";


  return (
    <>
      <SEO
        title="Code to HTML Converter | AI JSON Tools"
        description="Convert JSON and XML code to HTML instantly using AI-powered tools. Validate, correct, and preview HTML output."
        keywords="code to html converter, AI HTML Tools, convert code, JSON to HTML, XML to HTML"
        canonical="https://yourdomain.com/code-to-html"
        ogImage="https://yourdomain.com/images/code-to-html.jpg"
        ogUrl="https://yourdomain.com/code-to-html"
      />

      <div className="w-full flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
          <h2 className="text-xl font-semibold">Input Data / Code</h2>

          <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-x-auto">
            <div className="flex flex-nowrap items-center gap-1 p-1 bg-slate-200 dark:bg-slate-900 rounded-lg w-max" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
              {tabOrder.map((lang, index) => {
                const { label, icon } = languageDetails[lang];
                return (
                  <div
                    key={lang}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDrop}
                    className={`relative cursor-grab ${dragItem.current === index ? 'opacity-50' : ''} ${getDropIndicatorClass(index)}`}
                  >
                    <Tooltip content={`Switch to ${label} input`}>
                      <button
                        onClick={() => handleTabClick(lang)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full ${activeTab === lang ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'}`}
                      >
                        {icon} {label}
                      </button>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0">
            <CodeEditor value={currentInput} language={activeTab} onChange={handleInputChange} />
          </div>

          <div className="flex gap-2 mt-2 flex-wrap">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            <Tooltip content="Upload file">
              <button onClick={handleUploadClick} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                <UploadIcon className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip content="Copy input">
              <button onClick={handleCopyInput} disabled={!currentInput} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            </Tooltip>
            <Tooltip content="Clear input">
              <button onClick={handleClear} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded">Clear</button>
            </Tooltip>
            <Tooltip content={validateTooltip}>
              <button onClick={handleValidate} disabled={isActionDisabled} className="px-3 py-1 bg-teal-500 text-white rounded">Validate</button>
            </Tooltip>
            <Tooltip content={convertTooltip}>
              <button onClick={handleConvert} disabled={!isValidated || isActionDisabled} className="px-3 py-1 bg-indigo-600 text-white rounded">Convert</button>
            </Tooltip>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xl font-semibold">HTML Output</h2>
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
              ) : outputHtml ? (
                <HtmlRenderer htmlString={outputHtml} analysis={aiAnalysis} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                  <HtmlIcon className="h-10 w-10 mb-4 text-slate-300 dark:text-slate-600" />
                  <p>HTML output will appear here after conversion.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

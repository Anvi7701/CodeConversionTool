import React, { useState, useRef, useEffect } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeViewer } from './CodeViewer';
import { SpinnerIcon, JavascriptIcon, PythonIcon, JavaIcon, XmlIcon, HtmlIcon, CodeBracketIcon, CheckIcon, CopyIcon, LightBulbIcon, UploadIcon } from './icons';
import { convertCodeToJs, validateCodeSyntax, correctCodeSyntax, analyzeAndExecuteCode } from '../services/geminiService';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { convertJsonToJs, convertXmlToJs } from '../utils/reverseParser';
import { ErrorAnalysisDisplay } from './ErrorAnalysisDisplay';
import { AnalysisViewer } from './AnalysisViewer';
import { validateSyntaxLocally } from '../utils/localAnalyzers';
import { AutoCorrectionLoading } from './AutoCorrectionLoading';
import { ValidationLoading } from './ValidationLoading';

type InputLanguage = 'json' | 'xml' | 'python' | 'java' | 'html';
type InputCodeMap = { [key in InputLanguage]?: string };
type ValidationResult = { isValid: boolean; reason: string; isFixableSyntaxError: boolean; suggestedLanguage?: string };
type Analysis = { executionOutput: string; explanation: string; suggestions: string[]; };

const languageDetails: { [key in InputLanguage]: { label: string; icon: React.ReactNode } } = {
  json: { label: 'JSON', icon: <CodeBracketIcon className="h-5 w-5" /> },
  xml: { label: 'XML', icon: <XmlIcon className="h-5 w-5" /> },
  python: { label: 'Python', icon: <PythonIcon className="h-5 w-5" /> },
  java: { label: 'Java', icon: <JavaIcon className="h-5 w-5" /> },
  html: { label: 'HTML', icon: <HtmlIcon className="h-5 w-5" /> },
};

const allowedExtensions: { [key in InputLanguage]: string[] } = {
    json: ['.json', '.txt'],
    xml: ['.xml', '.txt'],
    python: ['.py', '.txt'],
    java: ['.java', '.txt'],
    html: ['.html', '.htm', '.txt'],
};

const defaultTabOrder: InputLanguage[] = ['json', 'xml', 'python', 'java', 'html'];

export const CodeToJsConverter: React.FC = () => {
  const [inputCodes, setInputCodes] = useState<InputCodeMap>(() => {
    try {
     const stored = localStorage.getItem('codeToJsInputs');
     return stored ? JSON.parse(stored) : {};
   } catch {
     return {};
   }
 });
  const [activeTab, setActiveTab] = useState<InputLanguage>('json');
  const [outputJs, setOutputJs] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'code' | 'analysis'>('code');
  const [aiAnalysis, setAiAnalysis] = useState<Analysis | null>(null);

  const [tabOrder, setTabOrder] = useState<InputLanguage[]>(() => {
    try {
        const storedOrder = localStorage.getItem('jsConverterTabOrder');
        if (storedOrder) {
            const parsedOrder = JSON.parse(storedOrder) as InputLanguage[];
            const validOrder = parsedOrder.filter(t => defaultTabOrder.includes(t));
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
    localStorage.setItem('jsConverterTabOrder', JSON.stringify(newTabOrder));
  };
  const getDropIndicatorClass = (index: number) => dragOverItem.current === index ? 'border-r-2 border-brand-primary' : 'border-r-2 border-transparent';

  const resetState = () => {
      setOutputJs(null);
      setOutputError(null);
      setValidationError(null);
      setSuccessMessage(null);
      setIsValidated(false);
      setIsConverted(false);
      setIsCopied(false);
      setAiAnalysis(null);
      setActiveOutputTab('code');
  };

  const handleInputChange = (value: string) => {
      const newInputs = {...inputCodes, [activeTab]: value};
      setInputCodes(newInputs);
      resetState();
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
        localStorage.setItem('codeToJsInputs', JSON.stringify(newInputs));
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
    try {
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

        const result = await validateCodeSyntax(currentInput, activeTab);
        if (result.isValid) {
            setSuccessMessage("Validation successful! You can now click 'Convert'.");
            setIsValidated(true);
        } else {
            setValidationError(result);
        }
    } catch (err: any) {
        setOutputError(`The validator found an issue with your ${activeTab} code. Please check the syntax.\n\nDetails: ${err.message}`);
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
    setOutputJs(null);
    setAiAnalysis(null);
    
    try {
      let resultJs: string;

      if (activeTab === 'json') {
        const jsonObj = JSON.parse(currentInput);
        resultJs = convertJsonToJs(jsonObj);
      } else if (activeTab === 'xml') {
        resultJs = convertXmlToJs(currentInput);
      } else {
        resultJs = await convertCodeToJs(currentInput, activeTab);
      }
      
      setOutputJs(resultJs);

      try {
          const analysis = await analyzeAndExecuteCode(resultJs, 'JavaScript');
          setAiAnalysis(analysis);
      } catch (analysisError: any) {
          console.warn("AI analysis failed, but conversion succeeded.", analysisError);
          setAiAnalysis({
              explanation: 'AI analysis of the generated code failed.',
              executionOutput: 'N/A',
              suggestions: ['The conversion was successful, but the AI could not provide analysis for the generated code. This might be a temporary issue.'],
          });
      }

      setIsConverted(true);
      setActiveOutputTab('code');
    } catch (err: any) {
      const isLocal = ['json', 'xml'].includes(activeTab);
      let errorMessage = err.message || `Failed to convert ${activeTab} to JavaScript.`;
      if (isLocal) {
          errorMessage = `Conversion from ${activeTab} to JavaScript failed. This usually means the input data has a formatting error.\n\nDetails: ${err.message}`;
      }
      setOutputError(errorMessage);
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
    : "Convert the validated code to JavaScript.";

  return (
    <>
      <SEO
    title="Code to JavaScript Converter | AI JSON Tools"
    description="Convert JSON, XML, Python, Java, and HTML code to JavaScript instantly using AI-powered tools. Validate, correct, and analyze JavaScript output."
    keywords="code to javascript converter, AI JS Tools, convert code, JSON to JS, XML to JS, Python to JS"
    canonical="https://yourdomain.com/code-to-js"
    ogImage="https://yourdomain.com/images/code-to-js.jpg"
    ogUrl="https://yourdomain.com/code-to-js"
  />
      
<TwoColumnLayout
  left={{
    header: <h2 className="text-xl font-semibold">Input Section</h2>,
    content: (
      <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
        <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0">
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

          <div className="p-4 flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <Tooltip content="Upload a file">
                <button onClick={handleUploadClick} className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800">
                  <UploadIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              <input ref={fileInputRef} type="file" accept={allowedExtensions[activeTab].join(',')} className="hidden" onChange={handleFileChange} />
              <Tooltip content="Copy input">
                <button onClick={handleCopyInput} className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800">
                  <CopyIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip content="Clear input">
                <button onClick={handleClear} className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800">Clear</button>
              </Tooltip>
            </div>

            <div className="ml-auto flex gap-2">
              <Tooltip content={validateTooltip}>
                <button onClick={handleValidate} disabled={isActionDisabled} className="px-3 py-2 rounded-md bg-teal-500 text-white">Validate</button>
              </Tooltip>
              <Tooltip content={convertTooltip}>
                <button onClick={handleConvert} disabled={!isValidated || isActionDisabled} className="px-3 py-2 rounded-md bg-indigo-600 text-white">Convert</button>
              </Tooltip>
            </div>
          </div>

            <div className="flex-grow relative overflow-hidden">
            <CodeEditor value={currentInput} language={activeTab} onChange={handleInputChange} />
            </div>
        </div>
      </div>
    ),
    scrollable: true,
    minHeight: "500px"
  }}
  right={{
    header: <h2 className="text-xl font-semibold">Output Section</h2>,
    content: (
      <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-semibold">JavaScript Output</h2>
        {isConverted && (
          <>
          <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-900 rounded-lg">
            <Tooltip content="View the converted JavaScript code">
              <button onClick={() => setActiveOutputTab('code')} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${activeOutputTab === 'code' ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-600 hover:bg-slate-100 dark:hover:text-white'}`}>
                <JavascriptIcon className="h-5 w-5" /> Code
              </button>
            </Tooltip>
            <Tooltip content="View AI analysis and suggestions">
              <button onClick={() => setActiveOutputTab('analysis')} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${activeOutputTab === 'analysis' ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-600 hover:bg-slate-100 dark:hover:text-white'}`}>
                <LightBulbIcon className="h-5 w-5" /> Analysis
              </button>
            </Tooltip>
          </div>
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
              ) : outputJs && isConverted ? (
                <>
                  {activeOutputTab === 'code' && <CodeViewer code={outputJs} language="javascript" />}
                  {activeOutputTab === 'analysis' && <AnalysisViewer analysis={aiAnalysis} />}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                  <JavascriptIcon className="h-10 w-10 mb-4 text-slate-300 dark:text-slate-600" />
                  <p>JavaScript output will appear here after conversion.</p>
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    ),
    scrollable: true,
    minHeight: "500px"
  }}
/>

    </>
  );
};

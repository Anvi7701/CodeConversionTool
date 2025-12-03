import React, { useState, useRef } from 'react';
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

export const OnlineFormatter: React.FC = () => {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<Language>('json');
  const [outputError, setOutputError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For formatting
  const [isValidating, setIsValidating] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    resetState(); // Clear input code when switching language
  };


  const handleInputChange = (value: string) => {
    setInputCode(value);
    setOutputError(null);
    setOutputCode(null);
    setValidationError(null);
    setSuccessMessage(null);
    setIsValidated(false);
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
      // Tier 1: Attempt fast, local validation for supported languages.
      const localResult = validateSyntaxLocally(trimmedInput, activeLanguage);
      if (localResult) {
        if (localResult.isValid) {
          setSuccessMessage(localResult.reason);
          setIsValidated(true);
        } else {
          setValidationError({ ...localResult, suggestedLanguage: undefined });
        }
        setIsValidating(false);
        return; // Exit early if local validation handled it
      }

      // Tier 2: Fallback to Gemini API for complex or unsupported languages (like HTML).
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
            isFixableSyntaxError: true, // API errors are often syntax-related and worth trying to fix
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
        setIsValidated(true);
        setSuccessMessage("AI successfully corrected the syntax. You can now format the code.");
    } catch (err: any) {
        setOutputError(err.message || "AI auto-correction failed.");
        setIsValidated(false);
    } finally {
        setIsCorrecting(false);
    }
  };


  const handleFormat = async () => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput) {
      // Button should be disabled, but as a safeguard.
      return;
    }
    
    setIsLoading(true);
    setOutputError(null);
    setValidationError(null);
    setSuccessMessage(null);
    setOutputCode(null);

    try {
      let formattedCode = '';
      switch (activeLanguage) {
        case 'json':
          const jsonObj = JSON.parse(trimmedInput);
          formattedCode = JSON.stringify(jsonObj, null, 2);
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

  const isActionDisabled = isLoading || isValidating || isCorrecting;
  
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
      
      <div className="w-full flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Input</h2>
            <div className="flex items-center gap-2">
              <Tooltip content="Upload a code file to input">
                <button onClick={() => fileInputRef.current?.click()} disabled={isActionDisabled} className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">
                  <UploadIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              <label htmlFor="language-select" className="text-sm font-medium">Format:</label>
              <select
                id="language-select"
                value={activeLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="px-2 py-1 text-sm rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-brand-primary focus:border-brand-primary"
              >
                {Object.keys(languageDetails).map(lang => (
                  <option key={lang} value={lang}>{languageDetails[lang as Language].label}</option>
                ))}
              </select>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept={languageDetails[activeLanguage].extensions.join(',')} className="hidden" onChange={handleFileChange} />

          <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 p-4">
            <textarea
              value={inputCode}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={`Enter your ${activeLanguage.toUpperCase()} code here...`}
              className="w-full h-96 bg-transparent resize-none p-2 border border-slate-200 dark:border-slate-700 rounded"
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              <button onClick={handleValidate} disabled={isActionDisabled || !inputCode.trim()} className="px-3 py-1 bg-slate-100 rounded">Validate</button>
              <button onClick={handleFormat} disabled={isActionDisabled || !inputCode.trim()} className="px-3 py-1 bg-slate-100 rounded">Format</button>
              <button onClick={() => resetState()} className="px-3 py-1 bg-slate-100 rounded">Clear</button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
          <h2 className="text-xl font-semibold">Output</h2>

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
    </>
  );
};

import React, { useState, useRef } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { SpinnerIcon, XmlIcon, CodeBracketIcon, CheckIcon, UploadIcon, TreeIcon } from './icons';
import { formatXml, minifyXml } from '../utils/formatters';
import { convertXmlToJson } from '../utils/reverseParser';
import { XmlTreeView } from './XmlTreeView';
import { JsonSyntaxHighlighter } from './JsonSyntaxHighlighter';
import { ErrorAnalysisDisplay } from './ErrorAnalysisDisplay';
import { correctCodeSyntax } from '../services/geminiService';
import { CodeViewer } from './CodeViewer';
import { AutoCorrectionLoading } from './AutoCorrectionLoading';
import { ValidationLoading } from './ValidationLoading';


type OutputView = 'code' | 'tree' | 'json';
type ValidationError = { reason: string; isFixable: boolean };

export const XmlInspector: React.FC = () => {
  const [inputXml, setInputXml] = useState('');
  const [outputXml, setOutputXml] = useState<string | null>(null);
  const [outputJson, setOutputJson] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<OutputView>('code');
  const [isValidated, setIsValidated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = (keepInput = false) => {
    if (!keepInput) setInputXml('');
    setValidationError(null);
    setOutputXml(null);
    setOutputJson(null);
    setIsValidated(false);
    setActiveOutputTab('code');
  };

  const handleInputChange = (value: string) => {
    setInputXml(value);
    // Reset output states if user types
    if (validationError || isValidated || outputXml) {
      setValidationError(null);
      setIsValidated(false);
      setOutputXml(null);
      setOutputJson(null);
      setActiveOutputTab('code');
    }
  };
  
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (typeof text === 'string') {
        handleInputChange(text);
      } else {
        setValidationError({ reason: 'Failed to read file content.', isFixable: false });
      }
    };
    reader.onerror = () => {
      setValidationError({ reason: 'Failed to read the file.', isFixable: false });
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedExtensions = ['.xml', '.txt'];
      const fileNameLower = file.name.toLowerCase();
      const lastDotIndex = fileNameLower.lastIndexOf('.');
      const fileExtension = lastDotIndex === -1 ? '' : fileNameLower.substring(lastDotIndex);

      if (!allowedExtensions.includes(fileExtension)) {
        setValidationError({ reason: `Invalid file type. Please upload an .xml or .txt file.`, isFixable: false });
        if (e.target) e.target.value = '';
        return;
      }
      processFile(file);
    }
    if (e.target) e.target.value = '';
  };
  
  const handleValidate = async () => {
      setIsValidating(true);
      setValidationError(null);
      setOutputXml(null);
      setOutputJson(null);
      setIsValidated(false);

      const trimmedInput = inputXml.trim();
      if (!trimmedInput) {
          setValidationError({ reason: "Input is empty. Please paste or upload some XML.", isFixable: false });
          setIsValidating(false);
          return;
      }
      
      try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(trimmedInput, "application/xml");
          const errorNode = doc.querySelector('parsererror');
          if (errorNode) {
              const errorMessage = errorNode.textContent?.split('\n')[1] || "Invalid XML syntax.";
              throw new Error(errorMessage);
          }
          setIsValidated(true);
          setOutputXml(await formatXml(trimmedInput));
          setActiveOutputTab('code');
      } catch (e: any) {
          setValidationError({ reason: `The validator found a syntax error in your XML.\n\nDetails: ${e.message}`, isFixable: true });
          setIsValidated(false);
      } finally {
          setIsValidating(false);
      }
  };

  const handleFormat = async () => {
    setOutputXml(await formatXml(inputXml));
    setActiveOutputTab('code');
  };
  
  const handleMinify = async () => {
    setOutputXml(await minifyXml(inputXml));
    setActiveOutputTab('code');
  };
  
  const handleOutputTabClick = (tab: OutputView) => {
    if (tab === 'json' && isValidated && !outputJson) {
      try {
        const jsonObj = convertXmlToJson(inputXml);
        setOutputJson(JSON.stringify(jsonObj, null, 2));
      } catch (e: any) {
        setValidationError({ reason: `Failed to convert to JSON: ${e.message}`, isFixable: false });
        return; // Don't switch tab if conversion fails
      }
    }
    setActiveOutputTab(tab);
  };
  
  const handleAutoCorrect = async () => {
    if (!inputXml) return;
    setIsCorrecting(true);
    setValidationError(null);
    try {
        const correctedCode = await correctCodeSyntax(inputXml, 'xml');
        setInputXml(correctedCode);
        // After correcting, automatically validate the new code
        const parser = new DOMParser();
        const doc = parser.parseFromString(correctedCode, "application/xml");
        const errorNode = doc.querySelector('parsererror');
        if (errorNode) throw new Error("AI correction failed to produce valid XML.");
        
        setIsValidated(true);
        setOutputXml(await formatXml(correctedCode));
        setActiveOutputTab('code');
    } catch (err: any) {
        setValidationError({ reason: err.message || "AI auto-correction failed.", isFixable: false });
        setIsValidated(false);
    } finally {
        setIsCorrecting(false);
    }
  };

  const isActionDisabled = isCorrecting || isValidating;
  const hasError = !!validationError;

  return (
    <>
    <SEO
    title="XML Inspector | AI JSON Tools"
    description="Validate, format, minify, and inspect XML instantly using AI-powered tools. Convert XML to JSON and view XML as a tree for better analysis."
    keywords="xml inspector, AI XML Tools, validate XML, format XML, convert XML to JSON"
    canonical="https://yourdomain.com/xml-inspector"
    ogImage="https://yourdomain.com/images/xml-inspector.jpg"
    ogUrl="https://yourdomain.com/xml-inspector"
  />
      
<TwoColumnLayout
        left={{
          header: <h2 className="text-xl font-semibold">Input Section</h2>,
          content: (
            <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
              <h2 className="text-xl font-semibold">Input XML</h2>
              <div className="relative flex-grow min-h-0">
                  <CodeEditor 
                        value={inputXml}
                        onChange={handleInputChange}
                        placeholder={`Paste your XML code here...`} 
                        language={''}            
                  />
                  <div className="absolute top-2 right-2 z-10">
                      <Tooltip content="Upload XML file">
                          <button
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-600"
                          >
                              <UploadIcon className="h-4 w-4" />
                          </button>
                      </Tooltip>
                  </div>
              </div>
            </div>
          )
        }}
        right={{
          header: <h2 className="text-xl font-semibold">Output Section</h2>,
      content: (
        <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xl font-semibold">Output</h2>
            <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-900 rounded-lg">
                 <Tooltip content="View the formatted or minified XML code">
                    <button
                        onClick={() => handleOutputTabClick('code')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${activeOutputTab === 'code' ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-600 hover:bg-slate-100 dark:hover:text-white'}`}
                    >
                        <XmlIcon className="h-5 w-5" /> Code
                    </button>
                </Tooltip>
                <Tooltip content={!isValidated ? "Validate XML to enable Tree View" : "View the XML as an interactive tree"}>
                    <div className="inline-block">
                        <button
                            onClick={() => handleOutputTabClick('tree')}
                            disabled={!isValidated}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${activeOutputTab === 'tree' && isValidated ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-600 hover:bg-slate-100 dark:hover:text-white'} ${!isValidated ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <TreeIcon className="h-5 w-5" /> Tree View
                        </button>
                    </div>
</Tooltip>
                <Tooltip content={!isValidated ? "Validate XML to enable conversion" : "Convert the valid XML to JSON"}>
                    <div className="inline-block">
                        <button
                            onClick={() => handleOutputTabClick('json')}
                            disabled={!isValidated}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${activeOutputTab === 'json' && isValidated ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-600 hover:bg-slate-100 dark:hover:text-white'} ${!isValidated ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <CodeBracketIcon className="h-5 w-5" /> JSON
                        </button>
                    </div>
                </Tooltip>
            </div>
        </div>
        <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="flex-grow relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                {isValidating ? (
                    <ValidationLoading />
                ) : isCorrecting ? (
                    <AutoCorrectionLoading />
                ) : validationError ? (
                    <ErrorAnalysisDisplay
                        title="Validation Failed"
                        analysisText={validationError.reason}
                        showAutoCorrectButton={validationError.isFixable}
                        onAutoCorrect={handleAutoCorrect}
                        isCorrecting={isCorrecting}
                    />
                ) : (
                  <>
                    {activeOutputTab === 'code' && outputXml && <CodeViewer code={outputXml} language="xml" />}
                    {activeOutputTab === 'tree' && isValidated && <XmlTreeView xmlString={inputXml} />}
                    {activeOutputTab === 'json' && outputJson && <JsonSyntaxHighlighter jsonString={outputJson} />}
                    
                    {/* Placeholder Logic */}
                    {(!outputXml && !validationError && !isValidated) && (
                         <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                           <XmlIcon className="h-10 w-10 mb-4 text-slate-300 dark:text-slate-600" />
                           <p>Format, minify, or validate your XML to see the output here.</p>
                        </div>
                    )}
                  </>
                )}
            </div>
          </div>
        </div>
          )
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};

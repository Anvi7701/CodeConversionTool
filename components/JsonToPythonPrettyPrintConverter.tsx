import React, { useState, useRef } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeViewer } from './CodeViewer';
import { SpinnerIcon, PythonIcon, CodeBracketIcon, CheckIcon, UploadIcon } from './icons';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { generatePythonPrettyPrintScript } from '../utils/codeGenerator';
import { ValidationLoading } from './ValidationLoading';

export const JsonToPythonPrettyPrintConverter: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [outputScript, setOutputScript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setOutputScript(null);
    setError(null);
    setSuccessMessage(null);
    setIsValidated(false);
    setIsConverted(false);
  };

  const handleInputChange = (value: string) => {
    setInputJson(value);
    resetState();
  };
  
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (typeof text === 'string') {
            handleInputChange(text);
        } else {
            setError('Failed to read file content.');
        }
    };
    reader.onerror = () => {
        setError('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const allowedExtensions = ['.json', '.txt'];
        
        const fileNameLower = file.name.toLowerCase();
        const lastDotIndex = fileNameLower.lastIndexOf('.');
        const fileExtension = lastDotIndex === -1 ? '' : fileNameLower.substring(lastDotIndex);

        if (!allowedExtensions.includes(fileExtension)) {
            setError(`Invalid file type. Please upload a .json or .txt file.`);
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

  const handleClear = () => {
    handleInputChange('');
  };

  const handleValidate = () => {
    setIsValidating(true);
    resetState();
    const trimmedInput = inputJson.trim();
    if (!trimmedInput) {
      setError("Input is empty. Please paste some JSON.");
      setIsValidating(false);
      return;
    }
    
    setTimeout(() => {
        try {
          JSON.parse(trimmedInput);
          setSuccessMessage("Validation successful! You can now generate the Python script.");
          setIsValidated(true);
        } catch (e: any) {
          setError(`Invalid JSON syntax. Please check your input.\n\nDetails: ${e.message}`);
          setIsValidated(false);
        } finally {
            setIsValidating(false);
        }
    }, 50);
  };

  const handleConvert = () => {
    if (!isValidated) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // This is a deterministic, client-side operation, so a timeout is sufficient
    setTimeout(() => {
        try {
            const jsonObj = JSON.parse(inputJson);
            const script = generatePythonPrettyPrintScript(jsonObj);
            setOutputScript(script);
            setIsConverted(true);
        } catch (err: any) {
            setError(`Script generation failed. This is likely due to an error in the JSON input.\n\nDetails: ${err.message || 'An unknown error occurred.'}`);
            setIsConverted(false);
        } finally {
            setIsLoading(false);
            setIsValidated(false); // Require re-validation for new conversions
        }
    }, 50); // Simulate a short loading state for better UX
  };
  
  const isActionDisabled = isLoading || isValidating;
  const hasError = !!error;

return (
  <>
    <SEO
      title="JSON to Python Pretty Print Converter | AI JSON Tools"
      description="Generate Python pretty print scripts from JSON instantly using AI-powered tools. Validate JSON and create clean, readable Python code."
      keywords="json to python converter, pretty print python, AI JSON Tools, convert JSON to Python script"
      canonical="https://yourdomain.com/json-to-python-pretty-print"
      ogImage="https://yourdomain.com/images/json-to-python-pretty-print.jpg"
      ogUrl="https://yourdomain.com/json-to-python-pretty-print"
    />
    
    <div className="w-full flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
        <h2 className="text-xl font-semibold">Input JSON</h2>

        <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 p-4">
          <textarea
            value={inputJson}
            onChange={e => handleInputChange(e.target.value)}
            className="w-full h-96 bg-transparent resize-none p-2 border border-slate-200 dark:border-slate-700 rounded"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            <input ref={fileInputRef} type="file" accept=".json,.txt" className="hidden" onChange={handleFileChange} />
            <button onClick={handleUploadClick} className="px-3 py-1 bg-slate-100 rounded">Upload</button>
            <button onClick={handleValidate} disabled={isActionDisabled} className="px-3 py-1 bg-slate-100 rounded">Validate</button>
            <button onClick={handleConvert} disabled={!isValidated || isActionDisabled} className="px-3 py-1 bg-slate-100 rounded">Generate</button>
            <button onClick={handleClear} className="px-3 py-1 bg-slate-100 rounded">Clear</button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Python Pretty Print Script</h2>
        </div>

        <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
          <div className="flex-grow relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
            {isValidating ? (
              <ValidationLoading />
            ) : error ? (
              <div className="absolute inset-0 p-6 overflow-auto bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200">
                <p className="whitespace-pre-wrap">{error}</p>
              </div>
            ) : successMessage ? (
              <div className="h-full flex flex-col items-center justify-center text-green-700 dark:text-green-300 p-4 text-center">
                <CheckIcon className="h-10 w-10 mb-4" />
                <p>{successMessage}</p>
              </div>
            ) : outputScript ? (
              <CodeViewer code={outputScript} language="python" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                <PythonIcon className="h-10 w-10 mb-4 text-slate-300 dark:text-slate-600" />
                <p>The Python script will appear here after generation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
}

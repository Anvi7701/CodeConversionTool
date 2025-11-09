import React, { useState, useRef } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeViewer } from './CodeViewer';
import { SpinnerIcon, JavascriptIcon, PythonIcon, JavaIcon, XmlIcon, CodeBracketIcon, UploadIcon, CubeStackIcon, CSharpIcon, GoIcon, SwiftIcon, RubyIcon, DartIcon } from './icons';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { convertXmlToJson } from '../utils/reverseParser';
import { generateClassFromJSON, TargetLanguage } from '../utils/classGenerator';
import { validateSyntaxLocally } from '../utils/localAnalyzers';


type InputLanguage = 'json' | 'xml';
type OutputLanguage = 'typescript' | 'python' | 'java' | 'csharp' | 'swift' | 'go' | 'ruby' | 'dart' | 'json_schema';

const inputLanguageDetails: { [key in InputLanguage]: { label: string; icon: React.ReactNode } } = {
  json: { label: 'JSON', icon: <CodeBracketIcon className="h-5 w-5" /> },
  xml: { label: 'XML', icon: <XmlIcon className="h-5 w-5" /> },
};

const outputLanguageDetails: { [key in OutputLanguage]: { label: string; icon: React.ReactNode; language: string } } = {
  typescript: { label: 'TypeScript', icon: <JavascriptIcon className="h-5 w-5" />, language: 'typescript' },
  python: { label: 'Python', icon: <PythonIcon className="h-5 w-5" />, language: 'python' },
  java: { label: 'Java', icon: <JavaIcon className="h-5 w-5" />, language: 'java' },
  csharp: { label: 'C#', icon: <CSharpIcon className="h-5 w-5" />, language: 'csharp' },
  swift: { label: 'Swift', icon: <SwiftIcon className="h-5 w-5" />, language: 'swift' },
  go: { label: 'Go', icon: <GoIcon className="h-5 w-5" />, language: 'go' },
  ruby: { label: 'Ruby', icon: <RubyIcon className="h-5 w-5" />, language: 'ruby' },
  dart: { label: 'Dart', icon: <DartIcon className="h-5 w-5" />, language: 'dart' },
  json_schema: { label: 'JSON Schema', icon: <CodeBracketIcon className="h-5 w-5" />, language: 'json' },
};

const allowedExtensions: { [key in InputLanguage]: string[] } = {
    json: ['.json', '.txt'],
    xml: ['.xml', '.txt'],
};


export const DataToClassConverter: React.FC = () => {
  const [inputCode, setInputCode] = useState('');
  const [activeInputTab, setActiveInputTab] = useState<InputLanguage>('json');
  const [activeOutputTab, setActiveOutputTab] = useState<OutputLanguage>('typescript');
  const [rootClassName, setRootClassName] = useState('Root');
  const [outputs, setOutputs] = useState<{ [key in OutputLanguage]?: string }>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = (keepInput = false) => {
    if (!keepInput) {
      setInputCode('');
      setRootClassName('Root');
    }
    setError(null);
    setOutputs({});
  };

  const handleInputChange = (value: string) => {
    setInputCode(value);
    setOutputs({});
    setError(null);
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
        const exts = allowedExtensions[activeInputTab];
        
        const fileNameLower = file.name.toLowerCase();
        const lastDotIndex = fileNameLower.lastIndexOf('.');
        const fileExtension = lastDotIndex === -1 ? '' : fileNameLower.substring(lastDotIndex);

        if (!exts.includes(fileExtension)) {
            setError(`Invalid file type for ${activeInputTab.toUpperCase()}. Expected ${exts.join(', ')}.`);
            if (e.target) e.target.value = '';
            return;
        }
        processFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleGenerate = () => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput) {
      setError("Input data cannot be empty.");
      return;
    }
    
    setIsLoading(true);
    resetState(true);

    // Use a small timeout to allow the UI to update to the loading state
    setTimeout(() => {
        try {
            let jsonString = trimmedInput;

            if (activeInputTab === 'xml') {
                const xmlValidation = validateSyntaxLocally(trimmedInput, 'xml');
                if (!xmlValidation?.isValid) {
                    throw new Error(xmlValidation?.reason || 'Invalid XML input.');
                }
                const jsonObj = convertXmlToJson(trimmedInput);
                jsonString = JSON.stringify(jsonObj);
            } else {
                const jsonValidation = validateSyntaxLocally(trimmedInput, 'json');
                if (!jsonValidation?.isValid) {
                    throw new Error(jsonValidation?.reason || 'Invalid JSON input.');
                }
            }

            const generatedOutputs: { [key in OutputLanguage]?: string } = {};
            (Object.keys(outputLanguageDetails) as OutputLanguage[]).forEach(lang => {
                try {
                    generatedOutputs[lang] = generateClassFromJSON(jsonString, rootClassName, lang);
                } catch (generationError: any) {
                    console.error(`Failed to generate for ${lang}`, generationError);
                    generatedOutputs[lang] = `// Generation failed for ${lang}: ${generationError.message}`;
                }
            });
            
            setOutputs(generatedOutputs);

        } catch (err: any) {
            setError(`Generation failed. This usually means the input ${activeInputTab.toUpperCase()} data has a formatting error.\n\nDetails: ${err.message || 'An unexpected error occurred.'}`);
        } finally {
            setIsLoading(false);
        }
    }, 50);
  };


  const isActionDisabled = isLoading;
  const currentOutput = outputs[activeOutputTab];
  
  return (
    <>
      <SEO
        title="Data to Class Converter | AI JSON Tools"
        description="Generate class definitions from JSON or XML instantly in multiple languages including TypeScript, Python, Java, C#, Swift, Go, Ruby, and Dart using AI-powered tools."
        keywords="data to class converter, AI class generator, JSON to class, XML to class, generate classes"
        canonical="https://yourdomain.com/data-to-class"
        ogImage="https://yourdomain.com/images/data-to-class.jpg"
        ogUrl="https://yourdomain.com/data-to-class"
      />
      
      <div className="w-full flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Input Data</h2>
            <Tooltip content="Upload a data file to input">
              <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">
                <UploadIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>

          <input ref={fileInputRef} type="file" accept={allowedExtensions[activeInputTab].join(',')} className="hidden" onChange={handleFileChange} />
          
          <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-900 rounded-lg w-fit">
            {(Object.keys(inputLanguageDetails) as InputLanguage[]).map(lang => (
              <button key={lang} onClick={() => setActiveInputTab(lang)} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${activeInputTab === lang ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {inputLanguageDetails[lang].icon} {inputLanguageDetails[lang].label}
              </button>
            ))}
          </div>

          <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 p-4">
            <textarea
              value={inputCode}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={`Paste your ${activeInputTab.toUpperCase()} data here...`}
              className="w-full h-64 bg-transparent resize-none p-2 border border-slate-200 dark:border-slate-700 rounded"
            />
            <div className="flex items-center gap-2 mt-3 mb-3">
              <label className="text-sm font-medium">Root Class Name:</label>
              <input
                type="text"
                value={rootClassName}
                onChange={(e) => setRootClassName(e.target.value)}
                className="px-3 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                placeholder="Root"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleGenerate} disabled={isActionDisabled} className="px-3 py-1 bg-slate-100 rounded">{isLoading ? 'Generating...' : 'Generate'}</button>
              <button onClick={() => resetState()} className="px-3 py-1 bg-slate-100 rounded">Clear</button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xl font-semibold">Generated Code</h2>
            <Tooltip content="Upload a data file to input">
              <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">
                <UploadIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>

          <input ref={fileInputRef} type="file" accept={allowedExtensions[activeInputTab].join(',')} className="hidden" onChange={handleFileChange} />
          
          <div className="overflow-x-auto">
            <div className="flex flex-nowrap items-center gap-1 p-1 bg-slate-200 dark:bg-slate-900 rounded-lg w-max">
              {(Object.keys(outputLanguageDetails) as OutputLanguage[]).map(lang => (
                <button key={lang} onClick={() => setActiveOutputTab(lang)} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${activeOutputTab === lang ? 'font-semibold bg-teal-100 text-brand-primary dark:bg-teal-900/50' : 'font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {outputLanguageDetails[lang].icon} {outputLanguageDetails[lang].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="flex-grow relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
              {error ? (
                <div className="h-full flex flex-col items-center justify-center text-red-700 dark:text-red-300 p-4 text-center">
                  <p>{error}</p>
                </div>
              ) : currentOutput ? (
                <CodeViewer code={currentOutput} language={outputLanguageDetails[activeOutputTab].language} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                  <CubeStackIcon className="h-10 w-10 mb-4 text-slate-300 dark:text-slate-600" />
                  <p>Generated code will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

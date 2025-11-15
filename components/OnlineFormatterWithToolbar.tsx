import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { SpinnerIcon, XmlIcon, CodeBracketIcon, UploadIcon, HtmlIcon, CssIcon, FormatIcon, JavascriptIcon, YamlIcon, TypeScriptIcon, AngularIcon, JavaIcon, GraphQLIcon, CheckIcon, LightningIcon } from './icons';
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
import { validateJsonSyntax, ErrorPosition } from '../utils/errorHighlighter';
import { fixSimpleJsonErrors, getFixSummary, FixChange } from '../utils/simpleJsonFixer';
import { AIErrorDisplay, parseAIError, type AIErrorType } from './AIErrorDisplay';
import { TreeView, FormView, TextView, ConsoleView } from './JsonViewRenderer';
import type { Selection } from '../types';

type Language = 'json' | 'xml' | 'html' | 'css' | 'javascript' | 'typescript' | 'yaml' | 'wsdl' | 'soap' | 'angular' | 'java' | 'graphql';
type ValidationResult = { isValid: boolean; reason: string; isFixableSyntaxError: boolean; suggestedLanguage?: string };
type FormatterMode = 'fast' | 'smart';

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

  // AI Error state
  const [aiError, setAiError] = useState<{ type: AIErrorType; code?: number; message: string; originalError?: string } | null>(null);
  const [lastAiRequest, setLastAiRequest] = useState<(() => Promise<void>) | null>(null);
  
  // Test mode to simulate errors (Ctrl+Shift+E=503, Ctrl+Shift+S=500, Ctrl+Shift+R=429)
  const [testErrorMode, setTestErrorMode] = useState<'503' | '500' | '429' | null>(null);

  // Fast/Smart mode for JSON formatter
  const [formatterMode, setFormatterMode] = useState<FormatterMode>('fast');
  const [errorLines, setErrorLines] = useState<ErrorPosition[]>([]);
  const [appliedFixes, setAppliedFixes] = useState<FixChange[]>([]);
  const [showFixSummary, setShowFixSummary] = useState(false);

  // History for undo/redo (only for JSON)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastSavedToHistoryRef = useRef<string>('');

  // Graph viewer state
  const [showGraph, setShowGraph] = useState(false);
  const [graphCollapsedNodes, setGraphCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNodePath, setSelectedNodePath] = useState<string>('');
  
  // Dropdown states
  const [showBeautifyDropdown, setShowBeautifyDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // View format state for JSON output (Code, Form, Text, Tree, View)
  type ViewFormat = 'code' | 'form' | 'text' | 'tree' | 'view';
  const [viewFormat, setViewFormat] = useState<ViewFormat>('code');
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  // Expand/Collapse state for Form, Tree, and View
  const [expandAllTrigger, setExpandAllTrigger] = useState(false);
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(false);

  // Test mode keyboard shortcuts (Ctrl+Shift+E for 503, Ctrl+Shift+S for 500, Ctrl+Shift+R for 429)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        setTestErrorMode(prev => prev === '503' ? null : '503');
        if (testErrorMode !== '503') {
          console.log('🧪 Test 503 Error Mode ENABLED - Next AI operation will simulate "Service Overloaded" error');
        } else {
          console.log('✅ Test Error Mode DISABLED - Normal AI operation');
        }
      } else if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        setTestErrorMode(prev => prev === '500' ? null : '500');
        if (testErrorMode !== '500') {
          console.log('🧪 Test 500 Error Mode ENABLED - Next AI operation will simulate "Server Error"');
        } else {
          console.log('✅ Test Error Mode DISABLED - Normal AI operation');
        }
      } else if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        setTestErrorMode(prev => prev === '429' ? null : '429');
        if (testErrorMode !== '429') {
          console.log('🧪 Test 429 Error Mode ENABLED - Next AI operation will simulate "Rate Limit" error');
        } else {
          console.log('✅ Test Error Mode DISABLED - Normal AI operation');
        }
      } else if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        // Undo on Ctrl+Z (but not Ctrl+Shift+Z)
        const target = event.target as HTMLElement;
        const isInTextarea = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
        if (!isInTextarea && historyIndex > 0 && activeLanguage === 'json') {
          event.preventDefault();
          handleUndo();
        }
      } else if (event.ctrlKey && event.key === 'y') {
        // Redo on Ctrl+Y
        const target = event.target as HTMLElement;
        const isInTextarea = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
        if (!isInTextarea && historyIndex < history.length - 1 && activeLanguage === 'json') {
          event.preventDefault();
          handleRedo();
        }
      } else if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        // Compact on Ctrl+Shift+L
        event.preventDefault();
        if (activeLanguage === 'json' && inputCode.trim()) {
          handleCompact();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [testErrorMode, historyIndex, history.length, activeLanguage]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowBeautifyDropdown(false);
        setShowSortDropdown(false);
      }
    };

    if (showBeautifyDropdown || showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBeautifyDropdown, showSortDropdown]);

  const resetState = (keepInput = false) => {
    if (!keepInput) setInputCode('');
    setOutputError(null);
    setOutputCode(null);
    setValidationError(null);
    setSuccessMessage(null);
    setIsValidated(false);
    setErrorLines([]);
    setAppliedFixes([]);
    setShowFixSummary(false);
    setAiError(null);
    setLastAiRequest(null);
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
    setErrorLines([]);
    setAppliedFixes([]);
    setShowFixSummary(false);
  };
  
  // Add to history with debounce for manual edits
  useEffect(() => {
    if (activeLanguage !== 'json' || !inputCode.trim()) return;
    
    // Only add to history if the value has actually changed significantly
    if (inputCode !== lastSavedToHistoryRef.current) {
      const timeoutId = setTimeout(() => {
        const currentHistoryValue = history[historyIndex];
        if (inputCode !== currentHistoryValue) {
          addToHistory(inputCode);
          lastSavedToHistoryRef.current = inputCode;
        }
      }, 1000); // Debounce for 1 second after user stops typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [inputCode, activeLanguage]);

  // Sync fullscreen state with actual fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      
      // Add/remove class on body to control visibility of navigation
      if (isInFullscreen) {
        document.body.classList.add('is-fullscreen');
      } else {
        document.body.classList.remove('is-fullscreen');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.body.classList.remove('is-fullscreen');
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showViewDropdown && !target.closest('.view-dropdown-container')) {
        setShowViewDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showViewDropdown]);


  // Add to history
  const addToHistory = (value: string) => {
    if (activeLanguage === 'json') {
      const newHistory = [...history.slice(0, historyIndex + 1), value];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      lastSavedToHistoryRef.current = value;
    }
  };

  // Check if error is complex (not fixable by simple auto-fix) - only for JSON
  const isComplexError = (error: ErrorPosition): boolean => {
    const message = error.message || '';
    
    // First check if it's a bracket/structural error (always complex)
    const complexPatterns = [
      'Mismatched brackets',
      'Unclosed',
      'Unexpected closing bracket',
      'expected \'}\' but found',
      'expected \']\' but found',
      'Missing opening bracket',
      'Missing closing bracket'
    ];
    
    // If it matches complex patterns, it's definitely complex
    if (complexPatterns.some(pattern => message.includes(pattern))) {
      return true;
    }
    
    // Check if error message mentions "Expected" with bracket symbols - this indicates structural issues
    if (message.includes('Expected') && (message.includes('}') || message.includes(']'))) {
      return true;
    }
    
    // Check if it's a simple pattern (specific cases only)
    const simplePatterns = [
      'Missing comma after property value',
      'Trailing comma',
      'single quote',
      'Unquoted key'
    ];
    
    // If it matches simple patterns, it's simple
    // Otherwise it's complex
    return !simplePatterns.some(pattern => message.includes(pattern));
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

  // Handle automatic fixing of simple JSON errors - only for JSON in Fast mode
  const handleFixSimpleErrors = async () => {
    if (activeLanguage !== 'json') return;
    
    const result = fixSimpleJsonErrors(inputCode);
    
    if (result.wasFixed) {
      // Update the input with fixed JSON
      setInputCode(result.fixed);
      setAppliedFixes(result.changes);
      addToHistory(result.fixed);
      
      // Re-validate to check for remaining errors
      const remainingErrors = validateJsonSyntax(result.fixed);
      setErrorLines(remainingErrors);
      
      // If there are remaining errors, show them
      if (remainingErrors.length > 0) {
        setValidationError({
          isValid: false,
          reason: `Remaining errors after auto-fix: ${remainingErrors.length} error${remainingErrors.length > 1 ? 's' : ''}`,
          isFixableSyntaxError: true,
          suggestedLanguage: undefined
        });
        setShowFixSummary(true);
        setIsValidated(false);
      } else {
        // All errors fixed! Mark as validated and ready to format
        setValidationError(null);
        setSuccessMessage(`✅ All syntax errors have been fixed! Applied ${result.changes.length} fix${result.changes.length > 1 ? 'es' : ''}. You can now format your JSON.`);
        setShowFixSummary(true);
        setIsValidated(true);
      }
    } else {
      // No fixes could be applied
      setAppliedFixes([]);
      setShowFixSummary(true);
    }
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
      // For JSON, use enhanced validation with error detection
      if (activeLanguage === 'json') {
        try {
          JSON.parse(trimmedInput);
          // Valid JSON
          setErrorLines([]);
          setSuccessMessage("✅ JSON is valid! You can now format the code.");
          setIsValidated(true);
          setIsValidating(false);
          return;
        } catch (err: any) {
          // JSON has syntax error - validate and find all errors
          const allErrors = validateJsonSyntax(trimmedInput);
          setErrorLines(allErrors);
          
          if (formatterMode === 'smart') {
            // Smart mode: Always offer AI-powered correction
            let errorAnalysis = `### Invalid JSON Syntax\n\n**Error Details:**\n${err.message}`;

            if (allErrors.length > 0) {
              errorAnalysis += `\n\n**Error Locations:**\n`;
              allErrors.forEach(error => {
                errorAnalysis += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
              });
            }

            errorAnalysis += `\n\n**What Happened:**\nThe JSON you provided has syntax errors that prevent it from being parsed. This could be due to:\n- Missing or extra commas\n- Unclosed quotes or brackets\n- Invalid characters or formatting\n\n### AI-Powered Resolution Available\n\nSince you're using Smart Mode (AI), I can attempt to automatically fix these syntax errors for you.\n\n**Suggestions:**\n1. Click the "Fix Complex Errors with AI" button to let AI fix the syntax errors\n2. Or manually review and fix the JSON syntax\n3. Common issues: trailing commas, unquoted keys, single quotes instead of double quotes`;
            
            setValidationError({
              isValid: false,
              reason: errorAnalysis,
              isFixableSyntaxError: true,
              suggestedLanguage: undefined
            });
          } else {
            // Fast mode: Check if errors are simple or complex
            const hasComplexErrors = allErrors.some(isComplexError);
            
            if (hasComplexErrors) {
              // Has complex errors - suggest Smart mode
              let fastError = `Invalid JSON syntax: ${err.message}\n\n📍 Error Locations:\n`;
              allErrors.forEach(error => {
                fastError += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
              });
              
              setValidationError({
                isValid: false,
                reason: fastError,
                isFixableSyntaxError: true,
                suggestedLanguage: undefined
              });
            } else {
              // Only simple errors - can be fixed
              let fastError = `Invalid JSON syntax: ${err.message}\n\n📍 Error Locations:\n`;
              allErrors.forEach(error => {
                fastError += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
              });
              
              setValidationError({
                isValid: false,
                reason: fastError,
                isFixableSyntaxError: true,
                suggestedLanguage: undefined
              });
            }
          }
          setIsValidating(false);
          return;
        }
      }

      // For other languages, use existing validation logic
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

      // Store AI validation request for retry
      const executeValidation = async () => {
        // Test mode: Simulate AI errors
        if (testErrorMode === '503') {
          setTestErrorMode(null); // Auto-disable after one use
          throw {
            error: {
              code: 503,
              message: "The model is overloaded. Please try again later.",
              status: "UNAVAILABLE"
            }
          };
        } else if (testErrorMode === '500') {
          setTestErrorMode(null); // Auto-disable after one use
          throw {
            error: {
              code: 500,
              message: "Internal Server Error",
              status: "INTERNAL_SERVER_ERROR"
            }
          };
        } else if (testErrorMode === '429') {
          setTestErrorMode(null); // Auto-disable after one use
          throw {
            error: {
              code: 429,
              message: "Resource has been exhausted (e.g. check quota).",
              status: "RESOURCE_EXHAUSTED"
            }
          };
        }
        
        const result = await validateCodeSyntax(trimmedInput, activeLanguage);
        if (result.isValid) {
          setSuccessMessage("Validation successful! You can now format the code.");
          setIsValidated(true);
          setLastAiRequest(null);
        } else {
          setValidationError(result);
          setLastAiRequest(null);
        }
      };

      setLastAiRequest(() => async () => {
        setIsValidating(true);
        setAiError(null);
        try {
          await executeValidation();
        } catch (err: any) {
          const parsedError = parseAIError(err);
          setAiError(parsedError);
        } finally {
          setIsValidating(false);
        }
      });

      await executeValidation();
    } catch (err: any) {
        // Check if this is an AI error (from validateCodeSyntax)
        if (err.message && (err.message.includes('API') || err.message.includes('AI') || err.message.includes('timed out') || err.message.includes('rate limit') || err.message.includes('Server Error'))) {
          const parsedError = parseAIError(err);
          setAiError(parsedError);
        } else {
          setValidationError({
              isValid: false,
              reason: `The validator encountered an issue. Please check the syntax of your ${activeLanguage} code.\n\nDetails: ${err.message}`,
              isFixableSyntaxError: true,
              suggestedLanguage: undefined
          });
        }
    } finally {
      setIsValidating(false);
    }
  };

  const handleAutoCorrect = async () => {
    if (!inputCode) return;
    
    // Store the request for retry functionality
    const executeCorrection = async () => {
      setIsCorrecting(true);
      setValidationError(null);
      setOutputError(null);
      setErrorLines([]);
      setAiError(null);
      
      try {
          // Test mode: Simulate AI errors
          if (testErrorMode === '503') {
            setTestErrorMode(null); // Auto-disable after one use
            throw {
              error: {
                code: 503,
                message: "The model is overloaded. Please try again later.",
                status: "UNAVAILABLE"
              }
            };
          } else if (testErrorMode === '500') {
            setTestErrorMode(null); // Auto-disable after one use
            throw {
              error: {
                code: 500,
                message: "Internal Server Error",
                status: "INTERNAL_SERVER_ERROR"
              }
            };
          } else if (testErrorMode === '429') {
            setTestErrorMode(null); // Auto-disable after one use
            throw {
              error: {
                code: 429,
                message: "Resource has been exhausted (e.g. check quota).",
                status: "RESOURCE_EXHAUSTED"
              }
            };
          }
          
          const correctedCode = await correctCodeSyntax(inputCode, activeLanguage);
          setInputCode(correctedCode);
          addToHistory(correctedCode);
          setIsValidated(true);
          setSuccessMessage("✅ AI successfully corrected the syntax. You can now format the code.");
          setShowFixSummary(false);
          setLastAiRequest(null);
      } catch (err: any) {
          // Parse and display user-friendly AI error
          const parsedError = parseAIError(err);
          setAiError(parsedError);
          setIsValidated(false);
      } finally {
          setIsCorrecting(false);
      }
    };
    
    setLastAiRequest(() => executeCorrection);
    await executeCorrection();
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

  const handleCompact = () => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput || activeLanguage !== 'json') return;

    try {
      const jsonObj = JSON.parse(trimmedInput);
      const compacted = JSON.stringify(jsonObj); // Remove all whitespaces
      setOutputCode(compacted);
      addToHistory(compacted);
      setValidationError(null);
      setOutputError(null);
    } catch (err: any) {
      setValidationError({
        isValid: false,
        reason: `Compact failed: ${err.message}`,
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
    if (!inputCode.trim()) return; // Don't copy if no input
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
    if (!inputCode.trim()) return; // Don't clear if already empty
    resetState();
    setHistory([]);
    setHistoryIndex(-1);
  };

  // Clear Output: clear all output data
  const handleClearOutput = () => {
    if (!outputCode.trim()) return; // Don't clear if already empty
    setOutputCode('');
    setValidationError(null);
  };

  // Move: copy data from input box to output box
  const handleMove = () => {
    if (!inputCode.trim()) return; // Don't move if input is empty
    setOutputCode(inputCode);
  };

  // Expand All Fields: expand all nodes in Form, Tree, and View
  const handleExpandAllFields = () => {
    setExpandAllTrigger(!expandAllTrigger);
    setCollapseAllTrigger(false);
  };

  // Collapse All Fields: collapse all nodes in Form, Tree, and View
  const handleCollapseAllFields = () => {
    setCollapseAllTrigger(!collapseAllTrigger);
    setExpandAllTrigger(false);
  };

  // Download: always downloads to default folder
  const handleDownload = () => {
    if (!inputCode.trim()) return;
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

  // Save: open Save As dialog (File System Access API), no fallback on cancel
  const handleSave = async () => {
    if (!inputCode.trim()) return;
    const content = outputCode || inputCode;
    if (!content) return;
    const ext = activeLanguage === 'typescript' ? 'ts' : activeLanguage === 'javascript' ? 'js' : activeLanguage;
    const fileName = `formatted.${ext}`;
    // Try File System Access API
    // @ts-ignore
    if (window.showSaveFilePicker) {
      try {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: `${activeLanguage.toUpperCase()} File`,
              accept: { 'text/plain': [`.${ext}`] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      } catch (err: any) {
        // Check if user cancelled (AbortError) vs actual error
        if (err.name === 'AbortError') {
          // User clicked Cancel - do nothing
          console.log('Save dialog was cancelled by user');
          return;
        }
        // For other errors, log but don't fallback
        console.warn('Save As dialog error:', err);
        return;
      }
    }
    // If File System Access API is not supported, show alert
    alert('Save dialog is not supported in your browser. Please use Download instead.');
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

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // AI Error handlers
  const handleRetryAiRequest = async () => {
    if (lastAiRequest) {
      await lastAiRequest();
    }
  };

  const handleSwitchToFastMode = () => {
    setFormatterMode('fast');
    setAiError(null);
    setLastAiRequest(null);
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

  // Expand all nodes in graph
  const handleGraphExpandAll = () => {
    setGraphCollapsedNodes(new Set());
  };

  // Collapse all nodes in graph
  const handleGraphCollapseAll = () => {
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
        {/* Language selector - removed from here, moved to middle toolbar */}

        {/* JSON Toolbar - Hidden, functionality moved to smaller buttons */}
        {/* {isJsonLanguage && (
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
        )} */}

        {/* Compact toolbar with smaller buttons and dropdowns */}
        {isJsonLanguage && (
          <div className="flex items-center justify-between gap-2 bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-3 overflow-visible z-20">
            <div className="flex items-center gap-2 overflow-visible">
              {/* Beautify button with dropdown */}
              <div className="relative dropdown-container overflow-visible">
                <button
                  onClick={() => {
                    if (isActionDisabled || !inputCode.trim()) return;
                    setShowBeautifyDropdown(!showBeautifyDropdown);
                  }}
                  className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Beautify JSON"
                >
                  <span>🎨</span>
                  <span>Beautify</span>
                  <span className="text-xs">▼</span>
                </button>
                {/* Dropdown menu */}
                {showBeautifyDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-[140px]">
                    <button
                      onClick={() => {
                        if (isActionDisabled || !inputCode.trim()) return;
                        handleFormat(2);
                        setShowBeautifyDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-900 dark:text-gray-100"
                    >
                      2 Spaces
                    </button>
                    <button
                      onClick={() => {
                        if (isActionDisabled || !inputCode.trim()) return;
                        handleFormat(4);
                        setShowBeautifyDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-900 dark:text-gray-100"
                    >
                      4 Spaces
                    </button>
                    <button
                      onClick={() => {
                        if (isActionDisabled || !inputCode.trim()) return;
                        handleFormat(0);
                        setShowBeautifyDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-900 dark:text-gray-100"
                    >
                      Tab
                    </button>
                  </div>
                )}
              </div>

              {/* Minify button */}
              <button
                onClick={() => {
                  if (isActionDisabled || !inputCode.trim()) return;
                  handleMinify();
                }}
                className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Minify JSON"
              >
                <span>📦</span>
                <span>Minify</span>
              </button>

              {/* Sort button with dropdown */}
              <div className="relative dropdown-container overflow-visible">
                <button
                  onClick={() => {
                    if (isActionDisabled || !inputCode.trim()) return;
                    setShowSortDropdown(!showSortDropdown);
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Sort JSON"
                >
                  <span>🔼</span>
                  <span>Sort</span>
                  <span className="text-xs">▼</span>
                </button>
                {/* Dropdown menu */}
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-[160px]">
                    <button
                      onClick={() => {
                        if (isActionDisabled || !inputCode.trim()) return;
                        handleSort('asc', 'keys');
                        setShowSortDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100"
                    >
                      Keys (A → Z)
                    </button>
                    <button
                      onClick={() => {
                        if (isActionDisabled || !inputCode.trim()) return;
                        handleSort('desc', 'keys');
                        setShowSortDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100"
                    >
                      Keys (Z → A)
                    </button>
                    <button
                      onClick={() => {
                        if (isActionDisabled || !inputCode.trim()) return;
                        handleSort('asc', 'values');
                        setShowSortDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100"
                    >
                      Values (A → Z)
                    </button>
                    <button
                      onClick={() => {
                        if (isActionDisabled || !inputCode.trim()) return;
                        handleSort('desc', 'values');
                        setShowSortDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100"
                    >
                      Values (Z → A)
                    </button>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>

              {/* Validate button */}
              <button
                onClick={() => {
                  if (isActionDisabled || !inputCode.trim()) return;
                  handleValidate();
                }}
                className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Validate JSON"
              >
                <span>✓</span>
                <span>Validate</span>
              </button>
            </div>

            {/* Right side controls - Mode selector and Format selector */}
            <div className="flex items-center gap-4">
              {/* Mode selector - Fast/Smart(AI) */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setFormatterMode('fast')}
                    className={`px-3 py-1.5 rounded-md transition-all text-sm flex items-center gap-1.5 ${
                      formatterMode === 'fast'
                        ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-lg font-semibold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    <LightningIcon className="h-3.5 w-3.5" />
                    <span>Fast</span>
                  </button>
                  <button
                    onClick={() => setFormatterMode('smart')}
                    className={`px-3 py-1.5 rounded-md transition-all text-sm flex items-center gap-1.5 ${
                      formatterMode === 'smart'
                        ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white shadow-lg font-semibold'
                        : 'bg-gradient-to-r from-purple-300 via-pink-300 to-red-300 text-white hover:from-purple-500 hover:via-pink-500 hover:to-red-500'
                    }`}
                  >
                    <span>🤖</span>
                    <span>Smart (AI)</span>
                  </button>
                </div>
                {/* Test mode indicator */}
                {testErrorMode && (
                  <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded border border-red-300 dark:border-red-700 animate-pulse">
                    🧪 Test {testErrorMode} Error
                  </span>
                )}
              </div>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>

              {/* Format selector */}
              <div className="flex items-center gap-3">
                <label htmlFor="language-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">Format:</label>
                <select
                  id="language-select"
                  value={activeLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="px-3 py-1.5 text-sm rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                >
                  {Object.keys(languageDetails).map(lang => (
                    <option key={lang} value={lang}>{languageDetails[lang as Language].label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* For non-JSON languages, show simpler toolbar with just Format selector */}
        {!isJsonLanguage && (
          <div className="flex items-center justify-center gap-3 bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-3">
            <label htmlFor="language-select-simple" className="text-sm font-medium text-gray-700 dark:text-gray-300">Format:</label>
            <select
              id="language-select-simple"
              value={activeLanguage}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="px-3 py-1.5 text-sm rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
            >
              {Object.keys(languageDetails).map(lang => (
                <option key={lang} value={lang}>{languageDetails[lang as Language].label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept={languageDetails[activeLanguage].extensions.join(',')} className="hidden" onChange={handleFileChange} />

        {/* Copy Success Toast */}
        {copySuccess && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            ✓ Copied to clipboard!
          </div>
        )}

        {/* Editor Area */}
        <div className="w-full flex flex-col lg:flex-row gap-6 min-h-[600px]">
          <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-3 min-h-[600px] relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 relative z-50">
                <h2 className="text-lg font-semibold">Input</h2>
                {/* Icon Toolbar - positioned next to "Input" heading */}
                <div className="flex items-center gap-1 opacity-100 pointer-events-auto relative z-50">
                  {/* Graph button - only for JSON */}
                  {isJsonLanguage && (
                    <>
                      <Tooltip content="Visualize as graph">
                        <button
                          onClick={handleShowGraph}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                          aria-label="Graph"
                          title="Visualize as graph"
                        >
                          📊
                        </button>
                      </Tooltip>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                    </>
                  )}
                  <Tooltip content="Print">
                    <button
                      onClick={handlePrint}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                      aria-label="Print"
                      title="Print JSON (Ctrl+P)"
                    >
                      🖨️
                    </button>
                  </Tooltip>
                  <Tooltip content="Copy to clipboard">
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                      aria-label="Copy"
                      title="Copy to clipboard (Ctrl+C)"
                    >
                      📋
                    </button>
                  </Tooltip>
                  {/* Compact button - only for JSON */}
                  {isJsonLanguage && (
                    <Tooltip content="Compact JSON data, remove all whitespaces">
                      <button
                        onClick={handleCompact}
                        className="p-1 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-xl cursor-pointer"
                        aria-label="Compact"
                        title="Compact JSON data, remove all whitespaces (Ctrl+Shift+L)"
                      >
                        📦
                      </button>
                    </Tooltip>
                  )}
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                  <Tooltip content="Undo last change">
                    <button
                      onClick={handleUndo}
                      className="p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-xl cursor-pointer"
                      aria-label="Undo"
                      title="Undo last change (Ctrl+Z)"
                    >
                      ↩️
                    </button>
                  </Tooltip>
                  <Tooltip content="Redo last change">
                    <button
                      onClick={handleRedo}
                      className="p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-xl cursor-pointer"
                      aria-label="Redo"
                      title="Redo last change (Ctrl+Y)"
                    >
                      ↪️
                    </button>
                  </Tooltip>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                  {!isFullscreen && (
                    <>
                      <Tooltip content="Enter fullscreen">
                        <button
                          onClick={handleToggleFullscreen}
                          className="p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                          aria-label="Enter Fullscreen"
                          title="Enter fullscreen (F11)"
                        >
                          ⛶
                        </button>
                      </Tooltip>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                    </>
                  )}
                  <Tooltip content="Clear input">
                    <button
                      onClick={handleClear}
                      className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xl cursor-pointer"
                      aria-label="Clear"
                      title="Clear all content"
                    >
                      🗑️
                    </button>
                  </Tooltip>
                  <Tooltip content="Move input to output">
                    <button
                      type="button"
                      onClick={handleMove}
                      className="p-1 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all text-xl cursor-pointer opacity-100 pointer-events-auto relative z-50"
                      aria-label="Move to Output"
                      title="Move input data to output"
                    >
                      ➡️
                    </button>
                  </Tooltip>
                </div>
              </div>
              <span className="text-xs text-slate-500">{inputCode.length} chars</span>
            </div>

            <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 relative">
              {/* Upload, Download and Save icons - positioned at top right inside the textarea box */}
              <div className="absolute top-2 right-6 z-10 flex items-center gap-1.5">
                <Tooltip content="Upload a code file">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-blue-600 dark:text-blue-400"
                    aria-label="Upload File"
                    title="Upload a code file to input"
                  >
                    U
                  </button>
                </Tooltip>
                <Tooltip content="Download to file">
                  <button
                    onClick={handleDownload}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-green-600 dark:text-green-400"
                    aria-label="Download File"
                    title="Download to file"
                  >
                    D
                  </button>
                </Tooltip>
                <Tooltip content="Save to file">
                  <button
                    onClick={handleSave}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-orange-600 dark:text-orange-400"
                    aria-label="Save File"
                    title="Save to file"
                  >
                    S
                  </button>
                </Tooltip>
              </div>
              
              <textarea
                value={inputCode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={`Enter your ${activeLanguage.toUpperCase()} code here...`}
                className="w-full flex-grow bg-transparent resize-none p-4 pr-28 border-none focus:outline-none font-mono text-sm"
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

          <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-3 min-h-[600px]">
            {/* Output heading with View selector and Exit fullscreen button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Formatted Output</h2>
                <Tooltip content="Clear output">
                  <button
                    onClick={handleClearOutput}
                    className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xl cursor-pointer"
                    aria-label="Clear Output"
                    title="Clear all output content"
                  >
                    🗑️
                  </button>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                {/* Expand/Collapse buttons - visible only for Form, Tree, and View */}
                {activeLanguage === 'json' && ['form', 'tree', 'view'].includes(viewFormat) && (
                  <>
                    <Tooltip content="Expand all fields">
                      <button
                        onClick={handleExpandAllFields}
                        className="p-1 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-2xl cursor-pointer"
                        aria-label="Expand All"
                        title="Expand all fields"
                      >
                        📂
                      </button>
                    </Tooltip>
                    <Tooltip content="Collapse all fields">
                      <button
                        onClick={handleCollapseAllFields}
                        className="p-1 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-2xl cursor-pointer"
                        aria-label="Collapse All"
                        title="Collapse all fields"
                      >
                        📁
                      </button>
                    </Tooltip>
                  </>
                )}
                {/* View Format Dropdown - visible by default for JSON */}
                {activeLanguage === 'json' && (
                  <div className="relative view-dropdown-container">
                    <button
                      onClick={() => {
                        console.log('View dropdown clicked, current format:', viewFormat);
                        setShowViewDropdown(!showViewDropdown);
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                      aria-label="Select View Format"
                      title="Select view format"
                    >
                      <span>{viewFormat.charAt(0).toUpperCase() + viewFormat.slice(1)}</span>
                      <span className="text-xs">▼</span>
                    </button>
                    {showViewDropdown && (
                      <div className="absolute right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-20 min-w-[120px]">
                        {(['code', 'form', 'text', 'tree', 'view'] as ViewFormat[]).map((format) => (
                          <button
                            key={format}
                            onClick={() => {
                              setViewFormat(format);
                              setShowViewDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                              viewFormat === format ? 'bg-slate-100 dark:bg-slate-700 font-semibold' : ''
                            }`}
                          >
                            {format.charAt(0).toUpperCase() + format.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {isFullscreen && (
                  <Tooltip content="Exit fullscreen">
                    <button
                      onClick={handleToggleFullscreen}
                      className="px-3 py-1.5 text-sm bg-slate-800 dark:bg-slate-700 text-white rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-all cursor-pointer flex items-center gap-1.5"
                      aria-label="Exit Fullscreen"
                      title="Exit fullscreen (F11 or Esc)"
                    >
                      <span>⮾</span>
                      <span>Exit</span>
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="flex-grow w-full rounded-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 relative">
              {/* Download, Copy and Save icons - positioned at top right inside the output box */}
              <div className="absolute top-2 right-6 z-10 flex items-center gap-1.5">
                <Tooltip content="Download formatted file">
                  <button
                    onClick={handleDownload}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-green-600 dark:text-green-400"
                    aria-label="Download"
                    title="Download formatted file"
                  >
                    D
                  </button>
                </Tooltip>
                <Tooltip content="Copy to clipboard">
                  <button
                    onClick={handleCopy}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-purple-600 dark:text-purple-400"
                    aria-label="Copy"
                    title="Copy to clipboard"
                  >
                    C
                  </button>
                </Tooltip>
                <Tooltip content="Save to file">
                  <button
                    onClick={handleSave}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-orange-600 dark:text-orange-400"
                    aria-label="Save"
                    title="Save to file"
                  >
                    S
                  </button>
                </Tooltip>
              </div>
              <div className="flex-grow relative bg-slate-50 dark:bg-slate-900/50 min-h-0">
                {isLoading ? (
                  <FormattingLoading />
                ) : isValidating ? (
                  <ValidationLoading />
                ) : isCorrecting ? (
                  <AutoCorrectionLoading />
                ) : aiError ? (
                  <div className="h-full overflow-auto p-4 flex items-center justify-center">
                    <AIErrorDisplay 
                      error={aiError}
                      onRetry={lastAiRequest ? handleRetryAiRequest : undefined}
                      onSwitchToFastMode={formatterMode === 'smart' ? handleSwitchToFastMode : undefined}
                    />
                  </div>
                ) : outputError ? (
                  <div className="h-full flex flex-col items-center justify-center text-red-700 dark:text-red-300 p-4 text-center">
                    <p>{outputError}</p>
                  </div>
                ) : validationError ? (
                  <div className="h-full overflow-auto p-4">
                    {/* For JSON with detailed error display */}
                    {activeLanguage === 'json' && errorLines.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 mb-4">
                          <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                              {errorLines.length} Syntax Error{errorLines.length > 1 ? 's' : ''} Found
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                              {validationError.reason.split('\n')[0]}
                            </p>
                          </div>
                        </div>

                        {/* Fix Summary - shown after auto-fix is applied */}
                        {showFixSummary && appliedFixes.length > 0 && (
                          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                            <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              ✅ Automatically Fixed {appliedFixes.length} Issue{appliedFixes.length > 1 ? 's' : ''}
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                              {getFixSummary(appliedFixes)}
                            </p>
                            <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                              {appliedFixes.map((fix, idx) => (
                                <div key={idx}>• Line {fix.line}: {fix.description}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Error List */}
                        <div className="border-2 border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10 mb-4">
                          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                            {errorLines.map((error, idx) => (
                              <div 
                                key={idx} 
                                className={`p-2 bg-white dark:bg-slate-800 rounded border-l-4 ${
                                  isComplexError(error) 
                                    ? 'border-purple-500' 
                                    : 'border-blue-500'
                                } text-xs`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-semibold ${
                                    isComplexError(error)
                                      ? 'text-purple-700 dark:text-purple-300'
                                      : 'text-blue-700 dark:text-blue-300'
                                  }`}>
                                    Line {error.line}, Column {error.column}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    isComplexError(error)
                                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {isComplexError(error) ? 'Complex' : 'Simple'}
                                  </span>
                                </div>
                                <p className={`${
                                  isComplexError(error)
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                } font-mono`}>
                                  {error.message || 'Syntax error detected'}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons based on Mode and Error Type */}
                          {formatterMode === 'fast' ? (
                            /* FAST MODE */
                            <>
                              {/* Case 1: Only Simple Errors - Enable "Fix Simple Errors" */}
                              {errorLines.every(e => !isComplexError(e)) ? (
                                <div className="mt-3">
                                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                    ✓ All errors can be automatically fixed! Click below to fix common errors like missing commas, trailing commas, unquoted keys, and single quotes (95%+ success rate).
                                  </p>
                                  <button
                                    onClick={handleFixSimpleErrors}
                                    disabled={isActionDisabled}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Fix Simple Errors
                                  </button>
                                </div>
                              ) : (
                                /* Case 2 & 3: Has Complex Errors - Disabled "Fix Simple Errors" with advice */
                                <div className="mt-3">
                                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded-lg mb-3">
                                    <p className="text-sm text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                      <span className="font-medium">Complex Errors Detected</span>
                                    </p>
                                    <p className="text-xs text-purple-700 dark:text-purple-300">
                                      Your JSON contains complex errors (like bracket mismatches or structural issues) that require AI-powered fixing. Please switch to <span className="font-semibold">Smart (AI)</span> mode for advanced error correction with bracket matching and context-aware repairs.
                                    </p>
                                  </div>
                                  <button
                                    disabled
                                    className="w-full px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Fix Simple Errors (Unavailable)
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            /* SMART (AI) MODE */
                            <div className="mt-3">
                              <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                                AI-powered error correction can handle all types of errors including bracket mismatches, structural issues, and complex syntax problems.
                              </p>
                              <button
                                onClick={handleAutoCorrect}
                                disabled={isActionDisabled || isCorrecting}
                                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                                </svg>
                                {isCorrecting ? 'Fixing...' : 'Fix Complex Errors with AI'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* For other languages or general errors */
                      <ErrorAnalysisDisplay
                        title={validationError.reason.includes("Formatting failed") ? "Formatting Failed" : "Validation Failed"}
                        analysisText={validationError.reason}
                        showAutoCorrectButton={!!validationError.isFixableSyntaxError && activeLanguage !== 'json'}
                        onAutoCorrect={handleAutoCorrect}
                        isCorrecting={isCorrecting}
                      />
                    )}
                  </div>
                ) : successMessage ? (
                  <div className="h-full flex flex-col items-center justify-center text-green-700 dark:text-green-300 p-4 text-center">
                    <CheckIcon className="h-10 w-10 mb-4" />
                    <p>{successMessage}</p>
                  </div>
                ) : outputCode ? (
                  <div className="h-full w-full">
                    {/* Render different views based on viewFormat for JSON */}
                    {activeLanguage === 'json' && viewFormat !== 'code' ? (
                      (() => {
                        try {
                          const parsedData = JSON.parse(outputCode);
                          switch (viewFormat) {
                            case 'tree':
                              return <TreeView data={parsedData} expandAll={expandAllTrigger} collapseAll={collapseAllTrigger} />;
                            case 'form':
                              return <FormView data={parsedData} expandAll={expandAllTrigger} collapseAll={collapseAllTrigger} />;
                            case 'text':
                              return <TextView code={outputCode} />;
                            case 'view':
                              return <ConsoleView data={parsedData} expandAll={expandAllTrigger} collapseAll={collapseAllTrigger} />;
                            default:
                              return <CodeViewer code={outputCode} language={activeLanguage} />;
                          }
                        } catch (error) {
                          return <CodeViewer code={outputCode} language={activeLanguage} />;
                        }
                      })()
                    ) : (
                      <CodeViewer code={outputCode} language={activeLanguage} />
                    )}
                  </div>
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
                    onClick={handleGraphExpandAll}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-700 flex items-center gap-2"
                    title="Expand all nodes"
                  >
                    <span>➕</span>
                    <span className="hidden sm:inline">Expand All</span>
                  </button>
                  
                  <button
                    onClick={handleGraphCollapseAll}
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

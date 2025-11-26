import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { JMESPathTransform } from './JMESPathTransform';
import { SpinnerIcon, XmlIcon, CodeBracketIcon, UploadIcon, HtmlIcon, CssIcon, FormatIcon, JavascriptIcon, YamlIcon, TypeScriptIcon, AngularIcon, JavaIcon, GraphQLIcon, CheckIcon, LightningIcon } from './icons';
import { beautifyAngular, beautifyCss, beautifyGraphql, beautifyJs, beautifyTs, beautifyYaml, formatXml } from '../utils/formatters';
import { beautifyJava } from '../utils/codeGenerator';
import { CodeMirrorViewer } from './CodeMirrorViewer';
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
import { TreeView, FormView, TextView, ConsoleView, TableView, type TableViewRef } from './UnifiedJsonViewRenderer';
import { analyzeJsonStructure } from '../utils/jsonStructureAnalyzer';
import { StatisticsDetailViewer } from './StatisticsDetailViewer';
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
    const [hasCommentsInInput, setHasCommentsInInput] = useState(false);
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
  const [errorSource, setErrorSource] = useState<'input' | 'output'>('input'); // Track if errors are from input or output

  // History for undo/redo (only for JSON)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastSavedToHistoryRef = useRef<string>('');

  // Output formatter history (tracks outputCode states for undo/redo independently of input JSON history)
  const [outputHistory, setOutputHistory] = useState<string[]>([]);
  const [outputHistoryIndex, setOutputHistoryIndex] = useState(-1);
  const isApplyingOutputHistoryRef = useRef(false);

  // Graph viewer state
  const [showGraph, setShowGraph] = useState(false);
  const [graphCollapsedNodes, setGraphCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNodePath, setSelectedNodePath] = useState<string>('');
  
  // Dropdown states
  const [showBeautifyDropdown, setShowBeautifyDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // JMESPath Transform modal state
  const [showJMESPathModal, setShowJMESPathModal] = useState(false);

  // View format state for JSON output (Code, Form, Text, Tree, View, Table)
  type ViewFormat = 'code' | 'form' | 'text' | 'tree' | 'view' | 'table';
  const [viewFormat, setViewFormat] = useState<ViewFormat>('code');
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [previousView, setPreviousView] = useState<ViewFormat>('code'); // Track the view before error

  // Pending action after error fix (view switch, save, or download)
  type PendingAction = { type: 'view-switch', targetView: ViewFormat } | { type: 'save' } | { type: 'download' } | null;
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Expand/Collapse state for Form, Tree, and View
  const [expandAllTrigger, setExpandAllTrigger] = useState(false);
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(false);

  // Structure analysis mode - when active, only "View" format is available
  const [isStructureAnalysisMode, setIsStructureAnalysisMode] = useState(false);

  // Ref for TableView component to access its helper functions
  const tableViewRef = useRef<TableViewRef>(null);

  // Reset output history when view format changes (so undo/redo starts disabled in new view)
  useEffect(() => {
    // Clear output history and reset index when switching views
    setOutputHistory([]);
    setOutputHistoryIndex(-1);
  }, [viewFormat]);

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
    setValidationError(null);
    setSuccessMessage(null);
    setIsValidated(false);
    setErrorLines([]);
    setAppliedFixes([]);
    setShowFixSummary(false);
    setHasCommentsInInput(false);

    if (activeLanguage === 'json' && value.trim()) {
      try {
        JSON.parse(value);
        setOutputCode(value);
        setErrorLines([]);
      } catch (jsonErr: any) {
        const allErrors = validateJsonSyntax(value);
        setErrorLines(allErrors);
        setErrorSource('input');
        setOutputCode(null);

        // Comment detection for auto-validation path
        const singleLineMatches = Array.from(value.matchAll(/\/\/.*$/gm));
        const multiLineMatches = Array.from(value.matchAll(/\/\*[\s\S]*?\*\//g));
        const commentsCount = singleLineMatches.length + multiLineMatches.length;
        let commentInfo = '';
        if (commentsCount > 0) {
          setHasCommentsInInput(true);
          commentInfo = `\n\n📝 **Comments Detected** (${commentsCount}):\n`;
          singleLineMatches.forEach(m => {
            if (m.index !== undefined) {
              const preview = m[0].substring(0, 50).replace(/\n/g, ' ');
              const line = value.substring(0, m.index).split('\n').length;
              commentInfo += `- Line ${line}: // ${preview}${m[0].length > 50 ? '...' : ''}\n`;
            }
          });
          multiLineMatches.forEach(m => {
            if (m.index !== undefined) {
              const preview = m[0].substring(0, 50).replace(/\n/g, ' ');
              const line = value.substring(0, m.index).split('\n').length;
              commentInfo += `- Line ${line}: /* ${preview}${m[0].length > 50 ? '...' : ''}\n`;
            }
          });
          commentInfo += `\n*Note: Comments are not valid in JSON. Use Auto Fix to remove them safely without changing other logic.*\n`;
        }

        if (formatterMode === 'smart') {
          let errorAnalysis = `### Invalid JSON Syntax\n\n**Error Details:**\n${jsonErr.message}`;
          if (allErrors.length > 0) {
            errorAnalysis += `\n\n**Error Locations:**\n`;
            allErrors.forEach(error => {
              errorAnalysis += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
            });
          }
          errorAnalysis += `\n\n**What Happened:**\nThe JSON you provided has syntax errors that prevent it from being parsed. This could be due to:\n- Missing or extra commas\n- Unclosed quotes or brackets\n- Invalid characters or formatting\n\n### AI-Powered Resolution Available\n\nSince you're using Smart Mode (AI), I can attempt to automatically fix these syntax errors for you.\n\n**Suggestions:**\n1. Click the "Fix Complex Errors with AI" button to let AI fix the syntax errors\n2. Or manually review and fix the JSON syntax\n3. Common issues: trailing commas, unquoted keys, single quotes instead of double quotes`;
          setValidationError({
            isValid: false,
            reason: errorAnalysis + commentInfo,
            isFixableSyntaxError: true,
            suggestedLanguage: undefined
          });
        } else {
          const hasComplexErrors = allErrors.some(isComplexError);
          let fastError = `Invalid JSON syntax: ${jsonErr.message}\n\n📍 Error Locations:\n`;
          allErrors.forEach(error => {
            fastError += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
          });
          setValidationError({
            isValid: false,
            reason: fastError + commentInfo,
            isFixableSyntaxError: true,
            suggestedLanguage: undefined
          });
        }
      }
    }
  };

  // Add output edits to history (Code/Text/Tree views) with debounce
  useEffect(() => {
    if (activeLanguage !== 'json') return;
    if (!outputCode || !outputCode.trim()) return;

    // Prevent duplicate history entries when programmatic changes already added
    if (outputCode !== lastSavedToHistoryRef.current) {
      const timeoutId = setTimeout(() => {
        const currentHistoryValue = history[historyIndex];
        if (outputCode !== currentHistoryValue) {
          addToHistory(outputCode);
          lastSavedToHistoryRef.current = outputCode;
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [outputCode, activeLanguage, history, historyIndex]);

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

  // Handle automatic fixing of simple JSON errors in OUTPUT - only for JSON in Fast mode
  const handleFixSimpleErrorsOutput = async () => {
    if (activeLanguage !== 'json' || !outputCode) return;
    
    const result = fixSimpleJsonErrors(outputCode);
    
    if (result.wasFixed) {
      // Update the output with fixed JSON
      setOutputCode(result.fixed);
      setAppliedFixes(result.changes);
      
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
        // All errors fixed! Mark as validated and ready to use
        setValidationError(null);
        setIsValidated(true);
        
        // If there's a pending action, execute it immediately without showing fix summary or success message
        if (pendingAction) {
          setShowFixSummary(false);
          setSuccessMessage(null);
          setAppliedFixes([]);
          setTimeout(() => {
            executePendingAction();
          }, 50);
        } else {
          // Only show fix summary and success message if no pending action
          setShowFixSummary(true);
          setSuccessMessage(`✅ All syntax errors have been fixed in output! Applied ${result.changes.length} fix${result.changes.length > 1 ? 'es' : ''}. You can now use your JSON.`);
        }
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
    setHasCommentsInInput(false);

    try {
      // For JSON, use enhanced validation with error detection
      if (activeLanguage === 'json') {
        // Early comment detection so Fast mode Auto Fix can enable even if complex errors occur
        const earlySingle = Array.from(trimmedInput.matchAll(/\/\/.*$/gm));
        const earlyMulti = Array.from(trimmedInput.matchAll(/\/\*[\s\S]*?\*\//g));
        if (earlySingle.length + earlyMulti.length > 0) {
          setHasCommentsInInput(true);
        }
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
          setErrorSource('input');

          // Detect comments for documentation (do not modify validation flow)
          let commentInfo = '';
          const singleLineMatches = Array.from(trimmedInput.matchAll(/\/\/.*$/gm));
          const multiLineMatches = Array.from(trimmedInput.matchAll(/\/\*[\s\S]*?\*\//g));
          const commentsCount = singleLineMatches.length + multiLineMatches.length;
          setHasCommentsInInput(commentsCount > 0);
          if (commentsCount > 0) {
            commentInfo = `\n\n📝 **Comments Detected** (${commentsCount}):\n`;
            singleLineMatches.forEach(m => {
              if (m.index !== undefined) {
                const preview = m[0].substring(0, 50).replace(/\n/g, ' ');
                const line = trimmedInput.substring(0, m.index).split('\n').length;
                commentInfo += `- Line ${line}: // ${preview}${m[0].length > 50 ? '...' : ''}\n`;
              }
            });
            multiLineMatches.forEach(m => {
              if (m.index !== undefined) {
                const preview = m[0].substring(0, 50).replace(/\n/g, ' ');
                const line = trimmedInput.substring(0, m.index).split('\n').length;
                commentInfo += `- Line ${line}: /* ${preview}${m[0].length > 50 ? '...' : ''}\n`;
              }
            });
            commentInfo += `\n*Note: Comments are not valid in JSON. Use Auto Fix to remove them safely without changing other logic.*\n`;
          }

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
              reason: errorAnalysis + commentInfo,
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
                reason: fastError + commentInfo,
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
                reason: fastError + commentInfo,
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

  const handleStructureAnalysis = () => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput) {
      setOutputError('Please enter JSON code to analyze');
      return;
    }

    if (activeLanguage !== 'json') {
      setOutputError('Structure analysis is only available for JSON format');
      return;
    }

    setIsLoading(true);
    setOutputError(null);
    setValidationError(null);
    setSuccessMessage(null);
    setErrorSource('input');
    setErrorLines([]);

    try {
      const analysis = analyzeJsonStructure(trimmedInput);
      const formattedOutput = JSON.stringify(analysis, null, 2);
      setOutputCode(formattedOutput);
      // Don't set success message as it blocks the output display
      // The output itself shows the analysis was successful
      addToHistory(formattedOutput);
      
      // Enable structure analysis mode and switch to "view" format
      setIsStructureAnalysisMode(true);
      setViewFormat('view');
    } catch (err: any) {
      setOutputError(`Analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoCorrect = async () => {
    // Determine which code to correct based on error source
    const codeToCorrect = errorSource === 'output' ? outputCode : inputCode;
    if (!codeToCorrect) return;
    
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
          
          const correctedCode = await correctCodeSyntax(codeToCorrect, activeLanguage);
          
          // Update the correct state based on error source
          if (errorSource === 'output') {
            setOutputCode(correctedCode);
            
            // If there's a pending action, execute it immediately without showing success message
            if (pendingAction) {
              setSuccessMessage(null);
              setTimeout(() => {
                executePendingAction();
              }, 50);
            } else {
              // Only show success message if no pending action
              setSuccessMessage("✅ AI successfully corrected the syntax in output. You can now use your JSON.");
            }
          } else {
            setInputCode(correctedCode);
            addToHistory(correctedCode);
            setSuccessMessage("✅ AI successfully corrected the syntax. You can now format the code.");
          }
          
          setIsValidated(true);
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
    setIsStructureAnalysisMode(false); // Reset structure analysis mode

    try {
      let formattedCode = '';
      const indentChar = indentSize === 0 ? '\t' : ' '.repeat(indentSize);
      
      switch (activeLanguage) {
        case 'json':
          // Validate JSON first with same error handling as Validate button
          try {
            const jsonObj = JSON.parse(trimmedInput);
            formattedCode = JSON.stringify(jsonObj, null, indentChar);
            addToHistory(formattedCode);
          } catch (jsonErr: any) {
            // JSON has syntax error - validate and find all errors (same as Validate button)
            const allErrors = validateJsonSyntax(trimmedInput);
            setErrorLines(allErrors);
            setErrorSource('input');
            
            if (formatterMode === 'smart') {
              // Smart mode: Always offer AI-powered correction
              let errorAnalysis = `### Invalid JSON Syntax\n\n**Error Details:**\n${jsonErr.message}`;

              if (allErrors.length > 0) {
                errorAnalysis += `\n\n**Error Locations:**\n`;
                allErrors.forEach(error => {
                  errorAnalysis += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
                });
              }

              errorAnalysis += `\n\n**What Happened:**\nThe JSON you provided has syntax errors that prevent it from being formatted. This could be due to:\n- Missing or extra commas\n- Unclosed quotes or brackets\n- Invalid characters or formatting\n\n### AI-Powered Resolution Available\n\nSince you're using Smart Mode (AI), I can attempt to automatically fix these syntax errors for you.\n\n**Suggestions:**\n1. Click the "Fix Complex Errors with AI" button to let AI fix the syntax errors\n2. Or manually review and fix the JSON syntax\n3. Common issues: trailing commas, unquoted keys, single quotes instead of double quotes`;
              
              setValidationError({
                isValid: false,
                reason: errorAnalysis,
                isFixableSyntaxError: true,
                suggestedLanguage: undefined
              });
              setIsLoading(false);
              return;
            } else {
              // Fast mode: Check if errors are simple or complex
              const hasComplexErrors = allErrors.some(isComplexError);
              
              if (hasComplexErrors) {
                // Has complex errors - suggest Smart mode
                let fastError = `Invalid JSON syntax: ${jsonErr.message}\n\n📍 Error Locations:\n`;
                allErrors.forEach(error => {
                  fastError += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
                });
                
                setValidationError({
                  isValid: false,
                  reason: fastError,
                  isFixableSyntaxError: true,
                  suggestedLanguage: undefined
                });
                setIsLoading(false);
                return;
              } else {
                // Only simple errors - can be fixed
                let fastError = `Invalid JSON syntax: ${jsonErr.message}\n\n📍 Error Locations:\n`;
                allErrors.forEach(error => {
                  fastError += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
                });
                
                setValidationError({
                  isValid: false,
                  reason: fastError,
                  isFixableSyntaxError: true,
                  suggestedLanguage: undefined
                });
                setIsLoading(false);
                return;
              }
            }
          }
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

    setIsStructureAnalysisMode(false); // Reset structure analysis mode
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

    setIsStructureAnalysisMode(false); // Reset structure analysis mode
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

    setIsStructureAnalysisMode(false); // Reset structure analysis mode
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

  // Output undo (does NOT modify inputCode; only reverts outputCode formatting steps)
  const handleOutputUndo = () => {
    if (outputHistoryIndex > 0) {
      const newIndex = outputHistoryIndex - 1;
      setOutputHistoryIndex(newIndex);
      isApplyingOutputHistoryRef.current = true;
      setOutputCode(outputHistory[newIndex]);
    }
  };

  // Output redo
  const handleOutputRedo = () => {
    if (outputHistoryIndex >= 0 && outputHistoryIndex < outputHistory.length - 1) {
      const newIndex = outputHistoryIndex + 1;
      setOutputHistoryIndex(newIndex);
      isApplyingOutputHistoryRef.current = true;
      setOutputCode(outputHistory[newIndex]);
    }
  };

  const handleCopy = async () => {
    if (!inputCode.trim()) return; // Don't copy if no input
    try {
      await navigator.clipboard.writeText(inputCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyOutput = async () => {
    if (!outputCode || !outputCode.trim()) return; // Don't copy if no output
    
    // If in table view, copy as tab-separated values (pasteable to Excel/Sheets)
    if (viewFormat === 'table' && tableViewRef.current) {
      try {
        await tableViewRef.current.copyTableToClipboard();
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy table:', error);
      }
      return;
    }
    
    try {
      await navigator.clipboard.writeText(outputCode);
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
    setIsStructureAnalysisMode(false); // Reset structure analysis mode
  };

  // Move: copy data from input box to output box
  const handleMove = () => {
    if (!inputCode.trim()) return; // Don't move if input is empty
    setOutputCode(inputCode);
    setIsStructureAnalysisMode(false); // Reset structure analysis mode
  };

  // Expand All Fields: expand all nodes in Form and View
  const handleExpandAllFields = () => {
    setExpandAllTrigger(!expandAllTrigger);
    setCollapseAllTrigger(false);
  };

  // Collapse All Fields: collapse all nodes in Form and View
  const handleCollapseAllFields = () => {
    setCollapseAllTrigger(!collapseAllTrigger);
    setExpandAllTrigger(false);
  };

  // Download: always downloads to default folder
  const handleDownload = () => {
    if (!inputCode.trim()) return;
    const content = outputCode || inputCode;
    if (!content) return;
    
    // Note: Download button behavior remains simple (downloads to default folder)
    // For table view, the Download button is hidden - users should use "Save to File" for folder selection
    
    // Validate output JSON before downloading
    if (activeLanguage === 'json' && outputCode) {
      setPreviousView(viewFormat); // Store current view before validation
      const isValid = validateOutputJson(outputCode, { type: 'download' });
      if (!isValid) {
        // Don't proceed with download if JSON is invalid - pending action stored
        return;
      }
    }
    
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
    
    // If in table view, open Save As dialog with both CSV and Excel format options
    if (viewFormat === 'table' && tableViewRef.current) {
      // @ts-ignore
      if (window.showSaveFilePicker) {
        try {
          // @ts-ignore
          const handle = await window.showSaveFilePicker({
            suggestedName: `table_data_${new Date().toISOString().slice(0, 10)}.csv`,
            types: [
              {
                description: 'CSV File',
                accept: { 'text/csv': ['.csv'] },
              },
              {
                description: 'Excel File',
                accept: { 'application/vnd.ms-excel': ['.xls'] },
              },
            ],
          });
          
          // Get the selected file name and determine format by extension
          const fileName = handle.name;
          const isExcel = fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx');
          
          let content: string;
          if (isExcel) {
            content = tableViewRef.current.generateExcel();
          } else {
            content = tableViewRef.current.generateCSV();
          }
          
          const writable = await handle.createWritable();
          await writable.write(content);
          await writable.close();
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('Save dialog was cancelled by user');
            return;
          }
          console.warn('Save As dialog error:', err);
          return;
        }
      }
      // Fallback for browsers that don't support File System Access API
      alert('Save dialog is not supported in your browser. Please use the Export button in the table toolbar instead.');
      return;
    }
    
    // Check if we're in Structure Analysis mode
    if (isStructureAnalysisMode && outputCode) {
      try {
        const analysisData = JSON.parse(outputCode);
        
        // Generate HTML report
        const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSON Structure Analysis Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 40px 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 32px; color: #2c3e50; margin-bottom: 10px; }
        .header p { color: #7f8c8d; font-size: 16px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 30px; }
        .card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card h2 { font-size: 20px; color: #2c3e50; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .status-valid { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 2px solid #28a745; }
        .status-invalid { background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%); border: 2px solid #dc3545; }
        .summary-card { background: linear-gradient(135deg, #cfe2ff 0%, #b6d4fe 100%); border: 2px solid #0d6efd; }
        .details-card { background: linear-gradient(135deg, #e7d6f5 0%, #d4b5e8 100%); border: 2px solid #6f42c1; }
        .stats-card { background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%); border: 2px solid #ffc107; }
        .info-row { display: flex; justify-content: space-between; padding: 12px; margin: 8px 0; background: white; border-radius: 8px; }
        .info-label { font-weight: 600; color: #495057; }
        .info-value { font-weight: 700; color: #0d6efd; }
        .stat-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }
        .stat-strings { background: linear-gradient(135deg, #d1f5d3 0%, #b8edb5 100%); border-color: #28a745; }
        .stat-numbers { background: linear-gradient(135deg, #cfe2ff 0%, #b6d4fe 100%); border-color: #0d6efd; }
        .stat-booleans { background: linear-gradient(135deg, #e7d6f5 0%, #d4b5e8 100%); border-color: #6f42c1; }
        .stat-nulls { background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%); border-color: #6c757d; }
        .stat-objects { background: linear-gradient(135deg, #ffe5b4 0%, #ffd480 100%); border-color: #fd7e14; }
        .stat-arrays { background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border-color: #17a2b8; }
        .stat-label { font-weight: 600; color: #495057; display: flex; align-items: center; gap: 8px; }
        .stat-value { font-size: 24px; font-weight: 700; }
        .message-box { padding: 15px; background: white; border-radius: 8px; margin-top: 15px; }
        .message-valid { color: #28a745; font-weight: 600; }
        .message-invalid { color: #dc3545; font-weight: 600; }
        @media print { body { background: white; padding: 20px; } .card { break-inside: avoid; box-shadow: none; border: 1px solid #dee2e6; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 JSON Structure Analysis Report</h1>
            <p>Comprehensive analysis of your JSON structure and statistics</p>
        </div>
        
        <div class="grid">
            <div>
                <!-- Validation Status -->
                <div class="card ${analysisData.isValid ? 'status-valid' : 'status-invalid'}">
                    <h2>${analysisData.isValid ? '✅' : '❌'} Validation Status</h2>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="info-value" style="color: ${analysisData.isValid ? '#28a745' : '#dc3545'};">${analysisData.isValid ? 'Valid' : 'Invalid'}</span>
                    </div>
                    <div class="message-box">
                        <p class="${analysisData.isValid ? 'message-valid' : 'message-invalid'}">${analysisData.message}</p>
                    </div>
                </div>
                
                <!-- Summary -->
                <div class="card summary-card" style="margin-top: 20px;">
                    <h2>📋 Summary</h2>
                    ${Object.entries(analysisData.summary).map(([key, value]) => `
                        <div class="info-row">
                            <span class="info-label">${key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span class="info-value">${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Details -->
                <div class="card details-card" style="margin-top: 20px;">
                    <h2>🔍 Details</h2>
                    ${Object.entries(analysisData.details)
                        .filter(([key]) => !['objectKeys', 'valueTypes'].includes(key))
                        .map(([key, value]) => `
                            <div class="info-row">
                                <span class="info-label">${key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span class="info-value">${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>
                            </div>
                        `).join('')}
                </div>
            </div>
            
            <!-- Statistics -->
            <div>
                <div class="card stats-card">
                    <h2>📈 Statistics</h2>
                    <p style="color: #856404; margin-bottom: 20px; font-size: 14px;">Complete breakdown of data types in your JSON</p>
                    
                    <div class="stat-item stat-strings">
                        <span class="stat-label">📝 Strings</span>
                        <span class="stat-value" style="color: #28a745;">${analysisData.statistics.strings}</span>
                    </div>
                    
                    <div class="stat-item stat-numbers">
                        <span class="stat-label">🔢 Numbers</span>
                        <span class="stat-value" style="color: #0d6efd;">${analysisData.statistics.numbers}</span>
                    </div>
                    
                    <div class="stat-item stat-booleans">
                        <span class="stat-label">✓ Booleans</span>
                        <span class="stat-value" style="color: #6f42c1;">${analysisData.statistics.booleans}</span>
                    </div>
                    
                    <div class="stat-item stat-nulls">
                        <span class="stat-label">∅ Nulls</span>
                        <span class="stat-value" style="color: #6c757d;">${analysisData.statistics.nulls}</span>
                    </div>
                    
                    <div class="stat-item stat-objects">
                        <span class="stat-label">📦 Objects</span>
                        <span class="stat-value" style="color: #fd7e14;">${analysisData.statistics.objects}</span>
                    </div>
                    
                    <div class="stat-item stat-arrays">
                        <span class="stat-label">📚 Arrays</span>
                        <span class="stat-value" style="color: #17a2b8;">${analysisData.statistics.arrays}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: #6c757d; font-size: 14px;">
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

        // Save as HTML file
        // @ts-ignore
        if (window.showSaveFilePicker) {
          try {
            // @ts-ignore
            const handle = await window.showSaveFilePicker({
              suggestedName: 'json-analysis-report.html',
              types: [
                {
                  description: 'HTML Report',
                  accept: { 'text/html': ['.html'] },
                },
              ],
            });
            const writable = await handle.createWritable();
            await writable.write(htmlReport);
            await writable.close();
            return;
          } catch (err: any) {
            if (err.name === 'AbortError') {
              console.log('Save dialog was cancelled by user');
              return;
            }
            console.warn('Save As dialog error:', err);
            return;
          }
        }
        // Fallback for browsers that don't support File System Access API
        const blob = new Blob([htmlReport], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'json-analysis-report.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      } catch (err) {
        console.error('Error generating report:', err);
        alert('Failed to generate report. Please try again.');
        return;
      }
    }
    
    // Validate output JSON before saving
    if (activeLanguage === 'json' && outputCode) {
      setPreviousView(viewFormat); // Store current view before validation
      const isValid = validateOutputJson(outputCode, { type: 'save' });
      if (!isValid) {
        // Don't proceed with save if JSON is invalid - pending action stored
        return;
      }
    }
    
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

  // Handle return to previous view with errors visible
  const handleReturnToCodeView = () => {
    setValidationError(null);
    setSuccessMessage(null);
    setPendingAction(null);
    // Return to the previous view (the view user was on before error occurred)
    // Auto-expand when returning to Form or Tree view
    if ((previousView === 'form' || previousView === 'tree') && viewFormat !== previousView) {
      setExpandAllTrigger(true);
      setTimeout(() => setExpandAllTrigger(false), 100);
    }
    setViewFormat(previousView);
  };

  const isActionDisabled = isLoading || isValidating || isCorrecting;
  const isJsonLanguage = activeLanguage === 'json';
  // Input history availability (JSON input edits)
  const canUndoInput = historyIndex > 0 && isJsonLanguage;
  const canRedoInput = historyIndex < history.length - 1 && isJsonLanguage;

  // Output history availability (formatted output edits)
  const canUndoOutput = outputHistoryIndex > 0; // at beginning (index 0) cannot undo
  const canRedoOutput = outputHistoryIndex >= 0 && outputHistoryIndex < outputHistory.length - 1; // at latest cannot redo

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

  // Execute pending action after error fix (view switch, save, or download)
  const executePendingAction = () => {
    if (!pendingAction) return;
    
    const action = pendingAction;
    setPendingAction(null); // Clear pending action before executing
    
    if (action.type === 'view-switch') {
      // Auto-expand when switching to Form or Tree view
      if ((action.targetView === 'form' || action.targetView === 'tree') && viewFormat !== action.targetView) {
        setExpandAllTrigger(true);
        setTimeout(() => setExpandAllTrigger(false), 100);
      }
      setViewFormat(action.targetView);
    } else if (action.type === 'download') {
      // Re-trigger download
      const content = outputCode || inputCode;
      if (content) {
        const ext = activeLanguage === 'typescript' ? 'ts' : activeLanguage === 'javascript' ? 'js' : activeLanguage;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `formatted.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else if (action.type === 'save') {
      // Re-trigger save
      const content = outputCode || inputCode;
      if (content) {
        const ext = activeLanguage === 'typescript' ? 'ts' : activeLanguage === 'javascript' ? 'js' : activeLanguage;
        const fileName = `formatted.${ext}`;
        // @ts-ignore
        if (window.showSaveFilePicker) {
          // @ts-ignore
          window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: `${activeLanguage.toUpperCase()} Files`,
                accept: { 'text/plain': languageDetails[activeLanguage].extensions }
              }
            ]
          }).then(async (handle: any) => {
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
          }).catch((err: any) => {
            // User cancelled or error - do nothing
          });
        }
      }
    }
  };

  // Validate output JSON and show errors if invalid (used for view switching and save/download)
  const validateOutputJson = (code: string, action?: PendingAction): boolean => {
    if (activeLanguage !== 'json' || !code || !code.trim()) return true;
    
    try {
      JSON.parse(code);
      // Valid JSON
      setErrorLines([]);
      setValidationError(null);
      setPendingAction(null); // Clear any pending action
      return true;
    } catch (jsonErr: any) {
      // Invalid JSON - store the pending action to execute after fix
      if (action) {
        setPendingAction(action);
      }
      
      // Show error handling (same as Validate button)
      const allErrors = validateJsonSyntax(code);
      setErrorLines(allErrors);
      setErrorSource('output');
      
      if (formatterMode === 'smart') {
        // Smart mode: Always offer AI-powered correction
        let errorAnalysis = `### Invalid JSON Syntax in Output\n\n**Error Details:**\n${jsonErr.message}`;

        if (allErrors.length > 0) {
          errorAnalysis += `\n\n**Error Locations:**\n`;
          allErrors.forEach(error => {
            errorAnalysis += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
          });
        }

        errorAnalysis += `\n\n**What Happened:**\nThe JSON in the output area has syntax errors. This could be due to manual edits or formatting issues.\n\n### AI-Powered Resolution Available\n\nSince you're using Smart Mode (AI), I can attempt to automatically fix these syntax errors for you.\n\n**Suggestions:**\n1. Click the "Fix Complex Errors with AI" button to let AI fix the syntax errors\n2. Or manually review and fix the JSON syntax\n3. Switch back to Code view to see the exact error locations`;
        
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
          let fastError = `Invalid JSON syntax in output: ${jsonErr.message}\n\n📍 Error Locations:\n`;
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
          let fastError = `Invalid JSON syntax in output: ${jsonErr.message}\n\n📍 Error Locations:\n`;
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
      return false;
    }
  };

  // Helper to render non-code views for formatted output
  const renderStructuredOutputView = () => {
    if (!outputCode) return null;
    try {
      const parsedData = JSON.parse(outputCode);
      switch (viewFormat) {
        case 'tree':
          return (
            <TreeView
              data={parsedData}
              expandAll={expandAllTrigger}
              collapseAll={collapseAllTrigger}
              onEdit={(value) => setOutputCode(value)}
            />
          );
        case 'form':
          return (
            <FormView
              data={parsedData}
              expandAll={expandAllTrigger}
              collapseAll={collapseAllTrigger}
              onEdit={(updatedJson) => {
                setOutputCode(updatedJson);
              }}
            />
          );
        case 'text':
          return (
            <TextView
              code={outputCode}
              onChange={(value) => setOutputCode(value)}
              expandAll={expandAllTrigger}
              collapseAll={collapseAllTrigger}
            />
          );
        case 'table':
          return (
            <TableView
              ref={tableViewRef}
              data={parsedData}
              expandAll={expandAllTrigger}
              collapseAll={collapseAllTrigger}
              onEdit={(value) => setOutputCode(value)}
            />
          );
        case 'view':
          // Check if this is structure analysis data
          if (isStructureAnalysisMode && parsedData && 
              typeof parsedData === 'object' && 
              'statistics' in parsedData && 
              parsedData.statistics) {
            return (
              <StatisticsDetailViewer
                data={parsedData}
                expandAll={expandAllTrigger}
                collapseAll={collapseAllTrigger}
                onClose={() => {
                  setOutputCode('');
                  setIsStructureAnalysisMode(false);
                }}
              />
            );
          }
          // Default ConsoleView for regular JSON
          return (
            <ConsoleView
              data={parsedData}
              expandAll={expandAllTrigger}
              collapseAll={collapseAllTrigger}
            />
          );
        default:
          return (
            <CodeMirrorViewer
              code={outputCode}
              language={activeLanguage}
              onChange={(value) => setOutputCode(value)}
              expandAll={expandAllTrigger}
              collapseAll={collapseAllTrigger}
            />
          );
      }
    } catch (e) {
      // Fallback to code view if JSON parse fails
      return (
        <CodeMirrorViewer
          code={outputCode}
          language={activeLanguage}
          onChange={(value) => setOutputCode(value)}
          expandAll={expandAllTrigger}
          collapseAll={collapseAllTrigger}
        />
      );
    }
  };

  // Track outputCode changes to build output history (ignore changes triggered by undo/redo application)
  useEffect(() => {
    if (!outputCode || !outputCode.trim()) return;
    if (isApplyingOutputHistoryRef.current) {
      // Skip adding history entry when we are applying an existing one
      isApplyingOutputHistoryRef.current = false;
      return;
    }
    // First entry
    if (outputHistoryIndex === -1) {
      const initial = [outputCode];
      setOutputHistory(initial);
      setOutputHistoryIndex(0);
      return;
    }
    // Avoid duplicates
    if (outputCode === outputHistory[outputHistoryIndex]) return;
    const newHist = [...outputHistory.slice(0, outputHistoryIndex + 1), outputCode];
    setOutputHistory(newHist);
    setOutputHistoryIndex(newHist.length - 1);
  }, [outputCode]);

  // Reset output history when clearing
  useEffect(() => {
    if (!outputCode) {
      setOutputHistory([]);
      setOutputHistoryIndex(-1);
    }
  }, [outputCode]);

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
                        handleFormat(3);
                        setShowBeautifyDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-900 dark:text-gray-100"
                    >
                      3 Spaces
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

              {/* Structure Analysis button - Only show for JSON */}
              {activeLanguage === 'json' && (
                <button
                  onClick={() => {
                    if (isActionDisabled || !inputCode.trim()) return;
                    handleStructureAnalysis();
                  }}
                  className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Analyze JSON structure and generate statistics report"
                >
                  <span>📈</span>
                  <span>Structure Analysis</span>
                </button>
              )}
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
                        ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-lg font-semibold opacity-100'
                        : 'bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 text-white hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-600 opacity-60'
                    }`}
                  >
                    <LightningIcon className="h-3.5 w-3.5" />
                    <span>Fast</span>
                  </button>
                  <button
                    onClick={() => setFormatterMode('smart')}
                    className={`px-3 py-1.5 rounded-md transition-all text-sm flex items-center gap-1.5 ${
                      formatterMode === 'smart'
                        ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white shadow-lg font-semibold opacity-100'
                        : 'bg-gradient-to-r from-purple-300 via-pink-300 to-red-300 text-white hover:from-purple-500 hover:via-pink-500 hover:to-red-500 opacity-60'
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
          <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-3 relative z-10 h-[600px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 relative z-50">
                <h2 className="text-lg font-semibold">Input</h2>
                {/* Icon Toolbar - positioned next to "Input" heading */}
                <div className="flex items-center gap-1 opacity-100 pointer-events-auto relative z-50">
                  {/* GROUP 2: Save, Download, Copy */}
                  <Tooltip content="Save to file">
                    <button
                      onClick={handleSave}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                      aria-label="Save"
                      title="Save to file (Ctrl+S)"
                    >
                      💾
                    </button>
                  </Tooltip>
                  <Tooltip content="Download to file">
                    <button
                      onClick={handleDownload}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                      aria-label="Download"
                      title="Download to file"
                    >
                      📥
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
                  
                  {/* Transform with JMESPath - only for JSON */}
                  {isJsonLanguage && (
                    <>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                      <Tooltip content="Transform with JMESPath">
                        <button
                          onClick={() => {
                            // Validate JSON before opening modal
                            try {
                              JSON.parse(inputCode);
                              setShowJMESPathModal(true);
                            } catch {
                              setValidationError({
                                isValid: false,
                                reason: 'Invalid JSON. Please fix syntax errors before using Transform.',
                                isFixableSyntaxError: true,
                                suggestedLanguage: undefined
                              });
                            }
                          }}
                          disabled={!inputCode.trim()}
                          className="p-1 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Transform"
                          title="Transform JSON with JMESPath query"
                        >
                          🔄
                        </button>
                      </Tooltip>
                    </>
                  )}
                  
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>

                  {/* GROUP 3: Move */}
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
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>

                  {/* GROUP 4: Undo and Redo (INPUT JSON) */}
                  <Tooltip content="Undo last change">
                    <button
                      onClick={canUndoInput ? handleUndo : undefined}
                      disabled={!canUndoInput}
                      className={`p-1 rounded-md transition-all text-xl ${canUndoInput ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                      aria-label="Undo"
                      title="Undo last change (Ctrl+Z)"
                    >
                      ↩️
                    </button>
                  </Tooltip>
                  <Tooltip content="Redo last change">
                    <button
                      onClick={canRedoInput ? handleRedo : undefined}
                      disabled={!canRedoInput}
                      className={`p-1 rounded-md transition-all text-xl ${canRedoInput ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                      aria-label="Redo"
                      title="Redo last change (Ctrl+Y)"
                    >
                      ↪️
                    </button>
                  </Tooltip>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>

                  {/* GROUP 5: Compact and Graph - only for JSON */}
                  {isJsonLanguage && (
                    <>
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

                  {/* GROUP 6: Print and Fullscreen */}
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
                  {!isFullscreen && (
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
                  )}
                </div>
              </div>
            </div>

            <div className="flex-grow w-full rounded-md flex flex-col min-h-0 relative overflow-hidden">
              {/* GROUP 1: Upload and Clear - positioned at top right inside the textarea box */}
              <div className="absolute top-2 right-6 z-10 flex items-center gap-1.5">
                <Tooltip content="Upload a code file">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-blue-600 dark:text-blue-400"
                    aria-label="Upload File"
                    title="Upload a code file to input"
                  >
                    📤
                  </button>
                </Tooltip>
                <Tooltip content="Clear input">
                  <button
                    onClick={handleClear}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-red-600 dark:text-red-400"
                    aria-label="Clear Input"
                    title="Clear all input content"
                  >
                    🧹
                  </button>
                </Tooltip>
              </div>
              
              <CodeEditor
                value={inputCode}
                onChange={handleInputChange}
                language={activeLanguage}
                placeholder={`Enter your ${activeLanguage.toUpperCase()} code here...`}
                errorLines={errorSource === 'input' && activeLanguage === 'json' ? errorLines : undefined}
              />
              
              {/* Character count - positioned at bottom right */}
              <div className="absolute bottom-2 right-6 z-10 pointer-events-none">
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                  {inputCode.length} chars
                </span>
              </div>
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

          <div className="w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-3 h-[600px]">
            {/* Output heading with View selector and Exit fullscreen button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Formatted Output</h2>
                {/* Icon Toolbar - positioned next to "Formatted Output" heading */}
                <div className="flex items-center gap-1 opacity-100 pointer-events-auto relative z-50">
                  <Tooltip content="Save to file">
                    <button
                      onClick={handleSave}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                      aria-label="Save"
                      title="Save to file (Ctrl+S)"
                    >
                      💾
                    </button>
                  </Tooltip>
                  <Tooltip content="Copy to clipboard">
                    <button
                      onClick={handleCopyOutput}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                      aria-label="Copy"
                      title="Copy to clipboard (Ctrl+C)"
                    >
                      📋
                    </button>
                  </Tooltip>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                  {/* Undo/Redo for OUTPUT (Formatted JSON) */}
                  <Tooltip content="Undo last change">
                    <button
                      onClick={canUndoOutput && !isStructureAnalysisMode ? handleOutputUndo : undefined}
                      disabled={!canUndoOutput || isStructureAnalysisMode}
                      className={`p-1 rounded-md transition-all text-xl ${canUndoOutput && !isStructureAnalysisMode ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                      aria-label="Undo"
                      title="Undo last change (Ctrl+Z)"
                    >
                      ↩️
                    </button>
                  </Tooltip>
                  <Tooltip content="Redo last change">
                    <button
                      onClick={canRedoOutput ? handleOutputRedo : undefined}
                      disabled={!canRedoOutput}
                      className={`p-1 rounded-md transition-all text-xl ${canRedoOutput ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                      aria-label="Redo"
                      title="Redo last change (Ctrl+Y)"
                    >
                      ↪️
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Expand/Collapse buttons - visible for Form, Tree, View, Code, and Text */}
                {activeLanguage === 'json' && ['form', 'tree', 'view', 'code', 'text'].includes(viewFormat) && !isStructureAnalysisMode && (
                  <>
                    <Tooltip content="Expand all fields">
                      <button
                        onClick={handleExpandAllFields}
                        className="p-1 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-xl cursor-pointer"
                        aria-label="Expand All"
                        title="Expand all fields"
                      >
                        ⬇️
                      </button>
                    </Tooltip>
                    <Tooltip content="Collapse all fields">
                      <button
                        onClick={handleCollapseAllFields}
                        className="p-1 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-xl cursor-pointer"
                        aria-label="Collapse All"
                        title="Collapse all fields"
                      >
                        ⬆️
                      </button>
                    </Tooltip>
                  </>
                )}
                {/* View Format Dropdown - visible by default for JSON */}
                {activeLanguage === 'json' && (
                  <div className="relative view-dropdown-container">
                    <button
                      onClick={() => {
                        if (isStructureAnalysisMode) return;
                        console.log('View dropdown clicked, current format:', viewFormat);
                        setShowViewDropdown(!showViewDropdown);
                      }}
                      disabled={isStructureAnalysisMode}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                        isStructureAnalysisMode 
                          ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed opacity-60' 
                          : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                      } text-white`}
                      aria-label="Select View Format"
                      title={isStructureAnalysisMode ? "View selector disabled in Structure Analysis mode" : "Select view format"}
                    >
                      <span>{viewFormat.charAt(0).toUpperCase() + viewFormat.slice(1)}</span>
                      <span className="text-xs">▼</span>
                    </button>
                    {showViewDropdown && (
                      <div className="absolute right-0 mt-1 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-xl z-20 min-w-[160px] overflow-hidden">
                        {(['code', 'form', 'text', 'tree', 'table', 'view'] as ViewFormat[]).map((format) => {
                          const isDisabled = isStructureAnalysisMode && format !== 'view';
                          
                          // Define emoji and colors for each format
                          const formatConfig = {
                            code: { emoji: '💻', color: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30' },
                            form: { emoji: '📄', color: 'text-green-600 dark:text-green-400', gradient: 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30' },
                            text: { emoji: '📝', color: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30' },
                            tree: { emoji: '🌳', color: 'text-teal-600 dark:text-teal-400', gradient: 'from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30' },
                            table: { emoji: '▦', color: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30' },
                            view: { emoji: '👁️', color: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30' }
                          };
                          
                          const config = formatConfig[format];
                          
                          return (
                            <button
                              key={format}
                              onClick={() => {
                                if (isDisabled) return;
                                
                                // Validate output JSON before switching views
                                if (activeLanguage === 'json' && outputCode && format !== 'code') {
                                  setPreviousView(viewFormat); // Store current view before validation
                                  const isValid = validateOutputJson(outputCode, { type: 'view-switch', targetView: format });
                                  if (!isValid) {
                                    // Don't switch view if JSON is invalid - pending action stored
                                    setShowViewDropdown(false);
                                    return;
                                  }
                                }
                                
                                // Auto-expand when switching to Form or Tree view
                                if ((format === 'form' || format === 'tree') && viewFormat !== format) {
                                  setExpandAllTrigger(true);
                                  // Reset the trigger after a brief moment to allow future expansions
                                  setTimeout(() => setExpandAllTrigger(false), 100);
                                }
                                
                                // Reset output history when switching views (undo/redo will be disabled initially)
                                setOutputHistory([]);
                                setOutputHistoryIndex(-1);
                                
                                setViewFormat(format);
                                setShowViewDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-3 ${
                                isDisabled 
                                  ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500' 
                                  : `hover:bg-gradient-to-r hover:${config.gradient} cursor-pointer hover:shadow-sm hover:scale-[1.02]`
                              } ${
                                viewFormat === format 
                                  ? `bg-gradient-to-r ${config.gradient} font-bold shadow-sm border-l-4 ${config.color.replace('text-', 'border-').replace(' dark:', ' dark:border-')}` 
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                              disabled={isDisabled}
                            >
                              <span className="text-lg">{config.emoji}</span>
                              <span className={viewFormat === format ? config.color : ''}>{format.charAt(0).toUpperCase() + format.slice(1)}</span>
                            </button>
                          );
                        })}
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
              {/* Download and Clear icons - positioned at top right inside the output box */}
              {/* Hide these buttons when there's an error (validationError, outputError, or aiError) or in Structure Analysis mode or when showing success message or in Table view */}
              {!validationError && !outputError && !aiError && !isStructureAnalysisMode && !successMessage && viewFormat !== 'table' && (
                <div className={`absolute z-10 flex items-center gap-1.5 ${viewFormat === 'tree' ? 'top-[2px] right-2' : viewFormat === 'form' ? 'top-[17px] right-6' : 'top-2 right-6'}`}>
                  <Tooltip content="Download formatted file">
                    <button
                      onClick={handleDownload}
                      className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-green-600 dark:text-green-400"
                      aria-label="Download"
                      title="Download formatted file"
                    >
                      📥
                    </button>
                  </Tooltip>
                  <Tooltip content="Clear output">
                    <button
                      onClick={handleClearOutput}
                      className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-red-600 dark:text-red-400"
                      aria-label="Clear Output"
                      title="Clear all output content"
                    >
                      🧹
                    </button>
                  </Tooltip>
                </div>
              )}
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
                        {(() => {
                          const inputStr = inputCode || '';
                          const singleLineMatches = Array.from(inputStr.matchAll(/\/\/.*$/gm));
                          const multiLineMatches = Array.from(inputStr.matchAll(/\/\*[\s\S]*?\*\//g));
                          const commentsCount = singleLineMatches.length + multiLineMatches.length;

                          // Determine if an error is directly caused by a comment token at its location
                          const isCommentCausedError = (error: ErrorPosition): boolean => {
                            const { line, column } = error;
                            if (!line || !column) return false;
                            const lines = inputStr.split('\n');
                            if (line - 1 >= lines.length) return false;
                            const targetLine = lines[line - 1] || '';
                            const colIdx = Math.max(0, Math.min(column - 1, targetLine.length));
                            const seg = targetLine.substring(Math.max(0, colIdx - 2), Math.min(targetLine.length, colIdx + 2));
                            return seg.includes('//') || seg.includes('/*');
                          };

                          // Exclude comment-caused entries from simple/complex counts
                          const nonCommentErrors = errorLines.filter(e => !isCommentCausedError(e));
                          const simpleCount = nonCommentErrors.filter(e => !isComplexError(e)).length;
                          const complexCount = nonCommentErrors.filter(e => isComplexError(e)).length;

                          return (
                            <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50/40 dark:bg-red-900/10">
                              <div className="p-4 flex items-start gap-3">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                                      {errorLines.length} Syntax Issue{errorLines.length > 1 ? 's' : ''}
                                    </h3>
                                    <div className="flex gap-2">
                                      {formatterMode === 'fast' ? (
                                        <>
                                          <button
                                            onClick={errorSource === 'output' ? handleFixSimpleErrorsOutput : handleFixSimpleErrors}
                                            disabled={!(errorLines.every(e => !isComplexError(e)) || hasCommentsInInput) || isActionDisabled}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Automatically fix common JSON issues; removes comments when present"
                                          >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Auto Fix
                                          </button>
                                          <button
                                            onClick={handleReturnToCodeView}
                                            className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            title="Return to previous view"
                                          >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                            Return
                                          </button>
                                        </>
                                      ) : (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={errorSource === 'output' ? handleAutoCorrect : handleAutoCorrect}
                                            disabled={isActionDisabled}
                                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Use AI to fix complex errors including bracket mismatches and structural issues"
                                          >
                                            <span>🤖</span>
                                            Fix with AI
                                          </button>
                                          <button
                                            onClick={handleReturnToCodeView}
                                            className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            title="Return to previous view"
                                          >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                            Return
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick chips */}
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Simple: {simpleCount}</span>
                                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">Complex: {complexCount}</span>
                                    {commentsCount > 0 && (
                                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">Comments: {commentsCount}</span>
                                    )}
                                  </div>

                                  {/* Minimal primary message */}
                                  <p className="mt-3 text-sm text-red-700 dark:text-red-300">
                                    {validationError.reason.split('\n')[0]}
                                  </p>
                                </div>
                              </div>

                              <div className="px-4 pb-4 space-y-3">
                                {/* Collapsible: Error locations */}
                                <details className="rounded border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900">
                                  <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-red-800 dark:text-red-200">Error Locations</summary>
                                  <div className="px-3 py-2 space-y-2 max-h-64 overflow-y-auto">
                                    {errorLines.map((error, idx) => (
                                      <div key={idx} className="p-2 rounded border-l-4 text-xs bg-red-50 dark:bg-slate-800 border-red-300 dark:border-red-700">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-semibold text-red-800 dark:text-red-200">Line {error.line}, Column {error.column}</span>
                                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${isComplexError(error) ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}`}>
                                            {isComplexError(error) ? 'Complex' : 'Simple'}
                                          </span>
                                        </div>
                                        <p className="text-red-700 dark:text-red-300 font-mono">{error.message || 'Syntax error detected'}</p>
                                      </div>
                                    ))}
                                  </div>
                                </details>

                                {/* Collapsible: Comments detected */}
                                {commentsCount > 0 && (
                                  <details className="rounded border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900">
                                    <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-amber-800 dark:text-amber-300">Comments Detected ({commentsCount})</summary>
                                    <div className="px-3 py-2 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                                      {singleLineMatches.map((m, idx) => {
                                        const idxPos = m.index ?? 0;
                                        const line = inputStr.substring(0, idxPos).split('\n').length;
                                        const preview = m[0].substring(0, 80).replace(/\n/g, ' ');
                                        return <div key={`sl-${idx}`}>• Line {line}: // {preview}{m[0].length > 80 ? '…' : ''}</div>;
                                      })}
                                      {multiLineMatches.map((m, idx) => {
                                        const idxPos = m.index ?? 0;
                                        const line = inputStr.substring(0, idxPos).split('\n').length;
                                        const preview = m[0].substring(0, 80).replace(/\n/g, ' ');
                                        return <div key={`ml-${idx}`}>• Line {line}: /* {preview}{m[0].length > 80 ? '…' : ''}</div>;
                                      })}
                                      <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">Note: Comments are not valid in JSON. Use Auto Fix to remove them safely without changing other logic.</p>
                                    </div>
                                  </details>
                                )}

                                {/* Contextual tip */}
                                {formatterMode === 'fast' && complexCount > 0 && (
                                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded-lg">
                                    <p className="text-xs text-purple-800 dark:text-purple-200">
                                      Complex issues detected. Auto Fix will remove comments and simple issues; for remaining structural problems, switch to Smart (AI).
                                    </p>
                                  </div>
                                )}
                                {formatterMode === 'smart' && (
                                  <p className="text-xs text-purple-700 dark:text-purple-300">AI can address complex structural errors including bracket mismatches.</p>
                                )}
                              </div>
                            </div>
                          );
                        })()}
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
                ) : outputCode || successMessage ? (
                  <div className="h-full w-full flex flex-col">
                    {/* Success Message Banner - shown at top when present */}
                    {successMessage && (
                      <div className="flex-shrink-0 bg-green-50 dark:bg-green-900/20 border-b-2 border-green-300 dark:border-green-700 px-4 py-3">
                        <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
                          <CheckIcon className="h-5 w-5 flex-shrink-0" />
                          <p className="text-sm font-medium">{successMessage}</p>
                        </div>
                      </div>
                    )}
                    {/* Output Content - shown below success message if present */}
                    {outputCode && (
                      <div className="flex-1 min-h-0">
                        {/* Render different views based on viewFormat for JSON */}
                        {activeLanguage === 'json' && viewFormat !== 'code'
                          ? renderStructuredOutputView()
                          : (
                            <CodeMirrorViewer
                              code={outputCode || ''}
                              language={activeLanguage}
                              onChange={(value) => setOutputCode(value)}
                              expandAll={expandAllTrigger}
                              collapseAll={collapseAllTrigger}
                            />
                          )}
                      </div>
                    )}
                    {/* Show placeholder if only success message without output */}
                    {!outputCode && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                        <FormatIcon className="h-10 w-10 mb-4 text-slate-300 dark:text-slate-600" />
                        <p>Formatted code will appear here.</p>
                      </div>
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
                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 max-w-[200px]" style={{ zIndex: 10, pointerEvents: 'auto' }}>
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

        {/* JMESPath Transform Modal */}
        {showJMESPathModal && (
          <JMESPathTransform
            inputJson={inputCode}
            onApply={(result) => {
              setOutputCode(result);
              setViewFormat('code'); // Switch to Code view to show result
              setValidationError(null); // Clear any validation errors
              setOutputError(null); // Clear any output errors
              setSuccessMessage(null); // Don't show success message - output will show in Output section
              setShowJMESPathModal(false);
            }}
            onClose={() => setShowJMESPathModal(false)}
          />
        )}
      </div>
    </>
  );
};

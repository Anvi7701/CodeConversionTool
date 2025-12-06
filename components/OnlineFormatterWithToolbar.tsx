import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { jsonToToon } from '../utils/jsonToToon';
import { TwoColumnLayout } from './Layout/TwoColumnLayout';
import SEO from './SEO';
import { CodeEditor } from './CodeEditor';
import { Tooltip } from './Tooltip';
import { JMESPathTransform } from './JMESPathTransform';
import { XmlIcon, CodeBracketIcon, UploadIcon, HtmlIcon, CssIcon, FormatIcon, JavascriptIcon, YamlIcon, TypeScriptIcon, AngularIcon, JavaIcon, GraphQLIcon, CheckIcon, LightningIcon } from './icons';
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
import { parseJsonSafe } from '../utils/parseJsonSafe';
import type { ParseResultErr } from '../utils/parseJsonSafe';
import { fixSimpleJsonErrors, getFixSummary, FixChange } from '../utils/simpleJsonFixer';
import { AIErrorDisplay, parseAIError, type AIErrorType } from './AIErrorDisplay';
import { TreeView, FormView, TextView, ConsoleView, TableView, type TableViewRef } from './UnifiedJsonViewRenderer';
import { useNavigate } from 'react-router-dom';
import { analyzeJsonStructure } from '../utils/jsonStructureAnalyzer';
import { StatisticsDetailViewer } from './StatisticsDetailViewer';
import { ValidationModal } from './ValidationModal';
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
  showLeftInputActions?: boolean;
  inlineStructureAnalysisIcon?: boolean; // Move Structure Analysis into Input toolbar as emoji
  inlineSortValidateIcons?: boolean; // Move Sort & Validate into Input toolbar as emoji icons
  showMinifyNextToBeautify?: boolean; // Beautifier page: move Compact to a Minify button next to Beautify
  // Optional color theme override for specific pages (e.g., JSON Beautifier)
  colorTheme?: 'default' | 'purple';
}

export const OnlineFormatterWithToolbar: React.FC<OnlineFormatterWithToolbarProps> = ({ initialLanguage = 'json', showLeftInputActions = false, inlineStructureAnalysisIcon = false, inlineSortValidateIcons = false, showMinifyNextToBeautify = false, colorTheme = 'default' }) => {
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

  // UI dropdowns and fullscreen state
  const [showBeautifyDropdown, setShowBeautifyDropdown] = useState(false);
  const navigate = useNavigate();
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  // Separate state for inline Sort emoji dropdown to avoid conflicts with header Sort button
  const [showInlineSortDropdown, setShowInlineSortDropdown] = useState(false);
  const [showOutputSortDropdown, setShowOutputSortDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showToonSettings, setShowToonSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Output-only fullscreen state and ref
  const [isOutputFullscreen, setIsOutputFullscreen] = useState<boolean>(false);
  const outputContainerRef = useRef<HTMLDivElement | null>(null);

  // Input/output history tracking
  const [history, setHistory] = useState<string[]>([]);

  // Theming for toolbar and left-rail icons (scoped to this component)
  const isPurpleTheme = colorTheme === 'purple';
  const iconButtonBase = 'icon-btn no-ring rounded-md border inline-flex items-center justify-center';
  const defaultIconButton = 'icon-plain border-black/30 dark:border-white/30 icon-hover-bg';
  // Deeper purple treatment
  const purpleIconButton = 'bg-white text-purple-800 border-purple-500 hover:bg-purple-100 hover:text-purple-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600';
  const iconButtonClass = `${iconButtonBase} ${isPurpleTheme ? purpleIconButton : defaultIconButton}`;

  const defaultIconText = 'text-slate-700 dark:text-slate-200';
  const purpleIconText = 'text-purple-800 dark:text-purple-300';
  const iconTextClass = isPurpleTheme ? purpleIconText : defaultIconText;
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const lastSavedToHistoryRef = useRef<string>('');
  const [outputHistory, setOutputHistory] = useState<string[]>([]);
  const [outputHistoryIndex, setOutputHistoryIndex] = useState<number>(-1);
  const isApplyingOutputHistoryRef = useRef<boolean>(false);

  // View/pending actions
  type ViewFormat = 'text' | 'tree' | 'form' | 'table' | 'view' | 'toon' | 'code';
  const [viewFormat, setViewFormat] = useState<ViewFormat>('text');
  const [previousView, setPreviousView] = useState<ViewFormat>('text');
  type PendingAction = { type: 'view-switch'; targetView: ViewFormat } | { type: 'download' } | { type: 'save' };
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Structure analysis mode
  const [isStructureAnalysisMode, setIsStructureAnalysisMode] = useState<boolean>(false);

  // Expand/collapse triggers for structured views
  const [expandAllTrigger, setExpandAllTrigger] = useState<boolean>(false);
  const [collapseAllTrigger, setCollapseAllTrigger] = useState<boolean>(false);

  // Table view ref for copy/export
  const tableViewRef = useRef<TableViewRef | null>(null);

  // TOON settings
  const [toonFlattenDepth, setToonFlattenDepth] = useState<number>(1);
  const [toonArrayJoin, setToonArrayJoin] = useState<string>('|');
  const [toonNullToken, setToonNullToken] = useState<string>('-');
  const [toonPath, setToonPath] = useState<string>('');

  // Graph view state
  const [showGraph, setShowGraph] = useState<boolean>(false);
  const [graphCollapsedNodes, setGraphCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNodePath, setSelectedNodePath] = useState<string>('');

  // Modal state
  const [showJMESPathModal, setShowJMESPathModal] = useState<boolean>(false);

  // AI Error state
  const [aiError, setAiError] = useState<{ type: AIErrorType; code?: number; message: string; originalError?: string } | null>(null);
  const [lastAiRequest, setLastAiRequest] = useState<(() => Promise<void>) | null>(null);
  
  // Test mode to simulate errors (Ctrl+Shift+E=503, Ctrl+Shift+S=500, Ctrl+Shift+R=429)
  const [testErrorMode, setTestErrorMode] = useState<'503' | '500' | '429' | null>(null);

  // Fast/Smart mode for JSON formatter
  const [formatterMode, setFormatterMode] = useState<FormatterMode>('fast');
  const [errorLines, setErrorLines] = useState<ErrorPosition[]>([]);
  const [commentLines, setCommentLines] = useState<number[]>([]);
  const [appliedFixes, setAppliedFixes] = useState<FixChange[]>([]);
  const [showFixSummary, setShowFixSummary] = useState(false);
  const [errorSource, setErrorSource] = useState<'input' | 'output'>('input');
  // Highlighted line targeting in input editor
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [highlightedType, setHighlightedType] = useState<'simple' | 'complex' | 'comment' | null>(null);
  const [highlightPulse, setHighlightPulse] = useState<boolean>(false);
  const [disableAutoScroll, setDisableAutoScroll] = useState<boolean>(false);
  // Ref for input editor folding API
  const inputEditorApiRef = useRef<{ foldAll: () => void; unfoldAll: () => void } | null>(null);
  // Input line numbers are always on to match output gutter
  const [showInputLineNumbers] = useState<boolean>(true);

  // Modal: JSON validation success (popup instead of banner)
  const [showValidationSuccess, setShowValidationSuccess] = useState<boolean>(false);
  const [validationSuccessText, setValidationSuccessText] = useState<string>('JSON is valid');

  const clearHighlight = useCallback(() => {
    setHighlightedLine(null);
    setHighlightedType(null);
    setHighlightPulse(false);
  }, []);

  // Keyboard shortcuts: Undo/Redo/Compact and test error toggles
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
        const target = event.target as HTMLElement;
        const isInTextarea = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
        if (!isInTextarea && historyIndex > 0 && activeLanguage === 'json') {
          event.preventDefault();
          handleUndo();
        }
      } else if (event.ctrlKey && event.key === 'y') {
        const target = event.target as HTMLElement;
        const isInTextarea = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
        if (!isInTextarea && historyIndex < history.length - 1 && activeLanguage === 'json') {
          event.preventDefault();
          handleRedo();
        }
      } else if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        if (activeLanguage === 'json' && inputCode.trim()) {
          handleCompact();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [testErrorMode, historyIndex, history, activeLanguage, inputCode]);

  // Close dropdowns when clicking outside (handles header + inline Sort separately)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        if (showBeautifyDropdown) setShowBeautifyDropdown(false);
        if (showSortDropdown) setShowSortDropdown(false);
        if (showInlineSortDropdown) setShowInlineSortDropdown(false);
        if (showOutputSortDropdown) setShowOutputSortDropdown(false);
      }
    };

    if (showBeautifyDropdown || showSortDropdown || showInlineSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBeautifyDropdown, showSortDropdown, showInlineSortDropdown, showOutputSortDropdown]);

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

  // Prevent auto-syncing Input -> Output for specific Input-only actions (e.g., Sort)
  const suppressOutputSyncRef = useRef(false);
  
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
    // Heavy parsing is debounced in an effect to keep paste responsive
  };

  // Initialize input history baseline when input becomes non-empty
  useEffect(() => {
    const trimmed = inputCode.trim();
    if (activeLanguage !== 'json') return;
    if (!trimmed) return;
    if (historyIndex === -1) {
      const initial = [inputCode];
      setHistory(initial);
      setHistoryIndex(0);
      lastSavedToHistoryRef.current = inputCode;
    }
  }, [inputCode, activeLanguage, historyIndex]);

  // Track subsequent input edits to build input history (ignore duplicates)
  useEffect(() => {
    const trimmed = inputCode.trim();
    if (activeLanguage !== 'json') return;
    if (!trimmed) return;
    if (historyIndex >= 0 && inputCode !== history[historyIndex]) {
      const newHist = [...history.slice(0, historyIndex + 1), inputCode];
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
      lastSavedToHistoryRef.current = inputCode;
    }
  }, [inputCode, activeLanguage, history, historyIndex]);

  // Debounced parse & classification for JSON input
  useEffect(() => {
    if (activeLanguage !== 'json') {
      setHasCommentsInInput(false);
      setCommentLines([]);
      // Do not auto-populate output for non-JSON languages
      return;
    }
    const timer = window.setTimeout(() => {
      const trimmed = inputCode.trim();
      if (!trimmed) {
        setHasCommentsInInput(false);
        setCommentLines([]);
        setErrorLines([]);
        setOutputCode(null);
        clearHighlight();
        return;
      }

      const res = parseJsonSafe(trimmed);
      setHasCommentsInInput(res.hasComments);
      setCommentLines(res.hasComments ? res.comments.map(c => c.line) : []);

      if (res.ok) {
        setErrorLines([]);
        setValidationError(null);
        // Auto-populate formatted output when input JSON is valid
        // Skip auto-sync if this input change comes from an Input-only action (e.g., Sort)
        if (!suppressOutputSyncRef.current) {
          try {
            const formatted = JSON.stringify(res.value, null, 2);
            setOutputCode(formatted);
            // Default to View mode for beautifier experience
            setIsStructureAnalysisMode(false);
            setViewFormat('view');
            // Trigger expand-all for structured views by toggling expandAllTrigger
            setExpandAllTrigger(true);
            setTimeout(() => setExpandAllTrigger(false), 120);
          } catch {
            // Ignore formatting issues; keep existing output state
          }
        }
        // Reset suppression flag after processing this input change
        if (suppressOutputSyncRef.current) suppressOutputSyncRef.current = false;
      } else {
        const { errors: allErrors, error: parseError } = res as ParseResultErr;
        setErrorLines(allErrors);
        setErrorSource('input');
        setOutputCode(null);

        let commentInfo = '';
        if (res.hasComments) {
          commentInfo = `\n\n📝 **Comments Detected** (${res.comments.length}):\n`;
          res.comments.forEach(m => {
            const prefix = m.kind === 'single' ? '// ' : '/* ';
            commentInfo += `- Line ${m.line}: ${prefix}${m.preview}${m.preview.length >= 80 ? '…' : ''}\n`;
          });
          commentInfo += `\n*Note: Comments are not valid in JSON. Use Auto Fix to remove them safely without changing other logic.*\n`;
        }

        if (formatterMode === 'smart') {
          let errorAnalysis = `### Invalid JSON Syntax\n\n**Error Details:**\n${parseError.message}`;
          if (allErrors.length > 0) {
            errorAnalysis += `\n\n**Error Locations:**\n`;
            allErrors.forEach(error => {
              errorAnalysis += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
            });
          }
          errorAnalysis += `\n\n**What Happened:**\nThe JSON you provided has syntax errors that prevent it from being parsed. This could be due to:\n- Missing or extra commas\n- Unclosed quotes or brackets\n- Invalid characters or formatting\n\n### AI-Powered Resolution Available\n\nSince you're using Smart Mode (AI), I can attempt to automatically fix these syntax errors for you.\n\n**Suggestions:**\n1. Click the \"Fix Complex Errors with AI\" button to let AI fix the syntax errors\n2. Or manually review and fix the JSON syntax\n3. Common issues: trailing commas, unquoted keys, single quotes instead of double quotes`;
          setValidationError({
            isValid: false,
            reason: errorAnalysis + commentInfo,
            isFixableSyntaxError: true,
            suggestedLanguage: undefined
          });
        } else {
          let fastError = `Invalid JSON syntax: ${parseError.message}\n\n📍 Error Locations:\n`;
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
    }, 150);

    return () => window.clearTimeout(timer);
  }, [inputCode, activeLanguage, formatterMode]);

  // Removed incorrect effect that added Output edits to Input history
  // Output history tracking is handled in a dedicated effect further below
  // Global keyboard shortcuts: route Undo/Redo to Input or Output based on focus
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
      } else if (event.ctrlKey && !event.shiftKey && (event.key === 'z' || event.key === 'Z')) {
        const target = event.target as HTMLElement;
        const isInTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
        if (isInTextInput) return;

        const activeEl = (document.activeElement as Node | null);
        const isInOutput = !!(outputContainerRef.current && activeEl && outputContainerRef.current.contains(activeEl));

        if (isInOutput) {
          if (outputHistoryIndex > 0) {
            event.preventDefault();
            handleOutputUndo();
          }
        } else {
          if (historyIndex > 0 && activeLanguage === 'json') {
            event.preventDefault();
            handleUndo();
          }
        }
      } else if (event.ctrlKey && (event.key === 'y' || event.key === 'Y' || (event.shiftKey && (event.key === 'z' || event.key === 'Z')))) {
        const target = event.target as HTMLElement;
        const isInTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
        if (isInTextInput) return;

        const activeEl = (document.activeElement as Node | null);
        const isInOutput = !!(outputContainerRef.current && activeEl && outputContainerRef.current.contains(activeEl));

        if (isInOutput) {
          if (outputHistoryIndex >= 0 && outputHistoryIndex < outputHistory.length - 1) {
            event.preventDefault();
            handleOutputRedo();
          }
        } else {
          if (historyIndex < history.length - 1 && activeLanguage === 'json') {
            event.preventDefault();
            handleRedo();
          }
        }
      } else if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        if (activeLanguage === 'json' && inputCode.trim()) {
          handleCompact();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [testErrorMode, historyIndex, history, activeLanguage, inputCode, outputHistoryIndex, outputHistory]);

  // Sync fullscreen state with actual fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      // Track output-only fullscreen by comparing the fullscreen element
      setIsOutputFullscreen(document.fullscreenElement === outputContainerRef.current);
      
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

  // Close dropdowns when clicking outside (header + inline Sort)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        if (showBeautifyDropdown) setShowBeautifyDropdown(false);
        if (showSortDropdown) setShowSortDropdown(false);
        if (showInlineSortDropdown) setShowInlineSortDropdown(false);
        if (showOutputSortDropdown) setShowOutputSortDropdown(false);
      }
    };

    if (showBeautifyDropdown || showSortDropdown || showInlineSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

  }, [showBeautifyDropdown, showSortDropdown, showInlineSortDropdown, showOutputSortDropdown]);

  // Build a per-line style map for gutter markers in the input editor
  const inputLineStyleMap = useMemo(() => {
    if (activeLanguage !== 'json') return undefined;
    if (errorSource !== 'input') return undefined;
    const map: Record<number, 'simple' | 'complex' | 'comment'> = {};
    for (const line of commentLines) {
      map[line] = 'comment';
    }
    for (const err of errorLines) {
      const type: 'simple' | 'complex' = isComplexError(err) ? 'complex' : 'simple';
      const prev = map[err.line];
      if (prev === 'complex') continue;
      if (prev === 'simple' && type === 'simple') continue;
      map[err.line] = type;
    }
    return map;
  }, [activeLanguage, errorSource, commentLines, errorLines]);


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
  function isComplexError(error: ErrorPosition): boolean {
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
  }
  
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

  // Format Input JSON with indentation and line feeds (Ctrl+L)
  const handleFormatInputJson = () => {
    if (activeLanguage !== 'json') return;
    const trimmed = inputCode.trim();
    if (!trimmed) return;
    try {
      const obj = JSON.parse(trimmed);
      const formatted = JSON.stringify(obj, null, 2);
      // Input-only action: prevent auto sync to Output
      suppressOutputSyncRef.current = true;
      setInputCode(formatted);
      addToHistory(formatted);
    } catch (err) {
      setValidationError({
        isValid: false,
        reason: `Format failed: ${(err as any)?.message || 'Invalid JSON'}`,
        isFixableSyntaxError: true,
        suggestedLanguage: undefined
      });
    }
  };

  // Keyboard shortcut: Ctrl+L to format Input JSON
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl+L (or Cmd+L on macOS)
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        handleFormatInputJson();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeLanguage, inputCode]);

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
      // Clear any existing input highlight after applying fixes
      clearHighlight();
      
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
        // Do not show success banners/messages for Output auto-fix; just apply fixes
        setShowFixSummary(false);
        setSuccessMessage(null);
        setAppliedFixes([]);
        if (pendingAction) {
          setTimeout(() => {
            executePendingAction();
          }, 50);
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
    // Do not clear output/view on Validate; only reset error states
    setOutputError(null);
    setValidationError(null);
    setSuccessMessage(null);
    setIsValidated(false);
    setErrorLines([]);
    setAppliedFixes([]);
    setShowFixSummary(false);
    setAiError(null);
    setHasCommentsInInput(false);

    try {
      // For JSON, use centralized parsing + detection
      if (activeLanguage === 'json') {
        const res = parseJsonSafe(trimmedInput);
        setHasCommentsInInput(res.hasComments);
        setCommentLines(res.hasComments ? res.comments.map(c => c.line) : []);
        if (res.ok) {
          setErrorLines([]);
          // Show success modal instead of banner in output box
          setValidationSuccessText('JSON is valid');
          setShowValidationSuccess(true);
          setIsValidated(true);
          setIsValidating(false);
          return;
        }

        const { errors: allErrors, error: parseError } = res as ParseResultErr;
        setErrorLines(allErrors);
        setErrorSource('input');

        let commentInfo = '';
        if (res.hasComments) {
          commentInfo = `\n\n📝 **Comments Detected** (${res.comments.length}):\n`;
          res.comments.forEach(m => {
            const prefix = m.kind === 'single' ? '// ' : '/* ';
            commentInfo += `- Line ${m.line}: ${prefix}${m.preview}${m.preview.length >= 80 ? '…' : ''}\n`;
          });
          commentInfo += `\n*Note: Comments are not valid in JSON. Use Auto Fix to remove them safely without changing other logic.*\n`;
        }

        if (formatterMode === 'smart') {
          // Smart mode: Always offer AI-powered correction
          let errorAnalysis = `### Invalid JSON Syntax\n\n**Error Details:**\n${parseError.message}`;

          if (allErrors.length > 0) {
            errorAnalysis += `\n\n**Error Locations:**\n`;
            allErrors.forEach(error => {
              errorAnalysis += `- Line ${error.line}, Column ${error.column}${error.message ? ': ' + error.message : ''}\n`;
            });
          }

          errorAnalysis += `\n\n**What Happened:**\nThe JSON you provided has syntax errors that prevent it from being parsed. This could be due to:\n- Missing or extra commas\n- Unclosed quotes or brackets\n- Invalid characters or formatting\n\n### AI-Powered Resolution Available\n\nSince you're using Smart Mode (AI), I can attempt to automatically fix these syntax errors for you.\n\n**Suggestions:**\n1. Click the \"Fix Complex Errors with AI\" button to let AI fix the syntax errors\n2. Or manually review and fix the JSON syntax\n3. Common issues: trailing commas, unquoted keys, single quotes instead of double quotes`;
          
          setValidationError({
            isValid: false,
            reason: errorAnalysis + commentInfo,
            isFixableSyntaxError: true,
            suggestedLanguage: undefined
          });
        } else {
          // Fast mode messaging
          let fastError = `Invalid JSON syntax: ${parseError.message}\n\n📍 Error Locations:\n`;
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
        setIsValidating(false);
        return;
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
            // Do not show success banners/messages for Output AI auto-correct; just apply fixes
            setSuccessMessage(null);
            if (pendingAction) {
              setTimeout(() => {
                executePendingAction();
              }, 50);
            }
          } else {
            setInputCode(correctedCode);
            addToHistory(correctedCode);
            setSuccessMessage("✅ AI successfully corrected the syntax. You can now format the code.");
            // Clear any existing input highlight after AI correction
            clearHighlight();
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
      // Force Output to show in Code view after Beautify/Format
      setIsStructureAnalysisMode(false);
      setViewFormat('code');
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
      // Force Output to show in Code view after Minify
      setIsStructureAnalysisMode(false);
      setViewFormat('code');
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
      // Force Output to show in Code view after Compact
      setIsStructureAnalysisMode(false);
      setViewFormat('code');
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
      // Sort action is Input-only; prevent Input->Output auto-sync for this change
      suppressOutputSyncRef.current = true;
      setInputCode(formatted);
      addToHistory(formatted);
    } catch (err: any) {
      setValidationError({
        isValid: false,
        reason: `Sort failed: ${err.message}`,
        isFixableSyntaxError: true,
        suggestedLanguage: undefined
      });
    }
  };

  // Sort Output JSON independently via Output toolbar
  const handleSortOutput = (direction: 'asc' | 'desc', sortBy: 'keys' | 'values') => {
    const trimmedOutput = outputCode?.trim();
    if (!trimmedOutput || activeLanguage !== 'json') return;

    setIsStructureAnalysisMode(false);
    try {
      const parsedJson = JSON.parse(trimmedOutput);
      const sortObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(sortObject);
        }
        if (obj !== null && typeof obj === 'object') {
          const keys = Object.keys(obj);
          const comparator = (a: string, b: string) => direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
          const sortedObj: any = {};
          if (sortBy === 'keys') {
            keys.sort(comparator).forEach((key) => {
              sortedObj[key] = sortObject(obj[key]);
            });
          } else {
            keys
              .sort((a, b) => {
                const va = String(obj[a]);
                const vb = String(obj[b]);
                return direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
              })
              .forEach((key) => {
                sortedObj[key] = sortObject(obj[key]);
              });
          }
          return sortedObj;
        }
        return obj;
      };
      const sorted = sortObject(parsedJson);
      const formatted = JSON.stringify(sorted, null, 2);
      setOutputCode(formatted);
      // Keep output history consistent with other output edits
      setOutputHistory((prev) => [...prev.slice(0, outputHistoryIndex + 1), formatted]);
      setOutputHistoryIndex((idx) => idx + 1);
      setOutputError(null);
    } catch (err: any) {
      setValidationError({
        isValid: false,
        reason: `Sort Output failed: ${err.message}`,
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
      // Input-only action: prevent auto sync to Output
      suppressOutputSyncRef.current = true;
      setInputCode(previousCode);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && activeLanguage === 'json') {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextCode = history[newIndex];
      // Input-only action: prevent auto sync to Output
      suppressOutputSyncRef.current = true;
      setInputCode(nextCode);
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
    // If in TOON view, copy TOON-rendered text instead of raw JSON
    if (viewFormat === 'toon') {
      try {
        const parsedData = JSON.parse(outputCode);
        const toonText: string = jsonToToon(parsedData, {
          flattenDepth: Math.max(0, Number.isFinite(toonFlattenDepth) ? toonFlattenDepth : 1),
          arrayJoin: toonArrayJoin || '|',
          nullToken: toonNullToken || '-',
          headerName: 'item',
          path: toonPath.trim() ? toonPath.trim() : undefined
        });
        await navigator.clipboard.writeText(toonText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy TOON:', error);
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
    clearHighlight();
  };

  // Clear Output: clear all output data
  const handleClearOutput = () => {
    if (!outputCode.trim()) return; // Don't clear if already empty
    setOutputCode('');
    setValidationError(null);
    setIsStructureAnalysisMode(false); // Reset structure analysis mode
  };

  // Removed: Move handler (copy input to output) — button removed and handler unused

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
    
    // TOON view: offer saving TOON text as .txt or .doc (Word-compatible)
    if (activeLanguage === 'json' && viewFormat === 'toon' && outputCode) {
      try {
        // Compute TOON text from current output JSON
        let toonText = '';
        try {
          const data = JSON.parse(outputCode);
          toonText = jsonToToon(data, {
            flattenDepth: Math.max(0, Number.isFinite(toonFlattenDepth) ? toonFlattenDepth : 1),
            arrayJoin: toonArrayJoin || '|',
            nullToken: toonNullToken || '-',
            headerName: 'item',
            path: toonPath.trim() ? toonPath.trim() : undefined
          });
        } catch (e) {
          toonText = outputCode; // Fallback to raw content if parsing fails
        }

        // Prepare a minimal HTML document for .doc that Word opens nicely
        const makeDocHtml = (txt: string) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>TOON</title><style>pre{font-family:Consolas,Monaco,monospace;font-size:11pt;white-space:pre-wrap;}</style></head><body><pre>${txt
          .replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;')}</pre></body></html>`;

        // Prepare basic RTF content for rich-text editors like Word/WordPad
        const makeRtf = (txt: string) => {
          const esc = (s: string) => s
            .replace(/\\/g, "\\\\")
            .replace(/\{/g, "\\{")
            .replace(/\}/g, "\\}")
            .replace(/\r?\n/g, "\n");
          const rtfBody = esc(txt).replace(/\n/g, "\\line ");
          return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Consolas;}}\\fs22\\pard\\f0 ${rtfBody}}`;
        };

        // @ts-ignore
        if (window.showSaveFilePicker) {
          try {
            // @ts-ignore
            const handle = await window.showSaveFilePicker({
              suggestedName: 'toon.txt',
              types: [
                {
                  description: 'Text File',
                  accept: { 'text/plain': ['.txt'] },
                },
                {
                  description: 'TOON File',
                  accept: { 'text/plain': ['.toon'] },
                },
                {
                  description: 'Rich Text Format',
                  accept: { 'application/rtf': ['.rtf'] },
                },
                {
                  description: 'Word Document (legacy)',
                  accept: { 'application/msword': ['.doc'] },
                },
              ],
            });
            const fileName = handle.name || '';
            const lower = fileName.toLowerCase();
            const isDoc = lower.endsWith('.doc');
            const isRtf = lower.endsWith('.rtf');
            const writable = await handle.createWritable();
            if (isDoc) {
              await writable.write(new Blob([makeDocHtml(toonText)], { type: 'application/msword' }));
            } else if (isRtf) {
              await writable.write(new Blob([makeRtf(toonText)], { type: 'application/rtf' }));
            } else {
              await writable.write(new Blob([toonText], { type: 'text/plain' }));
            }
            await writable.close();
            return;
          } catch (err: any) {
            if (err.name === 'AbortError') {
              console.log('Save dialog was cancelled by user');
              return;
            }
            console.warn('Save As dialog error (TOON):', err);
            // Fall through to fallback download
          }
        }

        // Fallback: download as .txt (browser cannot choose folder)
        const blob = new Blob([toonText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'toon.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      } catch (e) {
        console.error('TOON save failed:', e);
        // Continue to generic flow as last resort
      }
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
    // If File System Access API is not supported, fallback to simple download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Toggle fullscreen specifically for Output container
  const handleToggleOutputFullscreen = () => {
    const el = outputContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen().catch(() => {});
    } else if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) => {
        console.error('Error enabling output fullscreen:', err);
      });
    } else {
      // If some other element is in fullscreen, exit first then request on output
      document.exitFullscreen().then(() => {
        el.requestFullscreen().catch((err) => console.error('Error enabling output fullscreen:', err));
      }).catch(() => {});
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

  // Validate Output JSON (explicit action via Output header toolbar)
  const handleValidateOutput = () => {
    if (activeLanguage !== 'json') return;
    const content = outputCode || '';
    if (!content.trim()) return;

    try {
      JSON.parse(content);
      // Valid: show success modal, do not alter output/view
      setValidationError(null);
      setErrorLines([]);
      setValidationSuccessText('JSON is valid');
      setShowValidationSuccess(true);
    } catch (jsonErr: any) {
      // Invalid: show detailed errors in Output box (current behavior)
      const allErrors = validateJsonSyntax(content);
      setErrorLines(allErrors);
      setErrorSource('output');
      setValidationError({
        isValid: false,
        reason: `Invalid JSON syntax in output: ${jsonErr.message}`,
        isFixableSyntaxError: true,
        suggestedLanguage: undefined
      });
    }
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

  // Auto expand nodes whenever user switches between structured JSON views
  useEffect(() => {
    if (!outputCode || activeLanguage !== 'json') return;
    if (['tree','form','view'].includes(viewFormat)) {
      setExpandAllTrigger(true);
      const t = setTimeout(() => setExpandAllTrigger(false), 120);
      return () => clearTimeout(t);
    }
  }, [viewFormat, outputCode, activeLanguage]);

  // Helper to render non-code views for formatted output
  const renderStructuredOutputView = () => {
    if (!outputCode) return null;
    try {
      const parsedData = JSON.parse(outputCode);
      switch (viewFormat) {
        case 'toon': {
          const toonText: string = jsonToToon(parsedData, {
            flattenDepth: Math.max(0, Number.isFinite(toonFlattenDepth) ? toonFlattenDepth : 1),
            arrayJoin: toonArrayJoin || '|',
            nullToken: toonNullToken || '-',
            headerName: 'item',
            path: toonPath.trim() ? toonPath.trim() : undefined
          });
          return (
            <div className="absolute inset-0 overflow-hidden">
              <CodeMirrorViewer
                code={toonText}
                language="text"
                readOnly
                expandAll={expandAllTrigger}
                collapseAll={collapseAllTrigger}
              />
            </div>
          );
        }
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

  // Initialize output history baseline as soon as outputCode becomes available
  useEffect(() => {
    if (!outputCode || !outputCode.trim()) return;
    if (outputHistoryIndex === -1) {
      setOutputHistory([outputCode]);
      setOutputHistoryIndex(0);
    }
  }, [outputCode, outputHistoryIndex]);

  // Track subsequent output edits to build history (ignore entries applied by undo/redo)
  useEffect(() => {
    if (!outputCode || !outputCode.trim()) return;
    if (isApplyingOutputHistoryRef.current) {
      isApplyingOutputHistoryRef.current = false;
      return;
    }
    if (outputHistoryIndex >= 0 && outputCode !== outputHistory[outputHistoryIndex]) {
      const newHist = [...outputHistory.slice(0, outputHistoryIndex + 1), outputCode];
      setOutputHistory(newHist);
      setOutputHistoryIndex(newHist.length - 1);
    }
  }, [outputCode, outputHistory, outputHistoryIndex]);

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

        {/* New ribbon: Mode and Format selector (above main ribbon) */}
        {isJsonLanguage && (
          <div className="flex items-center justify-end gap-4 bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-3 mb-2">
            {/* Mode selector - Fast/Smart(AI) */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormatterMode('fast')}
                  className={`btn btn-cyan ${formatterMode === 'fast' ? '' : 'opacity-70'}`}
                >
                  <i className="fa-solid fa-bolt" aria-hidden="true"></i>
                  <span>Fast</span>
                </button>
                <button
                  onClick={() => setFormatterMode('smart')}
                  className={`btn btn-pink ${formatterMode === 'smart' ? '' : 'opacity-70'}`}
                >
                  <i className="fa-solid fa-brain" aria-hidden="true"></i>
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
              <label htmlFor="language-select-top" className="text-sm font-medium text-gray-700 dark:text-gray-300">Format:</label>
              <select
                id="language-select-top"
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
        )}

        {/* Compact toolbar with smaller buttons and dropdowns */}
        {isJsonLanguage && (
          <div className="flex items-center justify-between gap-2 bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-3 overflow-visible z-20">
            <div className="flex items-center gap-2 overflow-visible">
              {/* Format (Input JSON) - placed before Beautify */}
              <div className="relative dropdown-container overflow-visible">
                <button
                  onClick={() => {
                    if (isActionDisabled || !inputCode.trim()) return;
                    handleFormatInputJson();
                  }}
                  className="btn btn-blue"
                  title="Format Input JSON (Ctrl+L)"
                >
                  <i className="fa-solid fa-align-left" aria-hidden="true"></i>
                  <span>Format</span>
                </button>
              </div>

              {/* Beautify button with dropdown */}
              <div className="relative dropdown-container overflow-visible">
                <button
                  onClick={() => {
                    if (isActionDisabled || !inputCode.trim()) return;
                    setShowBeautifyDropdown(!showBeautifyDropdown);
                  }}
                  className="btn btn-purple"
                >
                  <i className="fa-solid fa-magic" aria-hidden="true"></i>
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

              {/* Minify button (Beautifier page only) */}
              {showMinifyNextToBeautify && (
                <button
                  onClick={() => {
                    if (isActionDisabled || !inputCode.trim()) return;
                    // Preserve existing Compact behavior but label as Minify
                    handleCompact();
                  }}
                  className="btn btn-orange"
                  title="Minify JSON (remove all whitespace)"
                >
                  <i className="fa-solid fa-compress" aria-hidden="true"></i>
                  <span>Minify</span>
                </button>
              )}

              {/* Tree View button - opens separate page to show JSON tree */}
              {activeLanguage === 'json' && (
                <button
                  onClick={() => {
                    if (!inputCode.trim()) return;
                    navigate('/json-tree-view', { state: { inputJson: inputCode } });
                  }}
                  className="btn btn-green"
                  title="Open JSON Tree View in a separate page"
                >
                  <i className="fa-solid fa-tree" aria-hidden="true"></i>
                  <span>Tree View</span>
                </button>
              )}

              {/* Graph button - opens in-page Graph Viewer (same workflow) */}
              {activeLanguage === 'json' && (
                <button
                  onClick={() => { if (isActionDisabled || !inputCode.trim()) return; handleShowGraph(); }}
                  className="btn btn-cyan"
                  title="Visualize as Graph"
                >
                  <i className="fa-solid fa-chart-simple" aria-hidden="true"></i>
                  <span>Graph</span>
                </button>
              )}

              {/* Structure Analysis button - opens dedicated analyzer page */}
              {activeLanguage === 'json' && (
                <button
                  onClick={() => {
                    if (!inputCode.trim()) return;
                    navigate('/json-structure-analyzer', { state: { inputJson: inputCode } });
                  }}
                  className="btn btn-purple"
                  title="Open JSON Structure Analyzer"
                >
                  <i className="fa-solid fa-diagram-project" aria-hidden="true"></i>
                  <span>Structure Analysis</span>
                </button>
              )}

              {/* Transform button - opens JMESPath Transform modal (same workflow) */}
              {activeLanguage === 'json' && (
                <button
                  onClick={() => {
                    if (!inputCode.trim()) return;
                    try { JSON.parse(inputCode); setShowJMESPathModal(true); }
                    catch {
                      setValidationError({ isValid: false, reason: 'Invalid JSON. Please fix syntax errors before using Transform.', isFixableSyntaxError: true, suggestedLanguage: undefined });
                    }
                  }}
                  className="btn btn-pink"
                  title="Transform with JMESPath"
                >
                  <i className="fa-solid fa-shuffle" aria-hidden="true"></i>
                  <span>Transform</span>
                </button>
              )}

              {/* Sort group removed; replaced by icon-only pill next to Input label */}

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>

              {/* Validate button removed; replaced by icon-only pill next to Input label */}

              {/* Structure Analysis button - Only show for JSON
                  Hide when inlineStructureAnalysisIcon is enabled (Beautifier page) */}
              {activeLanguage === 'json' && !inlineStructureAnalysisIcon && (
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

            {/* Right side controls removed to keep only Format/Beautify/Minify in current ribbon */}
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
          <div className={`w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg ${showLeftInputActions ? 'overflow-visible' : 'overflow-hidden'} p-6 gap-3 relative z-10 h-[600px] border border-slate-200 dark:border-slate-700`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 relative z-50 w-full">
                <h2 className="text-lg font-semibold">Input</h2>
                {/* Icon Toolbar - positioned next to "Input" heading */}
                  <div className="flex items-center gap-1 ml-4 opacity-100 pointer-events-auto relative z-50 bg-cyan-50/70 dark:bg-slate-700/40 px-2 py-1 rounded-md border border-cyan-200 dark:border-slate-600">
                  {/* Collapse/Expand All – moved to be first after Input label */}
                  {isJsonLanguage && (
                    <>
                      <Tooltip content="Collapse all JSON blocks">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => inputEditorApiRef.current?.foldAll()}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputEditorApiRef.current?.foldAll(); } }}
                          className={`${iconButtonClass} ml-1`}
                          aria-label="Collapse All Input"
                        >
                          <i className={`fa-solid fa-arrows-down-to-line ${iconTextClass}`} aria-hidden="true"></i>
                        </span>
                      </Tooltip>
                      <Tooltip content="Expand all JSON blocks">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => inputEditorApiRef.current?.unfoldAll()}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputEditorApiRef.current?.unfoldAll(); } }}
                          className={iconButtonClass}
                          aria-label="Expand All Input"
                        >
                          <i className={`fa-solid fa-arrows-up-to-line ${iconTextClass}`} aria-hidden="true"></i>
                        </span>
                      </Tooltip>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>

                      {/* Sort (Input) – moved to appear after Expand All */}
                      <div className="relative inline-flex dropdown-container overflow-visible">
                        <Tooltip content="Sort Input JSON (toggle options)">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => { if (isActionDisabled || !inputCode.trim()) return; setShowSortDropdown(!showSortDropdown); }}
                            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isActionDisabled && inputCode.trim()) { e.preventDefault(); setShowSortDropdown(!showSortDropdown); } }}
                            className={`${iconButtonClass} ${!inputCode.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
                            aria-label="Sort Input"
                            title="Sort Input JSON"
                          >
                            <i className={`fa-solid fa-sort ${iconTextClass}`} aria-hidden="true"></i>
                          </span>
                        </Tooltip>
                        {showSortDropdown && (
                          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[150px]">
                            <button onClick={() => { handleSort('asc','keys'); setShowSortDropdown(false); }} className="w-full px-3 py-1.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100">Keys (A → Z)</button>
                            <button onClick={() => { handleSort('desc','keys'); setShowSortDropdown(false); }} className="w-full px-3 py-1.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100">Keys (Z → A)</button>
                            <button onClick={() => { handleSort('asc','values'); setShowSortDropdown(false); }} className="w-full px-3 py-1.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100">Values (A → Z)</button>
                            <button onClick={() => { handleSort('desc','values'); setShowSortDropdown(false); }} className="w-full px-3 py-1.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100">Values (Z → A)</button>
                          </div>
                        )}
                      </div>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                    </>
                  )}
                    {/* GROUP 2: Save, Download, Copy (hide when left rail is enabled to avoid duplication) */}
                    {!showLeftInputActions && (
                      <>
                        <Tooltip content="Save to file">
                          <button
                            onClick={handleSave}
                            className={`${isPurpleTheme ? 'p-1 rounded-md transition-all text-xl cursor-pointer border border-purple-500 bg-white text-purple-800 hover:bg-purple-100 hover:text-purple-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600' : 'p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer border border-black/30 dark:border-white/30'}`}
                            aria-label="Save"
                            
                          >
                            💾
                          </button>
                        </Tooltip>
                        <Tooltip content="Download to file">
                          <button
                            onClick={handleDownload}
                            className={`${isPurpleTheme ? 'p-1 rounded-md transition-all text-xl cursor-pointer border border-purple-500 bg-white text-purple-800 hover:bg-purple-100 hover:text-purple-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600' : 'p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer border border-black/30 dark:border-white/30'}`}
                            aria-label="Download"
                            
                          >
                            📥
                          </button>
                        </Tooltip>
                        <Tooltip content="Copy to clipboard">
                          <button
                            onClick={handleCopy}
                            className={`${isPurpleTheme ? 'p-1 rounded-md transition-all text-xl cursor-pointer border border-purple-500 bg-white text-purple-800 hover:bg-purple-100 hover:text-purple-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600' : 'p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer border border-black/30 dark:border-white/30'}`}
                            aria-label="Copy"
                            
                          >
                            📋
                          </button>
                        </Tooltip>
                        <Tooltip content="Print">
                          <button
                            onClick={handlePrint}
                            className={`${isPurpleTheme ? 'p-1 rounded-md transition-all text-xl cursor-pointer border border-purple-500 bg-white text-purple-800 hover:bg-purple-100 hover:text-purple-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600' : 'p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer border border-black/30 dark:border-white/30'}`}
                            aria-label="Print"
                          >
                            🖨️
                          </button>
                        </Tooltip>
                      </>
                    )}
                    
                    {/* Transform moved to ribbon (button). */}
                  
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>

                  

                  {/* GROUP 4: Undo and Redo (INPUT JSON) – remains after Sort */}
                  <Tooltip content="Undo last change">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={canUndoInput ? handleUndo : undefined}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && canUndoInput) { e.preventDefault(); handleUndo(); } }}
                      className={`${iconButtonClass} ${canUndoInput ? '' : 'opacity-40 cursor-not-allowed'}`}
                      aria-label="Undo"
                    >
                      <i className={`fa-solid fa-rotate-left ${iconTextClass}`} aria-hidden="true"></i>
                    </span>
                  </Tooltip>
                  <Tooltip content="Redo last change">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={canRedoInput ? handleRedo : undefined}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && canRedoInput) { e.preventDefault(); handleRedo(); } }}
                      className={`${iconButtonClass} ${canRedoInput ? '' : 'opacity-40 cursor-not-allowed'}`}
                      aria-label="Redo"
                    >
                      <i className={`fa-solid fa-rotate-right ${iconTextClass}`} aria-hidden="true"></i>
                    </span>
                  </Tooltip>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>

                      {/* Validate moved to right side toolbar */}

                  {/* GROUP 5: Compact (JSON only) */}
                  {isJsonLanguage && !showMinifyNextToBeautify && (
                    <>
                      <Tooltip content="Compact JSON data, remove all whitespaces">
                        <button
                          onClick={handleCompact}
                          className="p-1 rounded-md transition-all text-xl cursor-pointer border border-black/30 dark:border-white/30 icon-hover-bg text-slate-700 dark:text-slate-200"
                          aria-label="Compact"
                        >
                          📦
                        </button>
                      </Tooltip>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                    </>
                  )}

                  {/* Structure Analysis icon removed from Input toolbar (moved to ribbon) */}

                  {/* Collapse/Expand moved earlier */}

                  {/* Fullscreen moved to right side toolbar */}
                  {/* Line numbers toggle removed per requirement (input always matches output) */}
                </div>
                {/* Toolbar always rendered; hidden when left rail is enabled */}
                {/* Right-aligned toolbar: Validate and Enter Fullscreen */}
                <div className="flex items-center gap-1 ml-auto">
                  {isJsonLanguage && (
                    <Tooltip content="Validate Input JSON">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleValidate}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleValidate(); } }}
                        className={iconButtonClass}
                        aria-label="Validate Input JSON"
                      >
                        <i className={`fa-solid fa-check ${iconTextClass}`} aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                  )}
                  {!isFullscreen && (
                    <Tooltip content="Enter fullscreen">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleToggleFullscreen}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleFullscreen(); } }}
                        className={iconButtonClass}
                        aria-label="Enter Fullscreen"
                      >
                        <i className={`fa-solid fa-expand ${iconTextClass}`} aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-grow w-full rounded-md flex flex-col min-h-0 relative overflow-visible">
              {/* GROUP 1: Upload and Clear - positioned at top right inside the textarea box (hidden when left actions enabled) */}
              {!showLeftInputActions && (
              <div className="absolute top-2 right-6 z-20 flex items-center gap-1.5 pointer-events-auto">
                <Tooltip content="Upload a code file">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-blue-600 dark:text-blue-400"
                    aria-label="Upload File"
                  >
                    📤
                  </button>
                </Tooltip>
                <Tooltip content="Clear input">
                  <button
                    onClick={handleClear}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-red-600 dark:text-red-400"
                    aria-label="Clear Input"
                  >
                    🧹
                  </button>
                </Tooltip>
              </div>
              )}

              {/* Dedicated left rail column and reserved content area */}
              <div className="flex-grow min-h-0 flex flex-col relative">
                {showLeftInputActions && (
                  <div className="left-rail absolute top-2 left-[-8px] w-[42px] flex flex-col gap-1.5 pt-2 pl-2 pr-2 items-center bg-cyan-50/70 dark:bg-slate-800/40 z-20 border-r border-cyan-200 dark:border-slate-600 rounded-md">
                    <Tooltip content="Upload file">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                        className={iconButtonClass}
                        aria-label="Upload File"
                      >
                        <i className={`fa-solid fa-upload ${iconTextClass}`} aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                    <Tooltip content="Clear input">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleClear}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClear(); } }}
                        className={`${iconButtonClass} ${!inputCode.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
                        aria-label="Clear Input"
                      >
                        <i className={`fa-solid fa-broom ${iconTextClass}`} aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                    <Tooltip content="Upload file">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleDownload}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDownload(); } }}
                        className={`${iconButtonClass} mt-0.5`}
                        aria-label="Download"
                      >
                        <i className={`fa-solid fa-download ${iconTextClass}`} aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                    <Tooltip content="Save file">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleSave}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSave(); } }}
                        className={`${iconButtonClass} ${(!outputCode && !inputCode.trim()) ? 'opacity-40 cursor-not-allowed' : ''}`}
                        aria-label="Save"
                      >
                        <i className={`fa-solid fa-floppy-disk ${iconTextClass}`} aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                    <Tooltip content="Copy to clipboard">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleCopy}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(); } }}
                        className={`${iconButtonClass} ${!inputCode.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
                        aria-label="Copy"
                      >
                        <i className={`fa-solid fa-copy ${iconTextClass}`} aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                    <Tooltip content="Print">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handlePrint}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePrint(); } }}
                        className={iconButtonClass}
                        aria-label="Print"
                      >
                        <i className={`fa-solid fa-print ${iconTextClass}`} aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                  </div>
                )}

                <div className={showLeftInputActions ? "relative h-full min-h-0 ml-[34px]" : "relative h-full min-h-0"}>
                  <CodeEditor
                    value={inputCode}
                    onChange={handleInputChange}
                    language={activeLanguage}
                    placeholder={`Enter your ${activeLanguage.toUpperCase()} code here...`}
                    errorLines={errorSource === 'input' && activeLanguage === 'json' ? errorLines : undefined}
                    lineStyleMap={inputLineStyleMap}
                    highlightLine={highlightedLine ?? null}
                    highlightStyle={highlightedType ?? null}
                    highlightPulse={highlightPulse}
                    disableAutoScroll={disableAutoScroll}
                    onPaste={() => {
                      setDisableAutoScroll(true);
                      window.setTimeout(() => setDisableAutoScroll(false), 1500);
                    }}
                    editorApiRef={inputEditorApiRef}
                  showLineNumbers={showInputLineNumbers}
                  // Apply purple gutter only when purple theme is active on JSON Beautifier
                  gutterColorLight={isPurpleTheme ? 'rgba(243, 232, 255, 0.6)' : undefined}
                  gutterColorDark={isPurpleTheme ? 'rgba(76, 29, 149, 0.35)' : undefined}
                  />
                </div>
              </div>
              
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

          <div ref={outputContainerRef} className={`w-full lg:w-1/2 flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-3 ${isOutputFullscreen ? 'h-screen' : 'h-[600px]'}`}>
            {/* Output heading with View selector and Exit fullscreen button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Output</h2>
                {/* Icon Toolbar - positioned next to "Formatted Output" heading */}
                <div className="flex items-center gap-1 opacity-100 pointer-events-auto relative z-50">
                  {(validationError || outputError || aiError || successMessage || isStructureAnalysisMode) && (
                    <>
                      <Tooltip content="Save to file">
                        <button
                          onClick={handleSave}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                          aria-label="Save"
                        >
                          💾
                        </button>
                      </Tooltip>
                      <Tooltip content={viewFormat === 'toon' ? 'Copy TOON to clipboard' : 'Copy to clipboard'}>
                        <button
                          onClick={handleCopyOutput}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                          aria-label="Copy"
                        >
                          📋
                        </button>
                      </Tooltip>
                    </>
                  )}
                  {/* TOON Settings in header toolbar to avoid overlapping content controls */}
                  {activeLanguage === 'json' && viewFormat === 'toon' && (
                    <div className="relative toon-settings-popover">
                      <Tooltip content="TOON settings">
                        <button
                          onClick={() => setShowToonSettings(v => !v)}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                          aria-label="TOON Settings"
                          
                        >
                          ⚙️
                        </button>
                      </Tooltip>
                      {showToonSettings && (
                        <div className="absolute right-0 mt-2 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">TOON Settings</div>
                            <button onClick={() => setShowToonSettings(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Close settings">✕</button>
                          </div>
                          <label className="block text-xs text-slate-600 dark:text-slate-300">Flatten depth</label>
                          <input
                            type="number"
                            min={0}
                            max={6}
                            value={toonFlattenDepth}
                            onChange={(e) => setToonFlattenDepth(Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
                            className="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                          <label className="block text-xs text-slate-600 dark:text-slate-300">Array join token</label>
                          <input
                            type="text"
                            value={toonArrayJoin}
                            onChange={(e) => setToonArrayJoin(e.target.value)}
                            className="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                          <label className="block text-xs text-slate-600 dark:text-slate-300">Null token</label>
                          <input
                            type="text"
                            value={toonNullToken}
                            onChange={(e) => setToonNullToken(e.target.value)}
                            className="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                          <label className="block text-xs text-slate-600 dark:text-slate-300">Root path (optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. data.items[]"
                            value={toonPath}
                            onChange={(e) => setToonPath(e.target.value)}
                            className="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">Examples: <code>data.items[]</code>, <code>payload.records[0]</code></div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                  {/* Undo/Redo buttons removed; replaced by icon-only pills near Output label */}
                </div>
              </div>
                <div className="flex items-center gap-2">
                {/* Expand/Collapse icons - visible for Form, Tree, View, Code, and Text */}
                {activeLanguage === 'json' && ['form', 'tree', 'view', 'code', 'text'].includes(viewFormat) && !isStructureAnalysisMode && (
                  <>
                    <Tooltip content="Expand all fields">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleExpandAllFields}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleExpandAllFields(); } }}
                        className="icon-btn icon-green"
                        aria-label="Expand All"
                      >
                        <i className="fa-solid fa-arrows-up-to-line" aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                    <Tooltip content="Collapse all fields">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleCollapseAllFields}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCollapseAllFields(); } }}
                        className="icon-btn icon-orange"
                        aria-label="Collapse All"
                      >
                        <i className="fa-solid fa-arrows-down-to-line" aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                  </>
                )}
                  {/* Undo/Redo for Output – icon-only pills after Output label */}
                  <Tooltip content="Undo last change">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={canUndoOutput ? handleOutputUndo : undefined}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && canUndoOutput) { e.preventDefault(); handleOutputUndo(); } }}
                      className={`icon-btn icon-blue ${canUndoOutput ? '' : 'opacity-40 cursor-not-allowed'}`}
                      aria-label="Undo"
                    >
                      <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
                    </span>
                  </Tooltip>
                  <Tooltip content="Redo last change">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={canRedoOutput ? handleOutputRedo : undefined}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && canRedoOutput) { e.preventDefault(); handleOutputRedo(); } }}
                      className={`icon-btn icon-blue ${canRedoOutput ? '' : 'opacity-40 cursor-not-allowed'}`}
                      aria-label="Redo"
                    >
                      <i className="fa-solid fa-rotate-right" aria-hidden="true"></i>
                    </span>
                  </Tooltip>
                {/* Validate Output (JSON) - next to view controls */}
                {activeLanguage === 'json' && !isStructureAnalysisMode && ['form','tree','view','code','text'].includes(viewFormat) && (
                  <Tooltip content="Validate Output JSON">
                    <button
                      onClick={handleValidateOutput}
                      disabled={!outputCode || !outputCode.trim()}
                      className={`p-1 rounded-md transition-all text-xl ${!outputCode || !outputCode.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer'}`}
                      aria-label="Validate Output"
                      title="Validate Output JSON"
                    >
                      ✅
                    </button>
                  </Tooltip>
                )}
                {/* Output Sort (JSON) - independent of Input sort (icon-only pill) */}
                {activeLanguage === 'json' && !isStructureAnalysisMode && ['form','tree','view','code','text'].includes(viewFormat) && (
                  <div className="relative inline-flex dropdown-container overflow-visible">
                    <Tooltip content="Sort Output JSON (toggle options)">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => { if (!outputCode || !outputCode.trim()) return; setShowOutputSortDropdown(!showOutputSortDropdown); }}
                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && outputCode && outputCode.trim()) { e.preventDefault(); setShowOutputSortDropdown(!showOutputSortDropdown); } }}
                        className={`icon-btn icon-cyan ${!outputCode || !outputCode.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
                        aria-label="Sort Output"
                        title="Sort Output JSON"
                      >
                        <i className="fa-solid fa-sort" aria-hidden="true"></i>
                      </span>
                    </Tooltip>
                    {showOutputSortDropdown && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[150px]">
                        <button onClick={() => { handleSortOutput('asc','keys'); setShowOutputSortDropdown(false); }} className="w-full px-3 py-1.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100">Keys (A → Z)</button>
                        <button onClick={() => { handleSortOutput('desc','keys'); setShowOutputSortDropdown(false); }} className="w-full px-3 py-1.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100">Keys (Z → A)</button>
                        <button onClick={() => { handleSortOutput('asc','values'); setShowOutputSortDropdown(false); }} className="w-full px-3 py-1.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100">Values (A → Z)</button>
                        <button onClick={() => { handleSortOutput('desc','values'); setShowOutputSortDropdown(false); }} className="w-full px-3 py-1.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100">Values (Z → A)</button>
                      </div>
                    )}
                  </div>
                )}
                {/* Output Fullscreen toggle - immediately after icons */}
                <Tooltip content={isOutputFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                  <button
                    onClick={handleToggleOutputFullscreen}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl cursor-pointer"
                    aria-label={isOutputFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    title={isOutputFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    ⛶
                  </button>
                </Tooltip>
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
                    >
                      <span>{viewFormat.charAt(0).toUpperCase() + viewFormat.slice(1)}</span>
                      <span className="text-xs">▼</span>
                    </button>
                    {showViewDropdown && (
                      <div className="absolute right-0 mt-1 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-20 min-w-[150px] overflow-hidden">
                        {(['code', 'form', 'text', 'tree', 'table', 'view', 'toon'] as ViewFormat[]).map((format) => {
                          const isDisabled = isStructureAnalysisMode && format !== 'view';
                          
                          // Define emoji and colors for each format
                          const formatConfig = {
                            code: { emoji: '💻', color: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30' },
                            form: { emoji: '📄', color: 'text-green-600 dark:text-green-400', gradient: 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30' },
                            text: { emoji: '📝', color: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30' },
                            tree: { emoji: '🌳', color: 'text-teal-600 dark:text-teal-400', gradient: 'from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30' },
                            table: { emoji: '▦', color: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30' },
                            view: { emoji: '👁️', color: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30' },
                            toon: { emoji: '🎛️', color: 'text-pink-600 dark:text-pink-400', gradient: 'from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30' }
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
                              className={`w-full text-left px-3 py-2 text-[13px] transition-all duration-150 flex items-center gap-2 ${
                                isDisabled 
                                  ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500' 
                                  : `hover:bg-gradient-to-r hover:${config.gradient} cursor-pointer`
                              } ${
                                viewFormat === format 
                                  ? `bg-gradient-to-r ${config.gradient} font-semibold border-l-2 ${config.color.replace('text-', 'border-').replace(' dark:', ' dark:border-')}` 
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                              disabled={isDisabled}
                            >
                              <span className="text-base">{config.emoji}</span>
                              <span className={`${viewFormat === format ? config.color : 'text-slate-800 dark:text-slate-200'} tracking-tight`}>{format.charAt(0).toUpperCase() + format.slice(1)}</span>
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
                      
                    >
                      <span>⮾</span>
                      <span>Exit</span>
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="flex-grow w-full rounded-md overflow-visible flex flex-col border border-slate-200 dark:border-slate-700 min-h-0 relative">
              {/* Download and Clear icons - positioned at top right inside the output box */}
              {/* Hide these buttons when there's an error (validationError, outputError, or aiError) or in Structure Analysis mode or when showing success message or in Table view */}
              {!validationError && !outputError && !aiError && !isStructureAnalysisMode && !successMessage && viewFormat !== 'table' && false && (
                <div className={`absolute z-10 flex items-center gap-1.5 ${viewFormat === 'tree' ? 'top-[2px] right-2' : viewFormat === 'form' ? 'top-[17px] right-6' : 'top-2 right-6'}`}>
                  <Tooltip content="Download formatted file">
                    <button
                      onClick={handleDownload}
                      className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-green-600 dark:text-green-400"
                      aria-label="Download"
                      
                    >
                      📥
                    </button>
                  </Tooltip>
                  <Tooltip content="Clear output">
                    <button
                      onClick={handleClearOutput}
                      className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center font-bold text-red-600 dark:text-red-400"
                      aria-label="Clear Output"
                      
                    >
                      🧹
                    </button>
                  </Tooltip>
                </div>
              )}
              {/* Right-side rail for Output (visible for all views when no errors/special states) */}
              {!validationError && !outputError && !aiError && !successMessage && !isStructureAnalysisMode && (
                <div className="right-rail absolute top-2 right-0 w-[42px] flex flex-col gap-1.5 pt-2 pl-2 pr-2 items-center bg-slate-50/60 dark:bg-slate-800/40 z-20 border-l border-slate-300 dark:border-slate-600">
                  <Tooltip content="Save to file">
                    <button
                      onClick={handleSave}
                      className="w-7 h-7 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-base"
                      aria-label="Save"
                    >
                      💾
                    </button>
                  </Tooltip>
                  <Tooltip content={viewFormat === 'toon' ? 'Copy TOON to clipboard' : 'Copy to clipboard'}>
                    <button
                      onClick={handleCopyOutput}
                      className="w-7 h-7 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center text-slate-700 dark:text-slate-200 text-base"
                      aria-label="Copy"
                    >
                      📋
                    </button>
                  </Tooltip>
                  <Tooltip content="Download formatted file">
                    <button
                      onClick={handleDownload}
                      className="w-7 h-7 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center text-green-600 dark:text-green-400 text-base"
                      aria-label="Download"
                    >
                      📥
                    </button>
                  </Tooltip>
                  <Tooltip content="Clear output">
                    <button
                      onClick={handleClearOutput}
                      className="w-7 h-7 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center text-red-600 dark:text-red-400 text-base"
                      aria-label="Clear Output"
                    >
                      🧹
                    </button>
                  </Tooltip>
                  <Tooltip content="Print">
                    <button
                      onClick={handlePrint}
                      className="w-7 h-7 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 text-base"
                      aria-label="Print"
                    >
                      🖨️
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
                            <div className="rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900">
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
                                    <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Simple: {simpleCount}</span>
                                    <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">Complex: {complexCount}</span>
                                    {commentsCount > 0 && (
                                      <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">Comments: {commentsCount}</span>
                                    )}
                                    {(highlightedLine != null) && (
                                      <button
                                        type="button"
                                        onClick={() => { setHighlightedLine(null); setHighlightedType(null); setHighlightPulse(false); }}
                                        className="ml-auto px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        aria-label="Clear highlight"
                                      >
                                        ✖ Clear highlight
                                      </button>
                                    )}
                                  </div>

                                  {/* Minimal primary message */}
                                  <p className="mt-3 text-sm text-red-700 dark:text-red-300">
                                    {validationError.reason.split('\n')[0]}
                                  </p>
                                </div>
                              </div>

                              <div className="px-4 pb-4 space-y-3">
                                {/* Collapsible: Simple Errors */}
                                {simpleCount > 0 && (
                                  <details className="rounded border border-green-200 dark:border-green-800 bg-white dark:bg-slate-900">
                                    <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-green-700 dark:text-green-300">Simple Errors ({simpleCount})</summary>
                                    <div className="px-3 py-2 space-y-2 max-h-64 overflow-y-auto">
                                      {errorLines.filter(e => !isComplexError(e)).map((error, idx) => (
                                        <div
                                          key={`simple-${idx}`}
                                          className="p-2 rounded border-l-4 text-xs bg-green-50 dark:bg-slate-800 border-green-300 dark:border-green-700"
                                          tabIndex={0}
                                          title={`Press Alt+G to jump to line ${error.line}`}
                                          onKeyDown={(e) => {
                                            if (errorSource === 'output') return;
                                            if (e.altKey && e.key.toLowerCase() === 'g') {
                                              setHighlightedLine(error.line);
                                              setHighlightedType('simple');
                                              setHighlightPulse(true);
                                              setTimeout(() => setHighlightPulse(false), 600);
                                              e.preventDefault();
                                            }
                                          }}
                                        >
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className="font-semibold text-green-800 dark:text-green-200">Line {error.line}, Column {error.column}</span>
                                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Simple</span>
                                            </div>
                                            {errorSource !== 'output' && (
                                              <button
                                                type="button"
                                                onClick={() => { setHighlightedLine(error.line); setHighlightedType('simple'); setHighlightPulse(true); setTimeout(()=> setHighlightPulse(false), 600); }}
                                                className="ml-auto shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-md bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-xs hover:bg-green-50 dark:hover:bg-green-900/20"
                                                aria-label={`Go to line ${error.line}`}
                                              >
                                                <span>🎯</span>
                                                <span>Go</span>
                                              </button>
                                            )}
                                          </div>
                                          <p className="text-green-700 dark:text-green-300 font-mono">{error.message || 'Syntax error detected'}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}

                                {/* Collapsible: Complex Errors */}
                                {complexCount > 0 && (
                                  <details className="rounded border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900">
                                    <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300">Complex Errors ({complexCount})</summary>
                                    <div className="px-3 py-2 space-y-2 max-h-64 overflow-y-auto">
                                      {errorLines.filter(e => isComplexError(e)).map((error, idx) => (
                                        <div
                                          key={`complex-${idx}`}
                                          className="p-2 rounded border-l-4 text-xs bg-red-50 dark:bg-slate-800 border-red-300 dark:border-red-700"
                                          tabIndex={0}
                                          title={`Press Alt+G to jump to line ${error.line}`}
                                          onKeyDown={(e) => {
                                            if (errorSource === 'output') return;
                                            if (e.altKey && e.key.toLowerCase() === 'g') {
                                              setHighlightedLine(error.line);
                                              setHighlightedType('complex');
                                              setHighlightPulse(true);
                                              setTimeout(() => setHighlightPulse(false), 600);
                                              e.preventDefault();
                                            }
                                          }}
                                        >
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className="font-semibold text-red-800 dark:text-red-200">Line {error.line}, Column {error.column}</span>
                                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">Complex</span>
                                            </div>
                                            {errorSource !== 'output' && (
                                              <button
                                                type="button"
                                                onClick={() => { setHighlightedLine(error.line); setHighlightedType('complex'); setHighlightPulse(true); setTimeout(()=> setHighlightPulse(false), 600); }}
                                                className="ml-auto shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-md bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-xs hover:bg-red-50 dark:hover:bg-red-900/20"
                                                aria-label={`Go to line ${error.line}`}
                                              >
                                                <span>🎯</span>
                                                <span>Go</span>
                                              </button>
                                            )}
                                          </div>
                                          <p className="text-red-700 dark:text-red-300 font-mono">{error.message || 'Syntax error detected'}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}

                                {/* Collapsible: Comments detected */}
                                {commentsCount > 0 && (
                                  <details className="rounded border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900">
                                    <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-300">Comments Detected ({commentsCount})</summary>
                                    <div className="px-3 py-2 text-xs text-purple-800 dark:text-purple-200 space-y-1">
                                      {singleLineMatches.map((m, idx) => {
                                        const idxPos = m.index ?? 0;
                                        const line = inputStr.substring(0, idxPos).split('\n').length;
                                        const preview = m[0].substring(0, 80).replace(/\n/g, ' ');
                                        return (
                                          <div
                                            key={`sl-${idx}`}
                                            className="flex items-start justify-between gap-2 flex-nowrap"
                                            tabIndex={0}
                                            title={`Press Alt+G to jump to line ${line}`}
                                            onKeyDown={(e) => {
                                              if (errorSource === 'output') return;
                                              if (e.altKey && e.key.toLowerCase() === 'g') {
                                                setHighlightedLine(line);
                                                setHighlightedType('comment');
                                                setHighlightPulse(true);
                                                setTimeout(() => setHighlightPulse(false), 600);
                                                e.preventDefault();
                                              }
                                            }}
                                          >
                                            <span className="min-w-0">• Line {line}: // {preview}{m[0].length > 80 ? '…' : ''}</span>
                                            {errorSource !== 'output' && (
                                              <button
                                                type="button"
                                                onClick={() => { setHighlightedLine(line); setHighlightedType('comment'); setHighlightPulse(true); setTimeout(()=> setHighlightPulse(false), 600); }}
                                                className="shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-md bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                                aria-label={`Go to line ${line}`}
                                              >
                                                <span>🎯</span>
                                                <span>Go</span>
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {multiLineMatches.map((m, idx) => {
                                        const idxPos = m.index ?? 0;
                                        const line = inputStr.substring(0, idxPos).split('\n').length;
                                        const preview = m[0].substring(0, 80).replace(/\n/g, ' ');
                                        return (
                                          <div
                                            key={`ml-${idx}`}
                                            className="flex items-start justify-between gap-2 flex-nowrap"
                                            tabIndex={0}
                                            title={`Press Alt+G to jump to line ${line}`}
                                            onKeyDown={(e) => {
                                              if (errorSource === 'output') return;
                                              if (e.altKey && e.key.toLowerCase() === 'g') {
                                                setHighlightedLine(line);
                                                setHighlightedType('comment');
                                                setHighlightPulse(true);
                                                setTimeout(() => setHighlightPulse(false), 600);
                                                e.preventDefault();
                                              }
                                            }}
                                          >
                                            <span className="min-w-0">• Line {line}: /* {preview}{m[0].length > 80 ? '…' : ''}</span>
                                            {errorSource !== 'output' && (
                                              <button
                                                type="button"
                                                onClick={() => { setHighlightedLine(line); setHighlightedType('comment'); setHighlightPulse(true); setTimeout(()=> setHighlightPulse(false), 600); }}
                                                className="shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-md bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                                aria-label={`Go to line ${line}`}
                                              >
                                                <span>🎯</span>
                                                <span>Go</span>
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                      <p className="mt-2 text-[11px] text-purple-700 dark:text-purple-300">Note: Comments are not valid in JSON. Use Auto Fix to remove them safely without changing other logic.</p>
                                    </div>
                                  </details>
                                )}

                                {/* Contextual tip */}
                                {formatterMode === 'fast' && complexCount > 0 && (
                                  <div className="p-3 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg">
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
                      <div className="flex-1 min-h-0 relative">
                        <div className="relative h-full mr-[42px]">
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

      {/* JSON Validation Success Modal */}
      <ValidationModal
        open={showValidationSuccess}
        message={validationSuccessText}
        onClose={() => setShowValidationSuccess(false)}
        variant="success"
      />
    </>
  );
};

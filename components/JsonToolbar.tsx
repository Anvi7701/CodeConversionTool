import React, { useState } from 'react';
import './JsonToolbar.css';

// Local view format type used for the View dropdown
type ViewFormat = 'code' | 'form' | 'text' | 'tree' | 'table' | 'view' | 'toon';

interface JsonToolbarProps {
  onFormat: (indentSize: number) => void;
  onMinify: () => void;
  onSort: (direction: 'asc' | 'desc', sortBy: 'keys' | 'values') => void;
  onRepair?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onGenerateSample?: (template: string) => void;
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
  onUploadJson?: () => void;
  onSearch?: () => void;
  onViewGraph?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onPrint?: () => void;
  onValidate: () => void;
  onCompare?: () => void;
  onTransform?: () => void;
  onClear: () => void;
  onCopy: () => void;
  onFullscreen?: () => void;
  onToggleEditLock?: () => void; // Parser Output: toggle lock/edit state
  isLocked?: boolean; // Parser Output: current lock state
  onCopyOutputToInput?: () => void; // Parser Output: copy output to input
  // Per-button enable flags to keep toolbar visible but contextually disabled
  enableSearch?: boolean;
  enableStructure?: boolean; // Collapse/Expand availability
  enableSort?: boolean;
  enableValidate?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  hasErrors: boolean;
  errorCount: number;
  isFullscreen?: boolean;
  disabled?: boolean;
  isEmpty?: boolean; // When true, disables Format and Minify buttons (but not Upload/Sample)
  language?: string;
  variant?: 'default' | 'compact';
  formatLabel?: string; // Override Beautify label (e.g., "Format")
  validateInPrimaryRibbon?: boolean; // When true, shows Validate next to Sort in primary ribbon
  sampleVariant?: 'button' | 'icon'; // Control Sample rendering style
  historyPlacement?: 'primary' | 'secondary';
  sortPlacement?: 'primary' | 'secondary-icon';
  searchPlacement?: 'primary' | 'secondary'; // Control Search icon placement
  highlightUpload?: boolean;
  highlightSample?: boolean;
  uploadPlacement?: 'primary' | 'secondary';
  samplePlacement?: 'primary' | 'secondary';
  copyPlacement?: 'primary' | 'secondary';
  savePlacement?: 'primary' | 'secondary';
  saveAsPlacement?: 'primary' | 'secondary';
  fullscreenPlacement?: 'primary' | 'secondary';
  showFormatInPrimary?: boolean;
  showMinifyInPrimary?: boolean;
  theme?: 'light' | 'dark';
  embedded?: boolean;
  printPlacement?: 'primary' | 'secondary';
  inputEmpty?: boolean; // state-aware content emptiness to disable relevant actions
  showSeparatorAfterValidatePrimary?: boolean; // control separator after Validate in primary ribbon
  fullscreenStyle?: 'default' | 'black'; // Customize fullscreen button background
  outputLabel?: string; // Label to display before Search icon (e.g., "JSONPath Output")
  uploadLabel?: string; // Label for Upload button (e.g., "Upload Data") - when set, renders as full button instead of icon-only
  sampleLabel?: string; // Label for Sample button (e.g., "Sample") - when set, renders as full button instead of icon-only
  // View dropdown props (Primary Output toolbar)
  onChangeView?: (format: ViewFormat) => void;
  currentViewFormat?: ViewFormat;
  enableView?: boolean;
  viewPlacement?: 'primary' | 'secondary';
}

export const JsonToolbar: React.FC<JsonToolbarProps> = ({
  onFormat,
  onMinify,
  onSort,
  onRepair,
  onUndo,
  onRedo,
  onGenerateSample,
  onCollapseAll,
  onExpandAll,
  onUploadJson,
  onSearch,
  onViewGraph: _onViewGraph,
  onSave,
  onSaveAs,
  onPrint: _onPrint,
  onValidate,
  onCompare,
  onTransform,
  onClear,
  onCopy,
  onFullscreen,
  onToggleEditLock,
  isLocked,
  onCopyOutputToInput,
  enableSearch = true,
  enableStructure = true,
  enableSort = true,
  enableValidate = true,
  canUndo = false,
  canRedo = false,
  hasErrors,
  errorCount,
  isFullscreen = false,
  disabled = false,
  language: _language = 'json',
  variant = 'default',
  formatLabel = 'Beautify',
  validateInPrimaryRibbon = false,
  sampleVariant = 'button',
  historyPlacement = 'primary',
  sortPlacement = 'primary',
  searchPlacement = 'primary',
  highlightUpload = false,
  highlightSample = false,
  uploadPlacement = 'secondary',
  samplePlacement = 'secondary',
  copyPlacement = 'secondary',
  savePlacement = 'secondary',
  saveAsPlacement = 'secondary',
  fullscreenPlacement = 'secondary',
  showFormatInPrimary = true,
  showMinifyInPrimary = true,
  theme = 'light',
  embedded = false,
  printPlacement = 'secondary',
  inputEmpty = false,
  showSeparatorAfterValidatePrimary = true,
  fullscreenStyle = 'default',
  outputLabel,
  uploadLabel,
  sampleLabel,
  // View dropdown controls
  onChangeView,
  currentViewFormat,
  enableView = true,
  viewPlacement = 'secondary',
}) => {
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [formatMoreOpen, setFormatMoreOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sampleDropdownOpen, setSampleDropdownOpen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setFormatDropdownOpen(false);
      setFormatMoreOpen(false);
      setSortDropdownOpen(false);
      setSampleDropdownOpen(false);
      setViewDropdownOpen(false);
    };

    if (formatDropdownOpen || sortDropdownOpen || sampleDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [formatDropdownOpen, sortDropdownOpen, sampleDropdownOpen, viewDropdownOpen]);

  // Sample templates
  const sampleTemplates = [
    { name: 'User Object', key: 'user' },
    { name: 'API Response', key: 'api' },
    { name: 'Config File', key: 'config' },
    { name: 'Array of Objects', key: 'array' },
    { name: 'Nested Object', key: 'nested' },
  ];

  const containerClass = `json-toolbar-container ${embedded ? 'embedded' : ''} ${theme === 'dark' ? 'theme-dark' : ''}`;
  const isEmpty = !!inputEmpty;
  // Only treat Lock Output as an output action; Copy Output→Input icon removed
  const hasOutputActions = !!(onToggleEditLock);
  return (
    <div className={containerClass}>
      {/* PRIMARY RIBBON: Format & Edit */}
      <div className="toolbar-ribbon primary-ribbon">
        {/* Upload Data and Sample buttons - positioned BEFORE Validate when in primary with labels */}
        {((uploadPlacement === 'primary' && onUploadJson && uploadLabel) || (samplePlacement === 'primary' && onGenerateSample && sampleLabel)) && (
          <>
            <div className="toolbar-group upload-sample-group">
              {uploadPlacement === 'primary' && onUploadJson && uploadLabel && (
                <button
                  className={`toolbar-btn primary ${variant === 'compact' ? 'compact' : ''} ${highlightUpload ? 'highlight' : ''}`}
                  onClick={onUploadJson}
                  disabled={disabled}
                  aria-label="Upload JSON file"
                  title="Upload JSON"
                >
                  <span className="icon">📤</span>
                  <span className="label">{uploadLabel}</span>
                </button>
              )}
              {samplePlacement === 'primary' && onGenerateSample && sampleLabel && (
                <div className="toolbar-button-group">
                  <button
                    className={`toolbar-btn primary ${variant === 'compact' ? 'compact' : ''} ${highlightSample ? 'highlight' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSampleDropdownOpen(!sampleDropdownOpen); }}
                    disabled={disabled}
                    aria-label="Generate sample JSON"
                    title="Insert Sample"
                  >
                    <span className="icon">✨</span>
                    <span className="label">{sampleLabel}</span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {sampleDropdownOpen && (
                    <div className="dropdown-menu">
                      {sampleTemplates.map((template) => (
                        <button key={template.key} onClick={() => { onGenerateSample(template.key); setSampleDropdownOpen(false); }}>
                          {template.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="toolbar-separator" />
          </>
        )}
        {/* Validate button (full button style) - positioned BEFORE Format when validateInPrimaryRibbon and no output actions */}
        {validateInPrimaryRibbon && !hasOutputActions && (
          <>
            <div className="toolbar-group validate-group">
              <button
                className={`toolbar-btn primary ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onValidate}
                disabled={disabled || isEmpty || !enableValidate}
                aria-label="Validate JSON"
                title="Validate JSON"
              >
                <span className="icon validate-tick" style={{ marginRight: '4px' }}>✓</span>
                <span className="label">Validate</span>
              </button>
            </div>
            <div className="toolbar-separator" />
          </>
        )}
        {/* Format group: Beautify + Minify (Compare expects these in primary) */}
        {showFormatInPrimary && (
          <div className="toolbar-group format-group">
            {/* Beautify with Dropdown */}
            <div className="toolbar-button-group">
              <button
                className={`toolbar-btn primary minify-btn ${variant === 'compact' ? 'compact' : ''}`}
                onClick={() => onFormat(2)}
                disabled={disabled || inputEmpty}
                aria-label="Beautify JSON (Ctrl+B)"
              >
                <span className="icon">🎨</span>
                <span className="label">{formatLabel}</span>
              </button>
              <button
                className={`toolbar-dropdown-toggle ${variant === 'compact' ? 'compact' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setFormatDropdownOpen(!formatDropdownOpen);
                }}
                disabled={disabled || inputEmpty}
                aria-label="Formatting options"
              >
                ▼
              </button>
              {formatDropdownOpen && (
                <div className="dropdown-menu">
                  <button onClick={() => { onFormat(1); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                    1 space
                  </button>
                  <button onClick={() => { onFormat(2); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                    <span className="checkmark">✓</span> 2 spaces
                  </button>
                  <button onClick={() => { onFormat(3); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                    3 spaces
                  </button>
                  <button onClick={() => { onFormat(4); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                    4 spaces
                  </button>
                  <button onClick={() => { onFormat(5); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                    5 spaces
                  </button>
                  <button onClick={() => { onFormat(0); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                    Tabs
                  </button>
                  <div className="dropdown-divider" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFormatMoreOpen(!formatMoreOpen); }}
                    className="more-toggle"
                  >
                    More... {formatMoreOpen ? '▲' : '▼'}
                  </button>
                  {formatMoreOpen && (
                    <div className="more-options">
                      <button onClick={() => { onFormat(6); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                        6 spaces
                      </button>
                      <button onClick={() => { onFormat(7); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                        7 spaces
                      </button>
                      <button onClick={() => { onFormat(8); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                        8 spaces
                      </button>
                      <button onClick={() => { onFormat(9); setFormatDropdownOpen(false); setFormatMoreOpen(false); }}>
                        9 spaces
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Minify */}
            {showMinifyInPrimary && (
              <button
                className={`toolbar-btn primary minify-btn ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onMinify}
                disabled={disabled || inputEmpty}
                aria-label="Minify JSON (Ctrl+M)"
              >
                <span className="icon">📦</span>
                <span className="label">Minify</span>
              </button>
            )}
          </div>
        )}
        {showFormatInPrimary && <div className="toolbar-separator" />}
        {/* Data group: Upload (icon-only when no label), Sample (icon-only when no label) */}
        {((uploadPlacement === 'primary' && !uploadLabel) || (samplePlacement === 'primary' && !sampleLabel)) && (
          <div className="toolbar-group data-group">
            {uploadPlacement === 'primary' && onUploadJson && !uploadLabel && (
              <div className="toolbar-button-group">
                <button
                  className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''} ${highlightUpload ? 'highlight' : ''}`}
                  onClick={onUploadJson}
                  disabled={disabled}
                  aria-label="Upload JSON file"
                  title="Upload JSON"
                >
                  <span className="icon"><i className="fa-solid fa-upload" aria-hidden="true"></i></span>
                </button>
              </div>
            )}
            {samplePlacement === 'primary' && onGenerateSample && !sampleLabel && (
              <div className="toolbar-button-group">
                <button
                  className={`toolbar-btn ${sampleVariant === 'icon' ? 'icon-only' : ''} ${variant === 'compact' ? 'compact' : ''} ${highlightSample ? 'highlight' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSampleDropdownOpen(!sampleDropdownOpen); }}
                  disabled={disabled}
                  aria-label="Generate sample JSON"
                  title="Insert Sample"
                >
                  <span className="icon">🎲</span>
                  {sampleVariant !== 'icon' && <span className="label">Sample</span>}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {sampleDropdownOpen && (
                  <div className="dropdown-menu">
                    {sampleTemplates.map((template) => (
                      <button key={template.key} onClick={() => { onGenerateSample(template.key); setSampleDropdownOpen(false); }}>
                        {template.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {((uploadPlacement === 'primary' && !uploadLabel) || (samplePlacement === 'primary' && !sampleLabel)) && <div className="toolbar-separator" />}

        {/* Validate button (full button style) - positioned BEFORE Lock when validateInPrimaryRibbon and has output actions */}
        {validateInPrimaryRibbon && hasOutputActions && (
          <>
            <div className="toolbar-group validate-group">
              <button
                className={`toolbar-btn primary ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onValidate}
                disabled={disabled || isEmpty || !enableValidate}
                aria-label="Validate JSON"
                title="Validate JSON"
              >
                <span className="icon validate-tick" style={{ marginRight: '4px' }}>✓</span>
                <span className="label">Validate</span>
              </button>
            </div>
            <div className="toolbar-separator" />
          </>
        )}

        {/* Output actions group: Lock Output, Copy Output to Input (first section for output toolbar) */}
        {hasOutputActions && (
          <div className="toolbar-group output-actions-group">
            {onToggleEditLock && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onToggleEditLock}
                disabled={disabled || isEmpty}
                aria-label={isLocked ? 'Unlock Output for Editing' : 'Lock Output (Read-only)'}
                title={isLocked ? 'Edit Output (unlock)' : 'Lock Output (read-only)'}
              >
                <span className="icon"><i className={`fa-solid ${isLocked ? 'fa-pen-to-square' : 'fa-lock'}`} aria-hidden="true"></i></span>
              </button>
            )}
            {/* Copy Output→Input icon removed */}
          </div>
        )}
        {hasOutputActions && <div className="toolbar-separator" />}

        {/* Output Label (e.g., JSONPath Output, JMESPath Output) */}
        {outputLabel && (
          <div className="toolbar-group" style={{ marginRight: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: 'white', fontWeight: '500' }}>
              {outputLabel}
            </span>
          </div>
        )}

        {/* Validate group: positioned directly after Format/Lock buttons */}
        {validateInPrimaryRibbon && (
          <>
            {/* Edit group: Copy, Save As, Download - positioned before Search when validate is in primary */}
            {(copyPlacement === 'primary' || (saveAsPlacement === 'primary' && onSaveAs) || (savePlacement === 'primary' && onSave)) && (
              <>
                <div className="toolbar-group edit-group">
                  {copyPlacement === 'primary' && (
                    <button
                      className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                      onClick={onCopy}
                      disabled={disabled || isEmpty}
                      aria-label="Copy"
                      title="Copy"
                    >
                      <span className="icon"><i className="fa-regular fa-copy" aria-hidden="true"></i></span>
                    </button>
                  )}
                  {saveAsPlacement === 'primary' && onSaveAs && (
                    <button
                      className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                      onClick={onSaveAs}
                      disabled={disabled || isEmpty}
                      aria-label="Save As JSON"
                      title="Save As"
                    >
                      <span className="icon"><i className="fa-regular fa-floppy-disk" aria-hidden="true"></i></span>
                    </button>
                  )}
                  {savePlacement === 'primary' && onSave && (
                    <button
                      className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                      onClick={onSave}
                      disabled={disabled || isEmpty}
                      aria-label="Download JSON"
                      title="Download"
                    >
                      <span className="icon"><i className="fa-solid fa-download" aria-hidden="true"></i></span>
                    </button>
                  )}
                </div>
                <div className="toolbar-separator" />
              </>
            )}
            {/* Search group: Search only - shown in primary when searchPlacement is primary */}
            {onSearch && searchPlacement === 'primary' && (
              <>
                <div className="toolbar-group search-group">
                  <button
                    className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                    onClick={onSearch}
                    disabled={disabled || isEmpty || !enableSearch}
                    aria-label="Search"
                    title="Search"
                  >
                    <span className="icon"><i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i></span>
                  </button>
                </div>
                <div className="toolbar-separator" />
              </>
            )}
            {/* Validate icon removed - now shown as full button at the beginning of toolbar */}
            {onFullscreen && fullscreenPlacement === 'primary' && (
              <>
                <div className="toolbar-separator" />
                <div className="toolbar-group view-group">
                  <button
                    className={`toolbar-btn icon-only fullscreen ${fullscreenStyle === 'black' ? 'fullscreen-black' : ''} ${variant === 'compact' ? 'compact' : ''}`}
                    onClick={onFullscreen}
                    disabled={disabled || isEmpty}
                    aria-label={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F11)'}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    <span className="icon">⛶</span>
                  </button>
                </div>
              </>
            )}
            {showSeparatorAfterValidatePrimary && <div className="toolbar-separator" />}
          </>
        )}

        {/* Edit group: Copy, Save As, Download - shown in normal position when validate is NOT in primary */}
        {!validateInPrimaryRibbon && (copyPlacement === 'primary' || (saveAsPlacement === 'primary' && onSaveAs) || (savePlacement === 'primary' && onSave)) && (
          <>
            <div className="toolbar-group edit-group">
              {copyPlacement === 'primary' && (
                <button
                  className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                  onClick={onCopy}
                  disabled={disabled || isEmpty}
                  aria-label="Copy"
                  title="Copy"
                >
                  <span className="icon"><i className="fa-regular fa-copy" aria-hidden="true"></i></span>
                </button>
              )}
              {saveAsPlacement === 'primary' && onSaveAs && (
                <button
                  className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                  onClick={onSaveAs}
                  disabled={disabled || isEmpty}
                  aria-label="Save As JSON"
                  title="Save As"
                >
                  <span className="icon"><i className="fa-regular fa-floppy-disk" aria-hidden="true"></i></span>
                </button>
              )}
              {savePlacement === 'primary' && onSave && (
                <button
                  className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                  onClick={onSave}
                  disabled={disabled || isEmpty}
                  aria-label="Download JSON"
                  title="Download"
                >
                  <span className="icon"><i className="fa-solid fa-download" aria-hidden="true"></i></span>
                </button>
              )}
            </div>
            <div className="toolbar-separator" />
          </>
        )}

        {/* View group: Fullscreen - only show here if validate is NOT in primary ribbon */}
        {fullscreenPlacement === 'primary' && !validateInPrimaryRibbon && onFullscreen && (
          <div className="toolbar-group view-group">
            <button
              className={`toolbar-btn icon-only fullscreen ${fullscreenStyle === 'black' ? 'fullscreen-black' : ''} ${variant === 'compact' ? 'compact' : ''}`}
              onClick={onFullscreen}
              disabled={disabled || isEmpty}
              aria-label={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F11)'}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <span className="icon">⛶</span>
            </button>
          </div>
        )}

        {/* Push View dropdown to extreme right */}
        <div className="toolbar-flex-spacer" />
        {viewPlacement === 'primary' && onChangeView && (
          <div className="toolbar-group view-format-group">
            <div className="toolbar-button-group">
              <button
                className={`toolbar-btn primary ${variant === 'compact' ? 'compact' : ''}`}
                onClick={(e) => { e.stopPropagation(); setViewDropdownOpen(!viewDropdownOpen); }}
                disabled={disabled || isEmpty || enableView === false}
                aria-label="Select View Format"
                title="View"
              >
                <span className="icon">👁️</span>
                <span className="label">{(currentViewFormat || 'code').charAt(0).toUpperCase() + (currentViewFormat || 'code').slice(1)}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {viewDropdownOpen && (
                <div className="dropdown-menu">
                  {(['code','form','text','tree','table','view','toon'] as ViewFormat[]).map((format) => (
                    <button key={format} onClick={() => { onChangeView(format); setViewDropdownOpen(false); }}>
                      {format.charAt(0).toUpperCase() + format.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full-width divider to visually split primary and secondary ribbons */}
      {embedded && <div className="toolbar-full-divider" />}

      {/* SECONDARY RIBBON: Tools & Actions */}
      <div className="toolbar-ribbon secondary-ribbon">
        {/* Section 1: Upload, Sample (only when not using labeled buttons in primary) */}
        {((onUploadJson && uploadPlacement === 'secondary') || (onGenerateSample && samplePlacement === 'secondary' && !sampleLabel)) && (
          <div className="toolbar-group data-group">
            {onUploadJson && uploadPlacement === 'secondary' && (
              <div className="toolbar-button-group">
                <button
                  className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''} ${highlightUpload ? 'highlight' : ''}`}
                  onClick={onUploadJson}
                  disabled={disabled}
                  aria-label="Upload JSON file"
                  title="Upload JSON"
                >
                  <span className="icon"><i className="fa-solid fa-upload" aria-hidden="true"></i></span>
                </button>
              </div>
            )}
            {onGenerateSample && samplePlacement === 'secondary' && !sampleLabel && (
              <div className="toolbar-button-group">
                <button
                  className={`toolbar-btn ${sampleVariant === 'icon' ? 'icon-only' : ''} ${variant === 'compact' ? 'compact' : ''} ${highlightSample ? 'highlight' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSampleDropdownOpen(!sampleDropdownOpen);
                  }}
                  disabled={disabled}
                  aria-label="Generate sample JSON"
                  title="Insert Sample"
                >
                  <span className="icon">🎲</span>
                  {sampleVariant !== 'icon' && <span className="label">Sample</span>}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {sampleDropdownOpen && (
                  <div className="dropdown-menu">
                    {sampleTemplates.map((template) => (
                      <button
                        key={template.key}
                        onClick={() => {
                          onGenerateSample(template.key);
                          setSampleDropdownOpen(false);
                        }}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {((onUploadJson && uploadPlacement === 'secondary') || (onGenerateSample && samplePlacement === 'secondary' && !sampleLabel)) && <div className="toolbar-separator" />}

        {/* Section 2: Collapse All, Expand All */}
        {(onCollapseAll || onExpandAll) && (
          <div className="toolbar-group structure-group">
            {onCollapseAll && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onCollapseAll}
                disabled={disabled || isEmpty || !enableStructure}
                aria-label="Collapse all"
                title="Collapse All"
              >
                <span className="icon"><i className="fa-solid fa-compress" aria-hidden="true"></i></span>
              </button>
            )}
            {onExpandAll && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onExpandAll}
                disabled={disabled || isEmpty || !enableStructure}
                aria-label="Expand all"
                title="Expand All"
              >
                <span className="icon"><i className="fa-solid fa-expand" aria-hidden="true"></i></span>
              </button>
            )}
          </div>
        )}

        {(onCollapseAll || onExpandAll) && <div className="toolbar-separator" />}

        {/* Section 3: Undo, Redo */}
        {historyPlacement === 'secondary' && (onUndo || onRedo) && (
          <div className="toolbar-group history-group">
            {onUndo && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onUndo}
                disabled={!canUndo || disabled}
                aria-label="Undo (Ctrl+Z)"
                title="Undo"
              >
                <span className="icon"><i className="fa-solid fa-rotate-left" aria-hidden="true"></i></span>
              </button>
            )}
            {onRedo && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onRedo}
                disabled={!canRedo || disabled}
                aria-label="Redo (Ctrl+Y)"
                title="Redo"
              >
                <span className="icon"><i className="fa-solid fa-rotate-right" aria-hidden="true"></i></span>
              </button>
            )}
          </div>
        )}

        {historyPlacement === 'secondary' && (onUndo || onRedo) && <div className="toolbar-separator" />}

        {/* Section 3.4: Search & Sort group when placed in secondary - combined in same section */}
        {((onSearch && searchPlacement === 'secondary') || sortPlacement === 'secondary-icon') && (
          <>
            <div className="toolbar-group search-sort-group">
              {/* Search icon */}
              {onSearch && searchPlacement === 'secondary' && (
                <button
                  className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                  onClick={onSearch}
                  disabled={disabled || isEmpty || !enableSearch}
                  aria-label="Search"
                  title="Search"
                >
                  <span className="icon"><i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i></span>
                </button>
              )}
              {/* Sort icon with dropdown */}
              {sortPlacement === 'secondary-icon' && (
                <div className="toolbar-button-group">
                  <button
                    className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSortDropdownOpen(!sortDropdownOpen); }}
                    disabled={disabled || isEmpty || !enableSort}
                    aria-label="Sort options"
                    title="Sort"
                  >
                    <span className="icon"><i className="fa-solid fa-sort" aria-hidden="true"></i></span>
                  </button>
                  {sortDropdownOpen && (
                    <div className="dropdown-menu">
                      <button onClick={() => { onSort('asc', 'keys'); setSortDropdownOpen(false); }}>
                        ↑ Keys Ascending
                      </button>
                      <button onClick={() => { onSort('desc', 'keys'); setSortDropdownOpen(false); }}>
                        ↓ Keys Descending
                      </button>
                      <div className="dropdown-divider" />
                      <button onClick={() => { onSort('asc', 'values'); setSortDropdownOpen(false); }}>
                        ↑ Values Ascending
                      </button>
                      <button onClick={() => { onSort('desc', 'values'); setSortDropdownOpen(false); }}>
                        ↓ Values Descending
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="toolbar-separator" />
          </>
        )}

        {/* Section 3.6: Transform (icon) - for navigating to JSON Transform page */}
        {onTransform && (
          <>
            <div className="toolbar-group transform-group">
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onTransform}
                disabled={disabled}
                aria-label="Transform"
                title="Transform"
              >
                <span className="icon"><i className="fa-solid fa-right-left" aria-hidden="true"></i></span>
              </button>
            </div>
            <div className="toolbar-separator" />
          </>
        )}
        {/* Section 4: Copy, Save, Download */}
        {((onCopy && copyPlacement === 'secondary') || (onSaveAs && saveAsPlacement === 'secondary') || (onSave && savePlacement === 'secondary')) && (
          <div className="toolbar-group edit-group">
            {onCopy && copyPlacement === 'secondary' && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onCopy}
                disabled={disabled || isEmpty}
                aria-label="Copy"
                title="Copy"
              >
                <span className="icon"><i className="fa-regular fa-copy" aria-hidden="true"></i></span>
              </button>
            )}
            {onSaveAs && saveAsPlacement === 'secondary' && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onSaveAs}
                disabled={disabled || isEmpty}
                aria-label="Save As JSON"
                title="Save As"
              >
                <span className="icon"><i className="fa-regular fa-floppy-disk" aria-hidden="true"></i></span>
              </button>
            )}
            {onSave && savePlacement === 'secondary' && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onSave}
                disabled={disabled || isEmpty}
                aria-label="Download JSON"
                title="Download"
              >
                <span className="icon"><i className="fa-solid fa-download" aria-hidden="true"></i></span>
              </button>
            )}
          </div>
        )}
        {/* Separator before Clear */}
        {onClear && <div className="toolbar-separator" />}
        {/* Section 5: Clear (separated) */}
        {onClear && (
          <div className="toolbar-group edit-group">
            <button
              className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
              onClick={onClear}
              disabled={disabled || isEmpty}
              aria-label="Clear"
              title="Clear"
            >
              <span className="icon"><i className="fa-solid fa-trash-can" aria-hidden="true"></i></span>
            </button>
          </div>
        )}
        {/* Separator before Fullscreen */}
        {onFullscreen && fullscreenPlacement === 'secondary' && <div className="toolbar-separator" />}
        {/* Fullscreen in secondary ribbon */}
        {onFullscreen && fullscreenPlacement === 'secondary' && (
          <div className="toolbar-group view-group">
            <button
              className={`toolbar-btn icon-only fullscreen ${fullscreenStyle === 'black' ? 'fullscreen-black' : ''} ${variant === 'compact' ? 'compact' : ''}`}
              onClick={onFullscreen}
              disabled={disabled || isEmpty}
              aria-label={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F11)'}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <span className="icon">⛶</span>
            </button>
          </div>
        )}

        {!validateInPrimaryRibbon && (
          <div className="toolbar-group validate-group">
            {/* Validate */}
            <button
              className={`toolbar-btn success ${variant === 'compact' ? 'compact' : ''}`}
              onClick={onValidate}
              disabled={disabled || !enableValidate}
              aria-label="Validate JSON"
            >
              <span className="icon">✓</span>
              <span className="label">Validate</span>
            </button>
            {onCompare && (
              <button
                className={`toolbar-btn warning ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onCompare}
                disabled={disabled}
                aria-label="Compare"
                title="Compare"
              >
                <span className="icon">🔍</span>
                <span className="label">Compare</span>
              </button>
            )}
          </div>
        )}

        {/* Print button removed from secondary ribbon (right of Fullscreen) */}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="keyboard-shortcuts-modal" onClick={() => setShowKeyboardShortcuts(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <button className="close-btn" onClick={() => setShowKeyboardShortcuts(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>B</kbd>
                <span>Beautify JSON</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>M</kbd>
                <span>Minify JSON</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>S</kbd>
                <span>Save JSON</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>P</kbd>
                <span>Print JSON</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                <span>Undo</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                <span>Redo</span>
              </div>
              <div className="shortcut-row">
                <kbd>F11</kbd>
                <span>Toggle Fullscreen</span>
              </div>
              <div className="shortcut-row">
                <kbd>Esc</kbd>
                <span>Exit Fullscreen</span>
              </div>
              <div className="shortcut-row">
                <kbd>?</kbd>
                <span>Show this help</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonToolbar;


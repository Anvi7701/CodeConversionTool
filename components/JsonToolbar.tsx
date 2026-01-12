import React, { useState } from 'react';
import './JsonToolbar.css';

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
  onPrint?: () => void;
  onValidate: () => void;
  onCompare?: () => void;
  onClear: () => void;
  onCopy: () => void;
  onFullscreen?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasErrors: boolean;
  errorCount: number;
  isFullscreen?: boolean;
  disabled?: boolean;
  language?: string;
  variant?: 'default' | 'compact';
  formatLabel?: string; // Override Beautify label (e.g., "Format")
  validateInPrimaryRibbon?: boolean; // When true, shows Validate next to Sort in primary ribbon
  sampleVariant?: 'button' | 'icon'; // Control Sample rendering style
  historyPlacement?: 'primary' | 'secondary';
  sortPlacement?: 'primary' | 'secondary-icon';
  highlightUpload?: boolean;
  highlightSample?: boolean;
  uploadPlacement?: 'primary' | 'secondary';
  samplePlacement?: 'primary' | 'secondary';
  copyPlacement?: 'primary' | 'secondary';
  savePlacement?: 'primary' | 'secondary';
  fullscreenPlacement?: 'primary' | 'secondary';
  showFormatInPrimary?: boolean;
  showMinifyInPrimary?: boolean;
  theme?: 'light' | 'dark';
  embedded?: boolean;
  printPlacement?: 'primary' | 'secondary';
  inputEmpty?: boolean; // state-aware content emptiness to disable relevant actions
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
  onPrint: _onPrint,
  onValidate,
  onCompare,
  onClear,
  onCopy,
  onFullscreen,
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
  highlightUpload = false,
  highlightSample = false,
  uploadPlacement = 'secondary',
  samplePlacement = 'secondary',
  copyPlacement = 'secondary',
  savePlacement = 'secondary',
  fullscreenPlacement = 'secondary',
  showFormatInPrimary = true,
  showMinifyInPrimary = true,
  theme = 'light',
  embedded = false,
  printPlacement = 'secondary',
  inputEmpty = false,
}) => {
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sampleDropdownOpen, setSampleDropdownOpen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setFormatDropdownOpen(false);
      setSortDropdownOpen(false);
      setSampleDropdownOpen(false);
    };

    if (formatDropdownOpen || sortDropdownOpen || sampleDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [formatDropdownOpen, sortDropdownOpen, sampleDropdownOpen]);

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
  return (
    <div className={containerClass}>
      {/* PRIMARY RIBBON: Format & Edit */}
      <div className="toolbar-ribbon primary-ribbon">
        {/* Data group: Upload, Sample */}
        {(uploadPlacement === 'primary' || samplePlacement === 'primary') && (
          <div className="toolbar-group data-group">
            {uploadPlacement === 'primary' && onUploadJson && (
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
            {samplePlacement === 'primary' && onGenerateSample && (
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
        {(uploadPlacement === 'primary' || samplePlacement === 'primary') && <div className="toolbar-separator" />}

        {/* Edit group: Search, Copy, Download */}
        {(onSearch || copyPlacement === 'primary' || (onSave && savePlacement === 'primary')) && (
          <div className="toolbar-group edit-group">
            {onSearch && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onSearch}
                disabled={disabled || isEmpty}
                aria-label="Search"
                title="Search"
              >
                <span className="icon"><i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i></span>
              </button>
            )}
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
        )}
        {(onSearch || copyPlacement === 'primary' || (onSave && savePlacement === 'primary')) && <div className="toolbar-separator" />}

        {/* Validate group: single icon-only */}
        {validateInPrimaryRibbon && (
          <div className="toolbar-group validate-group">
            <button
              className={`toolbar-btn icon-only success ${variant === 'compact' ? 'compact' : ''}`}
              onClick={onValidate}
              disabled={disabled || isEmpty}
              aria-label="Validate JSON"
              title="Validate JSON"
            >
              <span className="icon">✓</span>
            </button>
          </div>
        )}
        {validateInPrimaryRibbon && <div className="toolbar-separator" />}

        {/* View group: Fullscreen */}
        {fullscreenPlacement === 'primary' && onFullscreen && (
          <div className="toolbar-group view-group">
            <button
              className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
              onClick={onFullscreen}
              disabled={disabled || isEmpty}
              aria-label={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F11)'}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <span className="icon">⛶</span>
            </button>
          </div>
        )}
      </div>

      {/* SECONDARY RIBBON: Tools & Actions */}
      <div className="toolbar-ribbon secondary-ribbon">
        {/* Section 1: Upload, Sample */}
        {(onUploadJson || onGenerateSample) && (uploadPlacement === 'secondary' || samplePlacement === 'secondary') && (
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
            {onGenerateSample && samplePlacement === 'secondary' && (
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

        {(onUploadJson || onGenerateSample) && (uploadPlacement === 'secondary' || samplePlacement === 'secondary') && <div className="toolbar-separator" />}

        {/* Section 2: Collapse All, Expand All */}
        {(onCollapseAll || onExpandAll) && (
          <div className="toolbar-group structure-group">
            {onCollapseAll && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onCollapseAll}
                disabled={disabled || isEmpty}
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
                disabled={disabled || isEmpty}
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

        {/* Section 3.5: Sort (icon) when placed in secondary */}
        {sortPlacement === 'secondary-icon' && (
          <>
            <div className="toolbar-group sort-secondary-group">
              <div className="toolbar-button-group">
                <button
                  className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSortDropdownOpen(!sortDropdownOpen); }}
                  disabled={disabled || isEmpty}
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
            </div>
            <div className="toolbar-separator" />
          </>
        )}
        {/* Section 4: Clear, Copy, Download, Print */}
        {(onClear || (onCopy && copyPlacement === 'secondary') || (onSave && savePlacement === 'secondary') || (_onPrint && printPlacement === 'secondary')) && (
          <div className="toolbar-group edit-group">
            {onClear && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={onClear}
                disabled={disabled || isEmpty}
                aria-label="Clear"
                title="Clear"
              >
                <span className="icon"><i className="fa-solid fa-trash-can" aria-hidden="true"></i></span>
              </button>
            )}
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
            {_onPrint && printPlacement === 'secondary' && (
              <button
                className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
                onClick={_onPrint}
                disabled={disabled || isEmpty}
                aria-label="Print"
                title="Print"
              >
                <span className="icon"><i className="fa-solid fa-print" aria-hidden="true"></i></span>
              </button>
            )}
          </div>
        )}

        {!validateInPrimaryRibbon && (
          <div className="toolbar-group validate-group">
            {/* Validate */}
            <button
              className={`toolbar-btn success ${variant === 'compact' ? 'compact' : ''}`}
              onClick={onValidate}
              disabled={disabled}
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

        {onFullscreen && fullscreenPlacement === 'secondary' && <div className="toolbar-separator" />}

        {onFullscreen && fullscreenPlacement === 'secondary' && (
          <div className="toolbar-group view-group">
            {/* Fullscreen */}
            <button
              className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
              onClick={onFullscreen}
              disabled={disabled}
              aria-label={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F11)'}
            >
              <span className="icon">{isFullscreen ? '⛶' : '⛶'}</span>
            </button>

            {/* Keyboard Shortcuts */}
            <button
              className={`toolbar-btn icon-only ${variant === 'compact' ? 'compact' : ''}`}
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              aria-label="Keyboard shortcuts (?)"
            >
              <span className="icon">⌨️</span>
            </button>
          </div>
        )}
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


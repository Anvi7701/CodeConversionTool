import React, { useState } from 'react';
import './JsonToolbar.css';

interface JsonToolbarProps {
  onFormat: (indentSize: number) => void;
  onMinify: () => void;
  onSort: (direction: 'asc' | 'desc', sortBy: 'keys' | 'values') => void;
  onRepair: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onGenerateSample?: (template: string) => void;
  onViewGraph?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  onValidate: () => void;
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
}

export const JsonToolbar: React.FC<JsonToolbarProps> = ({
  onFormat,
  onMinify,
  onSort,
  onRepair,
  onUndo,
  onRedo,
  onGenerateSample,
  onViewGraph,
  onSave,
  onPrint,
  onValidate,
  onClear,
  onCopy,
  onFullscreen,
  canUndo = false,
  canRedo = false,
  hasErrors,
  errorCount,
  isFullscreen = false,
  disabled = false,
  language = 'json',
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

  return (
    <div className="json-toolbar-container">
      {/* PRIMARY RIBBON: Format & Edit */}
      <div className="toolbar-ribbon primary-ribbon">
        <div className="toolbar-group format-group">
          {/* Beautify with Dropdown */}
          <div className="toolbar-button-group">
            <button
              className="toolbar-btn primary"
              onClick={() => onFormat(2)}
              disabled={disabled}
              aria-label="Beautify JSON (Ctrl+B)"
            >
              <span className="icon">🎨</span>
              <span className="label">Beautify</span>
            </button>
            <button
              className="toolbar-dropdown-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setFormatDropdownOpen(!formatDropdownOpen);
              }}
              disabled={disabled}
              aria-label="Formatting options"
            >
              ▼
            </button>
            {formatDropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={() => { onFormat(2); setFormatDropdownOpen(false); }}>
                  <span className="checkmark">✓</span> 2 spaces
                </button>
                <button onClick={() => { onFormat(4); setFormatDropdownOpen(false); }}>
                  4 spaces
                </button>
                <button onClick={() => { onFormat(0); setFormatDropdownOpen(false); }}>
                  Tabs
                </button>
              </div>
            )}
          </div>

          {/* Minify */}
          <button
            className="toolbar-btn primary"
            onClick={onMinify}
            disabled={disabled}
            aria-label="Minify JSON (Ctrl+M)"
          >
            <span className="icon">📦</span>
            <span className="label">Minify</span>
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group sort-group">
          {/* Sort with Dropdown */}
          <div className="toolbar-button-group">
            <button
              className="toolbar-btn"
              onClick={() => onSort('asc', 'keys')}
              disabled={disabled}
              aria-label="Sort keys ascending"
            >
              <span className="icon">🔼</span>
              <span className="label">Sort</span>
            </button>
            <button
              className="toolbar-dropdown-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setSortDropdownOpen(!sortDropdownOpen);
              }}
              disabled={disabled}
              aria-label="Sort options"
            >
              ▼
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

        <div className="toolbar-group repair-group">
          {/* Repair (Conditional) */}
          {hasErrors && (
            <button
              className="toolbar-btn warning"
              onClick={onRepair}
              disabled={disabled}
              aria-label="Repair JSON errors"
            >
              <span className="icon">🔧</span>
              <span className="label">Repair</span>
              {errorCount > 0 && <span className="badge">{errorCount}</span>}
            </button>
          )}
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group history-group">
          {/* Undo */}
          {onUndo && (
            <button
              className="toolbar-btn icon-only"
              onClick={onUndo}
              disabled={!canUndo || disabled}
              aria-label="Undo (Ctrl+Z)"
            >
              <span className="icon">↶</span>
            </button>
          )}

          {/* Redo */}
          {onRedo && (
            <button
              className="toolbar-btn icon-only"
              onClick={onRedo}
              disabled={!canRedo || disabled}
              aria-label="Redo (Ctrl+Y)"
            >
              <span className="icon">↷</span>
            </button>
          )}
        </div>
      </div>

      {/* SECONDARY RIBBON: Tools & Actions */}
      <div className="toolbar-ribbon secondary-ribbon">
        <div className="toolbar-group data-group">
          {/* Sample Data with Dropdown */}
          {onGenerateSample && (
            <div className="toolbar-button-group">
              <button
                className="toolbar-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSampleDropdownOpen(!sampleDropdownOpen);
                }}
                disabled={disabled}
                aria-label="Generate sample JSON"
              >
                <span className="icon">🎲</span>
                <span className="label">Sample</span>
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

        {onGenerateSample && <div className="toolbar-separator" />}

        <div className="toolbar-group validate-group">
          {/* Validate */}
          <button
            className="toolbar-btn success"
            onClick={onValidate}
            disabled={disabled}
            aria-label="Validate JSON"
          >
            <span className="icon">✓</span>
            <span className="label">Validate</span>
          </button>
        </div>

        {onFullscreen && <div className="toolbar-separator" />}

        {onFullscreen && (
          <div className="toolbar-group view-group">
            {/* Fullscreen */}
            <button
              className="toolbar-btn icon-only"
              onClick={onFullscreen}
              disabled={disabled}
              aria-label={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F11)'}
            >
              <span className="icon">{isFullscreen ? '⛶' : '⛶'}</span>
            </button>

            {/* Keyboard Shortcuts */}
            <button
              className="toolbar-btn icon-only"
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


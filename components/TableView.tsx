import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';

interface TableViewProps {
  data: any;
  expandAll?: boolean;
  collapseAll?: boolean;
  onEdit?: (jsonString: string) => void;
  // Show or hide the built-in export control; parent may relocate export to header toolbar
  showExportControl?: boolean;
}

export interface TableViewRef {
  generateCSV: () => string;
  generateExcel: () => string;
  copyTableToClipboard: () => Promise<void>;
  getColumns: () => string[];
  getProcessedData: () => any[];
}

export const TableView = forwardRef<TableViewRef, TableViewProps>(({ data, expandAll: _expandAll, collapseAll: _collapseAll, onEdit, showExportControl = true }, ref) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState<string>(''); // Empty means search all columns
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detect if data is array of objects (suitable for table view)
  const isTableCompatible = useMemo(() => {
    if (!Array.isArray(data)) return false;
    if (data.length === 0) return false;
    
    // Check if at least 80% of items are objects with consistent keys
    const objectItems = data.filter(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    return objectItems.length >= data.length * 0.8;
  }, [data]);

  // Extract columns from data
  const columns = useMemo(() => {
    if (!isTableCompatible) return [];
    
    const allKeys = new Set<string>();
    data.forEach((item: any) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });
    
    return Array.from(allKeys);
  }, [data, isTableCompatible]);

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!isTableCompatible) return [];
    
    let filtered = [...data];
    
    // Search filter - with column-specific search
    if (searchTerm) {
      filtered = filtered.filter((row: any) => {
        // If a specific column is selected, search only in that column
        if (searchColumn) {
          const value = row[searchColumn];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        }
        // Otherwise, search across all columns
        return columns.some(col => {
          const value = row[col];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }
    
    // Sort
    if (sortColumn) {
      filtered.sort((a: any, b: any) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [data, isTableCompatible, columns, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  // Generate CSV content from table data
  const generateCSV = () => {
    const headers = columns.join(',');
    const rows = processedData.map((row: any) => {
      return columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    }).join('\n');
    return `${headers}\n${rows}`;
  };

  // Generate Excel (TSV) content from table data
  const generateExcel = () => {
    const headers = columns.join('\t');
    const rows = processedData.map((row: any) => {
      return columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }).join('\t');
    }).join('\n');
    return `${headers}\n${rows}`;
  };

  // Copy table data to clipboard in tab-separated format (pasteable to Excel/Sheets)
  const copyTableToClipboard = async () => {
    const tsvContent = generateExcel();
    await navigator.clipboard.writeText(tsvContent);
  };

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    generateCSV,
    generateExcel,
    copyTableToClipboard,
    getColumns: () => columns,
    getProcessedData: () => processedData
  }));

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data, searchTerm, searchColumn]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-dropdown-container')) {
        setShowSearchDropdown(false);
      }
      if (!target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = columns.join(',');
    const rows = processedData.map((row: any) => {
      return columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    }).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `table_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setShowExportDropdown(false);
  };

  // Export to Excel (TSV format which Excel can open)
  const exportToExcel = () => {
    const headers = columns.join('\t');
    const rows = processedData.map((row: any) => {
      return columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }).join('\t');
    }).join('\n');
    
    const tsv = `${headers}\n${rows}`;
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `table_export_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    setShowExportDropdown(false);
  };

  // Export to JSON
  const exportToJSON = () => {
    const json = JSON.stringify(processedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `table_export_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setShowExportDropdown(false);
  };

  const handleEdit = (rowIndex: number, column: string, value: any) => {
    if (!onEdit) return;
    setEditingCell({ row: rowIndex, col: column });
    setEditValue(value === null ? 'null' : typeof value === 'object' ? JSON.stringify(value) : String(value));
  };

  const handleSaveEdit = () => {
    if (!editingCell || !onEdit) return;
    
    const newData = [...data];
    const actualIndex = (currentPage - 1) * itemsPerPage + editingCell.row;
    
    let parsedValue: any = editValue;
    const trimmed = editValue.trim();
    
    if (trimmed === 'null') {
      parsedValue = null;
    } else if (trimmed === 'true') {
      parsedValue = true;
    } else if (trimmed === 'false') {
      parsedValue = false;
    } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
      parsedValue = Number(trimmed);
    } else if (/^[{[]/.test(trimmed)) {
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        // Keep as string if parsing fails
      }
    }
    
    newData[actualIndex] = { ...newData[actualIndex], [editingCell.col]: parsedValue };
    onEdit(JSON.stringify(newData, null, 2));
    setEditingCell(null);
  };

  const renderCellValue = (value: any) => {
    if (value === null) return <span className="text-slate-900 dark:text-slate-100 italic font-mono">null</span>;
    if (value === undefined) return <span className="text-slate-900 dark:text-slate-100 italic font-mono">undefined</span>;
    if (typeof value === 'boolean') return <span className="text-slate-900 dark:text-slate-100 font-mono font-semibold">{String(value)}</span>;
    if (typeof value === 'number') return <span className="text-slate-900 dark:text-slate-100 font-mono font-semibold">{value}</span>;
    if (typeof value === 'string') return <span className="text-slate-900 dark:text-slate-100 font-mono">"{value}"</span>;
    if (typeof value === 'object') return <span className="text-slate-900 dark:text-slate-100 font-mono text-xs">{JSON.stringify(value)}</span>;
    return String(value);
  };

  if (!isTableCompatible) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Table View Not Available</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Table view works best with arrays of objects. Your JSON structure is not compatible with table format.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-left">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">Compatible format example:</p>
            <pre className="text-xs text-blue-600 dark:text-blue-400 font-mono">
{`[
  {"name": "John", "age": 30},
  {"name": "Jane", "age": 25}
]`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-slate-400 dark:border-slate-500 bg-slate-200 dark:bg-slate-700 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          {/* Enhanced Search with Column Filter */}
          <div className="flex-1 min-w-[200px] max-w-md search-dropdown-container">
            <div className="relative group">
              <input
                type="text"
                placeholder={searchColumn ? `Search in ${searchColumn}...` : "Search table..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setShowSearchDropdown(false);
                }}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full px-3 py-1.5 pl-9 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                title={searchColumn ? `Searching in "${searchColumn}" column only. Click filter icon to change.` : "Search across all columns. Click filter icon to search in specific column."}
              />
              <svg className="absolute left-3 top-2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {/* Column filter dropdown trigger with tooltip */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSearchDropdown(!showSearchDropdown);
                }}
                className={`absolute right-2 top-1.5 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors ${searchColumn ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
                title={searchColumn ? `Currently filtering by: ${searchColumn}\nClick to change or remove filter` : "Click to search in a specific column"}
              >
                <svg className={`w-4 h-4 transition-colors ${searchColumn ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {searchColumn && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </button>
              
              {/* Hover tooltip for search input */}
              {!isSearchFocused && !showSearchDropdown && (
                <div className="absolute left-0 top-full mt-1 px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-md shadow-lg z-30 w-max max-w-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {searchColumn ? (
                    <>
                      <p className="font-semibold mb-1">🔍 Filtered Search Active</p>
                      <p>Searching only in: <span className="font-mono text-blue-300">{searchColumn}</span></p>
                      <p className="mt-1 text-slate-300">Click the filter icon to change or remove filter</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold mb-1">🔍 Search Tips</p>
                      <p>• Currently searching across all columns</p>
                      <p>• Click the <span className="text-blue-300">filter icon</span> to search in a specific column</p>
                      <p className="mt-1 text-slate-300">Type to search instantly</p>
                    </>
                  )}
                </div>
              )}
              
              {/* Search column dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSearchColumn('');
                      setShowSearchDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${!searchColumn ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-900 dark:text-slate-100'}`}
                  >
                    All columns
                  </button>
                  {columns.map((col) => (
                    <button
                      key={col}
                      onClick={() => {
                        setSearchColumn(col);
                        setShowSearchDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 font-mono ${searchColumn === col ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-900 dark:text-slate-100'}`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          
          {/* Stats - moved to right */}
          <div className="flex items-center gap-2 text-xs text-slate-900 dark:text-slate-100">
            <span>{processedData.length} rows</span>
            <span className="text-slate-400 dark:text-slate-400">|</span>
            <span>{columns.length} columns</span>
          </div>
          
          {/* Export Button with Emoji Icon (can be hidden by parent) */}
          {showExportControl && (
          <div className="relative export-dropdown-container">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="px-2 py-1.5 text-lg bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              title="Export table data"
            >
              📤
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-20 min-w-[150px]">
                <button
                  onClick={exportToCSV}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as CSV
                </button>
                <button
                  onClick={exportToExcel}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Export as Excel
                </button>
                <button
                  onClick={exportToJSON}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-200 dark:bg-slate-700">
            <tr>
              <th className="px-3 py-1.5 text-left text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 border-b-2 border-slate-400 dark:border-slate-500 bg-slate-200 dark:bg-slate-700">
                #
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column)}
                  className="px-3 py-1.5 text-left text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 border-b-2 border-slate-400 dark:border-slate-500 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors select-none bg-slate-200 dark:bg-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{column}</span>
                    {sortColumn === column && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row: any, rowIndex: number) => (
              <tr
                key={rowIndex}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-200 dark:border-slate-700"
              >
                <td className="px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono">
                  {(currentPage - 1) * itemsPerPage + rowIndex + 1}
                </td>
                {columns.map((column) => (
                  <td
                    key={column}
                    onClick={() => onEdit && handleEdit(rowIndex, column, row[column])}
                    className={`px-3 py-1.5 text-sm font-mono ${onEdit ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}`}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === column ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                        autoFocus
                        className="w-full px-2 py-1 text-sm font-mono border-2 border-blue-500 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    ) : (
                      <div className="truncate max-w-xs">{renderCellValue(row[column])}</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 border-t border-slate-400 dark:border-slate-500 bg-slate-200 dark:bg-slate-700 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-900 dark:text-slate-100">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-2 py-1 text-xs text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TableView.displayName = 'TableView';

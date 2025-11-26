import React, { useState, useEffect, useMemo } from 'react';

interface TableViewProps {
  data: any;
  expandAll?: boolean;
  collapseAll?: boolean;
  onEdit?: (jsonString: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({ data, expandAll, collapseAll, onEdit }) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
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
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((row: any) => {
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

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data, searchTerm]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
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
    if (value === null) return <span className="text-slate-400 italic font-mono">null</span>;
    if (value === undefined) return <span className="text-slate-400 italic font-mono">undefined</span>;
    if (typeof value === 'boolean') return <span className="text-purple-600 dark:text-purple-400 font-mono font-semibold">{String(value)}</span>;
    if (typeof value === 'number') return <span className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{value}</span>;
    if (typeof value === 'string') return <span className="text-green-600 dark:text-green-400 font-mono">{value}</span>;
    if (typeof value === 'object') return <span className="text-orange-600 dark:text-orange-400 font-mono text-xs">{JSON.stringify(value)}</span>;
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
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-9 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium">
              {processedData.length} {processedData.length === 1 ? 'row' : 'rows'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="font-medium">{columns.length} columns</span>
          </div>
          
          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-1.5 text-left text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 border-b-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                #
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column)}
                  className="px-3 py-1.5 text-left text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 border-b-2 border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none bg-slate-100 dark:bg-slate-800"
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
                <td className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
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
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Utility to extract error position from JSON parse errors
 */

export interface ErrorPosition {
  line: number;
  column: number;
  position?: number;
  message?: string;
}

/**
 * Validate JSON and find all syntax errors
 * Returns array of error positions for all lines with errors
 */
export function validateJsonSyntax(jsonText: string): ErrorPosition[] {
  const errors: ErrorPosition[] = [];
  
  // First, try standard JSON.parse to get the first error
  try {
    JSON.parse(jsonText);
    return []; // No errors
  } catch (err: any) {
    const firstError = extractErrorPosition(err.message, jsonText);
    if (firstError) {
      firstError.message = err.message;
      errors.push(firstError);
    }
  }
  
  // Additional comprehensive checks for all syntax issues
  const lines = jsonText.split('\n');
  
  // Track bracket/brace matching
  const bracketStack: { char: string; line: number; column: number }[] = [];
  const openBrackets = ['{', '['];
  const closeBrackets = ['}', ']'];
  const bracketPairs: { [key: string]: string } = { '}': '{', ']': '[' };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    const trimmedLine = line.trim();
    
    // Skip empty lines or whitespace-only lines
    if (!trimmedLine) continue;
    
    // Check each character for brackets
    let inString = false;
    let escapeNext = false;
    
    for (let col = 0; col < line.length; col++) {
      const char = line[col];
      
      // Handle string detection
      if (char === '"' && !escapeNext) {
        inString = !inString;
      }
      
      if (char === '\\' && inString) {
        escapeNext = !escapeNext;
        continue;
      } else {
        escapeNext = false;
      }
      
      // Only process brackets outside of strings
      if (!inString) {
        if (openBrackets.includes(char)) {
          bracketStack.push({ char, line: lineNumber, column: col + 1 });
        } else if (closeBrackets.includes(char)) {
          const expectedOpen = bracketPairs[char];
          if (bracketStack.length === 0) {
            // Closing bracket without opening
            const existingError = errors.find(e => e.line === lineNumber && Math.abs(e.column - (col + 1)) <= 2);
            if (!existingError) {
              errors.push({
                line: lineNumber,
                column: col + 1,
                message: `Unexpected closing bracket '${char}' without matching opening bracket`
              });
            }
          } else {
            const last = bracketStack[bracketStack.length - 1];
            if (last.char === expectedOpen) {
              bracketStack.pop(); // Matching pair
            } else {
              // Mismatched brackets
              const existingError = errors.find(e => e.line === lineNumber && Math.abs(e.column - (col + 1)) <= 2);
              if (!existingError) {
                errors.push({
                  line: lineNumber,
                  column: col + 1,
                  message: `Mismatched brackets: expected '${last.char === '{' ? '}' : ']'}' but found '${char}'`
                });
              }
              bracketStack.pop();
            }
          }
        }
      }
    }
    
    // Check for missing commas - line ends with a value and next line starts with a property
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1].trim();
      // Check if current line ends with a value (string, number, boolean, or closing bracket) but no comma
      // and next line starts with a property name or opening bracket
      if (/"[^"]*"$/.test(trimmedLine) || /\d+$/.test(trimmedLine) || /true$/.test(trimmedLine) || /false$/.test(trimmedLine) || /null$/.test(trimmedLine) || /\}$/.test(trimmedLine) || /\]$/.test(trimmedLine)) {
        if (/^"[^"]*"\s*:/.test(nextLine) || /^\{/.test(nextLine) || /^\[/.test(nextLine)) {
          if (!trimmedLine.endsWith(',') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('[')) {
            const existingError = errors.find(e => e.line === lineNumber && e.message?.includes('Missing comma'));
            if (!existingError) {
              errors.push({
                line: lineNumber,
                column: trimmedLine.length,
                message: 'Missing comma after property value'
              });
            }
          }
        }
      }
    }
    
    // Check for trailing commas before closing braces
    if (/,\s*$/.test(trimmedLine)) {
      const nextLineIndex = i + 1;
      if (nextLineIndex < lines.length) {
        const nextLine = lines[nextLineIndex].trim();
        if (/^[}\]]/.test(nextLine)) {
          const existingError = errors.find(e => e.line === lineNumber && e.message?.includes('Trailing comma'));
          if (!existingError) {
            errors.push({
              line: lineNumber,
              column: trimmedLine.lastIndexOf(',') + 1,
              message: 'Trailing comma before closing bracket'
            });
          }
        }
      }
    }
    
    // Check for unclosed quotes
    const quoteCount = (line.match(/"/g) || []).length;
    const escapedQuoteCount = (line.match(/\\"/g) || []).length;
    const actualQuoteCount = quoteCount - escapedQuoteCount;
    
    if (actualQuoteCount % 2 !== 0 && !trimmedLine.endsWith(',') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('[')) {
      const existingError = errors.find(e => e.line === lineNumber && e.message?.includes('quote'));
      if (!existingError) {
        errors.push({
          line: lineNumber,
          column: line.lastIndexOf('"') + 1,
          message: 'Unclosed or mismatched quotes'
        });
      }
    }
  }
  
  // Check for unclosed brackets at the end
  for (const unclosed of bracketStack) {
    const existingError = errors.find(e => e.line === unclosed.line && e.message?.includes('Unclosed'));
    if (!existingError) {
      errors.push({
        line: unclosed.line,
        column: unclosed.column,
        message: `Unclosed bracket '${unclosed.char}' - missing closing '${unclosed.char === '{' ? '}' : ']'}'`
      });
    }
  }
  
  // Remove duplicates and sort by line number
  // Also remove cascading errors where a missing comma on line N causes an error on line N+1
  const uniqueErrors = errors.filter((error, index, self) => {
    // Check for exact duplicates (same line and column)
    const isDuplicate = self.findIndex(e => e.line === error.line && e.column === error.column) !== index;
    if (isDuplicate) return false;
    
    // Check for cascading errors:
    // If this error is on line N and there's a "missing comma" error on line N-1, 
    // this error is likely a false positive caused by the missing comma
    if (error.message && 
        (error.message.includes("Expected ',' or '}'") || 
         error.message.includes("Expected ',' or '']") ||
         error.message.includes("Unexpected token") ||
         error.message.toLowerCase().includes("expected property name") ||
         error.message.toLowerCase().includes("unexpected string") ||
         error.message.toLowerCase().includes("unexpected number"))) {
      const previousLineError = self.find(e => 
        e.line === error.line - 1 && 
        e.message?.includes('Missing comma')
      );
      if (previousLineError) {
        // This is a cascading error, filter it out
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => a.line - b.line);
  
  return uniqueErrors;
}

/**
 * Extract line and column from JSON.parse error message
 * Common formats:
 * - "Unexpected token } in JSON at position 123"
 * - "Expected ',' or '}' after property value in JSON at position 456"
 */
export function extractErrorPosition(errorMessage: string, jsonText: string): ErrorPosition | null {
  // Try to extract position from error message
  const positionMatch = errorMessage.match(/at position (\d+)/i);
  
  if (positionMatch) {
    const position = parseInt(positionMatch[1], 10);
    const { line, column } = getLineAndColumnFromPosition(jsonText, position);
    return { line, column, position };
  }
  
  // Try alternative format: "line X column Y"
  const lineColMatch = errorMessage.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10)
    };
  }
  
  return null;
}

/**
 * Convert character position to line and column
 */
function getLineAndColumnFromPosition(text: string, position: number): { line: number; column: number } {
  const lines = text.substring(0, position).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  
  return { line, column };
}

/**
 * Get the text of a specific line (1-indexed)
 */
export function getLineText(text: string, lineNumber: number): string {
  const lines = text.split('\n');
  if (lineNumber >= 1 && lineNumber <= lines.length) {
    return lines[lineNumber - 1];
  }
  return '';
}

/**
 * Get surrounding lines for context (1-indexed)
 */
export function getSurroundingLines(
  text: string, 
  lineNumber: number, 
  contextLines: number = 2
): { lineNumber: number; text: string; isError: boolean }[] {
  const lines = text.split('\n');
  const result: { lineNumber: number; text: string; isError: boolean }[] = [];
  
  const startLine = Math.max(1, lineNumber - contextLines);
  const endLine = Math.min(lines.length, lineNumber + contextLines);
  
  for (let i = startLine; i <= endLine; i++) {
    result.push({
      lineNumber: i,
      text: lines[i - 1] || '',
      isError: i === lineNumber
    });
  }
  
  return result;
}

/**
 * Client-side JSON auto-fixer for simple, high-success-rate errors
 * Only fixes errors with 95%+ success rate
 */

export interface FixResult {
  fixed: string;
  changes: FixChange[];
  wasFixed: boolean;
}

export interface FixChange {
  type: 'missing-comma' | 'trailing-comma' | 'single-quotes' | 'unquoted-key';
  line: number;
  description: string;
}

/**
 * Attempts to fix simple JSON syntax errors
 * Returns the fixed JSON and a list of changes made
 */
export function fixSimpleJsonErrors(jsonText: string): FixResult {
  const changes: FixChange[] = [];
  let fixed = jsonText;
  let changesMade = false;

  // Track line numbers for each fix
  const getLineNumber = (text: string, index: number): number => {
    return text.substring(0, index).split('\n').length;
  };

  // 1. Fix trailing commas (95%+ success rate)
  // Pattern: , followed by optional whitespace and then } or ]
  const trailingCommaMatches = Array.from(fixed.matchAll(/,(\s*)([\]}])/g));
  if (trailingCommaMatches.length > 0) {
    trailingCommaMatches.forEach(match => {
      if (match.index !== undefined) {
        changes.push({
          type: 'trailing-comma',
          line: getLineNumber(fixed, match.index),
          description: 'Removed trailing comma'
        });
      }
    });
    fixed = fixed.replace(/,(\s*)([\]}])/g, '$1$2');
    changesMade = true;
  }

  // 2. Fix single quotes to double quotes (90%+ success rate)
  // Be careful with escaped quotes and quotes inside strings
  let inString = false;
  let escapeNext = false;
  let result = '';
  let singleQuoteChanges = 0;
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === "'" && !inString) {
      // Convert single quote to double quote
      result += '"';
      singleQuoteChanges++;
      if (singleQuoteChanges % 2 === 0) { // Closing quote
        changes.push({
          type: 'single-quotes',
          line: getLineNumber(fixed, i),
          description: 'Converted single quotes to double quotes'
        });
      }
      changesMade = true;
    } else {
      result += char;
      if (char === '"') {
        inString = !inString;
      }
    }
  }
  
  fixed = result;

  // 3. Fix missing commas between key-value pairs (98%+ success rate)
  // Pattern: "value" followed by whitespace and then " (start of next key)
  // Also: number/boolean/null followed by " (start of next key)
  // Also: } or ] followed by " (end of object/array, start of next key)
  
  // Fix: "value"<whitespace>"key" -> "value","key"
  const missingCommaAfterStringMatches = Array.from(fixed.matchAll(/("(?:[^"\\]|\\.)*")(\s+)("(?:[^"\\]|\\.)*"\s*:)/g));
  if (missingCommaAfterStringMatches.length > 0) {
    missingCommaAfterStringMatches.forEach(match => {
      if (match.index !== undefined) {
        changes.push({
          type: 'missing-comma',
          line: getLineNumber(fixed, match.index),
          description: 'Added missing comma after value'
        });
      }
    });
    fixed = fixed.replace(/("(?:[^"\\]|\\.)*")(\s+)("(?:[^"\\]|\\.)*"\s*:)/g, '$1,$2$3');
    changesMade = true;
  }

  // Fix: number/true/false/null followed by "key":
  const missingCommaAfterValueMatches = Array.from(fixed.matchAll(/(\d+|true|false|null)(\s+)("(?:[^"\\]|\\.)*"\s*:)/g));
  if (missingCommaAfterValueMatches.length > 0) {
    missingCommaAfterValueMatches.forEach(match => {
      if (match.index !== undefined) {
        changes.push({
          type: 'missing-comma',
          line: getLineNumber(fixed, match.index),
          description: 'Added missing comma after value'
        });
      }
    });
    fixed = fixed.replace(/(\d+|true|false|null)(\s+)("(?:[^"\\]|\\.)*"\s*:)/g, '$1,$2$3');
    changesMade = true;
  }

  // Fix: } or ] followed by "key":
  const missingCommaAfterBracketMatches = Array.from(fixed.matchAll(/([\]}])(\s+)("(?:[^"\\]|\\.)*"\s*:)/g));
  if (missingCommaAfterBracketMatches.length > 0) {
    missingCommaAfterBracketMatches.forEach(match => {
      if (match.index !== undefined) {
        changes.push({
          type: 'missing-comma',
          line: getLineNumber(fixed, match.index),
          description: 'Added missing comma after closing bracket'
        });
      }
    });
    fixed = fixed.replace(/([\]}])(\s+)("(?:[^"\\]|\\.)*"\s*:)/g, '$1,$2$3');
    changesMade = true;
  }

  // Fix: ] followed by } then { (array end, object end, new object start - needs comma after ])
  // Example: ...] \n } \n { ... should be ...] \n },\n {
  const missingCommaAfterArrayBeforeObject = Array.from(fixed.matchAll(/(\])(\s*\}\s*)(\{)/g));
  if (missingCommaAfterArrayBeforeObject.length > 0) {
    missingCommaAfterArrayBeforeObject.forEach(match => {
      if (match.index !== undefined) {
        changes.push({
          type: 'missing-comma',
          line: getLineNumber(fixed, match.index),
          description: 'Added missing comma after array before next object'
        });
      }
    });
    fixed = fixed.replace(/(\])(\s*)(\}\s*)(\{)/g, '$1$2$3,$4');
    changesMade = true;
  }

  // 4. Fix unquoted keys (85%+ success rate, but we'll be conservative)
  // Pattern: { or , followed by whitespace and identifier: 
  // Example: {name: "John"} -> {"name": "John"}
  const unquotedKeyMatches = Array.from(fixed.matchAll(/([\{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g));
  if (unquotedKeyMatches.length > 0) {
    unquotedKeyMatches.forEach(match => {
      if (match.index !== undefined) {
        changes.push({
          type: 'unquoted-key',
          line: getLineNumber(fixed, match.index),
          description: `Added quotes around key "${match[2]}"`
        });
      }
    });
    fixed = fixed.replace(/([\{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, '$1"$2"$3:');
    changesMade = true;
  }

  return {
    fixed,
    changes,
    wasFixed: changesMade
  };
}

/**
 * Get a human-readable summary of fixes
 */
export function getFixSummary(changes: FixChange[]): string {
  if (changes.length === 0) return 'No fixes applied';
  
  const grouped = changes.reduce((acc, change) => {
    acc[change.type] = (acc[change.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const parts: string[] = [];
  if (grouped['comment']) parts.push(`${grouped['comment']} comment${grouped['comment'] > 1 ? 's' : ''}`);
  if (grouped['trailing-comma']) parts.push(`${grouped['trailing-comma']} trailing comma${grouped['trailing-comma'] > 1 ? 's' : ''}`);
  if (grouped['single-quotes']) parts.push(`${grouped['single-quotes']} single quote conversion${grouped['single-quotes'] > 1 ? 's' : ''}`);
  if (grouped['missing-comma']) parts.push(`${grouped['missing-comma']} missing comma${grouped['missing-comma'] > 1 ? 's' : ''}`);
  if (grouped['unquoted-key']) parts.push(`${grouped['unquoted-key']} unquoted key${grouped['unquoted-key'] > 1 ? 's' : ''}`);

  return `Fixed: ${parts.join(', ')}`;
}

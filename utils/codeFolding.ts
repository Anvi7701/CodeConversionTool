/**
 * Code Folding Utilities for JSON
 * Detects foldable regions and handles collapse/expand operations
 */

export interface FoldRegion {
  startLine: number;
  endLine: number;
  type: 'object' | 'array';
  level: number; // nesting depth
}

/**
 * Detect foldable regions in JSON code
 * Returns array of regions that can be folded
 */
export const detectJsonFoldRegions = (code: string): FoldRegion[] => {
  const lines = code.split('\n');
  const regions: FoldRegion[] = [];
  const stack: { line: number; char: '{' | '['; level: number }[] = [];
  let currentLevel = 0;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) return;

    // Track opening brackets
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '{' || char === '[') {
        // Check if there's content after the opening bracket on same line
        const restOfLine = line.substring(i + 1).trim();
        const hasContentOnSameLine = restOfLine && !restOfLine.startsWith('}') && !restOfLine.startsWith(']');
        
        // Only create fold region if bracket has content on next lines (multi-line)
        if (!hasContentOnSameLine || lineIndex < lines.length - 1) {
          stack.push({ line: lineIndex, char, level: currentLevel });
          currentLevel++;
        }
      } else if (char === '}' || char === ']') {
        const matchingOpen = char === '}' ? '{' : '[';
        
        // Find matching opening bracket
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].char === matchingOpen) {
            const opening = stack[j];
            currentLevel--;
            
            // Only create region if it spans multiple lines
            if (lineIndex > opening.line) {
              regions.push({
                startLine: opening.line,
                endLine: lineIndex,
                type: matchingOpen === '{' ? 'object' : 'array',
                level: opening.level
              });
            }
            
            stack.splice(j, 1);
            break;
          }
        }
      }
    }
  });

  return regions;
};

/**
 * Get fold region that starts at a specific line
 */
export const getFoldRegionAtLine = (
  regions: FoldRegion[],
  line: number
): FoldRegion | undefined => {
  return regions.find(region => region.startLine === line);
};

/**
 * Collapse a code region by replacing content with placeholder
 */
export const collapseRegion = (
  code: string,
  region: FoldRegion,
  collapsedRegions: Set<number>
): string => {
  const lines = code.split('\n');
  
  // Check if already collapsed
  if (collapsedRegions.has(region.startLine)) {
    return code;
  }

  const startLine = lines[region.startLine];
  const endLine = lines[region.endLine];
  
  // Extract opening part (everything before the bracket)
  const openBracket = region.type === 'object' ? '{' : '[';
  const closeBracket = region.type === 'object' ? '}' : '[';
  
  const openingIndex = startLine.indexOf(openBracket);
  const prefix = startLine.substring(0, openingIndex + 1);
  
  // Extract closing part (everything after the bracket)
  const closingIndex = endLine.lastIndexOf(closeBracket);
  const suffix = endLine.substring(closingIndex);
  
  // Count collapsed lines
  const collapsedLineCount = region.endLine - region.startLine;
  
  // Create placeholder
  const placeholder = ` /* ${collapsedLineCount} lines */ `;
  const collapsedLine = prefix + placeholder + suffix;
  
  // Build new code
  const newLines = [
    ...lines.slice(0, region.startLine),
    collapsedLine,
    ...lines.slice(region.endLine + 1)
  ];
  
  return newLines.join('\n');
};

/**
 * Check if a line is inside a collapsed region
 */
export const isLineInCollapsedRegion = (
  line: number,
  collapsedRegions: Set<number>,
  allRegions: FoldRegion[]
): boolean => {
  for (const startLine of collapsedRegions) {
    const region = allRegions.find(r => r.startLine === startLine);
    if (region && line > region.startLine && line <= region.endLine) {
      return true;
    }
  }
  return false;
};

/**
 * Get visible lines after applying collapsed regions
 */
export const getVisibleLines = (
  code: string,
  collapsedRegions: Set<number>,
  allRegions: FoldRegion[]
): { visibleLines: string[]; lineNumberMap: Map<number, number> } => {
  const lines = code.split('\n');
  const visibleLines: string[] = [];
  const lineNumberMap = new Map<number, number>(); // visual line -> original line
  
  let visualLineNumber = 0;
  
  lines.forEach((line, originalLineNumber) => {
    // Check if this line is inside a collapsed region
    const inCollapsedRegion = isLineInCollapsedRegion(
      originalLineNumber,
      collapsedRegions,
      allRegions
    );
    
    if (!inCollapsedRegion) {
      // Check if this line starts a collapsed region
      const region = getFoldRegionAtLine(allRegions, originalLineNumber);
      if (region && collapsedRegions.has(originalLineNumber)) {
        // This is the start of a collapsed region
        const openBracket = region.type === 'object' ? '{' : '[';
        const closeBracket = region.type === 'object' ? '}' : ']';
        
        const openingIndex = line.indexOf(openBracket);
        const prefix = line.substring(0, openingIndex + 1);
        
        const endLine = lines[region.endLine];
        const closingIndex = endLine.lastIndexOf(closeBracket);
        const suffix = endLine.substring(closingIndex);
        
        const collapsedLineCount = region.endLine - region.startLine;
        const placeholder = ` /* ${collapsedLineCount} lines */ `;
        
        visibleLines.push(prefix + placeholder + suffix);
        lineNumberMap.set(visualLineNumber, originalLineNumber);
        visualLineNumber++;
      } else {
        // Regular visible line
        visibleLines.push(line);
        lineNumberMap.set(visualLineNumber, originalLineNumber);
        visualLineNumber++;
      }
    }
  });
  
  return { visibleLines, lineNumberMap };
};

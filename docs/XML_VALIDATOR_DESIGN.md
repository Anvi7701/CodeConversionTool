# XML Validator Design Document (Option 1 - Light Validation)

**Document Version:** 1.0  
**Created:** November 11, 2025  
**Status:** Design Phase (Not Implemented)  
**Estimated Implementation Time:** 2-3 hours  

---

## Table of Contents
1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Solution Architecture](#solution-architecture)
4. [Technical Specification](#technical-specification)
5. [Implementation Plan](#implementation-plan)
6. [Testing Strategy](#testing-strategy)
7. [Performance Considerations](#performance-considerations)
8. [Risk Analysis](#risk-analysis)
9. [Future Enhancements](#future-enhancements)

---

## Overview

### Purpose
Add a lightweight XML validation layer to catch and auto-fix common errors in AI-generated XML output during JSON to XML conversion in Smart (AI) mode.

### Scope
**In Scope:**
- XML well-formedness validation (proper tag matching)
- Over-escaped character detection and auto-fix
- Basic structural validation
- Auto-correction of fixable issues

**Out of Scope:**
- XML Schema (XSD) validation
- Complex semantic validation
- Type inference/validation
- Duplicate tag detection (arrays have legitimate duplicates)
- Custom business rule validation

### Goals
1. ✅ Catch AI-generated XML errors before displaying to users
2. ✅ Auto-fix common issues (over-escaping, malformed tags)
3. ✅ Maintain performance (<150ms overhead)
4. ✅ Minimize false positives (<5%)
5. ✅ Provide clear feedback to users when issues are found/fixed

---

## Problem Statement

### Current Behavior
- AI generates XML from JSON using `convertJsonToXml()` in `geminiService.ts`
- No validation occurs after AI conversion
- Users receive whatever XML the AI produces (could be invalid)

### Known Issues (Potential)
1. **Over-escaped Characters**: `&amp;apos;` instead of `'` or `&apos;`
2. **Malformed XML**: Unclosed tags, mismatched brackets
3. **Invalid XML Declaration**: Missing or malformed `<?xml ... ?>`
4. **Encoding Issues**: Non-UTF-8 characters causing parse errors

### Why Light Validation?
- AI prompt already handles most issues well
- No reported XML quality problems yet
- Heavy validation adds complexity without proven benefit
- Start small, expand if needed (lean development)

---

## Solution Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│  JSON to XML Conversion (Smart AI Mode)                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  1. correctCodeSyntax() - Fix JSON syntax                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. convertJsonToXml() - AI generates XML                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. validateAndFixXml() ← NEW VALIDATION LAYER              │
│     ├─ Check well-formedness (DOMParser)                    │
│     ├─ Detect over-escaped characters                       │
│     ├─ Auto-fix if possible                                 │
│     └─ Return ValidationResult                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Return corrected XML to user                            │
└─────────────────────────────────────────────────────────────┘
```

### Component Overview

```
utils/
  └── xmlValidator.ts (NEW)
      ├── validateAndFixXml()      - Main entry point
      ├── checkWellFormedness()     - DOMParser validation
      ├── detectOverEscaping()      - Find &amp;apos;, &amp;quot;
      ├── fixOverEscaping()         - Auto-correct escaping
      └── validateXmlDeclaration()  - Check <?xml ... ?>

services/
  └── geminiService.ts (MODIFIED)
      └── convertJsonToXml()
          └── Calls validateAndFixXml() before returning

components/
  └── JsonToXmlConverter.tsx (OPTIONAL MODIFICATION)
      └── Display validation status/warnings to user
```

---

## Technical Specification

### Data Structures

#### XmlValidationResult Interface
```typescript
/**
 * Result of XML validation and auto-fix operations
 */
export interface XmlValidationResult {
  /** Whether the XML is valid (after auto-fix attempts) */
  isValid: boolean;
  
  /** Original XML before any fixes */
  originalXml: string;
  
  /** Corrected XML (may be same as original if no fixes needed) */
  correctedXml: string;
  
  /** Issues found that could NOT be auto-fixed */
  criticalIssues: XmlIssue[];
  
  /** Issues that WERE auto-fixed */
  autoFixedIssues: XmlIssue[];
  
  /** Whether any auto-fixes were applied */
  wasAutoFixed: boolean;
  
  /** Performance metrics */
  validationTimeMs: number;
}

/**
 * Represents a single XML validation issue
 */
export interface XmlIssue {
  /** Type of issue */
  type: 'over-escaping' | 'malformed' | 'declaration' | 'encoding' | 'other';
  
  /** Severity level */
  severity: 'critical' | 'warning' | 'info';
  
  /** Human-readable description */
  message: string;
  
  /** Line number where issue occurs (if available) */
  line?: number;
  
  /** Whether this issue was auto-fixed */
  autoFixed: boolean;
}
```

### Core Functions

#### 1. validateAndFixXml() - Main Entry Point
```typescript
/**
 * Validates XML and attempts to auto-fix common issues
 * @param xml - The XML string to validate
 * @returns Validation result with corrected XML
 */
export const validateAndFixXml = (xml: string): XmlValidationResult => {
  const startTime = performance.now();
  const result: XmlValidationResult = {
    isValid: true,
    originalXml: xml,
    correctedXml: xml,
    criticalIssues: [],
    autoFixedIssues: [],
    wasAutoFixed: false,
    validationTimeMs: 0
  };

  // Step 1: Check XML declaration
  const declarationIssue = validateXmlDeclaration(xml);
  if (declarationIssue) {
    result.autoFixedIssues.push(declarationIssue);
  }

  // Step 2: Fix over-escaped characters
  const escapeResult = fixOverEscaping(result.correctedXml);
  if (escapeResult.wasFixed) {
    result.correctedXml = escapeResult.fixedXml;
    result.wasAutoFixed = true;
    result.autoFixedIssues.push(...escapeResult.issues);
  }

  // Step 3: Check well-formedness
  const wellFormednessIssue = checkWellFormedness(result.correctedXml);
  if (wellFormednessIssue) {
    result.isValid = false;
    result.criticalIssues.push(wellFormednessIssue);
  }

  result.validationTimeMs = performance.now() - startTime;
  return result;
};
```

#### 2. checkWellFormedness() - DOMParser Validation
```typescript
/**
 * Checks if XML is well-formed using DOMParser
 * @param xml - The XML string to check
 * @returns Issue if XML is malformed, null if valid
 */
const checkWellFormedness = (xml: string): XmlIssue | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    // Check for parser errors
    const parserError = doc.querySelector('parsererror');
    
    if (parserError) {
      const errorText = parserError.textContent || 'Unknown XML parsing error';
      
      // Extract line number if available
      const lineMatch = errorText.match(/line (\d+)/i);
      const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
      
      return {
        type: 'malformed',
        severity: 'critical',
        message: `XML is not well-formed: ${errorText}`,
        line: lineNumber,
        autoFixed: false
      };
    }
    
    return null; // XML is well-formed
  } catch (error: any) {
    return {
      type: 'malformed',
      severity: 'critical',
      message: `XML parsing failed: ${error.message}`,
      autoFixed: false
    };
  }
};
```

#### 3. fixOverEscaping() - Auto-Fix Over-Escaped Characters
```typescript
interface EscapeFixResult {
  wasFixed: boolean;
  fixedXml: string;
  issues: XmlIssue[];
}

/**
 * Detects and fixes over-escaped characters
 * Common issue: &amp;apos; instead of &apos; or '
 */
const fixOverEscaping = (xml: string): EscapeFixResult => {
  const result: EscapeFixResult = {
    wasFixed: false,
    fixedXml: xml,
    issues: []
  };

  const overEscapePatterns = [
    { pattern: /&amp;apos;/g, replacement: '&apos;', description: 'apostrophe' },
    { pattern: /&amp;quot;/g, replacement: '&quot;', description: 'quotation mark' },
    { pattern: /&amp;lt;/g, replacement: '&lt;', description: 'less than' },
    { pattern: /&amp;gt;/g, replacement: '&gt;', description: 'greater than' },
    { pattern: /&amp;amp;/g, replacement: '&amp;', description: 'ampersand' }
  ];

  overEscapePatterns.forEach(({ pattern, replacement, description }) => {
    const matches = result.fixedXml.match(pattern);
    
    if (matches && matches.length > 0) {
      result.fixedXml = result.fixedXml.replace(pattern, replacement);
      result.wasFixed = true;
      
      result.issues.push({
        type: 'over-escaping',
        severity: 'warning',
        message: `Fixed ${matches.length} over-escaped ${description}(s)`,
        autoFixed: true
      });
    }
  });

  return result;
};
```

#### 4. validateXmlDeclaration() - Check XML Declaration
```typescript
/**
 * Validates the XML declaration
 * Ensures it starts with <?xml version="1.0" encoding="UTF-8"?>
 */
const validateXmlDeclaration = (xml: string): XmlIssue | null => {
  const trimmedXml = xml.trim();
  
  // Check if XML declaration exists
  if (!trimmedXml.startsWith('<?xml')) {
    return {
      type: 'declaration',
      severity: 'info',
      message: 'XML declaration is recommended but not critical',
      autoFixed: false
    };
  }
  
  // Check for common declaration issues
  const declarationRegex = /^<\?xml\s+version="[\d.]+"\s+encoding="[\w-]+"\s*\?>/i;
  
  if (!declarationRegex.test(trimmedXml.split('\n')[0])) {
    return {
      type: 'declaration',
      severity: 'warning',
      message: 'XML declaration may be malformed',
      line: 1,
      autoFixed: false
    };
  }
  
  return null; // Declaration is valid
};
```

---

## Implementation Plan

### Phase 1: Core Validation (1.5 hours)

**Files to Create:**
1. `utils/xmlValidator.ts` - Core validation logic

**Tasks:**
- [ ] Create `XmlValidationResult` and `XmlIssue` interfaces
- [ ] Implement `validateAndFixXml()` main function
- [ ] Implement `checkWellFormedness()` using DOMParser
- [ ] Implement `fixOverEscaping()` with regex patterns
- [ ] Implement `validateXmlDeclaration()`
- [ ] Add JSDoc comments for all functions

**Acceptance Criteria:**
- All functions compile without TypeScript errors
- Basic validation logic works independently
- Auto-fix correctly handles over-escaping

---

### Phase 2: Integration (30 minutes)

**Files to Modify:**
1. `services/geminiService.ts`

**Tasks:**
- [ ] Import `validateAndFixXml` from `utils/xmlValidator`
- [ ] Add validation call in `convertJsonToXml()` after AI generation
- [ ] Log validation results to console
- [ ] Return corrected XML instead of original

**Code Location:**
```typescript
// services/geminiService.ts - Line ~380 (in convertJsonToXml function)

export const convertJsonToXml = async (jsonData: string): Promise<string> => {
    return handleApiCall(async () => {
        const result = await ai.models.generateContent({
            // ... existing AI generation code ...
        });
        
        let xmlCode = result.text.trim();
        
        // Clean up markdown formatting
        if (xmlCode.startsWith('```xml')) {
            xmlCode = xmlCode.replace(/^```xml\n/, '').replace(/\n```$/, '');
        } else if (xmlCode.startsWith('```')) {
            xmlCode = xmlCode.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        
        // ============ NEW CODE STARTS HERE ============
        // Validate and auto-fix the generated XML
        const validation = validateAndFixXml(xmlCode);
        
        // Log validation results for monitoring
        console.log('XML Validation Results:', {
            isValid: validation.isValid,
            wasAutoFixed: validation.wasAutoFixed,
            autoFixedCount: validation.autoFixedIssues.length,
            criticalIssuesCount: validation.criticalIssues.length,
            validationTimeMs: validation.validationTimeMs
        });
        
        // If critical issues found, log them
        if (validation.criticalIssues.length > 0) {
            console.warn('XML Critical Issues:', validation.criticalIssues);
        }
        
        // If auto-fixes were applied, log them
        if (validation.wasAutoFixed) {
            console.info('XML Auto-Fixes Applied:', validation.autoFixedIssues);
        }
        
        // Return the corrected XML (or original if no fixes needed)
        return validation.correctedXml.trim();
        // ============ NEW CODE ENDS HERE ============
    });
};
```

**Acceptance Criteria:**
- Validation runs after every AI XML generation
- Console logs show validation results
- Corrected XML is returned to user
- No breaking changes to existing functionality

---

### Phase 3: UI Feedback (Optional - 30 minutes)

**Files to Modify:**
1. `components/JsonToXmlConverter.tsx`

**Tasks:**
- [ ] Add state for validation results: `const [xmlValidation, setXmlValidation] = useState<XmlValidationResult | null>(null)`
- [ ] Modify `convertJsonToXml` to return validation results (requires geminiService modification)
- [ ] Display validation status/warnings below output box
- [ ] Show "✓ XML Validated" or "⚠ Issues Auto-Fixed" badge

**UI Mockup:**
```
┌─────────────────────────────────────────────────┐
│  Output (XML)                                   │
│                                                 │
│  <?xml version="1.0" encoding="UTF-8"?>         │
│  <root>                                         │
│    <name>John Doe</name>                        │
│  </root>                                        │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ ✓ XML Validated Successfully             │  │
│  │ ℹ Auto-fixed 3 over-escaped characters   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- Validation status visible to users
- Auto-fix count displayed when applicable
- Critical issues shown as warnings
- UI doesn't break if validation is skipped

---

### Phase 4: Testing (45 minutes)

**Test Cases:**

#### Test 1: Well-Formed XML (No Issues)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <name>John Doe</name>
  <age>30</age>
</root>
```
**Expected:** `isValid: true`, `wasAutoFixed: false`, no issues

---

#### Test 2: Over-Escaped Characters
```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <message>It&amp;apos;s working</message>
  <quote>He said &amp;quot;Hello&amp;quot;</quote>
</root>
```
**Expected:** 
- `isValid: true`
- `wasAutoFixed: true`
- `autoFixedIssues` contains over-escaping fixes
- Corrected: `It&apos;s` and `&quot;Hello&quot;`

---

#### Test 3: Malformed XML (Unclosed Tag)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <name>John Doe
  <age>30</age>
</root>
```
**Expected:**
- `isValid: false`
- `criticalIssues` contains malformed tag error
- Error includes line number

---

#### Test 4: Missing XML Declaration
```xml
<root>
  <name>John Doe</name>
</root>
```
**Expected:**
- `isValid: true` (declaration is optional)
- `autoFixedIssues` may contain info about missing declaration
- XML still validates

---

#### Test 5: Complex Nested Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <users>
    <user>
      <name>John</name>
      <email>john@example.com</email>
    </user>
    <user>
      <name>Jane</name>
      <email>jane@example.com</email>
    </user>
  </users>
</root>
```
**Expected:** `isValid: true`, no issues

---

#### Test 6: Multiple Issues (Over-Escaping + Malformed)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <message>It&amp;apos;s broken
  <name>John</name>
</root>
```
**Expected:**
- `wasAutoFixed: true` (fixes over-escaping)
- `isValid: false` (unclosed tag remains)
- Both `autoFixedIssues` and `criticalIssues` populated

---

#### Test 7: Large XML (Performance Test)
**Input:** Generate 1000-line XML with various elements  
**Expected:** Validation completes in <150ms

---

### Phase 5: Documentation (15 minutes)

**Tasks:**
- [ ] Add function documentation to `xmlValidator.ts`
- [ ] Update `README.md` with XML validation feature
- [ ] Add inline comments explaining validation logic
- [ ] Document performance benchmarks

---

## Testing Strategy

### Unit Tests (Optional but Recommended)

Create `utils/__tests__/xmlValidator.test.ts`:

```typescript
import { validateAndFixXml } from '../xmlValidator';

describe('xmlValidator', () => {
  describe('validateAndFixXml', () => {
    it('should validate well-formed XML', () => {
      const xml = '<?xml version="1.0"?><root><name>Test</name></root>';
      const result = validateAndFixXml(xml);
      
      expect(result.isValid).toBe(true);
      expect(result.wasAutoFixed).toBe(false);
      expect(result.criticalIssues).toHaveLength(0);
    });

    it('should fix over-escaped apostrophes', () => {
      const xml = '<?xml version="1.0"?><root><msg>It&amp;apos;s working</msg></root>';
      const result = validateAndFixXml(xml);
      
      expect(result.wasAutoFixed).toBe(true);
      expect(result.correctedXml).toContain('It&apos;s working');
      expect(result.autoFixedIssues.length).toBeGreaterThan(0);
    });

    it('should detect malformed XML', () => {
      const xml = '<root><name>Unclosed</root>';
      const result = validateAndFixXml(xml);
      
      expect(result.isValid).toBe(false);
      expect(result.criticalIssues.length).toBeGreaterThan(0);
    });

    it('should complete validation quickly', () => {
      const xml = '<?xml version="1.0"?><root><name>Test</name></root>';
      const result = validateAndFixXml(xml);
      
      expect(result.validationTimeMs).toBeLessThan(150);
    });
  });
});
```

### Manual Testing Checklist

- [ ] Test with well-formed XML (no changes expected)
- [ ] Test with over-escaped characters (auto-fix should work)
- [ ] Test with malformed XML (should detect error)
- [ ] Test with missing XML declaration (should handle gracefully)
- [ ] Test with large XML files (>1000 lines) - performance check
- [ ] Test edge cases: empty string, null, undefined
- [ ] Test with non-XML input (plain text, JSON)

---

## Performance Considerations

### Benchmark Targets

| Operation | Target Time | Maximum Time |
|-----------|-------------|--------------|
| Small XML (<100 lines) | <50ms | 100ms |
| Medium XML (100-500 lines) | <100ms | 150ms |
| Large XML (500-1000 lines) | <150ms | 200ms |
| Very Large XML (>1000 lines) | <200ms | 300ms |

### Optimization Strategies

1. **Lazy Evaluation**
   - Only parse XML with DOMParser if other checks pass
   - Skip expensive checks if early checks fail

2. **Regex Efficiency**
   - Use compiled regex patterns (defined once, reused)
   - Avoid catastrophic backtracking in patterns

3. **Early Returns**
   - Return immediately on critical errors
   - Don't perform auto-fixes if XML is fundamentally broken

4. **Caching** (Future Enhancement)
   - Cache validation results for identical XML
   - Use hash-based cache key

### Performance Monitoring

Log validation time in production:
```typescript
console.log(`XML Validation completed in ${result.validationTimeMs}ms`);
```

---

## Risk Analysis

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **False Positives** (flagging valid XML as invalid) | Medium | High | Extensive testing with diverse XML samples |
| **Performance Degradation** (>200ms validation time) | Low | Medium | Benchmark testing, optimize regex patterns |
| **DOMParser Browser Compatibility** | Low | Low | DOMParser widely supported in all modern browsers |
| **Breaking Existing Functionality** | Low | High | Only adds validation layer, doesn't modify core conversion |
| **Incomplete Auto-Fixes** (fixes part but not all issues) | Medium | Low | Clear error messages for unfixed issues |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **User Confusion** (too many warnings) | Medium | Medium | Only show critical issues, auto-fix minor ones silently |
| **Development Time Overrun** | Low | Low | Well-defined scope, 3-hour time limit |
| **Not Solving Real User Problems** | Medium | Medium | Monitor usage, remove if unused after 2 weeks |

---

## Future Enhancements

### Phase 2 Features (If Needed)

1. **Type Validation**
   - Detect if numbers are stored as strings
   - Validate boolean values (true/false vs 1/0)
   - Requires JSON schema or type hints

2. **Semantic Validation**
   - Check for duplicate elements (beyond arrays)
   - Validate data relationships
   - Custom business rules

3. **XML Schema (XSD) Support**
   - Validate against user-provided XSD
   - Auto-generate XSD from JSON structure
   - Much more complex, 8-15 hours implementation

4. **Batch Validation**
   - Validate multiple XML files at once
   - Generate validation report CSV/PDF

5. **Custom Validation Rules**
   - User-defined validation functions
   - Pluggable validator architecture

### Metrics to Track

To decide if Phase 2 is needed, track:
- **Validation Failure Rate**: How often does XML fail validation?
- **Auto-Fix Success Rate**: How often do auto-fixes work?
- **User Reports**: Do users report XML quality issues?
- **Performance Impact**: Is validation slowing down conversions?

**Decision Criteria:**
- If validation failure rate >10%, implement more robust validation
- If auto-fix success rate <80%, improve auto-fix logic
- If user reports >5 XML issues per month, prioritize enhancements

---

## Rollback Plan

If implementation causes issues:

1. **Immediate Rollback** (if breaking production)
   - Comment out `validateAndFixXml()` call in `geminiService.ts`
   - Deploy hotfix within 30 minutes

2. **Partial Rollback** (if only UI issues)
   - Remove UI feedback components
   - Keep backend validation for logging only

3. **Feature Toggle** (best practice)
   - Add environment variable: `VITE_ENABLE_XML_VALIDATION=true`
   - Conditionally enable validation:
   ```typescript
   const shouldValidate = import.meta.env.VITE_ENABLE_XML_VALIDATION === 'true';
   if (shouldValidate) {
       const validation = validateAndFixXml(xmlCode);
       xmlCode = validation.correctedXml;
   }
   ```

---

## Success Metrics

### Implementation Success (Week 1)
- [ ] All code compiles without errors
- [ ] All test cases pass
- [ ] Validation time <150ms for 95% of conversions
- [ ] Zero breaking changes to existing functionality

### Feature Success (Week 2-4)
- [ ] Validation catches at least 1 real AI error in testing
- [ ] Auto-fix success rate >90%
- [ ] No user complaints about false positives
- [ ] Performance impact <2% (users don't notice)

### Long-Term Success (Month 1-3)
- [ ] If no XML errors detected in production → Consider removing feature
- [ ] If 5+ errors detected/fixed → Justify keeping feature
- [ ] If user satisfaction increases → Success
- [ ] If validation overhead becomes issue → Optimize or remove

---

## Conclusion

### Recommendation

**Implement Option 1 (Light Validation) IF:**
1. ✅ You have 3 hours of development time available
2. ✅ You want proactive quality assurance
3. ✅ You're willing to monitor metrics for 2-4 weeks
4. ✅ You value "insurance" against AI errors

**Wait and Monitor IF:**
1. ⏸️ You haven't seen any XML quality issues yet
2. ⏸️ You're on a tight launch deadline
3. ⏸️ You want to validate the need first (lean approach)

### Implementation Timeline

```
Week 0: Decision (you are here)
Week 1: Implement if approved (3 hours)
Week 2-3: Monitor metrics and user feedback
Week 4: Decide to keep, enhance, or remove

Total Time Investment: 3-4 hours
Potential ROI: Prevent 1-2 user complaints = Worth it
```

### Final Notes

This is a **reference design** - not a mandate. Feel free to:
- Simplify further (remove optional UI feedback)
- Expand scope (add more validators)
- Delay implementation until evidence of need
- Archive and never implement (perfectly valid choice)

**The best code is code you don't have to write.** Only implement when the problem is proven, not assumed.

---

## Appendix

### Code Files Summary

**New Files:**
1. `utils/xmlValidator.ts` (~150 lines)

**Modified Files:**
1. `services/geminiService.ts` (+15 lines)
2. `components/JsonToXmlConverter.tsx` (+20 lines, optional)

**Total Code Impact:** ~185 lines

### Dependencies

**New Dependencies:** None (uses built-in DOMParser)  
**Browser Compatibility:** All modern browsers (Chrome, Firefox, Safari, Edge)

### References

- [DOMParser API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)
- [XML Validation - W3C](https://www.w3.org/XML/)
- [XML Character Entities](https://www.w3.org/TR/xml/#sec-predefined-ent)

---

**Document End**

Last Updated: November 11, 2025  
Next Review: When implementation is approved or after 1 month (whichever comes first)

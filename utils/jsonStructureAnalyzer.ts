/**
 * Analyzes JSON structure and provides detailed statistics
 */

interface StructureAnalysis {
  isValid: boolean;
  message: string;
  summary: {
    status: string;
    type: string;
    isArray: boolean;
    size: string;
    depth: string;
    keys: number;
  };
  details: {
    rootType: string;
    isArray: boolean;
    totalSize: number;
    nestingDepth: number;
    objectKeys: string[];
    valueTypes: Record<string, string>;
  };
  statistics: {
    strings: number;
    numbers: number;
    booleans: number;
    nulls: number;
    objects: number;
    arrays: number;
  };
}

/**
 * Analyzes JSON structure and returns comprehensive statistics
 */
export function analyzeJsonStructure(jsonString: string): StructureAnalysis {
  try {
    const parsed = JSON.parse(jsonString);
    
    const statistics = {
      strings: 0,
      numbers: 0,
      booleans: 0,
      nulls: 0,
      objects: 0,
      arrays: 0,
    };
    
    let maxDepth = 0;
    
    // Recursive function to analyze structure and count types
    function analyze(value: any, depth: number = 0): void {
      maxDepth = Math.max(maxDepth, depth);
      
      if (value === null) {
        statistics.nulls++;
      } else if (Array.isArray(value)) {
        statistics.arrays++;
        value.forEach(item => analyze(item, depth + 1));
      } else if (typeof value === 'object') {
        statistics.objects++;
        Object.values(value).forEach(val => analyze(val, depth + 1));
      } else if (typeof value === 'string') {
        statistics.strings++;
      } else if (typeof value === 'number') {
        statistics.numbers++;
      } else if (typeof value === 'boolean') {
        statistics.booleans++;
      }
    }
    
    // Start analysis from root
    analyze(parsed, 1);
    
    // Get root information
    const isArray = Array.isArray(parsed);
    const rootType = isArray ? 'array' : typeof parsed === 'object' && parsed !== null ? 'object' : typeof parsed;
    const objectKeys = !isArray && typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : [];
    
    // Build value types map for root level keys
    const valueTypes: Record<string, string> = {};
    if (!isArray && typeof parsed === 'object' && parsed !== null) {
      Object.entries(parsed).forEach(([key, value]) => {
        if (value === null) {
          valueTypes[key] = 'null';
        } else if (Array.isArray(value)) {
          valueTypes[key] = 'array';
        } else {
          valueTypes[key] = typeof value;
        }
      });
    }
    
    const totalSize = jsonString.length;
    const sizeFormatted = totalSize >= 1024 
      ? `${(totalSize / 1024).toFixed(2)} KB`
      : `${totalSize} characters`;
    
    return {
      isValid: true,
      message: "JSON format is valid ✅",
      summary: {
        status: "Valid",
        type: rootType,
        isArray: isArray,
        size: sizeFormatted,
        depth: `${maxDepth} levels`,
        keys: objectKeys.length,
      },
      details: {
        rootType: rootType,
        isArray: isArray,
        totalSize: totalSize,
        nestingDepth: maxDepth,
        objectKeys: objectKeys,
        valueTypes: valueTypes,
      },
      statistics: statistics,
    };
    
  } catch (error) {
    return {
      isValid: false,
      message: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      summary: {
        status: "Invalid",
        type: "N/A",
        isArray: false,
        size: "N/A",
        depth: "N/A",
        keys: 0,
      },
      details: {
        rootType: "N/A",
        isArray: false,
        totalSize: jsonString.length,
        nestingDepth: 0,
        objectKeys: [],
        valueTypes: {},
      },
      statistics: {
        strings: 0,
        numbers: 0,
        booleans: 0,
        nulls: 0,
        objects: 0,
        arrays: 0,
      },
    };
  }
}

# AI Error Handling Implementation Guide

## Overview
This guide ensures all AI features across the application have consistent, user-friendly error handling.

## Components Affected
All components using `geminiService`:
- ✅ OnlineFormatterWithToolbar.tsx (IMPLEMENTED)
- 🔄 CodeToJsonConverter.tsx
- 🔄 CodeToHtmlConverter.tsx
- 🔄 CodeToPythonConverter.tsx
- 🔄 CodeToJsConverter.tsx
- 🔄 CodeToXmlConverter.tsx
- 🔄 XmlInspector.tsx
- 🔄 JsonToJavaConverter.tsx
- 🔄 JsonToXmlConverter.tsx
- 🔄 JsonExplainerPage.tsx
- 🔄 OnlineFormatter.tsx (deprecated)

## Implementation Pattern

### 1. Import Required Dependencies
```typescript
import { AIErrorDisplay, parseAIError, type AIErrorType } from './AIErrorDisplay';
import { handleAICall, isAIError } from '../utils/aiErrorHandler';
```

### 2. Add State Management
```typescript
// AI Error state
const [aiError, setAiError] = useState<{ 
  type: AIErrorType; 
  code?: number; 
  message: string; 
  originalError?: string 
} | null>(null);
const [lastAiRequest, setLastAiRequest] = useState<(() => Promise<void>) | null>(null);
```

### 3. Wrap AI Calls with Error Handling
```typescript
const handleAIOperation = async () => {
  const executeOperation = async () => {
    setIsLoading(true);
    setAiError(null);
    
    try {
      // Your AI service call here
      const result = await someAIServiceFunction(input, params);
      
      // Handle success
      setOutput(result);
      setLastAiRequest(null);
    } catch (err: any) {
      // Parse and display user-friendly error
      const parsedError = parseAIError(err);
      setAiError(parsedError);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Store for retry functionality
  setLastAiRequest(() => executeOperation);
  await executeOperation();
};
```

### 4. Add Retry and Fallback Handlers
```typescript
const handleRetryAiRequest = async () => {
  if (lastAiRequest) {
    await lastAiRequest();
  }
};

const handleFallback = () => {
  // Component-specific fallback logic
  // e.g., switch to Fast mode, use local processing, etc.
  setAiError(null);
  setLastAiRequest(null);
};
```

### 5. Display Error in UI
```typescript
{isLoading ? (
  <LoadingComponent />
) : aiError ? (
  <div className="h-full overflow-auto p-4 flex items-center justify-center">
    <AIErrorDisplay 
      error={aiError}
      onRetry={lastAiRequest ? handleRetryAiRequest : undefined}
      onSwitchToFastMode={handleFallback} // or onFallback
    />
  </div>
) : outputError ? (
  // Regular error display
  <div className="error-display">{outputError}</div>
) : (
  // Success content
  <div>{output}</div>
)}
```

### 6. Clear Errors on New Operations
```typescript
const resetState = () => {
  setAiError(null);
  setLastAiRequest(null);
  setOutput(null);
  setError(null);
};
```

## Error Types Supported

### 503 - Service Overloaded (⚠️ Orange)
- **Message**: AI Service Temporarily Unavailable
- **Cause**: High demand on AI servers
- **User Action**: Wait 30-60 seconds or use fallback

### 500 - Server Error (🔧 Red)
- **Message**: AI Service Error  
- **Cause**: Internal server issues
- **User Action**: Try again later or use fallback

### 429 - Rate Limit (⏱️ Yellow)
- **Message**: Too Many Requests
- **Cause**: Exceeded API quota
- **User Action**: Wait 1-2 minutes or use fallback

### Network Error (🌐 Blue)
- **Message**: Connection Issue
- **Cause**: Network connectivity problems
- **User Action**: Check connection

### Unknown Error (❌ Gray)
- **Message**: Unexpected Error
- **Cause**: Unspecified error
- **User Action**: Try different input or use fallback

## Test Mode

Use keyboard shortcuts to test error handling without actual API failures:

- **Ctrl+Shift+E**: Simulate 503 (Service Overloaded)
- **Ctrl+Shift+S**: Simulate 500 (Server Error)
- **Ctrl+Shift+R**: Simulate 429 (Rate Limit)

## Best Practices

### ✅ DO:
- Always wrap AI service calls in try-catch
- Use `parseAIError()` for consistent error formatting
- Provide retry functionality via `lastAiRequest` state
- Offer fallback options (Fast mode, manual features)
- Clear AI errors when starting new operations
- Show loading states during AI operations
- Preserve user input on errors

### ❌ DON'T:
- Display raw error JSON to users
- Use generic "An error occurred" messages
- Leave users without action options
- Forget to clear errors on state reset
- Block UI without retry option
- Lose user data on error

## Migration Checklist

For each component using AI services:

- [ ] Import AIErrorDisplay and parseAIError
- [ ] Add aiError and lastAiRequest state
- [ ] Wrap AI calls with try-catch
- [ ] Parse errors with parseAIError()
- [ ] Implement retry handler
- [ ] Implement fallback handler
- [ ] Update UI to show AIErrorDisplay
- [ ] Clear errors in resetState()
- [ ] Test all error types
- [ ] Verify retry functionality
- [ ] Verify fallback functionality
- [ ] Update documentation

## Example Implementation

See `OnlineFormatterWithToolbar.tsx` for complete reference implementation with:
- ✅ All error types handled
- ✅ Retry functionality
- ✅ Fast mode fallback
- ✅ Test mode for all errors
- ✅ Proper state management
- ✅ User-friendly UI

## Future Development

When adding new AI features:
1. Import error handling utilities from day one
2. Follow the implementation pattern above
3. Add appropriate fallback options
4. Test with simulated errors
5. Update this documentation

## Questions?

For questions or issues with AI error handling:
- Check OnlineFormatterWithToolbar.tsx for reference
- Review AIErrorDisplay.tsx for error display logic
- Check utils/aiErrorHandler.ts for helper functions

import { parseAIError, type AIErrorType } from '../components/AIErrorDisplay';

/**
 * Centralized AI error handler utility
 * Use this to wrap all AI service calls for consistent error handling
 */

export interface AIErrorState {
  hasError: boolean;
  error: { type: AIErrorType; code?: number; message: string; originalError?: string } | null;
}

/**
 * Wraps an AI service call with standardized error handling
 * @param aiFunction The async function that calls the AI service
 * @param onError Callback when an error occurs
 * @param onSuccess Optional callback when the operation succeeds
 * @returns The result of the AI function or throws parsed error
 */
export async function handleAICall<T>(
  aiFunction: () => Promise<T>,
  onError: (error: { type: AIErrorType; code?: number; message: string; originalError?: string }) => void,
  onSuccess?: (result: T) => void
): Promise<T | null> {
  try {
    const result = await aiFunction();
    if (onSuccess) {
      onSuccess(result);
    }
    return result;
  } catch (err: any) {
    const parsedError = parseAIError(err);
    onError(parsedError);
    return null;
  }
}

/**
 * Checks if an error is an AI-related error
 * @param error The error to check
 * @returns true if it's an AI error (503, 429, 500, network, etc.)
 */
export function isAIError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  const errorString = typeof error === 'string' ? error : JSON.stringify(error);
  
  return (
    errorMessage.includes('API') ||
    errorMessage.includes('AI') ||
    errorMessage.includes('timed out') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('Server Error') ||
    errorMessage.includes('overload') ||
    errorMessage.includes('UNAVAILABLE') ||
    errorMessage.includes('RESOURCE_EXHAUSTED') ||
    errorString.includes('"code":503') ||
    errorString.includes('"code":500') ||
    errorString.includes('"code":429')
  );
}

/**
 * Creates a retry function for AI operations
 * @param operation The operation to retry
 * @returns A function that retries the operation
 */
export function createRetryHandler(operation: () => Promise<void>): () => Promise<void> {
  return async () => {
    await operation();
  };
}

/**
 * Default error messages for common scenarios
 */
export const AI_ERROR_MESSAGES = {
  NO_INPUT: 'Please provide input before using AI features.',
  GENERIC_FAILURE: 'AI operation failed. Please try again or use manual features.',
  NETWORK_ISSUE: 'Unable to connect to AI service. Please check your connection.',
  VALIDATION_FAILED: 'AI validation encountered an error. Please check your input.',
} as const;

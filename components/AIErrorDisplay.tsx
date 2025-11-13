import React from 'react';

export type AIErrorType = 'overloaded' | 'rate-limit' | 'server-error' | 'network-error' | 'unknown';

interface AIError {
  type: AIErrorType;
  code?: number;
  message: string;
  originalError?: string;
}

interface AIErrorDisplayProps {
  error: AIError;
  onRetry?: () => void;
  onSwitchToFastMode?: () => void;
}

const errorConfig: Record<AIErrorType, {
  icon: string;
  title: string;
  description: string;
  why: string[];
  whatToDo: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  'overloaded': {
    icon: '⚠️',
    title: 'AI Service Temporarily Unavailable',
    description: 'The Gemini AI service is currently experiencing high demand and cannot process your request.',
    why: [
      'The AI model is overloaded with requests',
      'This is a temporary issue with Google\'s servers',
      'Your code and our application are working fine'
    ],
    whatToDo: [
      'Wait 30-60 seconds and try again',
      'Switch to "Fast Mode" for instant formatting (no AI needed)',
      'Use manual Beautify/Minify/Sort buttons'
    ],
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300'
  },
  'rate-limit': {
    icon: '⏱️',
    title: 'Too Many Requests',
    description: 'You\'ve reached the request limit for the AI service.',
    why: [
      'Too many requests sent in a short time',
      'API rate limits help ensure fair usage',
      'This protects the service for all users'
    ],
    whatToDo: [
      'Wait 1-2 minutes before trying again',
      'Switch to "Fast Mode" which has no limits',
      'Use offline formatting features'
    ],
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300'
  },
  'server-error': {
    icon: '🔧',
    title: 'AI Service Error',
    description: 'The AI service encountered an internal error.',
    why: [
      'Temporary server-side issue',
      'The AI service may be updating',
      'Your input is saved and safe'
    ],
    whatToDo: [
      'Try again in a few minutes',
      'Switch to "Fast Mode" for reliable formatting',
      'Your Fast Mode features work perfectly offline'
    ],
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300'
  },
  'network-error': {
    icon: '🌐',
    title: 'Connection Issue',
    description: 'Unable to reach the AI service.',
    why: [
      'Network connection may be unstable',
      'Firewall or proxy blocking the request',
      'Internet connectivity issue'
    ],
    whatToDo: [
      'Check your internet connection',
      'Try again after reconnecting',
      'Use "Fast Mode" which works offline'
    ],
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300'
  },
  'unknown': {
    icon: '❌',
    title: 'Unexpected Error',
    description: 'An unexpected error occurred while processing your request.',
    why: [
      'An unknown issue occurred',
      'The error details are shown below',
      'This doesn\'t affect your local features'
    ],
    whatToDo: [
      'Try again with a different input',
      'Switch to "Fast Mode" for guaranteed results',
      'Use manual formatting buttons'
    ],
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300'
  }
};

export const AIErrorDisplay: React.FC<AIErrorDisplayProps> = ({ error, onRetry, onSwitchToFastMode }) => {
  const config = errorConfig[error.type];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-6 max-w-3xl mx-auto`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-4xl">{config.icon}</span>
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${config.color} mb-1`}>{config.title}</h3>
          <p className="text-gray-700">{config.description}</p>
        </div>
      </div>

      {/* Why this happened */}
      <div className="mb-4">
        <h4 className={`font-semibold ${config.color} mb-2`}>Why this happened:</h4>
        <ul className="space-y-1">
          {config.why.map((reason, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-gray-400 mt-1">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* What you can do */}
      <div className="mb-5">
        <h4 className={`font-semibold ${config.color} mb-2`}>What you can do:</h4>
        <ul className="space-y-1">
          {config.whatToDo.map((action, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-green-500 mt-1">✓</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <span>🔄</span>
            <span>Try Again</span>
          </button>
        )}
        {onSwitchToFastMode && (
          <button
            onClick={onSwitchToFastMode}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <span>⚡</span>
            <span>Switch to Fast Mode</span>
          </button>
        )}
      </div>

      {/* Quick Tip */}
      <div className="bg-white/60 border border-blue-200 rounded-lg p-3 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div>
            <span className="font-semibold text-blue-700">Quick Tip:</span>
            <span className="text-gray-700"> Fast Mode works offline and never fails! Switch to Fast Mode for reliable, instant formatting.</span>
          </div>
        </div>
      </div>

      {/* Technical Details (collapsed by default) */}
      {error.originalError && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Technical details (for debugging)
          </summary>
          <div className="mt-2 p-3 bg-gray-100 rounded border border-gray-300 text-xs font-mono text-gray-700 overflow-auto">
            {error.originalError}
          </div>
        </details>
      )}
    </div>
  );
};

/**
 * Parse API error response and categorize it
 */
export const parseAIError = (error: any): AIError => {
  // Handle string errors
  if (typeof error === 'string') {
    try {
      error = JSON.parse(error);
    } catch {
      return {
        type: 'unknown',
        message: error,
        originalError: error
      };
    }
  }

  // Extract error details
  const errorObj = error?.error || error;
  const code = errorObj?.code || error?.status || 0;
  const message = errorObj?.message || error?.message || 'Unknown error';
  const status = errorObj?.status || error?.statusText || '';

  // Categorize by error code and message
  if (code === 503 || status === 'UNAVAILABLE' || message.toLowerCase().includes('overload')) {
    return {
      type: 'overloaded',
      code,
      message,
      originalError: JSON.stringify(error, null, 2)
    };
  }

  if (code === 429 || message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota')) {
    return {
      type: 'rate-limit',
      code,
      message,
      originalError: JSON.stringify(error, null, 2)
    };
  }

  if (code >= 500 && code < 600) {
    return {
      type: 'server-error',
      code,
      message,
      originalError: JSON.stringify(error, null, 2)
    };
  }

  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch') || message.toLowerCase().includes('connection')) {
    return {
      type: 'network-error',
      code,
      message,
      originalError: JSON.stringify(error, null, 2)
    };
  }

  return {
    type: 'unknown',
    code,
    message,
    originalError: JSON.stringify(error, null, 2)
  };
};

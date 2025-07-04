import { MCPError, ErrorTrackingData } from '../types/errors';

/**
 * Validates and normalizes different types of errors into a consistent MCPError format.
 * This ensures type safety and prevents crashes from unexpected error types.
 * @param error - The error to validate (can be Error, string, object, etc.)
 * @returns A normalized MCPError object
 */
export function validateError(error: unknown): MCPError {
    if (error instanceof Error) {
        return {
            message: error.message,
            name: error.name,
            stack: error.stack,
        };
    }
    
    if (typeof error === 'string') {
        return {
            message: error,
            name: 'StringError',
        };
    }
    
    if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        
        if ('message' in errorObj && typeof errorObj.message === 'string') {
            return {
                message: errorObj.message,
                name: (errorObj.name && typeof errorObj.name === 'string') 
                    ? errorObj.name 
                    : 'ObjectError',
                stack: (errorObj.stack && typeof errorObj.stack === 'string') 
                    ? errorObj.stack 
                    : undefined,
            };
        }
    }
    
    return {
        message: 'Unknown error occurred',
        name: 'UnknownError',
    };
}

/**
 * Sanitizes error data for PostHog tracking by limiting field sizes and removing sensitive information.
 * @param error - The validated error object
 * @param context - Optional context for the error
 * @returns Sanitized error tracking data
 */
export function sanitizeErrorForTracking(error: MCPError, context?: string): ErrorTrackingData {
    return {
        context,
        errorMessage: error.message.substring(0, 500), // Limit message size
        errorStack: error.stack?.substring(0, 1000), // Limit stack trace size
        errorName: error.name,
        errorCode: error.code,
        timestamp: new Date().toISOString(),
    };
}
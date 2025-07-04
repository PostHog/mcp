import { MCPError, ErrorTrackingData } from '../types/errors';
import { validateError, sanitizeErrorForTracking } from './errorValidation';

/**
 * Handles tool errors, logs them, and optionally tracks them in PostHog.
 * @param error - The error object (can be any type)
 * @param context - Optional context to add to the error message
 * @param trackErrorFn - Optional function to track the error (e.g., with PostHog)
 * @returns A structured error message for the MCP client
 */
export function handleToolError(
    error: unknown,
    context?: string,
    trackErrorFn?: (event: string, properties: ErrorTrackingData) => Promise<void>
) {
    // Validate and normalize the error
    const validatedError = validateError(error);
    
    // Log the error with context
    if (context) {
        console.error(`[MCP Error][${context}]`, validatedError);
    } else {
        console.error('[MCP Error]', validatedError);
    }

    // Track the error in PostHog if tracking function is provided
    if (trackErrorFn) {
        const trackingData = sanitizeErrorForTracking(validatedError, context);
        
        trackErrorFn("mcp tool error", trackingData).catch(trackError => {
            // Don't let tracking errors break the main error handling
            console.error("Failed to track error in PostHog:", trackError);
        });
    }

    return {
        content: [
            {
                type: "text",
                text: `Error: ${validatedError.message}${context ? ` (Context: ${context})` : ""}`,
            },
        ],
    };
}

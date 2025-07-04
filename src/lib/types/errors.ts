// src/lib/types/errors.ts
export interface MCPError {
    message: string;
    name?: string;
    stack?: string;
    code?: string;
    cause?: unknown;
}

// Interface for custom error objects
export interface CustomErrorObject {
    message: string;
    name?: string;
    stack?: string;
    code?: string;
}

export interface ErrorTrackingData {
    context?: string;
    errorMessage: string;
    errorStack?: string;
    errorName?: string;
    errorCode?: string;
    timestamp: string;
    projectId?: string;
    orgId?: string;
    userHash?: string;
}
export interface MCPToolResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
}

export interface MCPToolHandler {
    (params: any): Promise<MCPToolResponse>;
}

import toolDefinitionsJson from "../../../schema/tool-definitions.json";

export interface ToolDefinition {
	description: string;
}

export type ToolDefinitions = Record<string, ToolDefinition>;

const toolDefinitions: ToolDefinitions = toolDefinitionsJson;

export default toolDefinitions;

export function getToolDefinition(toolName: string): ToolDefinition {
	const definition = toolDefinitions[toolName];
	if (!definition) {
		throw new Error(`Tool definition not found for: ${toolName}`);
	}
	return definition;
}

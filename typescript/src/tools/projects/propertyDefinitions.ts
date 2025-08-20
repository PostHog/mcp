import { ProjectPropertyDefinitionsSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ProjectPropertyDefinitionsSchema;

type Params = z.infer<typeof schema>;

export const propertyDefinitionsHandler = async (context: Context, _params: Params) => {
	const projectId = await context.getProjectId();

	const propDefsResult = await context.api.projects().propertyDefinitions({ projectId });

	if (!propDefsResult.success) {
		throw new Error(`Failed to get property definitions: ${propDefsResult.error.message}`);
	}
	return {
		content: [{ type: "text", text: JSON.stringify(propDefsResult.data) }],
	};
};

const definition = getToolDefinition("property-definitions");

const tool = (): Tool<typeof schema> => ({
	name: "property-definitions",
	description: definition.description,
	schema,
	handler: propertyDefinitionsHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

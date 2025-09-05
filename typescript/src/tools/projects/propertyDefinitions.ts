import { PropertyDefinitionSchema } from "@/schema/properties";
import { ProjectPropertyDefinitionsSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ProjectPropertyDefinitionsSchema;

type Params = z.infer<typeof schema>;

export const propertyDefinitionsHandler = async (context: Context, params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const propDefsResult = await context.api.projects().propertyDefinitions({
		projectId,
		eventNames: [params.eventName],
		excludeCoreProperties: true,
		filterByEventNames: true,
		isFeatureFlag: false,
		limit: 100,
	});

	if (!propDefsResult.success) {
		throw new Error(
			`Failed to get property definitions for event ${params.eventName}: ${propDefsResult.error.message}`,
		);
	}

	const simplifiedProperties = PropertyDefinitionSchema.array().parse(propDefsResult.data);

	return {
		content: [{ type: "text", text: JSON.stringify(simplifiedProperties) }],
	};
};

const definition = getToolDefinition("event-properties-get");

const tool = (): Tool<typeof schema> => ({
	name: "event-properties-get",
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

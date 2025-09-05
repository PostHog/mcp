import { EventDefinitionSchema } from "@/schema/properties";
import { ProjectEventDefinitionsSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ProjectEventDefinitionsSchema;

type Params = z.infer<typeof schema>;

export const eventDefinitionsHandler = async (context: Context, _params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const eventDefsResult = await context.api.projects().eventDefinitions({ projectId });

	if (!eventDefsResult.success) {
		throw new Error(`Failed to get event definitions: ${eventDefsResult.error.message}`);
	}

	const simplifiedEvents = eventDefsResult.data.map((def) => EventDefinitionSchema.parse(def));

	return {
		content: [{ type: "text", text: JSON.stringify(simplifiedEvents) }],
	};
};

const definition = getToolDefinition("event-definitions-list");

const tool = (): Tool<typeof schema> => ({
	name: "event-definitions-list",
	title: definition.title,
	description: definition.description,
	schema,
	handler: eventDefinitionsHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

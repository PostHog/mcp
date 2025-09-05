import { ExperimentGetSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ExperimentGetSchema;

type Params = z.infer<typeof schema>;

export const getHandler = async (context: Context, params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const result = await context.api.experiments({ projectId }).get({
		experimentId: params.experimentId,
	});

	if (!result.success) {
		throw new Error(`Failed to get experiment: ${result.error.message}`);
	}

	return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
};

const definition = getToolDefinition("experiment-get");

const tool = (): Tool<typeof schema> => ({
	name: "experiment-get",
	title: definition.title,
	description: definition.description,
	schema,
	handler: getHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

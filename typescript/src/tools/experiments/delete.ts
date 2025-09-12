import { ExperimentDeleteSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ExperimentDeleteSchema;

type Params = z.infer<typeof schema>;

export const deleteHandler = async (context: Context, params: Params) => {
	const { experimentId } = params;
	const projectId = await context.stateManager.getProjectId();

	const deleteResult = await context.api.experiments({ projectId }).delete({
		experimentId,
	});
	if (!deleteResult.success) {
		throw new Error(`Failed to delete experiment: ${deleteResult.error.message}`);
	}

	return {
		content: [{ type: "text", text: JSON.stringify(deleteResult.data) }],
	};
};

const definition = getToolDefinition("experiment-delete");

const tool = (): Tool<typeof schema> => ({
	name: "experiment-delete",
	title: definition.title,
	description: definition.description,
	schema,
	handler: deleteHandler,
	annotations: {
		destructiveHint: true,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: false,
	},
});

export default tool;

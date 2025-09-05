import { ExperimentGetAllSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ExperimentGetAllSchema;

type Params = z.infer<typeof schema>;

export const getAllHandler = async (context: Context, _params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const results = await context.api.experiments({ projectId }).list();
	if (!results.success) {
		throw new Error(`Failed to get experiments: ${results.error.message}`);
	}
	return { content: [{ type: "text", text: JSON.stringify(results.data) }] };
};

const definition = getToolDefinition("experiment-get-all");

const tool = (): Tool<typeof schema> => ({
	name: "experiment-get-all",
	title: definition.title,
	description: definition.description,
	schema,
	handler: getAllHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

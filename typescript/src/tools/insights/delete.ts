import { InsightDeleteSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import { resolveInsightId } from "./utils";
import type { z } from "zod";

const schema = InsightDeleteSchema;

type Params = z.infer<typeof schema>;

export const deleteHandler = async (context: Context, params: Params) => {
	const { insightId } = params;
	const projectId = await context.stateManager.getProjectId();

	const numericId = await resolveInsightId(context, insightId, projectId);
	const result = await context.api.insights({ projectId }).delete({ insightId: numericId });

	if (!result.success) {
		throw new Error(`Failed to delete insight: ${result.error.message}`);
	}

	return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
};

const definition = getToolDefinition("insight-delete");

const tool = (): Tool<typeof schema> => ({
	name: "insight-delete",
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

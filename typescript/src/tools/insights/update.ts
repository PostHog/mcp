import { InsightUpdateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import { resolveInsightId } from "./utils";
import type { z } from "zod";

const schema = InsightUpdateSchema;

type Params = z.infer<typeof schema>;

export const updateHandler = async (context: Context, params: Params) => {
	const { insightId, data } = params;
	const projectId = await context.stateManager.getProjectId();

	const numericId = await resolveInsightId(context, insightId, projectId);
	const insightResult = await context.api.insights({ projectId }).update({
		insightId: numericId,
		data,
	});

	if (!insightResult.success) {
		throw new Error(`Failed to update insight: ${insightResult.error.message}`);
	}

	const insightWithUrl = {
		...insightResult.data,
		url: `${context.api.getProjectBaseUrl(projectId)}/insights/${insightResult.data.short_id}`,
	};

	return { content: [{ type: "text", text: JSON.stringify(insightWithUrl) }] };
};

const definition = getToolDefinition("insight-update");

const tool = (): Tool<typeof schema> => ({
	name: "insight-update",
	title: definition.title,
	description: definition.description,
	schema,
	handler: updateHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: false,
	},
});

export default tool;

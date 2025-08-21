import { InsightGetAllSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = InsightGetAllSchema;

type Params = z.infer<typeof schema>;

export const getAllHandler = async (context: Context, params: Params) => {
	const { data } = params;
	const projectId = await context.stateManager.getProjectId();
	const insightsResult = await context.api.insights({ projectId }).list({ params: { ...data } });

	if (!insightsResult.success) {
		throw new Error(`Failed to get insights: ${insightsResult.error.message}`);
	}

	const insightsWithUrls = insightsResult.data.map((insight) => ({
		...insight,
		url: `${context.api.getProjectBaseUrl(projectId)}/insights/${insight.short_id}`,
	}));

	return { content: [{ type: "text", text: JSON.stringify(insightsWithUrls) }] };
};

const definition = getToolDefinition("insights-get-all");

const tool = (): Tool<typeof schema> => ({
	name: "insights-get-all",
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

import { InsightQuerySchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = InsightQuerySchema;

type Params = z.infer<typeof schema>;

export const queryHandler = async (context: Context, params: Params) => {
	const { insightId } = params;
	const projectId = await context.stateManager.getProjectId();

	const insightResult = await context.api.insights({ projectId }).get({ insightId });

	if (!insightResult.success) {
		throw new Error(`Failed to get insight: ${insightResult.error.message}`);
	}

	// Query the insight with parameters to get actual results
	const queryResult = await context.api.insights({ projectId }).query({
		query: insightResult.data.query,
	});

	if (!queryResult.success) {
		throw new Error(`Failed to query insight: ${queryResult.error.message}`);
	}

	const responseData = {
		insight: {
			url: `${context.api.getProjectBaseUrl(projectId)}/insights/${insightResult.data.short_id}`,
			...insightResult.data,
		},
		results: queryResult.data.results,
	};

	return { content: [{ type: "text", text: JSON.stringify(responseData) }] };
};

const definition = getToolDefinition("insight-query");

const tool = (): Tool<typeof schema> => ({
	name: "insight-query",
	title: definition.title,
	description: definition.description,
	schema,
	handler: queryHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

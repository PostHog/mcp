import { z } from "zod";
import type { Context, Tool } from "../types";
import { ListInsightsSchema } from "../../schema/insights";
import { getProjectBaseUrl } from "../../lib/utils/api";

const schema = z.object({
	data: ListInsightsSchema.optional(),
});

type Params = z.infer<typeof schema>;

export const getAllHandler = async (context: Context, params: Params) => {
	const { data } = params;
	const projectId = await context.getProjectId();
	const insightsResult = await context.api.insights({ projectId }).list({ params: data });

	if (!insightsResult.success) {
		throw new Error(`Failed to get insights: ${insightsResult.error.message}`);
	}

	const insightsWithUrls = insightsResult.data.map((insight) => ({
		...insight,
		url: `${getProjectBaseUrl(projectId)}/insights/${insight.short_id}`,
	}));

	return { content: [{ type: "text", text: JSON.stringify(insightsWithUrls) }] };
};

const tool = (): Tool<typeof schema> => ({
	name: "insights-get-all",
	description: `
        - Get all insights in the project with optional filtering.
        - Can filter by saved status, favorited status, or search term.
    `,
	schema,
	handler: getAllHandler,
});

export default tool;

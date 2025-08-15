import { DashboardAddInsightSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = DashboardAddInsightSchema;

type Params = z.infer<typeof schema>;

export const addInsightHandler = async (context: Context, params: Params) => {
	const { data } = params;
	const projectId = await context.getProjectId();

	const insightResult = await context.api
		.insights({ projectId })
		.get({ insightId: data.insightId });

	if (!insightResult.success) {
		throw new Error(`Failed to get insight: ${insightResult.error.message}`);
	}

	const result = await context.api.dashboards({ projectId }).addInsight({ data });

	if (!result.success) {
		throw new Error(`Failed to add insight to dashboard: ${result.error.message}`);
	}

	const resultWithUrls = {
		...result.data,
		dashboard_url: `${context.api.getProjectBaseUrl(projectId)}/dashboard/${data.dashboardId}`,
		insight_url: `${context.api.getProjectBaseUrl(projectId)}/insights/${insightResult.data.short_id}`,
	};

	return { content: [{ type: "text", text: JSON.stringify(resultWithUrls) }] };
};

const definition = getToolDefinition("add-insight-to-dashboard");

const tool = (): Tool<typeof schema> => ({
	name: "add-insight-to-dashboard",
	description: definition.description,
	schema,
	handler: addInsightHandler,
});

export default tool;

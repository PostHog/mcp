import type { z } from "zod";
import type { Context, Tool } from "@/tools/types";
import { getProjectBaseUrl } from "@/lib/utils/api";
import { DashboardAddInsightSchema } from "@/schema/tool-inputs";

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
		dashboard_url: `${getProjectBaseUrl(projectId)}/dashboard/${data.dashboardId}`,
		insight_url: `${getProjectBaseUrl(projectId)}/insights/${insightResult.data.short_id}`,
	};

	return { content: [{ type: "text", text: JSON.stringify(resultWithUrls) }] };
};

const tool = (): Tool<typeof schema> => ({
	name: "add-insight-to-dashboard",
	description: `
        - Add an existing insight to a dashboard.
        - Requires insight ID and dashboard ID.
        - Optionally supports layout and color customization.
    `,
	schema,
	handler: addInsightHandler,
});

export default tool;

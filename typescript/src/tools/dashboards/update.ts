import { DashboardUpdateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = DashboardUpdateSchema;

type Params = z.infer<typeof schema>;

export const updateHandler = async (context: Context, params: Params) => {
	const { dashboardId, data } = params;
	const projectId = await context.stateManager.getProjectId();
	const dashboardResult = await context.api
		.dashboards({ projectId })
		.update({ dashboardId, data });

	if (!dashboardResult.success) {
		throw new Error(`Failed to update dashboard: ${dashboardResult.error.message}`);
	}

	const dashboardWithUrl = {
		...dashboardResult.data,
		url: `${context.api.getProjectBaseUrl(projectId)}/dashboard/${dashboardResult.data.id}`,
	};

	return { content: [{ type: "text", text: JSON.stringify(dashboardWithUrl) }] };
};

const tool = (): Tool<typeof schema> => ({
	name: "dashboard-update",
	title: getToolDefinition("dashboard-update").title,
	description: getToolDefinition("dashboard-update").description,
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

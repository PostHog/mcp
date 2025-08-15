import { DashboardGetSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = DashboardGetSchema;

type Params = z.infer<typeof schema>;

export const getHandler = async (context: Context, params: Params) => {
	const { dashboardId } = params;
	const projectId = await context.getProjectId();
	const dashboardResult = await context.api.dashboards({ projectId }).get({ dashboardId });

	if (!dashboardResult.success) {
		throw new Error(`Failed to get dashboard: ${dashboardResult.error.message}`);
	}

	return { content: [{ type: "text", text: JSON.stringify(dashboardResult.data) }] };
};

const definition = getToolDefinition("dashboard-get");

const tool = (): Tool<typeof schema> => ({
	name: "dashboard-get",
	description: definition.description,
	schema,
	handler: getHandler,
});

export default tool;

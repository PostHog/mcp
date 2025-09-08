import { DashboardCreateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = DashboardCreateSchema;

type Params = z.infer<typeof schema>;

export const createHandler = async (context: Context, params: Params) => {
	const { data } = params;
	const projectId = await context.stateManager.getProjectId();
	const dashboardResult = await context.api.dashboards({ projectId }).create({ data });

	if (!dashboardResult.success) {
		throw new Error(`Failed to create dashboard: ${dashboardResult.error.message}`);
	}

	const dashboardWithUrl = {
		...dashboardResult.data,
		url: `${context.api.getProjectBaseUrl(projectId)}/dashboard/${dashboardResult.data.id}`,
	};

	return { content: [{ type: "text", text: JSON.stringify(dashboardWithUrl) }] };
};

const definition = getToolDefinition("dashboard-create");

const tool = (): Tool<typeof schema> => ({
	name: "dashboard-create",
	title: definition.title,
	description: definition.description,
	schema,
	handler: createHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: false,
		openWorldHint: true,
		readOnlyHint: false,
	},
});

export default tool;

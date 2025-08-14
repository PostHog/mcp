import { DashboardGetAllSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = DashboardGetAllSchema;

type Params = z.infer<typeof schema>;

export const getAllHandler = async (context: Context, params: Params) => {
	const { data } = params;
	const projectId = await context.getProjectId();
	const dashboardsResult = await context.api
		.dashboards({ projectId })
		.list({ params: data ?? {} });

	if (!dashboardsResult.success) {
		throw new Error(`Failed to get dashboards: ${dashboardsResult.error.message}`);
	}

	return { content: [{ type: "text", text: JSON.stringify(dashboardsResult.data) }] };
};

const tool = (): Tool<typeof schema> => ({
	name: "dashboards-get-all",
	description: getToolDefinition("dashboards-get-all").description,
	schema,
	handler: getAllHandler,
});

export default tool;

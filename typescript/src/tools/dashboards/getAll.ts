import type { z } from "zod";
import type { Context, Tool } from "@/tools/types";
import { DashboardGetAllSchema } from "@/schema/tool-inputs";

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
	description: `
        - Get all dashboards in the project with optional filtering.
        - Can filter by pinned status, search term, or pagination.
    `,
	schema,
	handler: getAllHandler,
});

export default tool;

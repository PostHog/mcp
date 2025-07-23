import type { z } from "zod";
import type { Context, Tool } from "@/tools/types";
import { DashboardGetSchema } from "@/schema/tool-inputs";

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

const tool = (): Tool<typeof schema> => ({
	name: "dashboard-get",
	description: `
        - Get a specific dashboard by ID.
    `,
	schema,
	handler: getHandler,
});

export default tool;

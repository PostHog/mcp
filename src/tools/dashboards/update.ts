import { z } from "zod";
import type { Context, Tool } from "../types";
import { UpdateDashboardInputSchema } from "../../schema/dashboards";
import { getProjectBaseUrl } from "../../lib/utils/api";

const schema = z.object({
	dashboardId: z.number(),
	data: UpdateDashboardInputSchema,
});

type Params = z.infer<typeof schema>;

export const updateHandler = async (context: Context, params: Params) => {
	const { dashboardId, data } = params;
	const projectId = await context.getProjectId();
	const dashboardResult = await context.api
		.dashboards({ projectId })
		.update({ dashboardId, data });

	if (!dashboardResult.success) {
		throw new Error(`Failed to update dashboard: ${dashboardResult.error.message}`);
	}

	const dashboardWithUrl = {
		...dashboardResult.data,
		url: `${getProjectBaseUrl(projectId)}/dashboard/${dashboardResult.data.id}`,
	};

	return { content: [{ type: "text", text: JSON.stringify(dashboardWithUrl) }] };
};

const tool = (): Tool<typeof schema> => ({
	name: "dashboard-update",
	description: `
        - Update an existing dashboard by ID.
        - Can update name, description, pinned status or tags.
    `,
	schema,
	handler: updateHandler,
});

export default tool;

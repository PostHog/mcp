import type { z } from "zod";
import type { Context, Tool } from "../types";
import { DashboardDeleteSchema } from "../../schema/tool-inputs";

const schema = DashboardDeleteSchema;

type Params = z.infer<typeof schema>;

export const deleteHandler = async (context: Context, params: Params) => {
	const { dashboardId } = params;
	const projectId = await context.getProjectId();
	const result = await context.api.dashboards({ projectId }).delete({ dashboardId });

	if (!result.success) {
		throw new Error(`Failed to delete dashboard: ${result.error.message}`);
	}

	return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
};

const tool = (): Tool<typeof schema> => ({
	name: "dashboard-delete",
	description: `
        - Delete a dashboard by ID (soft delete - marks as deleted).
    `,
	schema,
	handler: deleteHandler,
});

export default tool;

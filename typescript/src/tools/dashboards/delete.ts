import { DashboardDeleteSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

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

const definition = getToolDefinition("dashboard-delete");

const tool = (): Tool<typeof schema> => ({
	name: "dashboard-delete",
	description: definition.description,
	schema,
	handler: deleteHandler,
});

export default tool;

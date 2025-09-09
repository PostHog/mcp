import { ProjectGetAllSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ProjectGetAllSchema;

type Params = z.infer<typeof schema>;

export const getProjectsHandler = async (context: Context, _params: Params) => {
	const orgId = await context.stateManager.getOrgID();

	if (!orgId) {
		throw new Error("API key does not have access to any organizations.");
	}

	const projectsResult = await context.api.organizations().projects({ orgId }).list();

	if (!projectsResult.success) {
		throw new Error(`Failed to get projects: ${projectsResult.error.message}`);
	}

	return {
		content: [{ type: "text", text: JSON.stringify(projectsResult.data) }],
	};
};

const definition = getToolDefinition("projects-get");

const tool = (): Tool<typeof schema> => ({
	name: "projects-get",
	title: definition.title,
	description: definition.description,
	schema,
	handler: getProjectsHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

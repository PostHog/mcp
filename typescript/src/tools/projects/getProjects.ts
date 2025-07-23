import type { z } from "zod";
import type { Context, Tool } from "@/tools/types";
import { ProjectGetAllSchema } from "@/schema/tool-inputs";

const schema = ProjectGetAllSchema;

type Params = z.infer<typeof schema>;

export const getProjectsHandler = async (context: Context, _params: Params) => {
	const orgId = await context.getOrgID();
	const projectsResult = await context.api.organizations().projects({ orgId }).list();

	if (!projectsResult.success) {
		throw new Error(`Failed to get projects: ${projectsResult.error.message}`);
	}

	return {
		content: [{ type: "text", text: JSON.stringify(projectsResult.data) }],
	};
};

const tool = (): Tool<typeof schema> => ({
	name: "projects-get",
	description: `
        - Fetches projects that the user has access to - the orgId is optional. 
        - Use this tool before you use any other tools (besides organization-* and docs-search) to allow user to select the project they want to use for subsequent requests.
    `,
	schema,
	handler: getProjectsHandler,
});

export default tool;

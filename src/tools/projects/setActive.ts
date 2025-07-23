import type { z } from "zod";
import type { Context, Tool } from "../types";
import { ProjectSetActiveSchema } from "../../schema/tool-inputs";

const schema = ProjectSetActiveSchema;

type Params = z.infer<typeof schema>;

export const setActiveHandler = async (context: Context, params: Params) => {
	const { projectId } = params;

	await context.cache.set("projectId", projectId.toString());

	return {
		content: [{ type: "text", text: `Switched to project ${projectId}` }],
	};
};

const tool = (): Tool<typeof schema> => ({
	name: "project-set-active",
	description: `
        - Use this tool to set the active project.
    `,
	schema,
	handler: setActiveHandler,
});

export default tool;

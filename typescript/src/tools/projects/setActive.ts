import { ProjectSetActiveSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ProjectSetActiveSchema;

type Params = z.infer<typeof schema>;

export const setActiveHandler = async (context: Context, params: Params) => {
	const { projectId } = params;

	await context.cache.set("projectId", projectId.toString());

	return {
		content: [{ type: "text", text: `Switched to project ${projectId}` }],
	};
};

const definition = getToolDefinition("project-set-active");

const tool = (): Tool<typeof schema> => ({
	name: "project-set-active",
	description: definition.description,
	schema,
	handler: setActiveHandler,
});

export default tool;

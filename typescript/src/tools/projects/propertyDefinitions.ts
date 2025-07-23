import type { z } from "zod";
import type { Context, Tool } from "@/tools/types";
import { ProjectPropertyDefinitionsSchema } from "@/schema/tool-inputs";

const schema = ProjectPropertyDefinitionsSchema;

type Params = z.infer<typeof schema>;

export const propertyDefinitionsHandler = async (context: Context, _params: Params) => {
	const projectId = await context.getProjectId();

	const propDefsResult = await context.api.projects().propertyDefinitions({ projectId });

	if (!propDefsResult.success) {
		throw new Error(`Failed to get property definitions: ${propDefsResult.error.message}`);
	}
	return {
		content: [{ type: "text", text: JSON.stringify(propDefsResult.data) }],
	};
};

const tool = (): Tool<typeof schema> => ({
	name: "property-definitions",
	description: `
        - Use this tool to get the property definitions of the active project.
    `,
	schema,
	handler: propertyDefinitionsHandler,
});

export default tool;

import { OrganizationSetActiveSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = OrganizationSetActiveSchema;

type Params = z.infer<typeof schema>;

export const setActiveHandler = async (context: Context, params: Params) => {
	const { orgId } = params;
	await context.cache.set("orgId", orgId);

	return {
		content: [{ type: "text", text: `Switched to organization ${orgId}` }],
	};
};

const definition = getToolDefinition("switch-organization");

const tool = (): Tool<typeof schema> => ({
	name: "switch-organization",
	description: definition.description,
	schema,
	handler: setActiveHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true, // This sets the active organization, but does not change anything with the API.
	},
});

export default tool;

import type { z } from "zod";
import type { Context, Tool } from "../types";
import { OrganizationSetActiveSchema } from "../../schema/tool-inputs";

const schema = OrganizationSetActiveSchema;

type Params = z.infer<typeof schema>;

export const setActiveHandler = async (context: Context, params: Params) => {
	const { orgId } = params;
	await context.cache.set("orgId", orgId);

	return {
		content: [{ type: "text", text: `Switched to organization ${orgId}` }],
	};
};

const tool = (): Tool<typeof schema> => ({
	name: "organization-set-active",
	description: `
        - Use this tool to set the active organization.
    `,
	schema,
	handler: setActiveHandler,
});

export default tool;

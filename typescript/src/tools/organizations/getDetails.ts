import { OrganizationGetDetailsSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = OrganizationGetDetailsSchema;

type Params = z.infer<typeof schema>;

export const getDetailsHandler = async (context: Context, _params: Params) => {
	const orgId = await context.getOrgID();

	const orgResult = await context.api.organizations().get({ orgId });

	if (!orgResult.success) {
		throw new Error(`Failed to get organization details: ${orgResult.error.message}`);
	}

	return {
		content: [{ type: "text", text: JSON.stringify(orgResult.data) }],
	};
};

const definition = getToolDefinition("organization-details-get");

const tool = (): Tool<typeof schema> => ({
	name: "organization-details-get",
	description: definition.description,
	schema,
	handler: getDetailsHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

import type { z } from "zod";
import type { Context, Tool } from "@/tools/types";
import { OrganizationGetDetailsSchema } from "@/schema/tool-inputs";

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

const tool = (): Tool<typeof schema> => ({
	name: "organization-details-get",
	description: `
        - Use this tool to get the details of the active organization.
    `,
	schema,
	handler: getDetailsHandler,
});

export default tool;

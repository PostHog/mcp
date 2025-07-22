import { z } from "zod";
import type { Context, Tool } from "../types";

const schema = z.object({});

type Params = z.infer<typeof schema>;

export const getOrganizationsHandler = async (context: Context, _params: Params) => {
    const orgsResult = await context.api.organizations().list();
    if (!orgsResult.success) {
        throw new Error(`Failed to get organizations: ${orgsResult.error.message}`);
    }
    
    return {
        content: [{ type: "text", text: JSON.stringify(orgsResult.data) }],
    };
};

const tool = (): Tool<typeof schema> => ({
    name: "organizations-get",
    description: `
        - Use this tool to get the organizations the user has access to.
    `,
    schema,
    handler: getOrganizationsHandler,
});

export default tool;
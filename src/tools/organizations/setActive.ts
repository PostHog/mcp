import { z } from "zod";
import type { Context, Tool } from "../types";

const schema = z.object({
    orgId: z.string(),
});

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
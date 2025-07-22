import { z } from "zod";
import type { Context, Tool } from "../types";

const schema = z.object({});

type Params = z.infer<typeof schema>;

export const getAllHandler = async (context: Context, _params: Params) => {
    const projectId = await context.getProjectId();

    const flagsResult = await context.api.featureFlags({ projectId }).list();
    if (!flagsResult.success) {
        throw new Error(`Failed to get feature flags: ${flagsResult.error.message}`);
    }

    return { content: [{ type: "text", text: JSON.stringify(flagsResult.data) }] };
};

const tool = (): Tool<typeof schema> => ({
    name: "feature-flag-get-all",
    description: `
        - Use this tool to get all feature flags in the project.
    `,
    schema,
    handler: getAllHandler,
});

export default tool;
import { z } from "zod";
import type { Context, Tool } from "../types";

const schema = z.object({
    insightId: z.number(),
});

type Params = z.infer<typeof schema>;

export const deleteHandler = async (context: Context, params: Params) => {
    const { insightId } = params;
    const projectId = await context.getProjectId();
    const result = await context.api.insights({ projectId }).delete({ insightId });

    if (!result.success) {
        throw new Error(`Failed to delete insight: ${result.error.message}`);
    }

    return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
};

const tool = (): Tool<typeof schema> => ({
    name: "insight-delete",
    description: `
        - Delete an insight by ID (soft delete - marks as deleted).
    `,
    schema,
    handler: deleteHandler,
});

export default tool;
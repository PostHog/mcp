import { z } from "zod";
import type { Context, Tool } from "../types";
import { getProjectBaseUrl } from "../../lib/utils/api";

const schema = z.object({
	insightId: z.number(),
});

type Params = z.infer<typeof schema>;

export const getHandler = async (context: Context, params: Params) => {
	const { insightId } = params;
	const projectId = await context.getProjectId();
	const insightResult = await context.api.insights({ projectId }).get({ insightId });
	if (!insightResult.success) {
		throw new Error(`Failed to get insight: ${insightResult.error.message}`);
	}

	const insightWithUrl = {
		...insightResult.data,
		url: `${getProjectBaseUrl(projectId)}/insights/${insightResult.data.short_id}`,
	};

	return { content: [{ type: "text", text: JSON.stringify(insightWithUrl) }] };
};

const tool = (): Tool<typeof schema> => ({
	name: "insight-get",
	description: `
        - Get a specific insight by ID.
    `,
	schema,
	handler: getHandler,
});

export default tool;

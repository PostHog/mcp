import { z } from "zod";
import type { Context, Tool } from "../types";
import { UpdateInsightInputSchema } from "../../schema/insights";
import { getProjectBaseUrl } from "../../lib/utils/api";

const schema = z.object({
	insightId: z.number(),
	data: UpdateInsightInputSchema,
});

type Params = z.infer<typeof schema>;

export const updateHandler = async (context: Context, params: Params) => {
	const { insightId, data } = params;
	const projectId = await context.getProjectId();
	const insightResult = await context.api.insights({ projectId }).update({
		insightId,
		data,
	});

	if (!insightResult.success) {
		throw new Error(`Failed to update insight: ${insightResult.error.message}`);
	}

	const insightWithUrl = {
		...insightResult.data,
		url: `${getProjectBaseUrl(projectId)}/insights/${insightResult.data.short_id}`,
	};

	return { content: [{ type: "text", text: JSON.stringify(insightWithUrl) }] };
};

const tool = (): Tool<typeof schema> => ({
	name: "insight-update",
	description: `
        - Update an existing insight by ID.
        - Can update name, description, filters, and other properties.
    `,
	schema,
	handler: updateHandler,
});

export default tool;

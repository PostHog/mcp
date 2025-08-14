import { getProjectBaseUrl } from "@/lib/utils/api";
import { InsightUpdateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = InsightUpdateSchema;

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

const definition = getToolDefinition("insight-update");

const tool = (): Tool<typeof schema> => ({
	name: "insight-update",
	description: definition.description,
	schema,
	handler: updateHandler,
});

export default tool;

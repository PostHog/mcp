import { InsightGetSqlSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = InsightGetSqlSchema;

type Params = z.infer<typeof schema>;

export const getSqlInsightHandler = async (context: Context, params: Params) => {
	const { query } = params;
	const projectId = await context.getProjectId();

	const result = await context.api.insights({ projectId }).sqlInsight({ query });

	if (!result.success) {
		throw new Error(`Failed to execute SQL insight: ${result.error.message}`);
	}

	if (result.data.length === 0) {
		return {
			content: [
				{
					type: "text",
					text: "Received an empty SQL insight or no data in the stream.",
				},
			],
		};
	}
	return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
};

const definition = getToolDefinition("get-sql-insight");

const tool = (): Tool<typeof schema> => ({
	name: "get-sql-insight",
	description: definition.description,
	schema,
	handler: getSqlInsightHandler,
});

export default tool;

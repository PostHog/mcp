import type { z } from "zod";
import type { Context, Tool } from "@/tools/types";
import { InsightGetSqlSchema } from "@/schema/tool-inputs";

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

const tool = (): Tool<typeof schema> => ({
	name: "get-sql-insight",
	description: `
        - Queries project's PostHog data warehouse based on a provided natural language question - don't provide SQL query as input but describe the output you want.
        - Data warehouse schema includes data like events and persons.
        - Use this tool to get a quick answer to a question about the data in the project, which can't be answered using other, more dedicated tools.
        - Fetches the result as a Server-Sent Events (SSE) stream and provides the concatenated data content.
        - When giving the results back to the user, first show the SQL query that was used, then briefly explain the query, then provide results in reasily readable format.
        - You should also offer to save the query as an insight if the user wants to.
    `,
	schema,
	handler: getSqlInsightHandler,
});

export default tool;

import { QueryRunInputSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = QueryRunInputSchema;

type Params = z.infer<typeof schema>;

export const queryRunHandler = async (context: Context, params: Params) => {
	const { query } = params;

	console.log("Running query:", query);

	const projectId = await context.stateManager.getProjectId();

	const queryResult = await context.api.insights({ projectId }).query({
		query: query,
	});

	console.log("Query result:", queryResult);

	if (!queryResult.success) {
		throw new Error(`Failed to query insight: ${queryResult.error.message}`);
	}

	return { content: [{ type: "text", text: JSON.stringify(queryResult.data.results) }] };
};

const definition = getToolDefinition("query-run");

const tool = (): Tool<typeof schema> => ({
	name: "query-run",
	title: definition.title,
	description: definition.description,
	schema,
	handler: queryRunHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

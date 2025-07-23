import type { z } from "zod";
import type { Context, Tool } from "../types";
import { docsSearch } from "../../inkeepApi";
import { DocumentationSearchSchema } from "../../schema/tool-inputs";

const schema = DocumentationSearchSchema;

type Params = z.infer<typeof schema>;

export const searchDocsHandler = async (context: Context, params: Params) => {
	const { query } = params;
	const inkeepApiKey = context.env.INKEEP_API_KEY;

	if (!inkeepApiKey) {
		return {
			content: [
				{
					type: "text",
					text: "Error: INKEEP_API_KEY is not configured.",
				},
			],
		};
	}
	const resultText = await docsSearch(inkeepApiKey, query);
	return { content: [{ type: "text", text: resultText }] };
};

const tool = (): Tool<typeof schema> => ({
	name: "docs-search",
	description: `
        - Use this tool to search the PostHog documentation for information that can help the user with their request. 
        - Use it as a fallback when you cannot answer the user's request using other tools in this MCP.
    `,
	schema,
	handler: searchDocsHandler,
});

export default tool;

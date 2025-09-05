import { InsightGenerateHogQLFromQuestionSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = InsightGenerateHogQLFromQuestionSchema;

type Params = z.infer<typeof schema>;

export const generateHogQLHandler = async (context: Context, params: Params) => {
	const { question } = params;
	const projectId = await context.stateManager.getProjectId();

	const result = await context.api.insights({ projectId }).sqlInsight({ query: question });

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

const definition = getToolDefinition("insights-generate-hogql-from-question");

const tool = (): Tool<typeof schema> => ({
	name: "insights-generate-hogql-from-question",
	title: definition.title,
	description: definition.description,
	schema,
	handler: generateHogQLHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: false,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

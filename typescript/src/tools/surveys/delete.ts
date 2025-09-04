import { SurveyDeleteSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = SurveyDeleteSchema;
type Params = z.infer<typeof schema>;

export const deleteHandler = async (context: Context, params: Params) => {
	const { surveyId } = params;
	const projectId = await context.stateManager.getProjectId();

	const deleteResult = await context.api.surveys({ projectId }).delete({
		surveyId,
	});

	if (!deleteResult.success) {
		throw new Error(`Failed to delete survey: ${deleteResult.error.message}`);
	}

	return {
		content: [{ type: "text", text: JSON.stringify(deleteResult.data) }],
	};
};

const definition = getToolDefinition("survey-delete");

const tool = (): Tool<typeof schema> => ({
	name: "survey-delete",
	description: definition.description,
	schema,
	handler: deleteHandler,
	annotations: {
		destructiveHint: true,
		idempotentHint: false,
		openWorldHint: false,
		readOnlyHint: false,
	},
});

export default tool;

import { SurveyGetSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = SurveyGetSchema;
type Params = z.infer<typeof schema>;

export const getHandler = async (context: Context, params: Params) => {
	const { surveyId } = params;
	const projectId = await context.stateManager.getProjectId();

	const surveyResult = await context.api.surveys({ projectId }).get({
		surveyId,
	});

	if (!surveyResult.success) {
		throw new Error(`Failed to get survey: ${surveyResult.error.message}`);
	}

	// Add helpful URL for the survey
	const surveyWithUrl = {
		...surveyResult.data,
		url: `${context.api.getProjectBaseUrl(projectId)}/surveys/${surveyResult.data.id}`,
	};

	return {
		content: [{ type: "text", text: JSON.stringify(surveyWithUrl) }],
	};
};

const definition = getToolDefinition("survey-get");

const tool = (): Tool<typeof schema> => ({
	name: "survey-get",
	description: definition.description,
	schema,
	handler: getHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: false,
		readOnlyHint: true,
	},
});

export default tool;

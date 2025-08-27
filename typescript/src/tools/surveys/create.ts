import { SurveyCreateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = SurveyCreateSchema;
type Params = z.infer<typeof schema>;

export const createHandler = async (context: Context, params: Params) => {
	const { data } = params;
	const projectId = await context.stateManager.getProjectId();

	const surveyResult = await context.api.surveys({ projectId }).create({
		data,
	});

	if (!surveyResult.success) {
		throw new Error(`Failed to create survey: ${surveyResult.error.message}`);
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

const definition = getToolDefinition("survey-create");

const tool = (): Tool<typeof schema> => ({
	name: "survey-create",
	description: definition.description,
	schema,
	handler: createHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: false,
		openWorldHint: true,
		readOnlyHint: false,
	},
});

export default tool;

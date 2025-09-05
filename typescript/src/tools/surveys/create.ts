import { SurveyCreateSchema } from "@/schema/tool-inputs";
import { formatSurvey } from "@/tools/surveys/utils/survey-utils";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = SurveyCreateSchema;
type Params = z.infer<typeof schema>;

export const createHandler = async (context: Context, params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const surveyResult = await context.api.surveys({ projectId }).create({
		data: params,
	});

	if (!surveyResult.success) {
		throw new Error(`Failed to create survey: ${surveyResult.error.message}`);
	}

	const formattedSurvey = formatSurvey(surveyResult.data, context, projectId);

	return {
		content: [{ type: "text", text: JSON.stringify(formattedSurvey) }],
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

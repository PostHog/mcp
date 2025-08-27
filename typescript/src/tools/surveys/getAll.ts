import { SurveyGetAllSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = SurveyGetAllSchema;
type Params = z.infer<typeof schema>;

export const getAllHandler = async (context: Context, params: Params) => {
	const { data } = params;
	const projectId = await context.stateManager.getProjectId();

	const surveysResult = await context.api
		.surveys({ projectId })
		.list(data ? { params: data } : {});

	if (!surveysResult.success) {
		throw new Error(`Failed to get surveys: ${surveysResult.error.message}`);
	}

	// Format the surveys with better status display
	const formattedSurveys = surveysResult.data.map((survey) => ({
		...survey,
		status: survey.archived
			? "archived"
			: survey.start_date === null || survey.start_date === undefined
				? "draft"
				: survey.end_date
					? "completed"
					: "active",
		end_date: survey.end_date || undefined, // Don't show null end_date
	}));

	return {
		content: [{ type: "text", text: JSON.stringify(formattedSurveys) }],
	};
};

const definition = getToolDefinition("surveys-get-all");

const tool = (): Tool<typeof schema> => ({
	name: "surveys-get-all",
	description: definition.description,
	schema,
	handler: getAllHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: false,
		readOnlyHint: true,
	},
});

export default tool;

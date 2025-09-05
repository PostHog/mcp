import { SurveyStatsSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = SurveyStatsSchema;
type Params = z.infer<typeof schema>;

export const statsHandler = async (context: Context, params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const result = await context.api.surveys({ projectId }).stats({
		survey_id: params.survey_id,
		date_from: params.date_from,
		date_to: params.date_to,
	});

	if (!result.success) {
		throw new Error(`Failed to get survey stats: ${result.error.message}`);
	}

	return {
		content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
	};
};

const definition = getToolDefinition("survey-stats");

const tool = (): Tool<typeof schema> => ({
	name: "survey-stats",
	description: definition.description,
	schema,
	handler: statsHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

import { SurveyGlobalStatsSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = SurveyGlobalStatsSchema;
type Params = z.infer<typeof schema>;

export const globalStatsHandler = async (context: Context, params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const result = await context.api.surveys({ projectId }).globalStats({ params });

	if (!result.success) {
		throw new Error(`Failed to get survey global stats: ${result.error.message}`);
	}

	return {
		content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
	};
};

const definition = getToolDefinition("surveys-global-stats");

const tool = (): Tool<typeof schema> => ({
	name: "surveys-global-stats",
	description: definition.description,
	schema,
	handler: globalStatsHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: false,
		readOnlyHint: true,
	},
});

export default tool;

import { ExperimentExposureQueryToolSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ExperimentExposureQueryToolSchema;

type Params = z.infer<typeof schema>;

/**
 * Get experiment exposure data including daily timeseries and total exposures per variant
 * This tool fetches the experiment details and executes the exposure query
 * Only works with started experiments (experiments with a start_date)
 */
export const getExposuresHandler = async (context: Context, params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const result = await context.api.experiments({ projectId }).getExposures({
		experimentId: params.experimentId,
		refresh: params.refresh,
	});

	if (!result.success) {
		throw new Error(`Failed to get experiment exposures: ${result.error.message}`);
	}

	const { experiment, exposures } = result.data;

	// Format the response for better readability
	const formattedResponse = {
		experiment: {
			id: experiment.id,
			name: experiment.name,
			description: experiment.description,
			feature_flag_key: experiment.feature_flag_key,
			start_date: experiment.start_date,
			end_date: experiment.end_date,
			status: experiment.start_date
				? experiment.end_date
					? "completed"
					: "running"
				: "draft",
			variants: experiment.parameters?.feature_flag_variants || [],
		},
		exposures: exposures
			? {
					timeseries: exposures.timeseries || [],
					total_exposures: exposures.total_exposures || {},
					date_range: exposures.date_range || null,
				}
			: null,
	};

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(formattedResponse, null, 2),
			},
		],
	};
};

const definition = getToolDefinition("experiment-exposure-query");

const tool = (): Tool<typeof schema> => ({
	name: "experiment-exposure-query",
	description: definition.description,
	schema,
	handler: getExposuresHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

import { ExperimentMetricResultsGetSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ExperimentMetricResultsGetSchema;

type Params = z.infer<typeof schema>;

/**
 * Get experiment results including metrics and exposures data
 * This tool fetches the experiment details and executes the necessary queries
 * to get metrics results (both primary and secondary) and exposure data
 */
export const getMetricResultsHandler = async (context: Context, params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const result = await context.api.experiments({ projectId }).getMetricResults({
		experimentId: params.experimentId,
		refresh: params.refresh,
	});

	if (!result.success) {
		throw new Error(`Failed to get experiment results: ${result.error.message}`);
	}

	const { experiment, primaryMetricsResults, secondaryMetricsResults, exposures } = result.data;

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
		metrics: {
			primary: {
				count: primaryMetricsResults.length,
				results: primaryMetricsResults
					.map((result, index) => ({
						index,
						metric_name: experiment.metrics?.[index]?.name || `Metric ${index + 1}`,
						data: result,
					}))
					.filter((item) => item.data !== null),
			},
			secondary: {
				count: secondaryMetricsResults.length,
				results: secondaryMetricsResults
					.map((result, index) => ({
						index,
						metric_name:
							experiment.metrics_secondary?.[index]?.name ||
							`Secondary Metric ${index + 1}`,
						data: result,
					}))
					.filter((item) => item.data !== null),
			},
		},
		exposures: exposures
			? {
					total_exposures: exposures.total_exposures,
					daily_exposures_count: exposures.daily_exposures?.length || 0,
					// Include first few days as sample
					sample_daily_exposures: exposures.daily_exposures?.slice(0, 5),
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

const definition = getToolDefinition("experiment-metric-results-get");

const tool = (): Tool<typeof schema> => ({
	name: "experiment-metric-results-get",
	description: definition.description,
	schema,
	handler: getMetricResultsHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;

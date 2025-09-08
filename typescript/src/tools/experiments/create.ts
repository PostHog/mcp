import { ExperimentCreateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ExperimentCreateSchema;

type Params = z.infer<typeof schema>;

/**
 * Create a comprehensive A/B test experiment with guided setup
 * This tool helps users create well-configured experiments through conversation
 */
export const createExperimentHandler = async (context: Context, params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	// The API client handles all validation and transformation with Zod
	// We just need to pass the params with proper type casting
	const result = await context.api.experiments({ projectId }).create(params as any);

	if (!result.success) {
		throw new Error(`Failed to create experiment: ${result.error.message}`);
	}

	// Format the response with useful information
	const experiment = result.data;
	const experimentWithUrl = {
		...experiment,
		url: `${context.api.getProjectBaseUrl(projectId)}/experiments/${experiment.id}`,
		status: experiment.start_date ? "running" : "draft",
		variants_summary:
			experiment.parameters?.feature_flag_variants?.map((v) => ({
				key: v.key,
				name: v.name || v.key,
				percentage: v.rollout_percentage,
			})) || [],
		metrics_summary: {
			primary_count: experiment.metrics?.length || 0,
			secondary_count: experiment.metrics_secondary?.length || 0,
		},
	};

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(experimentWithUrl, null, 2),
			},
		],
	};
};

const definition = getToolDefinition("experiment-create");

const tool = (): Tool<typeof schema> => ({
	name: "experiment-create",
	description: definition.description,
	schema,
	handler: createExperimentHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: false,
		openWorldHint: true,
		readOnlyHint: false,
	},
});

export default tool;

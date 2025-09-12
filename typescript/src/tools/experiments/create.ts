import { ExperimentCreateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ExperimentCreateSchema;

// Define a more permissive type that matches the actual input requirements
// The schema has .default() values which make these fields optional at input time
type Params = {
	name: string;
	description?: string;
	feature_flag_key: string;
	type?: "product" | "web";
	primary_metrics?: Array<{
		name?: string;
		metric_type: "mean" | "funnel" | "ratio";
		event_name?: string;
		funnel_steps?: string[];
		properties?: Record<string, any>;
		description?: string;
	}>;
	secondary_metrics?: Array<{
		name?: string;
		metric_type: "mean" | "funnel" | "ratio";
		event_name?: string;
		funnel_steps?: string[];
		properties?: Record<string, any>;
		description?: string;
	}>;
	variants?: Array<{
		key: string;
		name?: string;
		rollout_percentage: number;
	}>;
	minimum_detectable_effect?: number;
	filter_test_accounts?: boolean;
	target_properties?: Record<string, any>;
	draft?: boolean;
	holdout_id?: number;
};

/**
 * Create a comprehensive A/B test experiment with guided setup
 * This tool helps users create well-configured experiments through conversation
 */
export const createExperimentHandler = async (context: Context, params: any) => {
	const projectId = await context.stateManager.getProjectId();

	// Parse and validate the params using the schema to apply defaults
	const validatedParams = schema.parse(params);

	// The API client handles all validation and transformation with Zod
	const result = await context.api.experiments({ projectId }).create(validatedParams as any);

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
	title: definition.title,
	description: definition.description,
	schema,
	handler: createExperimentHandler, // Now accepts any params and validates internally
	annotations: {
		destructiveHint: false,
		idempotentHint: false,
		openWorldHint: true,
		readOnlyHint: false,
	},
});

export default tool;

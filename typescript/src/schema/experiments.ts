import { z } from "zod";

import { FeatureFlagSchema } from "./flags";

const ExperimentType = ["web", "product"] as const;

const ExperimentConclusion = ["won", "lost", "inconclusive", "stopped_early", "invalid"] as const;

export const ExperimentMetricType = z.enum(["funnel", "mean", "ratio"]);

export const ExperimentMetricBasePropertiesSchema = z.object({
	kind: z.literal("ExperimentMetric"),
	uuid: z.string().optional(),
	name: z.string().optional(),
	conversion_window: z.number().optional(),
	conversion_window_unit: z.any().optional(), // FunnelConversionWindowTimeUnit
});

export const ExperimentMetricOutlierHandlingSchema = z.object({
	lower_bound_percentile: z.number().optional(),
	upper_bound_percentile: z.number().optional(),
});

export const ExperimentDataWarehouseNodeSchema = z.object({
	kind: z.literal("ExperimentDataWarehouseNode"),
	table_name: z.string(),
	timestamp_field: z.string(),
	events_join_key: z.string(),
	data_warehouse_join_key: z.string(),
	// EntityNode properties
	name: z.string().optional(),
	custom_name: z.string().optional(),
	math: z.any().optional(),
	math_multiplier: z.number().optional(),
	math_property: z.string().optional(),
	math_property_type: z.string().optional(),
	math_property_revenue_currency: z.any().optional(),
	math_hogql: z.string().optional(),
	math_group_type_index: z
		.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
		.optional(),
	properties: z.array(z.any()).optional(),
	fixedProperties: z.array(z.any()).optional(),
});

export const ExperimentMetricSourceSchema = z.any(); // EventsNode | ActionsNode | ExperimentDataWarehouseNode

export const ExperimentFunnelMetricStepSchema = z.any(); // EventsNode | ActionsNode

export const ExperimentMeanMetricSchema = z
	.object({
		metric_type: z.literal("mean"),
		source: ExperimentMetricSourceSchema,
	})
	.merge(ExperimentMetricBasePropertiesSchema)
	.merge(ExperimentMetricOutlierHandlingSchema);

export const ExperimentFunnelMetricSchema = z
	.object({
		metric_type: z.literal("funnel"),
		series: z.array(ExperimentFunnelMetricStepSchema),
		funnel_order_type: z.any().optional(), // StepOrderValue
	})
	.merge(ExperimentMetricBasePropertiesSchema);

export const ExperimentRatioMetricSchema = z
	.object({
		metric_type: z.literal("ratio"),
		numerator: ExperimentMetricSourceSchema,
		denominator: ExperimentMetricSourceSchema,
	})
	.merge(ExperimentMetricBasePropertiesSchema);

export const ExperimentMetricSchema = z.union([
	ExperimentMeanMetricSchema,
	ExperimentFunnelMetricSchema,
	ExperimentRatioMetricSchema,
]);

export const ExperimentExposureConfigSchema = z.object({
	kind: z.literal("ExperimentEventExposureConfig"),
	event: z.string(),
	properties: z.array(z.any()), // this is an array of AnyPropertyFilter
});

export const ExperimentExposureCriteriaSchema = z.object({
	filterTestAccounts: z.boolean().optional(),
	exposure_config: ExperimentExposureConfigSchema.optional(),
	multiple_variant_handling: z.enum(["exclude", "first_seen"]).optional(),
});

/**
 * This is the schema for the experiment object.
 * It references the Experiment type from
 * @posthog/frontend/src/types.ts
 */
export const ExperimentSchema = z.object({
	id: z.number(),
	name: z.string(),
	type: z.enum(ExperimentType).nullish(),
	description: z.string().nullish(),
	feature_flag_key: z.string(),
	feature_flag: FeatureFlagSchema.optional(),
	exposure_cohort: z.number().nullish(),
	exposure_criteria: ExperimentExposureCriteriaSchema.optional(),
	/**
	 * We only type ExperimentMetrics. Legacy metric formats are not validated.
	 */
	metrics: z.array(z.union([ExperimentMetricSchema, z.any()])).optional(),
	metrics_secondary: z.array(z.union([ExperimentMetricSchema, z.any()])).optional(),
	saved_metrics: z.array(z.any()).optional(),
	saved_metrics_ids: z.nullable(z.array(z.any())),
	parameters: z
		.object({
			feature_flag_variants: z.array(
				z.object({
					key: z.string(),
					name: z.string().nullish(),
					rollout_percentage: z.number().nullish(),
				}),
			),
			minimum_detectable_effect: z.number().nullish(),
			recommended_running_time: z.number().nullish(),
			recommended_sample_size: z.number().nullish(),
		})
		.nullish(),
	start_date: z.string().nullish(),
	end_date: z.string().nullish(),
	archived: z.boolean(),
	deleted: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
	holdout: z.any().optional(),
	holdout_id: z.number().nullish(),
	stats_config: z.any().optional(),
	conclusion: z.enum(ExperimentConclusion).nullish(),
	conclusion_comment: z.string().nullish(),
});

export type Experiment = z.infer<typeof ExperimentSchema>;
export type ExperimentMetricType = z.infer<typeof ExperimentMetricType>;
export type ExperimentMetricBaseProperties = z.infer<typeof ExperimentMetricBasePropertiesSchema>;
export type ExperimentMetricOutlierHandling = z.infer<typeof ExperimentMetricOutlierHandlingSchema>;
export type ExperimentDataWarehouseNode = z.infer<typeof ExperimentDataWarehouseNodeSchema>;
export type ExperimentMeanMetric = z.infer<typeof ExperimentMeanMetricSchema>;
export type ExperimentFunnelMetric = z.infer<typeof ExperimentFunnelMetricSchema>;
export type ExperimentRatioMetric = z.infer<typeof ExperimentRatioMetricSchema>;
export type ExperimentMetric = z.infer<typeof ExperimentMetricSchema>;

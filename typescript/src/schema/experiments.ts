import { z } from "zod";

import { FeatureFlagSchema } from "./flags";

const ExperimentType = ["web", "product"] as const;

const ExperimentConclusion = ["won", "lost", "inconclusive", "stopped_early", "invalid"] as const;

/**
 * This is the schema for the experiment metric base properties.
 * It references the ExperimentMetricBaseProperties type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 *
 * TODO: Add the schemas for FunnelConversionWindowTimeUnit
 */
export const ExperimentMetricBasePropertiesSchema = z.object({
	kind: z.literal("ExperimentMetric"),
	uuid: z.string().optional(),
	name: z.string().optional(),
	conversion_window: z.number().optional(),
	conversion_window_unit: z.any().optional(), // FunnelConversionWindowTimeUnit
});

/**
 * This is the schema for the experiment metric outlier handling.
 * It references the ExperimentMetricOutlierHandling type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 */
export const ExperimentMetricOutlierHandlingSchema = z.object({
	lower_bound_percentile: z.number().optional(),
	upper_bound_percentile: z.number().optional(),
});

/**
 * This is the schema for the experiment metric source.
 * It references the ExperimentMetricSource type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 *
 * TODO: Add the schemas for the EventsNode and ActionsNode and ExperimentDataWarehouseNode
 */
export const ExperimentMetricSourceSchema = z.any(); // EventsNode | ActionsNode | ExperimentDataWarehouseNode

/**
 * This is the schema for the experiment funnel metric step.
 * It references the ExperimentFunnelMetricStep type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 *
 * TODO: Add the schemas for the EventsNode and ActionsNode
 */
export const ExperimentFunnelMetricStepSchema = z.any(); // EventsNode | ActionsNode

/**
 * This is the schema for the experiment mean metric.
 * It references the ExperimentMeanMetric type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 */
export const ExperimentMeanMetricSchema = z
	.object({
		metric_type: z.literal("mean"),
		source: ExperimentMetricSourceSchema,
	})
	.merge(ExperimentMetricBasePropertiesSchema)
	.merge(ExperimentMetricOutlierHandlingSchema);

/**
 * This is the schema for the experiment funnel metric.
 * It references the ExperimentFunnelMetric type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 */
export const ExperimentFunnelMetricSchema = z
	.object({
		metric_type: z.literal("funnel"),
		series: z.array(ExperimentFunnelMetricStepSchema),
		funnel_order_type: z.any().optional(), // StepOrderValue
	})
	.merge(ExperimentMetricBasePropertiesSchema);

/**
 * This is the schema for the experiment ratio metric.
 * It references the ExperimentRatioMetric type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 */
export const ExperimentRatioMetricSchema = z
	.object({
		metric_type: z.literal("ratio"),
		numerator: ExperimentMetricSourceSchema,
		denominator: ExperimentMetricSourceSchema,
	})
	.merge(ExperimentMetricBasePropertiesSchema);

/**
 * This is the schema for the experiment metric.
 * It references the ExperimentMetric type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 */
export const ExperimentMetricSchema = z.union([
	ExperimentMeanMetricSchema,
	ExperimentFunnelMetricSchema,
	ExperimentRatioMetricSchema,
]);

/**
 * This is the schema for the experiment exposure config.
 * It references the ExperimentEventExposureConfig type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 */
export const ExperimentEventExposureConfigSchema = z.object({
	kind: z.literal("ExperimentEventExposureConfig"),
	event: z.string(),
	properties: z.array(z.any()), // this is an array of AnyPropertyFilter
});

/**
 * This is the schema for the experiment exposure criteria.
 * It references the ExperimentExposureCriteria type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 */
export const ExperimentExposureCriteriaSchema = z.object({
	filterTestAccounts: z.boolean().optional(),
	exposure_config: ExperimentEventExposureConfigSchema.optional(),
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
	saved_metrics_ids: z.array(z.any()).nullable(),
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

/**
 * This is the schema for the experiment exposure query.
 * It references the ExperimentExposureQuery type from
 * @posthog/frontend/src/queries/schema/schema-general.ts
 */
export const ExperimentExposureQuerySchema = z.object({
	kind: z.literal("ExperimentExposureQuery"),
	experiment_id: z.number(),
	experiment_name: z.string(),
	exposure_criteria: ExperimentExposureCriteriaSchema.optional(),
	feature_flag: FeatureFlagSchema.optional(),
	start_date: z.string().nullish(),
	end_date: z.string().nullish(),
	holdout: z.any().optional(),
});

export const ExperimentExposureTimeSeriesSchema = z.object({
	variant: z.string(),
	days: z.array(z.string()),
	exposure_counts: z.array(z.number()),
});

export const ExperimentExposureQueryResponseSchema = z.object({
	kind: z.literal("ExperimentExposureQuery"), // API returns the query kind, not a response kind
	timeseries: z.array(ExperimentExposureTimeSeriesSchema),
	total_exposures: z.record(z.string(), z.number()),
	date_range: z.object({
		date_from: z.string(),
		date_to: z.string().nullable(), // API can return null for date_to
	}),
});

/**
 * Schema for creating a new experiment
 * This validates the payload sent to the API
 */
export const ExperimentCreatePayloadSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	feature_flag_key: z.string(),
	type: z.enum(ExperimentType).optional(),

	// Base fields required by API
	filters: z.object({}).default({}),
	saved_metrics_ids: z.array(z.any()).default([]),
	saved_metrics: z.array(z.any()).default([]),
	primary_metrics_ordered_uuids: z.null().default(null),
	secondary_metrics_ordered_uuids: z.null().default(null),
	archived: z.boolean().default(false),
	deleted: z.boolean().default(false),

	// Metrics - these will be transformed from simple input to proper ExperimentMetric
	metrics: z.array(ExperimentMetricSchema).optional().default([]),
	metrics_secondary: z.array(ExperimentMetricSchema).optional().default([]),

	// Parameters
	parameters: z
		.object({
			feature_flag_variants: z
				.array(
					z.object({
						key: z.string(),
						name: z.string().optional(),
						rollout_percentage: z.number(),
					}),
				)
				.default([
					{ key: "control", rollout_percentage: 50 },
					{ key: "test", rollout_percentage: 50 },
				]),
			minimum_detectable_effect: z.number().optional(),
		})
		.optional(),

	// Exposure criteria
	exposure_criteria: z
		.object({
			filterTestAccounts: z.boolean().default(true),
			properties: z.any().optional(),
		})
		.optional(),

	// Optional fields
	holdout_id: z.number().optional(),
	start_date: z.string().optional(), // Set when not draft
});

/**
 * Schema for updating existing experiments
 * All fields are optional to support partial updates
 */
export const ExperimentUpdatePayloadSchema = z
	.object({
		name: z.string().optional(),
		description: z.string().nullish(),
		start_date: z.string().nullish(),
		end_date: z.string().nullish(),

		// Parameters
		parameters: z
			.object({
				feature_flag_variants: z
					.array(
						z.object({
							key: z.string(),
							name: z.string().optional(),
							rollout_percentage: z.number(),
						}),
					)
					.optional(),
				minimum_detectable_effect: z.number().nullish(),
				recommended_running_time: z.number().nullish(),
				recommended_sample_size: z.number().nullish(),
				variant_screenshot_media_ids: z.record(z.array(z.string())).optional(),
			})
			.optional(),

		// Metrics
		metrics: z.array(ExperimentMetricSchema).optional(),
		metrics_secondary: z.array(ExperimentMetricSchema).optional(),
		primary_metrics_ordered_uuids: z.array(z.string()).nullish(),
		secondary_metrics_ordered_uuids: z.array(z.string()).nullish(),

		// State management
		archived: z.boolean().optional(),
		conclusion: z.enum(ExperimentConclusion).nullish(),
		conclusion_comment: z.string().nullish(),

		// Configuration
		exposure_criteria: ExperimentExposureCriteriaSchema.optional(),
		saved_metrics_ids: z.array(z.any()).nullish(),
		stats_config: z.any().optional(),
	})
	.strict();

// experiment type
export type Experiment = z.infer<typeof ExperimentSchema>;
export type ExperimentCreatePayload = z.infer<typeof ExperimentCreatePayloadSchema>;
export type ExperimentUpdatePayload = z.infer<typeof ExperimentUpdatePayloadSchema>;
//metric types
export type ExperimentMetricBaseProperties = z.infer<typeof ExperimentMetricBasePropertiesSchema>;
export type ExperimentMetricOutlierHandling = z.infer<typeof ExperimentMetricOutlierHandlingSchema>;
export type ExperimentMeanMetric = z.infer<typeof ExperimentMeanMetricSchema>;
export type ExperimentFunnelMetric = z.infer<typeof ExperimentFunnelMetricSchema>;
export type ExperimentRatioMetric = z.infer<typeof ExperimentRatioMetricSchema>;
export type ExperimentMetric = z.infer<typeof ExperimentMetricSchema>;
// query types
export type ExperimentExposureQuery = z.infer<typeof ExperimentExposureQuerySchema>;
// response types
export type ExperimentExposureQueryResponse = z.infer<typeof ExperimentExposureQueryResponseSchema>;

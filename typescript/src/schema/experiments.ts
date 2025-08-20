import { z } from "zod";

export const ExperimentSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullish(),
	feature_flag_key: z.string(),
	start_date: z.string().nullish(),
	end_date: z.string().nullish(),
	created_at: z.string(),
	updated_at: z.string(),
	archived: z.boolean(),
	parameters: z
		.object({
			feature_flag_variants: z.array(
				z.object({
					key: z.string(),
					name: z.string().optional(),
					rollout_percentage: z.number(),
				}),
			),
			minimum_detectable_effect: z.number().optional(),
			recommended_running_time: z.number().optional(),
			recommended_sample_size: z.number().optional(),
		})
		.optional(),
	metrics: z.array(z.any()).optional(),
	secondary_metrics: z.array(z.any()).optional(),
});

export type Experiment = z.infer<typeof ExperimentSchema>;

import { z } from "zod";
import { InsightQuerySchema } from "./query";

export const InsightSchema = z.object({
	id: z.number(),
	name: z.string().nullish(),
	description: z.string().nullish(),
	filters: z.record(z.any()),
	query: z.record(z.any()).nullish(),
	result: z.any().optional(),
	created_at: z.string(),
	updated_at: z.string(),
	created_by: z
		.object({
			id: z.number(),
			uuid: z.string().uuid(),
			distinct_id: z.string(),
			first_name: z.string(),
			email: z.string(),
		})
		.optional()
		.nullable(),
	saved: z.boolean(),
	favorited: z.boolean().nullish(),
	deleted: z.boolean(),
	dashboard: z.number().nullish(),
	layouts: z.record(z.any()).nullish(),
	color: z.string().nullish(),
	last_refresh: z.string().nullish(),
	refreshing: z.boolean().nullish(),
	tags: z.array(z.string()).nullish(),
});

export const CreateInsightInputSchema = z.object({
	name: z.string(),
	query: InsightQuerySchema,
	description: z.string().optional(),
	saved: z.boolean().default(true),
	favorited: z.boolean().default(false),
	tags: z.array(z.string()).optional(),
});

export const UpdateInsightInputSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	filters: z.record(z.any()).optional(),
	query: z.record(z.any()).optional(),
	saved: z.boolean().optional(),
	favorited: z.boolean().optional(),
	dashboard: z.number().optional(),
	tags: z.array(z.string()).optional(),
});

export const ListInsightsSchema = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	saved: z.boolean().optional(),
	favorited: z.boolean().optional(),
	search: z.string().optional(),
});

export type PostHogInsight = z.infer<typeof InsightSchema>;
export type CreateInsightInput = z.infer<typeof CreateInsightInputSchema>;
export type UpdateInsightInput = z.infer<typeof UpdateInsightInputSchema>;
export type ListInsightsData = z.infer<typeof ListInsightsSchema>;

export const SQLInsightResponseSchema = z.array(
	z.object({
		type: z.string(),
		data: z.record(z.any()),
	}),
);

export type SQLInsightResponse = z.infer<typeof SQLInsightResponseSchema>;

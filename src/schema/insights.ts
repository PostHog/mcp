import { z } from "zod";

export const InsightSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional(),
	filters: z.record(z.any()),
	query: z.record(z.any()).optional(),
	result: z.any().optional(),
	created_at: z.string(),
	updated_at: z.string(),
	created_by: z.object({
		id: z.number(),
		uuid: z.string(),
		distinct_id: z.string(),
		first_name: z.string(),
		email: z.string(),
	}).optional(),
	saved: z.boolean(),
	favorited: z.boolean().optional(),
	deleted: z.boolean(),
	dashboard: z.number().optional(),
	layouts: z.record(z.any()).optional(),
	color: z.string().optional(),
	last_refresh: z.string().optional(),
	refreshing: z.boolean().optional(),
	tags: z.array(z.string()).optional(),
});

export const CreateInsightInputSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	filters: z.record(z.any()),
	query: z.record(z.any()).optional(),
	saved: z.boolean().default(true),
	dashboard: z.number().optional(),
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
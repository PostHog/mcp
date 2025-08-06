import { z } from "zod";

export const ApiPropertyDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	is_numerical: z.boolean().nullable().optional(),
	updated_at: z.string().nullable().optional(),
	updated_by: z.string().nullable().optional(),
	is_seen_on_filtered_events: z.boolean().nullable().optional(),
	property_type: z.enum(["String", "Numeric", "Boolean", "DateTime"]).nullable().optional(),
	verified: z.boolean().nullable().optional(),
	verified_at: z.string().nullable().optional(),
	verified_by: z.string().nullable().optional(),
	hidden: z.boolean().nullable().optional(),
	tags: z.array(z.string()).default([]),
});

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		count: z.number(),
		next: z.string().nullable(),
		previous: z.string().nullable(),
		results: z.array(dataSchema),
	});

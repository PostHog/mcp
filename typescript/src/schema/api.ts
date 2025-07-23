import { z } from "zod";

export const ApiPropertyDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	is_numerical: z.boolean().nullable(),
	updated_at: z.string().nullable(),
	updated_by: z.string().nullable(),
	is_seen_on_filtered_events: z.boolean().nullable(),
	property_type: z.enum(["String", "Numeric", "Boolean", "DateTime"]).nullable(),
	verified: z.boolean().nullable(),
	verified_at: z.string().nullable(),
	verified_by: z.string().nullable(),
	hidden: z.boolean().nullable(),
	tags: z.array(z.string()),
});

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		count: z.number(),
		next: z.string().nullable(),
		previous: z.string().nullable(),
		results: z.array(dataSchema),
	});

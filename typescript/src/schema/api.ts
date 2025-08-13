import { z } from "zod";

export const ApiPropertyDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullish(),
	is_numerical: z.boolean().nullish(),
	updated_at: z.string().nullish(),
	updated_by: z.string().nullish(),
	is_seen_on_filtered_events: z.boolean().nullish(),
	property_type: z.enum(["String", "Numeric", "Boolean", "DateTime"]).nullish(),
	verified: z.boolean().nullish(),
	verified_at: z.string().nullish(),
	verified_by: z.string().nullish(),
	hidden: z.boolean().nullish(),
	tags: z.array(z.string()).default([]),
});

export const ApiListResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		count: z.number().nullish(),
		next: z.string().nullish(),
		previous: z.string().nullish(),
		results: z.array(dataSchema),
	});

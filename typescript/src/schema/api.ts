import { z } from "zod";

export const ApiPropertyDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullish(),
	is_numerical: z.boolean().nullish(),
	updated_at: z.string().nullish(),
	updated_by: z.any().nullish(),
	is_seen_on_filtered_events: z.boolean().nullish(),
	property_type: z.enum(["String", "Numeric", "Boolean", "DateTime"]).nullish(),
	verified: z.boolean().nullish(),
	verified_at: z.string().nullish(),
	verified_by: z.any().nullish(),
	hidden: z.boolean().nullish(),
	tags: z.array(z.string()).nullish(),
});

export const ApiEventDefinitionSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	owner: z.string().nullish(),
	description: z.string().nullish(),
	created_at: z.string().nullish(),
	updated_at: z.string().nullish(),
	updated_by: z.any().nullish(),
	last_seen_at: z.string().nullish(),
	verified: z.boolean().nullish(),
	verified_at: z.string().nullish(),
	verified_by: z.any().nullish(),
	hidden: z.boolean().nullish(),
	is_action: z.boolean().nullish(),
	post_to_slack: z.boolean().nullish(),
	default_columns: z.array(z.string().nullish()).nullish(),
	tags: z.array(z.string().nullish()).nullish(),
});

export const ApiListResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		count: z.number().nullish(),
		next: z.string().nullish(),
		previous: z.string().nullish(),
		results: z.array(dataSchema),
	});

export type ApiPropertyDefinition = z.infer<typeof ApiPropertyDefinitionSchema>;
export type ApiEventDefinition = z.infer<typeof ApiEventDefinitionSchema>;

import { z } from "zod";

export interface PostHogFeatureFlag {
	id: number;
	key: string;
	name: string;
}

export interface PostHogFlagsResponse {
	results?: PostHogFeatureFlag[];
}
const base = ["exact", "is_not"] as const;
const stringOps = [
	...base,
	"icontains",
	"not_icontains",
	"regex",
	"not_regex",
	"is_cleaned_path_exact",
] as const;
const numberOps = [...base, "gt", "gte", "lt", "lte", "min", "max"] as const;
const booleanOps = [...base] as const;

const arrayOps = ["in", "not_in"] as const;

const operatorSchema = z.enum([
	...stringOps,
	...numberOps,
	...booleanOps,
	...arrayOps,
] as unknown as [string, ...string[]]);

export const PersonPropertyFilterSchema = z
	.object({
		key: z.string(),
		value: z.union([
			z.string(),
			z.number(),
			z.boolean(),
			z.array(z.string()),
			z.array(z.number()),
		]),
		operator: operatorSchema.optional(),
	})
	.superRefine((data, ctx) => {
		const { value, operator } = data;
		if (!operator) return;
		const isArray = Array.isArray(value);

		const valid =
			(typeof value === "string" && stringOps.includes(operator as any)) ||
			(typeof value === "number" && numberOps.includes(operator as any)) ||
			(typeof value === "boolean" && booleanOps.includes(operator as any)) ||
			(isArray && arrayOps.includes(operator as any));

		if (!valid)
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `operator "${operator}" is not valid for value type "${isArray ? "array" : typeof value}"`,
			});

		if (!isArray && arrayOps.includes(operator as any))
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `operator "${operator}" requires an array value`,
			});
	})
	.transform((data) => {
		return {
			...data,
			type: "person",
		};
	});

export type PersonPropertyFilter = z.infer<typeof PersonPropertyFilterSchema>;

export const FiltersSchema = z.object({
	properties: z.array(PersonPropertyFilterSchema),
	rollout_percentage: z.number(),
});

export type Filters = z.infer<typeof FiltersSchema>;

export const FilterGroupsSchema = z.object({
	groups: z.array(FiltersSchema),
});

export type FilterGroups = z.infer<typeof FilterGroupsSchema>;

export const CreateFeatureFlagInputSchema = z.object({
	name: z.string(),
	key: z.string(),
	description: z.string(),
	filters: FilterGroupsSchema,
	active: z.boolean(),
	tags: z.array(z.string()).optional(),
});

export type CreateFeatureFlagInput = z.infer<typeof CreateFeatureFlagInputSchema>;

export const UpdateFeatureFlagInputSchema = CreateFeatureFlagInputSchema.omit({
	key: true,
}).partial();

export type UpdateFeatureFlagInput = z.infer<typeof UpdateFeatureFlagInputSchema>;

export const FeatureFlagSchema = z.object({
	id: z.number(),
	key: z.string(),
	name: z.string(),
	description: z.string().optional(),
	filters: FiltersSchema.optional(),
	active: z.boolean(),
	tags: z.array(z.string()).optional(),
});

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

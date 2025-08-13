import { type ApiListResponseSchema, ApiPropertyDefinitionSchema } from "@/schema/api";
import type { z } from "zod";

export const PropertyDefinitionSchema = ApiPropertyDefinitionSchema.pick({
	name: true,
	property_type: true,
});

export type PropertyDefinition = z.infer<typeof ApiPropertyDefinitionSchema>;
export type PropertyDefinitionsResponse = z.infer<
	ReturnType<typeof ApiListResponseSchema<typeof ApiPropertyDefinitionSchema>>
>;

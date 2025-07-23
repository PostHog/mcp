import type { z } from "zod";
import { ApiPropertyDefinitionSchema, type ApiResponseSchema } from "./api";

export const PropertyDefinitionSchema = ApiPropertyDefinitionSchema.pick({
	name: true,
	property_type: true,
});

export type PropertyDefinition = z.infer<typeof ApiPropertyDefinitionSchema>;
export type PropertyDefinitionsResponse = z.infer<
	ReturnType<typeof ApiResponseSchema<typeof ApiPropertyDefinitionSchema>>
>;

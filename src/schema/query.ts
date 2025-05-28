import { z } from "zod"

export const DateRangeSchema = z.object({
  date_from: z.string().describe("The start date of the date range. Could be a date string or a relative date string like '-7d'"),
  date_to: z.string().describe("The end date of the date range. Could be a date string or a relative date string like '-1d'"),
})

export const HogQLFiltersSchema = z.object({
  dateRange: DateRangeSchema.optional(),
})

export const HogQLQuerySchema = z.object({
  kind: z.literal("HogQLQuery"),
  query: z.string(),
  explain: z.boolean().optional(),
  filters: HogQLFiltersSchema.optional(),
})

export const InsightQuerySchema = z.object({
  kind: z.literal("DataVisualizationNode"),
  source: HogQLQuerySchema,
})

export type InsightQuery = z.infer<typeof InsightQuerySchema>;
export type HogQLQuery = z.infer<typeof HogQLQuerySchema>;
export type HogQLFilters = z.infer<typeof HogQLFiltersSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
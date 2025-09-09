import { z } from "zod";
import {
	AddInsightToDashboardSchema,
	CreateDashboardInputSchema,
	ListDashboardsSchema,
	UpdateDashboardInputSchema,
} from "./dashboards";
import { ErrorDetailsSchema, ListErrorsSchema } from "./errors";
import { FilterGroupsSchema, UpdateFeatureFlagInputSchema } from "./flags";
import { CreateInsightInputSchema, ListInsightsSchema, UpdateInsightInputSchema } from "./insights";

export const DashboardAddInsightSchema = z.object({
	data: AddInsightToDashboardSchema,
});

export const DashboardCreateSchema = z.object({
	data: CreateDashboardInputSchema,
});

export const DashboardDeleteSchema = z.object({
	dashboardId: z.number(),
});

export const DashboardGetSchema = z.object({
	dashboardId: z.number(),
});

export const DashboardGetAllSchema = z.object({
	data: ListDashboardsSchema.optional(),
});

export const DashboardUpdateSchema = z.object({
	dashboardId: z.number(),
	data: UpdateDashboardInputSchema,
});

export const DocumentationSearchSchema = z.object({
	query: z.string(),
});

export const ErrorTrackingDetailsSchema = ErrorDetailsSchema;

export const ErrorTrackingListSchema = ListErrorsSchema;

export const ExperimentGetAllSchema = z.object({});

export const ExperimentGetSchema = z.object({
	experimentId: z.number().describe("The ID of the experiment to retrieve"),
});

export const FeatureFlagCreateSchema = z.object({
	name: z.string(),
	key: z.string(),
	description: z.string(),
	filters: FilterGroupsSchema,
	active: z.boolean(),
	tags: z.array(z.string()).optional(),
});

export const FeatureFlagDeleteSchema = z.object({
	flagKey: z.string(),
});

export const FeatureFlagGetAllSchema = z.object({});

export const FeatureFlagGetDefinitionSchema = z.object({
	flagId: z.number().int().positive().optional(),
	flagKey: z.string().optional(),
});

export const FeatureFlagUpdateSchema = z.object({
	flagKey: z.string(),
	data: UpdateFeatureFlagInputSchema,
});

export const InsightCreateSchema = z.object({
	data: CreateInsightInputSchema,
});

export const InsightDeleteSchema = z.object({
	insightId: z.string(),
});

export const InsightGetSchema = z.object({
	insightId: z.string(),
});

export const InsightGetAllSchema = z.object({
	data: ListInsightsSchema.optional(),
});

export const InsightGetSqlSchema = z.object({
	query: z
		.string()
		.max(1000)
		.describe("Your natural language query describing the SQL insight (max 1000 characters)."),
});

export const InsightQuerySchema = z.object({
	insightId: z.string(),
});

export const InsightUpdateSchema = z.object({
	insightId: z.string(),
	data: UpdateInsightInputSchema,
});

export const LLMObservabilityGetCostsSchema = z.object({
	projectId: z.number().int().positive(),
	days: z.number().optional(),
});

export const OrganizationGetDetailsSchema = z.object({});

export const OrganizationGetAllSchema = z.object({});

export const OrganizationSetActiveSchema = z.object({
	orgId: z.string().uuid(),
});

export const ProjectGetAllSchema = z.object({});

export const ProjectEventDefinitionsSchema = z.object({
	q: z
		.string()
		.optional()
		.describe("Search query to filter event names. Only use if there are lots of events."),
});

export const ProjectPropertyDefinitionsSchema = z.object({
	eventName: z.string().describe("Event name to filter properties by"),
});

export const ProjectSetActiveSchema = z.object({
	projectId: z.number().int().positive(),
});

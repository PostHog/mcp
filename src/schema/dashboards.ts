import { z } from "zod";

// Base dashboard schema from PostHog API
export const DashboardSchema = z.object({
	id: z.number().int().positive(),
	name: z.string(),
	description: z.string().optional().nullable(),
	pinned: z.boolean().optional().nullable(),
	created_at: z.string(),
	created_by: z
		.object({
			email: z.string().email(),
		})
		.optional().nullable(),
	is_shared: z.boolean().optional().nullable(),
	deleted: z.boolean().optional().nullable(),
	filters: z.record(z.any()).optional().nullable(),
	variables: z.record(z.any()).optional().nullable(),
	tags: z.array(z.string()).optional().nullable(),
	tiles: z.array(z.record(z.any())).optional().nullable(),
});

// Input schema for creating dashboards
export const CreateDashboardInputSchema = z.object({
	name: z.string().min(1, "Dashboard name is required"),
	description: z.string().optional(),
	pinned: z.boolean().optional().default(false),
	tags: z.array(z.string()).optional(),
});

// Input schema for updating dashboards
export const UpdateDashboardInputSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	pinned: z.boolean().optional(),
	tags: z.array(z.string()).optional(),
});

// Input schema for listing dashboards
export const ListDashboardsSchema = z.object({
	limit: z.number().int().positive().optional(),
	offset: z.number().int().nonnegative().optional(),
	search: z.string().optional(),
	pinned: z.boolean().optional(),
});

// Input schema for adding insight to dashboard
export const AddInsightToDashboardSchema = z.object({
	insight_id: z.number().int().positive(),
	dashboard_id: z.number().int().positive(),
});

// Type exports
export type PostHogDashboard = z.infer<typeof DashboardSchema>;
export type CreateDashboardInput = z.infer<typeof CreateDashboardInputSchema>;
export type UpdateDashboardInput = z.infer<typeof UpdateDashboardInputSchema>;
export type ListDashboardsData = z.infer<typeof ListDashboardsSchema>;
export type AddInsightToDashboardInput = z.infer<typeof AddInsightToDashboardSchema>;

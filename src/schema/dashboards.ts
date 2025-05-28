import { z } from "zod";

// Base dashboard schema from PostHog API
export const DashboardSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional(),
	pinned: z.boolean().optional(),
	created_at: z.string(),
	created_by: z
		.object({
			id: z.number(),
			uuid: z.string(),
			distinct_id: z.string(),
			first_name: z.string(),
			last_name: z.string(),
			email: z.string().email(),
			is_email_verified: z.boolean(),
			hedgehog_config: z.record(z.any()).optional(),
			role_at_organization: z.string(),
		})
		.optional(),
	is_shared: z.boolean().optional(),
	deleted: z.boolean().optional(),
	creation_mode: z.string().optional(),
	use_template: z.string().optional(),
	use_dashboard: z.number().optional(),
	delete_insights: z.boolean().optional(),
	filters: z.record(z.any()).optional(),
	variables: z.record(z.any()).optional(),
	breakdown_colors: z.any().optional(),
	data_color_theme_id: z.number().optional(),
	tags: z.array(z.string()).optional(),
	tiles: z.array(z.record(z.any())).optional(),
	restriction_level: z.number().optional(),
	effective_restriction_level: z.number().optional(),
	effective_privilege_level: z.number().optional(),
	user_access_level: z.string().optional(),
	access_control_version: z.string().optional(),
	_create_in_folder: z.string().optional(),
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

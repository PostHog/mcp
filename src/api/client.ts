import { BASE_URL } from "../lib/constants";
import { ErrorCode } from "../lib/errors";
import { withPagination } from "../lib/utils/api";
import { OrganizationSchema, type Organization } from "../schema/orgs";
import { ProjectSchema, type Project } from "../schema/projects";
import {
	type CreateFeatureFlagInput,
	CreateFeatureFlagInputSchema,
	type UpdateFeatureFlagInput,
	UpdateFeatureFlagInputSchema,
	FeatureFlagSchema,
} from "../schema/flags";
import { ApiPropertyDefinitionSchema } from "../schema/api";
import { PropertyDefinitionSchema } from "../schema/properties";
import {
	type CreateInsightInput,
	CreateInsightInputSchema,
	type ListInsightsData,
	ListInsightsSchema,
} from "../schema/insights";
import {
	type CreateDashboardInput,
	CreateDashboardInputSchema,
	type ListDashboardsData,
	ListDashboardsSchema,
} from "../schema/dashboards";
import { z } from "zod";

export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export interface ApiConfig {
	apiToken: string;
	baseUrl?: string;
}
export class ApiClient {
	private config: ApiConfig;
	private baseUrl: string;

	constructor(config: ApiConfig) {
		this.config = config;
		this.baseUrl = config.baseUrl || BASE_URL;
	}
	private buildHeaders() {
		return {
			Authorization: `Bearer ${this.config.apiToken}`,
			"Content-Type": "application/json",
		};
	}

	private async fetchWithSchema<T>(
		url: string,
		schema: z.ZodType<T>,
		options?: RequestInit,
	): Promise<Result<T>> {
		try {
			const response = await fetch(url, {
				...options,
				headers: {
					...this.buildHeaders(),
					...options?.headers,
				},
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error(ErrorCode.INVALID_API_KEY);
				}


				const errorData = (await response.json()) as any;
				if (errorData.type === "validation_error" && errorData.code) {
					throw new Error(`Validation error: ${errorData.code}`);
				}


				throw new Error(`Request failed: ${response.statusText}`);
			}

			const rawData = await response.json();
			const parseResult = schema.safeParse(rawData);

			if (!parseResult.success) {
				throw new Error(`Response validation failed: ${parseResult.error.message}`);
			}

			return { success: true, data: parseResult.data };
		} catch (error) {
			return { success: false, error: error as Error };
		}
	}

	organizations() {
		return {
			list: async (): Promise<Result<Organization[]>> => {
				const responseSchema = z.object({
					results: z.array(OrganizationSchema),
				});

				const result = await this.fetchWithSchema(
					`${this.baseUrl}/api/organizations/`,
					responseSchema,
				);

				if (result.success) {
					return { success: true, data: result.data.results };
				}
				return result;
			},

			get: async ({ orgId }: { orgId: string }): Promise<Result<Organization>> => {
				return this.fetchWithSchema(
					`${this.baseUrl}/api/organizations/${orgId}/`,
					OrganizationSchema,
				);
			},

			projects: ({ orgId }: { orgId: string }) => {
				return {
					list: async (): Promise<Result<Project[]>> => {
						const responseSchema = z.object({
							results: z.array(ProjectSchema),
						});

						const result = await this.fetchWithSchema(
							`${this.baseUrl}/api/organizations/${orgId}/projects/`,
							responseSchema,
						);

						if (result.success) {
							return { success: true, data: result.data.results };
						}
						return result;
					},
				};
			},
		};
	}

	projects() {
		return {
			get: async ({ projectId }: { projectId: string }): Promise<Result<Project>> => {
				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/`,
					ProjectSchema,
				);
			},

			propertyDefinitions: async ({
				projectId,
			}: { projectId: string }): Promise<Result<any[]>> => {
				try {
					const propertyDefinitions = await withPagination(
						`${this.baseUrl}/api/projects/${projectId}/property_definitions/`,
						this.config.apiToken,
						ApiPropertyDefinitionSchema,
					);

					const propertyDefinitionsWithoutHidden = propertyDefinitions.filter(
						(def) => !def.hidden,
					);

					const validated = propertyDefinitionsWithoutHidden.map((def) =>
						PropertyDefinitionSchema.parse(def),
					);

					return { success: true, data: validated };
				} catch (error) {
					return { success: false, error: error as Error };
				}
			},
		};
	}

	featureFlags({ projectId }: { projectId: string }) {
		return {
			list: async (): Promise<
				Result<Array<{ id: number; key: string; name: string; active: boolean }>>
			> => {
				try {
					const schema = FeatureFlagSchema.pick({
						id: true,
						key: true,
						name: true,
						active: true,
					});

					const response = await withPagination(
						`${this.baseUrl}/api/projects/${projectId}/feature_flags/`,
						this.config.apiToken,
						schema,
					);

					return {
						success: true,
						data: response as Array<{
							id: number;
							key: string;
							name: string;
							active: boolean;
						}>,
					};
				} catch (error) {
					return { success: false, error: error as Error };
				}
			},

			get: async ({
				flagId,
			}: { flagId: string | number }): Promise<
				Result<{
					id: number;
					key: string;
					name: string;
					active: boolean;
					description?: string;
				}>
			> => {
				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/feature_flags/${flagId}/`,
					FeatureFlagSchema.pick({
						id: true,
						key: true,
						name: true,
						active: true,
						description: true,
					}),
				);
			},

			findByKey: async ({
				key,
			}: { key: string }): Promise<
				Result<{ id: number; key: string; name: string; active: boolean } | undefined>
			> => {
				const listResult = await this.featureFlags({ projectId }).list();

				if (!listResult.success) {
					return { success: false, error: listResult.error };
				}

				const found = listResult.data.find((f) => f.key === key);
				return { success: true, data: found };
			},

			create: async ({
				data,
			}: { data: CreateFeatureFlagInput }): Promise<
				Result<{ id: number; key: string; name: string; active: boolean }>
			> => {
				const validatedInput = CreateFeatureFlagInputSchema.parse(data);

				const body = {
					key: validatedInput.key,
					name: validatedInput.name,
					description: validatedInput.description,
					active: validatedInput.active,
					filters: validatedInput.filters,
				};

				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/feature_flags/`,
					FeatureFlagSchema.pick({
						id: true,
						key: true,
						name: true,
						active: true,
					}),
					{
						method: "POST",
						body: JSON.stringify(body),
					},
				);
			},

			update: async ({
				key,
				data,
			}: { key: string; data: UpdateFeatureFlagInput }): Promise<
				Result<{ id: number; key: string; name: string; active: boolean }>
			> => {
				const validatedInput = UpdateFeatureFlagInputSchema.parse(data);
				const findResult = await this.featureFlags({ projectId }).findByKey({ key });

				if (!findResult.success) {
					return findResult;
				}

				if (!findResult.data) {
					return {
						success: false,
						error: new Error(`Feature flag not found: ${key}`),
					};
				}

				const body = {
					key: key,
					name: validatedInput.name,
					description: validatedInput.description,
					active: validatedInput.active,
					filters: validatedInput.filters,
				};

				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/feature_flags/${findResult.data.id}/`,
					FeatureFlagSchema.pick({
						id: true,
						key: true,
						name: true,
						active: true,
					}),
					{
						method: "PATCH",
						body: JSON.stringify(body),
					},
				);
			},

			delete: async ({
				flagId,
			}: { flagId: number }): Promise<Result<{ success: boolean; message: string }>> => {
				try {
					const response = await fetch(
						`${this.baseUrl}/api/projects/${projectId}/feature_flags/${flagId}/`,
						{
							method: "PATCH",
							headers: this.buildHeaders(),
							body: JSON.stringify({ deleted: true }),
						},
					);

					if (!response.ok) {
						throw new Error(`Failed to delete feature flag: ${response.statusText}`);
					}

					return {
						success: true,
						data: {
							success: true,
							message: "Feature flag deleted successfully",
						},
					};
				} catch (error) {
					return { success: false, error: error as Error };
				}
			},
		};
	}

	insights({ projectId }: { projectId: string }) {
		return {
			list: async ({
				params,
			}: { params?: ListInsightsData } = {}): Promise<
				Result<
					Array<{
						id: number;
						name: string;
						short_id: string;
						description?: string | null;
					}>
				>
			> => {
				const validatedParams = params ? ListInsightsSchema.parse(params) : undefined;
				const searchParams = new URLSearchParams();

				if (validatedParams?.limit)
					searchParams.append("limit", String(validatedParams.limit));
				if (validatedParams?.offset)
					searchParams.append("offset", String(validatedParams.offset));
				if (validatedParams?.saved !== undefined)
					searchParams.append("saved", String(validatedParams.saved));
				if (validatedParams?.search) searchParams.append("search", validatedParams.search);

				const url = `${this.baseUrl}/api/projects/${projectId}/insights/${searchParams.toString() ? `?${searchParams}` : ""}`;

				const simpleInsightSchema = z.object({
					id: z.number(),
					name: z.string(),
					short_id: z.string(),
					description: z.string().optional().nullable(),
				});

				const responseSchema = z.object({
					results: z.array(simpleInsightSchema),
				});

				const result = await this.fetchWithSchema(url, responseSchema);
				if (result.success) {
					return { success: true, data: result.data.results };
				}
				return result;
			},

			create: async ({
				data,
			}: { data: CreateInsightInput }): Promise<
				Result<{ id: number; name: string; short_id: string }>
			> => {
				const validatedInput = CreateInsightInputSchema.parse(data);

				const createResponseSchema = z.object({
					id: z.number(),
					name: z.string(),
					short_id: z.string(),
				});

				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/insights/`,
					createResponseSchema,
					{
						method: "POST",
						body: JSON.stringify(validatedInput),
					},
				);
			},

			get: async ({
				insightId,
			}: { insightId: number }): Promise<
				Result<{ id: number; name: string; short_id: string; description?: string | null }>
			> => {
				const simpleInsightSchema = z.object({
					id: z.number(),
					name: z.string(),
					short_id: z.string(),
					description: z.string().nullable().optional(),
				});

				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/insights/${insightId}/`,
					simpleInsightSchema,
				);
			},

			update: async ({
				insightId,
				data,
			}: { insightId: number; data: any }): Promise<
				Result<{ id: number; name: string; short_id: string }>
			> => {
				const updateResponseSchema = z.object({
					id: z.number(),
					name: z.string(),
					short_id: z.string(),
				});

				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/insights/${insightId}/`,
					updateResponseSchema,
					{
						method: "PATCH",
						body: JSON.stringify(data),
					},
				);
			},

			delete: async ({
				insightId,
			}: { insightId: number }): Promise<Result<{ success: boolean; message: string }>> => {
				try {
					const response = await fetch(
						`${this.baseUrl}/api/projects/${projectId}/insights/${insightId}/`,
						{
							method: "PATCH",
							headers: this.buildHeaders(),
							body: JSON.stringify({ deleted: true }),
						},
					);

					if (!response.ok) {
						throw new Error(`Failed to delete insight: ${response.statusText}`);
					}

					return {
						success: true,
						data: {
							success: true,
							message: "Insight deleted successfully",
						},
					};
				} catch (error) {
					return { success: false, error: error as Error };
				}
			},

			sqlInsight: async ({
				query,
			}: { query: string }): Promise<Result<{ columns: string[]; results: any[] }>> => {
				const requestBody = {
					query: query,
					insight_type: "sql",
				};

				const sqlResponseSchema = z.array(z.any());

				const result = await this.fetchWithSchema(
					`${this.baseUrl}/api/environments/${projectId}/max_tools/create_and_query_insight/`,
					sqlResponseSchema,
					{
						method: "POST",
						body: JSON.stringify(requestBody),
					},
				);

				if (result.success) {
					const dataObject = result.data.find(
						(item: any) =>
							item &&
							typeof item === "object" &&
							"columns" in item &&
							"results" in item,
					);

					if (dataObject) {
						return {
							success: true,
							data: {
								columns: dataObject.columns || [],
								results: dataObject.results || [],
							},
						};
					}

					const anyDataObject = result.data.find(
						(item: any) =>
							item &&
							typeof item === "object" &&
							(Array.isArray(item) || Object.keys(item).length > 0),
					);

					if (anyDataObject) {
						if (Array.isArray(anyDataObject)) {
							return {
								success: true,
								data: {
									columns: ["result"],
									results: anyDataObject,
								},
							};
						}

						return {
							success: true,
							data: {
								columns: Object.keys(anyDataObject),
								results: [anyDataObject],
							},
						};
					}

					return { success: false, error: new Error("No SQL data found in response") };
				}

				return result;
			},
		};
	}

	dashboards({ projectId }: { projectId: string }) {
		return {
			list: async ({
				params,
			}: { params?: ListDashboardsData } = {}): Promise<
				Result<
					Array<{
						id: number;
						name: string;
						description?: string | null;
					}>
				>
			> => {
				const validatedParams = params ? ListDashboardsSchema.parse(params) : undefined;
				const searchParams = new URLSearchParams();

				if (validatedParams?.limit)
					searchParams.append("limit", String(validatedParams.limit));
				if (validatedParams?.offset)
					searchParams.append("offset", String(validatedParams.offset));
				if (validatedParams?.search) searchParams.append("search", validatedParams.search);

				const url = `${this.baseUrl}/api/projects/${projectId}/dashboards/${searchParams.toString() ? `?${searchParams}` : ""}`;

				const simpleDashboardSchema = z.object({
					id: z.number(),
					name: z.string(),
					description: z.string().optional().nullable(),
				});

				const responseSchema = z.object({
					results: z.array(simpleDashboardSchema),
				});

				const result = await this.fetchWithSchema(url, responseSchema);

				if (result.success) {
					return { success: true, data: result.data.results };
				}

				return result;
			},

			get: async ({
				dashboardId,
			}: { dashboardId: number }): Promise<
				Result<{ id: number; name: string; description?: string | null }>
			> => {
				const simpleDashboardSchema = z.object({
					id: z.number(),
					name: z.string(),
					description: z.string().optional().nullable(),
				});

				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/dashboards/${dashboardId}/`,
					simpleDashboardSchema,
				);
			},

			create: async ({
				data,
			}: { data: CreateDashboardInput }): Promise<Result<{ id: number; name: string }>> => {
				const validatedInput = CreateDashboardInputSchema.parse(data);

				const createResponseSchema = z.object({
					id: z.number(),
					name: z.string(),
				});

				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/dashboards/`,
					createResponseSchema,
					{
						method: "POST",
						body: JSON.stringify(validatedInput),
					},
				);
			},

			update: async ({
				dashboardId,
				data,
			}: { dashboardId: number; data: any }): Promise<
				Result<{ id: number; name: string }>
			> => {
				const updateResponseSchema = z.object({
					id: z.number(),
					name: z.string(),
				});

				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/dashboards/${dashboardId}/`,
					updateResponseSchema,
					{
						method: "PATCH",
						body: JSON.stringify(data),
					},
				);
			},

			delete: async ({
				dashboardId,
			}: { dashboardId: number }): Promise<Result<{ success: boolean; message: string }>> => {
				try {
					const response = await fetch(
						`${this.baseUrl}/api/projects/${projectId}/dashboards/${dashboardId}/`,
						{
							method: "PATCH",
							headers: this.buildHeaders(),
							body: JSON.stringify({ deleted: true }),
						},
					);

					if (!response.ok) {
						throw new Error(`Failed to delete dashboard: ${response.statusText}`);
					}

					return {
						success: true,
						data: {
							success: true,
							message: "Dashboard deleted successfully",
						},
					};
				} catch (error) {
					return { success: false, error: error as Error };
				}
			},

			addInsight: async ({
				data,
			}: { data: { insight_id: number; dashboard_id: number } }): Promise<Result<any>> => {
				return this.fetchWithSchema(
					`${this.baseUrl}/api/projects/${projectId}/insights/${data.insight_id}/`,
					z.any(),
					{
						method: "PATCH",
						body: JSON.stringify({ dashboards: [data.dashboard_id] }),
					},
				);
			},
		};
	}

	query({ projectId }: { projectId: string }) {
		return {
			execute: async ({
				queryBody,
			}: { queryBody: any }): Promise<Result<{ results: any[] }>> => {
				const responseSchema = z.object({
					results: z.array(z.any()),
				});

				return this.fetchWithSchema(
					`${this.baseUrl}/api/environments/${projectId}/query/`,
					responseSchema,
					{
						method: "POST",
						body: JSON.stringify({ query: queryBody }),
					},
				);
			},
		};
	}

	users() {
		return {
			me: async (): Promise<Result<{ distinctId: string }>> => {
				const result = await this.fetchWithSchema(
					`${this.baseUrl}/api/users/@me/`,
					z.object({ distinct_id: z.string() }),
				);

				if (!result.success) {
					return result;
				}

				return {
					success: true,
					data: { distinctId: result.data.distinct_id },
				};
			},
		};
	}
}

import { McpServer, type ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

import { ApiClient } from "./api/client";

import {
	AddInsightToDashboardSchema,
	CreateDashboardInputSchema,
	ListDashboardsSchema,
	UpdateDashboardInputSchema,
} from "./schema/dashboards";
import { FilterGroupsSchema, UpdateFeatureFlagInputSchema } from "./schema/flags";
import {
	CreateInsightInputSchema,
	ListInsightsSchema,
	UpdateInsightInputSchema,
} from "./schema/insights";

import { docsSearch } from "./inkeepApi";
import { DurableObjectCache } from "./lib/utils/cache/DurableObjectCache";
import { hash } from "./lib/utils/helper-functions";
import { ErrorDetailsSchema, ListErrorsSchema } from "./schema/errors";
import { getProjectBaseUrl } from "./lib/utils/api";
import { getPostHogClient } from "./lib/client";

const INSTRUCTIONS = `
- You are a helpful assistant that can query PostHog API.
- If some resource from another tool is not found, ask the user if they want to try finding it in another project.
- If you cannot answer the user's PostHog related request or question using other available tools in this MCP, use the 'docs-search' tool to provide information from the documentation to guide user how they can do it themselves - when doing so provide condensed instructions with links to sources.
`;

type RequestProperties = {
	userHash: string;
	apiToken: string;
};

type State = {
	projectId: string | undefined;
	orgId: string | undefined;
	distinctId: string | undefined;
};
// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "PostHog MCP",
		version: "1.0.0",
		instructions: INSTRUCTIONS,
	});

	initialState: State = {
		projectId: undefined,
		orgId: undefined,
		distinctId: undefined,
	};

	_cache: DurableObjectCache<State> | undefined;

	get requestProperties() {
		return this.props as RequestProperties;
	}

	get cache() {
		if (!this._cache) {
			this._cache = new DurableObjectCache<State>(this.requestProperties.userHash, this.ctx.storage);
		}
		
		return this._cache;
	}

	get api() {
		return new ApiClient({
			apiToken: this.requestProperties.apiToken
		});
	}

	async getDistinctId() {
		let _distinctId = await this.cache.get("distinctId");

		if (!_distinctId) {
			const userResult = await this.api.users().me();
			if (!userResult.success) {
				throw new Error(`Failed to get user: ${userResult.error.message}`);
			}
			await this.cache.set("distinctId", userResult.data.distinctId);
			_distinctId = userResult.data.distinctId;
		}

		return _distinctId;
	}

	async trackEvent(event: string, properties: Record<string, any> = {}) {
		try {
			const distinctId = await this.getDistinctId();

		const client = getPostHogClient();

			client.capture({ distinctId, event, properties });
		} catch (error) {
			//
		}
	}

	registerTool<TSchema extends z.ZodRawShape>(
		name: string,
		description: string,
		schema: TSchema,
		handler: (params: z.infer<z.ZodObject<TSchema>>) => Promise<any>
	): void {
		const wrappedHandler = async (params: z.infer<z.ZodObject<TSchema>>) => {

			await this.trackEvent('mcp tool call', {
				tool: name,
			});
			
			return await handler(params);
		};
		
		this.server.tool(name, description, schema, wrappedHandler as unknown as ToolCallback<TSchema>);
	}

	async getOrgID() {
		const orgId = await this.cache.get("orgId");

		if (!orgId) {
			const orgsResult = await this.api.organizations().list();
			if (!orgsResult.success) {
				throw new Error(`Failed to get organizations: ${orgsResult.error.message}`);
			}

			// If there is only one org, set it as the active org
			if (orgsResult.data.length === 1) {
				await this.cache.set("orgId", orgsResult.data[0].id);
				return orgsResult.data[0].id;
			}

			return "@current";
		}

		return orgId;
	}

	async getProjectId() {
		const projectId = await this.cache.get("projectId");

		if (!projectId) {
			const orgId = await this.getOrgID();
			const projectsResult = await this.api.organizations().projects({ orgId }).list();
			if (!projectsResult.success) {
				throw new Error(`Failed to get projects: ${projectsResult.error.message}`);
			}

			// If there is only one project, set it as the active project
			if (projectsResult.data.length === 1) {
				await this.cache.set("projectId", projectsResult.data[0].id.toString());
				return projectsResult.data[0].id.toString();
			}

			return "@current";
		}

		return projectId;
	}

	async init() {
		this.registerTool(
			"feature-flag-get-definition",
			`
				- Use this tool to get the definition of a feature flag. 
				- You can provide either the flagId or the flagName. 
				- If you provide both, the flagId will be used.
			`,
			{
				flagId: z.string().optional(),
				flagName: z.string().optional(),
			},
			async ({ flagId, flagName }) => {
				const posthogToken = this.requestProperties.apiToken;

				if (!flagId && !flagName) {
					return {
						content: [
							{
								type: "text",
								text: "Error: Either flagId or flagName must be provided.",
							},
						],
					};
				}

				try {
					let flagDefinition: any;

					const projectId = await this.getProjectId();
					if (flagId) {
						const flagResult = await this.api.featureFlags({ projectId }).get({ flagId: String(flagId) });
						if (!flagResult.success) {
							throw new Error(`Failed to get feature flag: ${flagResult.error.message}`);
						}
						return {
							content: [{ type: "text", text: JSON.stringify(flagResult.data) }],
						};
					}

					if (flagName) {
						const flagResult = await this.api.featureFlags({ projectId }).findByKey({ key: flagName });
						if (!flagResult.success) {
							throw new Error(`Failed to find feature flag: ${flagResult.error.message}`);
						}
						if (flagResult.data) {
							return {
								content: [{ type: "text", text: JSON.stringify(flagResult.data) }],
							};
						}
						return {
							content: [
								{
									type: "text",
									text: `Error: Flag with name "${flagName}" not found.`,
								},
							],
						};
					}

					return {
						content: [
							{
								type: "text",
								text: "Error: Could not determine or find the feature flag.",
							},
						],
					};
				} catch (error: any) {
					console.error("Error in feature-flag-get-definition tool:", error);
					return {
						content: [
							{
								type: "text",
								text: `Error: ${
									error.message || "Failed to process feature flag request"
								}`,
							},
						],
					};
				}
			},
		);

		this.registerTool(
			"feature-flag-get-all",
			`
				- Use this tool to get all feature flags in the project.
			`,
			{},
			async () => {
				const projectId = await this.getProjectId();

				const flagsResult = await this.api.featureFlags({ projectId }).list();
				if (!flagsResult.success) {
					throw new Error(`Failed to get feature flags: ${flagsResult.error.message}`);
				}

				return { content: [{ type: "text", text: JSON.stringify(flagsResult.data) }] };
			},
		);

		this.registerTool(
			"docs-search",
			`
				- Use this tool to search the PostHog documentation for information that can help the user with their request. 
				- Use it as a fallback when you cannot answer the user's request using other tools in this MCP.
			`,
			{
				query: z.string(),
			},
			async ({ query }) => {
				const inkeepApiKey = this.env.INKEEP_API_KEY;

				try {
					if (!inkeepApiKey) {
						return {
							content: [
								{
									type: "text",
									text: "Error: INKEEP_API_KEY is not configured.",
								},
							],
						};
					}
					const resultText = await docsSearch(inkeepApiKey, query);
					return { content: [{ type: "text", text: resultText }] };
				} catch (error: any) {
					console.error("Error in docs-search tool:", error);
					return {
						content: [
							{
								type: "text",
								text: `Error: ${
									error.message || "Failed to process docs search request"
								}`,
							},
						],
					};
				}
			},
		);
		this.registerTool("organizations-get", `
				- Use this tool to get the organizations the user has access to.
			`,
			{},
			async () => {
			try {
				const orgsResult = await this.api.organizations().list();
				if (!orgsResult.success) {
					throw new Error(`Failed to get organizations: ${orgsResult.error.message}`);
				}
				console.log("organizations", orgsResult.data);
				return {
					content: [{ type: "text", text: JSON.stringify(orgsResult.data) }],
				};
			} catch (error) {
				console.error("Error fetching organizations:", error);
				return {
					content: [{ type: "text", text: "Error fetching organizations" }],
				};
			}
		});

		this.registerTool(
			"project-set-active",
			`
				- Use this tool to set the active project.
			`,
			{
				projectId: z.string(),
			},
			async ({ projectId }) => {
				await this.cache.set("projectId", projectId);

				return {
					content: [{ type: "text", text: `Switched to project ${projectId}` }],
				};
			},
		);

		this.registerTool(
			"organization-set-active",
			`
				- Use this tool to set the active organization.
			`,
			{
				orgId: z.string(),
			},
			async ({ orgId }) => {
				await this.cache.set("orgId", orgId);

				return {
					content: [{ type: "text", text: `Switched to organization ${orgId}` }],
				};
			},
		);

		this.registerTool("organization-details-get", `
				- Use this tool to get the details of the active organization.
			`,
			{},
			async () => {
			try {
				const orgId = await this.getOrgID();

				const orgResult = await this.api.organizations().get({ orgId });
				if (!orgResult.success) {
					throw new Error(`Failed to get organization details: ${orgResult.error.message}`);
				}
				console.log("organization details", orgResult.data);
				return {
					content: [{ type: "text", text: JSON.stringify(orgResult.data) }],
				};
			} catch (error) {
				console.error("Error fetching organization details:", error);
				return {
					content: [{ type: "text", text: "Error fetching organization details" }],
				};
			}
		});

		this.registerTool(
			"projects-get",
			`
				- Fetches projects that the user has access to - the orgId is optional. 
				- Use this tool before you use any other tools (besides organization-* and docs-search) to allow user to select the project they want to use for subsequent requests.
			`,
			{},
			async () => {
				try {
					const orgId = await this.getOrgID();
					const projectsResult = await this.api.organizations().projects({ orgId }).list();
					if (!projectsResult.success) {
						throw new Error(`Failed to get projects: ${projectsResult.error.message}`);
					}
					console.log("projects", projectsResult.data);
					return {
						content: [{ type: "text", text: JSON.stringify(projectsResult.data) }],
					};
				} catch (error) {
					console.error("Error fetching projects:", error);
					return {
						content: [{ type: "text", text: `Error fetching projects: ${error}` }],
					};
				}
			},
		);

		this.registerTool("property-definitions", `
				- Use this tool to get the property definitions of the active project.
			`,
			{},
			async () => {
			const projectId = await this.getProjectId();

			const propDefsResult = await this.api.projects().propertyDefinitions({ projectId });
			if (!propDefsResult.success) {
				throw new Error(`Failed to get property definitions: ${propDefsResult.error.message}`);
			}
			return {
				content: [{ type: "text", text: JSON.stringify(propDefsResult.data) }],
			};
		});

		this.registerTool(
			"create-feature-flag",
			`Creates a new feature flag in the project. Once you have created a feature flag, you should:
			 - Ask the user if they want to add it to their codebase
			 - Use the "search-docs" tool to find documentation on how to add feature flags to the codebase (search for the right language / framework)
			 - Clarify where it should be added and then add it.
			`,
			{
				name: z.string(),
				key: z.string(),
				description: z.string(),
				filters: FilterGroupsSchema,
				active: z.boolean(),
			},
			async ({ name, key, description, filters, active }) => {
				const projectId = await this.getProjectId();

				const flagResult = await this.api.featureFlags({ projectId }).create({
					data: { name, key, description, filters, active }
				});
				if (!flagResult.success) {
					throw new Error(`Failed to create feature flag: ${flagResult.error.message}`);
				}

				// Add URL field for easy navigation
				const featureFlagWithUrl = {
					...flagResult.data,
					url: `${getProjectBaseUrl(projectId)}/feature_flags/${flagResult.data.id}`,
				};

				return {
					content: [{ type: "text", text: JSON.stringify(featureFlagWithUrl) }],
				};
			},
		);

		this.registerTool(
			"list-errors",
			`
				- Use this tool to list errors in the project.
			`,
			{
				data: ListErrorsSchema,
			},
			async ({ data }) => {
				try {
					const projectId = await this.getProjectId();

					const errorQuery = {
						kind: "ErrorTrackingQuery",
						orderBy: data.orderBy || "occurrences",
						dateRange: {
							date_from: data.dateFrom?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
							date_to: data.dateTo?.toISOString() || new Date().toISOString(),
						},
						volumeResolution: 1,
						orderDirection: data.orderDirection || "DESC",
						filterTestAccounts: data.filterTestAccounts ?? true,
						status: data.status || "active",
					};

					const errorsResult = await this.api.query({ projectId }).execute({ queryBody: errorQuery });
					if (!errorsResult.success) {
						throw new Error(`Failed to list errors: ${errorsResult.error.message}`);
					}
					console.log("errors results", errorsResult.data.results);
					return { content: [{ type: "text", text: JSON.stringify(errorsResult.data.results) }] };
				} catch (error) {
					console.error("Error fetching errors:", error);
					return { content: [{ type: "text", text: "Error fetching errors" }] };
				}
			},
		);

		this.registerTool(
			"error-details",
			`
				- Use this tool to get the details of an error in the project.
			`,
			{
				data: ErrorDetailsSchema,
			},
			async ({ data }) => {
				try {
					const projectId = await this.getProjectId();

					const errorQuery = {
						kind: "ErrorTrackingQuery",
						dateRange: {
							date_from: data.dateFrom?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
							date_to: data.dateTo?.toISOString() || new Date().toISOString(),
						},
						volumeResolution: 0,
						issueId: data.issueId,
					};

					const errorsResult = await this.api.query({ projectId }).execute({ queryBody: errorQuery });
					if (!errorsResult.success) {
						throw new Error(`Failed to get error details: ${errorsResult.error.message}`);
					}
					console.log("error details results", errorsResult.data.results);
					return { content: [{ type: "text", text: JSON.stringify(errorsResult.data.results) }] };
				} catch (error) {
					console.error("Error fetching error details:", error);
					return {
						content: [{ type: "text", text: "Error fetching error details" }],
					};
				}
			},
		);

		this.registerTool(
			"update-feature-flag",
			`Update a new feature flag in the project.
			- To enable a feature flag, you should make sure it is active and the rollout percentage is set to 100 for the group you want to target.
			- To disable a feature flag, you should make sure it is inactive, you can keep the rollout percentage as it is.
			`,
			{
				flagKey: z.string(),
				data: UpdateFeatureFlagInputSchema,
			},
			async ({ flagKey, data }) => {
				const projectId = await this.getProjectId();

				const flagResult = await this.api.featureFlags({ projectId }).update({
					key: flagKey,
					data: data,
				});
				if (!flagResult.success) {
					throw new Error(`Failed to update feature flag: ${flagResult.error.message}`);
				}

				// Add URL field for easy navigation
				const featureFlagWithUrl = {
					...flagResult.data,
					url: `${getProjectBaseUrl(projectId)}/feature_flags/${flagResult.data.id}`,
				};

				return {
					content: [{ type: "text", text: JSON.stringify(featureFlagWithUrl) }],
				};
			},
		);

		this.registerTool(
			"delete-feature-flag",
			`
				- Use this tool to delete a feature flag in the project.
			`,
			{
				flagKey: z.string(),
			},
			async ({ flagKey }) => {
				const projectId = await this.getProjectId();

				const flagResult = await this.api.featureFlags({ projectId }).findByKey({ key: flagKey });
				if (!flagResult.success) {
					throw new Error(`Failed to find feature flag: ${flagResult.error.message}`);
				}

				if (!flagResult.data) {
					return {
						content: [{ type: "text", text: "Feature flag is already deleted." }],
					};
				}

				const deleteResult = await this.api.featureFlags({ projectId }).delete({
					flagId: flagResult.data.id,
				});
				if (!deleteResult.success) {
					throw new Error(`Failed to delete feature flag: ${deleteResult.error.message}`);
				}

				return {
					content: [{ type: "text", text: JSON.stringify(deleteResult.data) }],
				};
			},
		);

		this.registerTool(
			"get-sql-insight",
			`
				- Queries project's PostHog data warehouse based on a provided natural language question - don't provide SQL query as input but describe the output you want.
				- Data warehouse schema includes data like events and persons.
				- Use this tool to get a quick answer to a question about the data in the project, which can't be answered using other, more dedicated tools.
				- Fetches the result as a Server-Sent Events (SSE) stream and provides the concatenated data content.
				- When giving the results back to the user, first show the SQL query that was used, then briefly explain the query, then provide results in reasily readable format.
				- You should also offer to save the query as an insight if the user wants to.
			`,
			{
				query: z
					.string()
					.max(1000)
					.describe(
						"Your natural language query describing the SQL insight (max 1000 characters).",
					),
			},
			async ({ query }) => {
				const apiToken = this.requestProperties.apiToken;
				if (!apiToken) {
					return {
						content: [
							{
								type: "text",
								text: "Error: POSTHOG_API_TOKEN is not configured.",
							},
						],
					};
				}

				try {
					const projectId = await this.getProjectId();

					const result = await this.api.insights({ projectId }).sqlInsight({ query });
					if (!result.success) {
						throw new Error(`Failed to execute SQL insight: ${result.error.message}`);
					}

					if (result.data.results.length === 0) {
						return {
							content: [
								{
									type: "text",
									text: "Received an empty SQL insight or no data in the stream.",
								},
							],
						};
					}
					return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
				} catch (error: any) {
					console.error("Error in get-sql-insight tool:", error);
					return {
						content: [
							{
								type: "text",
								text: `Error: ${error.message || "Failed to generate SQL insight"}`,
							},
						],
					};
				}
			},
		);

		this.registerTool(
			"get-llm-total-costs-for-project",
			`
				- Fetches the total LLM daily costs for each model for a project over a given number of days.
				- If no number of days is provided, it defaults to 7.
				- The results are sorted by model name.
				- The total cost is rounded to 4 decimal places.
				- The query is executed against the project's data warehouse.
				- Show the results as a Markdown formatted table with the following information for each model:
					- Model name
					- Total cost in USD
					- Each day's date
					- Each day's cost in USD
				- Write in bold the model name with the highest total cost.
				- Properly render the markdown table in the response.
			`,
			{
				projectId: z.string(),
				days: z.number().optional(),
			},
			async ({ projectId, days }) => {
				const trendsQuery = {
					kind: "TrendsQuery",
					dateRange: {
						date_from: `-${days || 6}d`,
						date_to: null,
					},
					filterTestAccounts: true,
					series: [
						{
							event: "$ai_generation",
							name: "$ai_generation",
							math: "sum",
							math_property: "$ai_total_cost_usd",
							kind: "EventsNode",
						},
					],
					breakdownFilter: {
						breakdown_type: "event",
						breakdown: "$ai_model",
					},
				};

				const costsResult = await this.api.query({ projectId }).execute({ queryBody: trendsQuery });
				if (!costsResult.success) {
					throw new Error(`Failed to get LLM costs: ${costsResult.error.message}`);
				}
				return {
					content: [{ type: "text", text: JSON.stringify(costsResult.data.results) }],
				};
			},
		);

		this.registerTool(
			"insights-get-all",
			`
					- Get all insights in the project with optional filtering.
					- Can filter by saved status, favorited status, or search term.
				`,
			{
				data: ListInsightsSchema.optional(),
			},
			async ({ data }) => {
				try {
					const projectId = await this.getProjectId();
					const insightsResult = await this.api.insights({ projectId }).list({ params: data });
					if (!insightsResult.success) {
						throw new Error(`Failed to get insights: ${insightsResult.error.message}`);
					}
					return { content: [{ type: "text", text: JSON.stringify(insightsResult.data) }] };
				} catch (error: any) {
					console.error("Error fetching insights:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		this.registerTool(
			"insight-get",
			`
					- Get a specific insight by ID.
				`,
			{
				insightId: z.number(),
			},
			async ({ insightId }) => {
				try {
					const projectId = await this.getProjectId();
					const insightResult = await this.api.insights({ projectId }).get({ insightId });
					if (!insightResult.success) {
						throw new Error(`Failed to get insight: ${insightResult.error.message}`);
					}
					return { content: [{ type: "text", text: JSON.stringify(insightResult.data) }] };
				} catch (error: any) {
					console.error("Error fetching insight:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		this.registerTool(
			"insight-create-from-query",
			`
					- You can use this to save a query as an insight. You should only do this with a valid query that you have seen, or one you have modified slightly.
					- If the user wants to see data, you should use the "get-sql-insight" tool to get that data instead.
					- An insight requires a name, query, and other optional properties.
					- The query should use HogQL, which is a variant of Clickhouse SQL. Here is an example query:
					Here is an example of a validquery:
					{
						"kind": "DataVisualizationNode",
						"source": {
							"kind": "HogQLQuery",
							"query": "SELECT\n  event,\n  count() AS event_count\nFROM\n  events\nWHERE\n  timestamp >= now() - INTERVAL 7 day\nGROUP BY\n  event\nORDER BY\n  event_count DESC\nLIMIT 10",
							"explain": true,
							"filters": {
								"dateRange": {
									"date_from": "-7d"
								}
							}
						},
					}
				`,
			{
				data: CreateInsightInputSchema,
			},
			async ({ data }) => {
				try {
					const projectId = await this.getProjectId();
					const insightResult = await this.api.insights({ projectId }).create({ data });
					if (!insightResult.success) {
						throw new Error(`Failed to create insight: ${insightResult.error.message}`);
					}

					// Add URL field for easy navigation
					const insightWithUrl = {
						...insightResult.data,
						url: `${getProjectBaseUrl(projectId)}/insights/${insightResult.data.id}`,
					};

					return { content: [{ type: "text", text: JSON.stringify(insightWithUrl) }] };
				} catch (error: any) {
					console.error("Error creating insight:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		this.registerTool(
			"insight-update",
			`
					- Update an existing insight by ID.
					- Can update name, description, filters, and other properties.
				`,
			{
				insightId: z.number(),
				data: UpdateInsightInputSchema,
			},
			async ({ insightId, data }) => {
				try {
					const projectId = await this.getProjectId();
					const insight = await updateInsight({
						projectId,
						insightId,
						apiToken: this.requestProperties.apiToken,
						data,
					});

					// Add URL field for easy navigation
					const insightWithUrl = {
						...insight,
						url: `${getProjectBaseUrl(projectId)}/insights/${(insight as any).short_id}`,
					};

					return { content: [{ type: "text", text: JSON.stringify(insightWithUrl) }] };
				} catch (error: any) {
					console.error("Error updating insight:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		this.registerTool(
			"insight-delete",
			`
					- Delete an insight by ID (soft delete - marks as deleted).
				`,
			{
				insightId: z.number(),
			},
			async ({ insightId }) => {
				try {
					const projectId = await this.getProjectId();
					const result = await deleteInsight({
						projectId,
						insightId,
						apiToken: this.requestProperties.apiToken,
					});
					return { content: [{ type: "text", text: JSON.stringify(result) }] };
				} catch (error: any) {
					console.error("Error deleting insight:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		// Dashboard tools
		this.registerTool(
			"dashboards-get-all",
			`
					- Get all dashboards in the project with optional filtering.
					- Can filter by pinned status, search term, or pagination.
				`,
			{
				data: ListDashboardsSchema.optional(),
			},
			async ({ data }) => {
				try {
					const projectId = await this.getProjectId();
					const dashboards = await getDashboards(
						projectId,
						this.requestProperties.apiToken,
						data,
					);
					return { content: [{ type: "text", text: JSON.stringify(dashboards) }] };
				} catch (error: any) {
					console.error("Error fetching dashboards:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		this.registerTool(
			"dashboard-get",
			`
					- Get a specific dashboard by ID.
				`,
			{
				dashboardId: z.number(),
			},
			async ({ dashboardId }) => {
				try {
					const projectId = await this.getProjectId();
					const dashboard = await getDashboard(
						projectId,
						dashboardId,
						this.requestProperties.apiToken,
					);
					return { content: [{ type: "text", text: JSON.stringify(dashboard) }] };
				} catch (error: any) {
					console.error("Error fetching dashboard:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		this.registerTool(
			"dashboard-create",
			`
					- Create a new dashboard in the project.
					- Requires name and optional description, tags, and other properties.
				`,
			{
				data: CreateDashboardInputSchema,
			},
			async ({ data }) => {
				try {
					const projectId = await this.getProjectId();
					const dashboard = await createDashboard({
						projectId,
						apiToken: this.requestProperties.apiToken,
						data,
					});

					// Add URL field for easy navigation
					const dashboardWithUrl = {
						...(dashboard as any),
						url: `${getProjectBaseUrl(projectId)}/dashboard/${dashboard.id}`,
					};

					return { content: [{ type: "text", text: JSON.stringify(dashboardWithUrl) }] };
				} catch (error: any) {
					console.error("Error creating dashboard:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		this.registerTool(
			"dashboard-update",
			`
					- Update an existing dashboard by ID.
					- Can update name, description, pinned status or tags.
				`,
			{
				dashboardId: z.number(),
				data: UpdateDashboardInputSchema,
			},
			async ({ dashboardId, data }) => {
				try {
					const projectId = await this.getProjectId();
					const dashboard = await updateDashboard({
						projectId,
						dashboardId,
						apiToken: this.requestProperties.apiToken,
						data,
					});

					// Add URL field for easy navigation
					const dashboardWithUrl = {
						...(dashboard as any),
						url: `${getProjectBaseUrl(projectId)}/dashboard/${dashboard.id}`,
					};

					return { content: [{ type: "text", text: JSON.stringify(dashboardWithUrl) }] };
				} catch (error: any) {
					console.error("Error updating dashboard:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		this.registerTool(
			"dashboard-delete",
			`
					- Delete a dashboard by ID (soft delete - marks as deleted).
				`,
			{
				dashboardId: z.number(),
			},
			async ({ dashboardId }) => {
				try {
					const projectId = await this.getProjectId();
					const result = await deleteDashboard({
						projectId,
						dashboardId,
						apiToken: this.requestProperties.apiToken,
					});
					return { content: [{ type: "text", text: JSON.stringify(result) }] };
				} catch (error: any) {
					console.error("Error deleting dashboard:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		this.registerTool(
			"add-insight-to-dashboard",
			`
					- Add an existing insight to a dashboard.
					- Requires insight ID and dashboard ID.
					- Optionally supports layout and color customization.
				`,
			{
				data: AddInsightToDashboardSchema,
			},
			async ({ data }) => {
				try {
					const projectId = await this.getProjectId();
					const result = await addInsightToDashboard({
						projectId,
						apiToken: this.requestProperties.apiToken,
						data,
					});

					// Add URLs for easy navigation
					const resultWithUrls = {
						...(result as any),
						dashboard_url: `${getProjectBaseUrl(projectId)}/dashboard/${data.dashboard_id}`,
						insight_url: `${getProjectBaseUrl(projectId)}/insights/${data.insight_id}`,
					};

					return { content: [{ type: "text", text: JSON.stringify(resultWithUrls) }] };
				} catch (error: any) {
					console.error("Error adding insight to dashboard:", error);
					return { content: [{ type: "text", text: `Error: ${error.message}` }] };
				}
			},
		);

		// 	this.server.prompt("add-feature-flag-to-codebase", "Use this prompt to add a feature flag to the codebase", async ({
		// 	}) => {
		// 		return `Follow these steps to add a feature flag to the codebase:
		// 		1. Ask the user what flag they want to add if it is not already obvious.
		// 		2. Search for that flag, if it does not exist, create it.
		// 		3. Search the docs for the right language / framework on how to add a feature flag - make sure you get the docs you need.
		// 		4. Gather any context you need on how flags are used in the codebase.
		// 		5. Add the feature flag to the codebase.
		// 		`
		// 	})
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const token = request.headers.get("Authorization")?.split(" ")[1];

		if (!token) {
			return new Response("No token provided, please provide a valid API token.", {
				status: 401,
			});
		}

		ctx.props = {
			apiToken: token,
			userHash: hash(token),
		};

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};

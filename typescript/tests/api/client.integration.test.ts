import { ApiClient } from "@/api/client";
import type { CreateInsightInput } from "@/schema/insights";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

// Helper function for detailed API logging
const logApiResponse = (testName: string, success: boolean, data?: any, error?: any) => {
	console.log(`[${testName}] API Response:`, {
		success,
		...(success
			? { data: JSON.stringify(data, null, 2) }
			: {
					error: error?.message,
					fullError: JSON.stringify(error, null, 2),
				}),
	});
};

const API_BASE_URL = process.env.TEST_POSTHOG_API_BASE_URL || "http://localhost:8010";
const API_TOKEN = process.env.TEST_POSTHOG_PERSONAL_API_KEY;
const TEST_ORG_ID = process.env.TEST_ORG_ID;
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID;

describe("API Client Integration Tests", { concurrent: false }, () => {
	let client: ApiClient;
	let testOrgId: string;
	let testProjectId: string;

	// Track created resources for cleanup
	const createdResources = {
		featureFlags: [] as number[],
		insights: [] as number[],
		dashboards: [] as number[],
	};

	beforeAll(async () => {
		if (!API_TOKEN) {
			throw new Error("TEST_POSTHOG_PERSONAL_API_KEY environment variable is required");
		}

		if (!TEST_ORG_ID) {
			throw new Error("TEST_ORG_ID environment variable is required");
		}

		if (!TEST_PROJECT_ID) {
			throw new Error("TEST_PROJECT_ID environment variable is required");
		}

		client = new ApiClient({
			apiToken: API_TOKEN,
			baseUrl: API_BASE_URL,
		});

		testOrgId = TEST_ORG_ID;
		testProjectId = TEST_PROJECT_ID;
	});

	afterEach(async () => {
		// Clean up created feature flags
		for (const flagId of createdResources.featureFlags) {
			try {
				await client.featureFlags({ projectId: testProjectId }).delete({ flagId });
			} catch (error) {
				console.warn(`Failed to cleanup feature flag ${flagId}:`, error);
			}
		}
		createdResources.featureFlags = [];

		// Clean up created insights
		for (const insightId of createdResources.insights) {
			try {
				await client.insights({ projectId: testProjectId }).delete({ insightId });
			} catch (error) {
				console.warn(`Failed to cleanup insight ${insightId}:`, error);
			}
		}
		createdResources.insights = [];

		// Clean up created dashboards
		for (const dashboardId of createdResources.dashboards) {
			try {
				await client.dashboards({ projectId: testProjectId }).delete({ dashboardId });
			} catch (error) {
				console.warn(`Failed to cleanup dashboard ${dashboardId}:`, error);
			}
		}
		createdResources.dashboards = [];
	});

	describe("Organizations API", () => {
		it("should list organizations", async () => {
			const result = await client.organizations().list();

			if (!result.success) {
				console.error("Failed to list organizations:", (result as any).error);
			}

			expect(result.success).toBe(true);

			if (result.success) {
				expect(Array.isArray(result.data)).toBe(true);
				if (result.data.length > 0) {
					const org = result.data[0];
					expect(org).toHaveProperty("id");
					expect(org).toHaveProperty("name");
					if (org) {
						expect(typeof org.id).toBe("string");
						expect(typeof org.name).toBe("string");
					}
				}
			}
		});

		it("should get organization details", async () => {
			const result = await client.organizations().get({ orgId: testOrgId });

			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data).toHaveProperty("id");
				expect(result.data).toHaveProperty("name");
				expect(result.data.id).toBe(testOrgId);
			}
		});

		it("should list projects for organization", async () => {
			const result = await client.organizations().projects({ orgId: testOrgId }).list();

			if (!result.success) {
				console.error("Failed to list projects:", (result as any).error);
			}

			expect(result.success).toBe(true);

			if (result.success) {
				expect(Array.isArray(result.data)).toBe(true);
				if (result.data.length > 0) {
					const project = result.data[0];
					expect(project).toHaveProperty("id");
					expect(project).toHaveProperty("name");
					if (project) {
						expect(typeof project.id).toBe("number");
						expect(typeof project.name).toBe("string");
					}
				}
			}
		});
	});

	describe("Projects API", () => {
		it("should get project details", async () => {
			const result = await client.projects().get({ projectId: testProjectId });

			if (!result.success) {
				console.error("Failed to get project details:", (result as any).error);
			}

			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data).toHaveProperty("id");
				expect(result.data).toHaveProperty("name");
				expect(result.data.id).toBe(Number(testProjectId));
			}
		});

		it("should get property definitions", async () => {
			const result = await client
				.projects()
				.propertyDefinitions({ projectId: testProjectId });

			expect(result.success).toBe(true);

			if (result.success) {
				expect(Array.isArray(result.data)).toBe(true);
				if (result.data.length > 0) {
					const propDef = result.data[0];
					expect(propDef).toHaveProperty("id");
					expect(propDef).toHaveProperty("name");
				}
			}
		});
	});

	describe("Feature Flags API", () => {
		it("should list feature flags", async () => {
			const result = await client.featureFlags({ projectId: testProjectId }).list();

			expect(result.success).toBe(true);

			if (result.success) {
				expect(Array.isArray(result.data)).toBe(true);
				for (const flag of result.data) {
					expect(flag).toHaveProperty("id");
					expect(flag).toHaveProperty("key");
					expect(flag).toHaveProperty("name");
					expect(flag).toHaveProperty("active");
					expect(typeof flag.id).toBe("number");
					expect(typeof flag.key).toBe("string");
					expect(typeof flag.name).toBe("string");
					expect(typeof flag.active).toBe("boolean");
				}
			}
		});

		it("should create, get, update, and delete a feature flag", async () => {
			const testKey = `test-flag-${Date.now()}`;

			// Create
			const createResult = await client.featureFlags({ projectId: testProjectId }).create({
				data: {
					key: testKey,
					name: "Test Flag",
					description: "Test feature flag",
					active: true,
					filters: { groups: [] },
				},
			});

			expect(createResult.success).toBe(true);

			if (createResult.success) {
				const flagId = createResult.data.id;
				createdResources.featureFlags.push(flagId);

				// Get by ID
				const getResult = await client
					.featureFlags({ projectId: testProjectId })
					.get({ flagId });
				expect(getResult.success).toBe(true);

				if (getResult.success) {
					expect(getResult.data.key).toBe(testKey);
					expect(getResult.data.name).toBe("Test Flag");
				}

				// Find by key
				const findResult = await client
					.featureFlags({ projectId: testProjectId })
					.findByKey({ key: testKey });
				expect(findResult.success).toBe(true);

				if (findResult.success && findResult.data) {
					expect(findResult.data.id).toBe(flagId);
					expect(findResult.data.key).toBe(testKey);
				}

				// Update
				const updateResult = await client
					.featureFlags({ projectId: testProjectId })
					.update({
						key: testKey,
						data: {
							name: "Updated Test Flag",
							active: false,
						},
					});
				expect(updateResult.success).toBe(true);

				// Verify update
				const updatedGetResult = await client
					.featureFlags({ projectId: testProjectId })
					.get({ flagId });
				if (updatedGetResult.success) {
					expect(updatedGetResult.data.name).toBe("Updated Test Flag");
					expect(updatedGetResult.data.active).toBe(false);
				}

				// Delete will be handled by afterEach cleanup
			}
		});
	});

	describe("Insights API", () => {
		it("should list insights", async () => {
			const result = await client.insights({ projectId: testProjectId }).list();

			expect(result.success).toBe(true);

			if (result.success) {
				expect(Array.isArray(result.data)).toBe(true);
				for (const insight of result.data) {
					expect(insight).toHaveProperty("id");
					expect(insight).toHaveProperty("name");
					expect(typeof insight.id).toBe("number");
					expect(typeof insight.name).toBe("string");
				}
			}
		});

		it.skip("should execute SQL insight query", async () => {
			const result = await client
				.insights({ projectId: testProjectId })
				.sqlInsight({ query: "SELECT 1 as test" });

			if (!result.success) {
				console.error("Failed to execute SQL insight:", (result as any).error);
			}

			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data).toHaveProperty("columns");
				expect(result.data).toHaveProperty("results");
				if ("columns" in result.data && "results" in result.data) {
					expect(Array.isArray(result.data.columns)).toBe(true);
					expect(Array.isArray(result.data.results)).toBe(true);
				}
			}
		});

		it("should create, get, update, and delete an insight", async () => {
			const createResult = await client.insights({ projectId: testProjectId }).create({
				data: {
					name: "Test Insight",
					query: {
						kind: "DataVisualizationNode",
						source: {
							kind: "HogQLQuery",
							query: "SELECT 1 as test",
							filters: {
								dateRange: {
									date_from: "-7d",
									date_to: "1d",
								},
							},
						},
					},
					saved: true,
					favorited: false,
				},
			});

			if (!createResult.success) {
				console.error("Failed to create insight:", (createResult as any).error);
			}

			expect(createResult.success).toBe(true);

			if (createResult.success) {
				const insightId = createResult.data.id;
				createdResources.insights.push(insightId);

				// Get
				const getResult = await client
					.insights({ projectId: testProjectId })
					.get({ insightId: insightId.toString() });

				if (!getResult.success) {
					console.error("Failed to get insight:", (getResult as any).error);
				}

				expect(getResult.success).toBe(true);

				if (getResult.success) {
					expect(getResult.data.name).toBe("Test Insight");
				}

				// Update
				const updateResult = await client.insights({ projectId: testProjectId }).update({
					insightId,
					data: {
						name: "Updated Test Insight",
					},
				});
				expect(updateResult.success).toBe(true);

				// Delete will be handled by afterEach cleanup
			}
		});

		describe("Trends Query Tests", () => {
			it("should create trends insight with minimal parameters", async () => {
				const insightData: CreateInsightInput = {
					name: "Basic Trends Test",
					query: {
						kind: "InsightVizNode",
						source: {
							kind: "TrendsQuery",
							series: [
								{
									kind: "EventsNode",
									event: "$pageview",
									math: "total",
								},
							],
							properties: [],
							filterTestAccounts: false,
							interval: "day",
						},
					},
					saved: true,
					favorited: false,
				};

				const result = await client.insights({ projectId: testProjectId }).create({
					data: insightData,
				});

				logApiResponse(
					"Basic Trends",
					result.success,
					result.success ? result.data : undefined,
					result.success ? undefined : (result as any).error,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					createdResources.insights.push(result.data.id);
				}
			});

			it("should create trends insight with all display types", async () => {
				const displayTypes = [
					"ActionsLineGraph",
					"ActionsTable",
					"ActionsPie",
					"ActionsBar",
					"ActionsBarValue",
					"WorldMap",
					"BoldNumber",
				] as const;

				for (const display of displayTypes) {
					const insightData: CreateInsightInput = {
						name: `Trends Display - ${display}`,
						query: {
							kind: "InsightVizNode",
							source: {
								kind: "TrendsQuery",
								series: [
									{
										kind: "EventsNode",
										event: "$pageview",
										math: "total",
									},
								],
								trendsFilter: {
									display,
									showLegend: true,
								},
								properties: [],
								filterTestAccounts: true,
								interval: "day",
							},
						},
						favorited: false,
						saved: true,
					};

					const result = await client.insights({ projectId: testProjectId }).create({
						data: insightData,
					});

					logApiResponse(
						`Trends ${display}`,
						result.success,
						result.success ? result.data : undefined,
						result.success ? undefined : (result as any).error,
					);

					expect(result.success).toBe(true);
					if (result.success) {
						createdResources.insights.push(result.data.id);
					}
				}
			});

			it("should create trends insight with breakdowns", async () => {
				const breakdownTypes = ["event", "person"] as const;

				for (const breakdownType of breakdownTypes) {
					const insightData: CreateInsightInput = {
						name: `Trends Breakdown - ${breakdownType}`,
						query: {
							kind: "InsightVizNode",
							source: {
								kind: "TrendsQuery",
								series: [
									{
										kind: "EventsNode",
										event: "$pageview",
										math: "total",
									},
								],
								breakdownFilter: {
									breakdown_type: breakdownType,
									breakdown:
										breakdownType === "event" ? "$current_url" : "$browser",
									breakdown_limit: 10,
								},
								properties: [],
								filterTestAccounts: true,
								interval: "day",
							},
						},
						favorited: false,
						saved: true,
					};

					const result = await client.insights({ projectId: testProjectId }).create({
						data: insightData,
					});

					logApiResponse(
						`Trends Breakdown ${breakdownType}`,
						result.success,
						result.success ? result.data : undefined,
						result.success ? undefined : (result as any).error,
					);

					expect(result.success).toBe(true);
					if (result.success) {
						createdResources.insights.push(result.data.id);
					}
				}
			});

			it("should create trends insight with different intervals", async () => {
				const intervals = ["hour", "day", "week", "month"] as const;

				for (const interval of intervals) {
					const insightData: CreateInsightInput = {
						name: `Trends Interval - ${interval}`,
						query: {
							kind: "InsightVizNode",
							source: {
								kind: "TrendsQuery",
								dateRange: {
									date_from: "-30d",
									date_to: null,
								},
								interval,
								series: [
									{
										kind: "EventsNode",
										event: "$pageview",
										math: "total",
									},
								],
								properties: [],
								filterTestAccounts: true,
							},
						},
						favorited: false,
						saved: true,
					};

					const result = await client.insights({ projectId: testProjectId }).create({
						data: insightData,
					});

					logApiResponse(
						`Trends Interval ${interval}`,
						result.success,
						result.success ? result.data : undefined,
						result.success ? undefined : (result as any).error,
					);

					expect(result.success).toBe(true);
					if (result.success) {
						createdResources.insights.push(result.data.id);
					}
				}
			});

			it("should create trends insight with compare filter", async () => {
				const insightData: CreateInsightInput = {
					name: "Trends Compare Test",
					query: {
						kind: "InsightVizNode",
						source: {
							kind: "TrendsQuery",
							series: [
								{
									kind: "EventsNode",
									event: "$pageview",
									math: "total",
								},
							],
							compareFilter: {
								compare: true,
								compare_to: "-1w",
							},
							properties: [],
							filterTestAccounts: false,
							interval: "day",
						},
					},
					favorited: false,
					saved: true,
				};

				const result = await client.insights({ projectId: testProjectId }).create({
					data: insightData,
				});

				logApiResponse(
					"Trends Compare",
					result.success,
					result.success ? result.data : undefined,
					result.success ? undefined : (result as any).error,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					createdResources.insights.push(result.data.id);
				}
			});

			it("should create trends insight with property filters", async () => {
				const insightData: CreateInsightInput = {
					name: "Trends Property Filters",
					query: {
						kind: "InsightVizNode",
						source: {
							kind: "TrendsQuery",
							series: [
								{
									kind: "EventsNode",
									event: "$pageview",
									math: "total",
									properties: [
										{
											key: "$browser",
											value: ["Chrome", "Safari"],
											operator: "exact",
											type: "event",
										},
									],
								},
							],
							properties: [
								{
									key: "$current_url",
									value: "/dashboard",
									operator: "icontains",
									type: "event",
								},
							],
							filterTestAccounts: false,
							interval: "day",
						},
					},
					favorited: false,
					saved: true,
				};

				const result = await client.insights({ projectId: testProjectId }).create({
					data: insightData,
				});

				logApiResponse(
					"Trends Property Filter",
					result.success,
					result.success ? result.data : undefined,
					result.success ? undefined : (result as any).error,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					createdResources.insights.push(result.data.id);
				}
			});
		});

		describe("Funnels Query Tests", () => {
			it("should create funnel insight with minimal parameters", async () => {
				const insightData: CreateInsightInput = {
					name: "Basic Funnel Test",
					query: {
						kind: "InsightVizNode",
						source: {
							kind: "FunnelsQuery",
							series: [
								{
									kind: "EventsNode",
									event: "$pageview",
									math: "total",
								},
								{
									kind: "EventsNode",
									event: "button_clicked",
									math: "total",
								},
							],
							properties: [],
							filterTestAccounts: false,
						},
					},
					favorited: false,
					saved: true,
				};

				const result = await client.insights({ projectId: testProjectId }).create({
					data: insightData,
				});

				logApiResponse(
					"Basic Funnel",
					result.success,
					result.success ? result.data : undefined,
					result.success ? undefined : (result as any).error,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					createdResources.insights.push(result.data.id);
				}
			});

			it("should create funnel insight with different layouts and order types", async () => {
				const configs = [
					{ layout: "horizontal" as const, orderType: "ordered" as const },
					{ layout: "vertical" as const, orderType: "unordered" as const },
					{ layout: "vertical" as const, orderType: "strict" as const },
				];

				for (const config of configs) {
					const insightData: CreateInsightInput = {
						name: `Funnel ${config.layout} ${config.orderType}`,
						query: {
							kind: "InsightVizNode",
							source: {
								kind: "FunnelsQuery",
								series: [
									{
										kind: "EventsNode",
										event: "$pageview",
										math: "total",
									},
									{
										kind: "EventsNode",
										event: "button_clicked",
										math: "total",
									},
								],
								funnelsFilter: {
									layout: config.layout,
									funnelOrderType: config.orderType,
									funnelWindowInterval: 7,
									funnelWindowIntervalUnit: "day",
								},
								properties: [],
								filterTestAccounts: false,
							},
						},
						favorited: false,
						saved: true,
					};

					const result = await client.insights({ projectId: testProjectId }).create({
						data: insightData,
					});

					logApiResponse(
						`Funnel ${config.layout} ${config.orderType}`,
						result.success,
						result.success ? result.data : undefined,
						result.success ? undefined : (result as any).error,
					);

					expect(result.success).toBe(true);
					if (result.success) {
						createdResources.insights.push(result.data.id);
					}
				}
			});

			it("should create funnel insight with breakdown attribution", async () => {
				const attributionTypes = ["first_touch", "last_touch", "all_events"] as const;

				for (const attribution of attributionTypes) {
					const insightData: CreateInsightInput = {
						name: `Funnel Attribution - ${attribution}`,
						query: {
							kind: "InsightVizNode",
							source: {
								kind: "FunnelsQuery",
								series: [
									{
										kind: "EventsNode",
										event: "$pageview",
										math: "total",
									},
									{
										kind: "EventsNode",
										event: "button_clicked",
										math: "total",
									},
								],
								breakdownFilter: {
									breakdown_type: "event",
									breakdown: "$browser",
									breakdown_limit: 5,
								},
								funnelsFilter: {
									breakdownAttributionType: attribution,
								},
								properties: [],
								filterTestAccounts: false,
							},
						},
						favorited: false,
						saved: true,
					};

					const result = await client.insights({ projectId: testProjectId }).create({
						data: insightData,
					});

					logApiResponse(
						`Funnel Attribution ${attribution}`,
						result.success,
						result.success ? result.data : undefined,
						result.success ? undefined : (result as any).error,
					);

					expect(result.success).toBe(true);
					if (result.success) {
						createdResources.insights.push(result.data.id);
					}
				}
			});

			it("should create funnel insight with conversion window", async () => {
				const windowUnits = ["minute", "hour", "day", "week", "month"] as const;

				for (const unit of windowUnits) {
					const insightData: CreateInsightInput = {
						name: `Funnel Window - ${unit}`,
						query: {
							kind: "InsightVizNode",
							source: {
								kind: "FunnelsQuery",
								series: [
									{
										kind: "EventsNode",
										event: "$pageview",
										math: "total",
									},
									{
										kind: "EventsNode",
										event: "button_clicked",
										math: "total",
									},
								],
								funnelsFilter: {
									funnelWindowInterval:
										unit === "minute" ? 30 : unit === "hour" ? 2 : 7,
									funnelWindowIntervalUnit: unit,
								},
								properties: [],
								filterTestAccounts: false,
							},
						},
						favorited: false,
						saved: true,
					};

					const result = await client.insights({ projectId: testProjectId }).create({
						data: insightData,
					});

					logApiResponse(
						`Funnel Window ${unit}`,
						result.success,
						result.success ? result.data : undefined,
						result.success ? undefined : (result as any).error,
					);

					expect(result.success).toBe(true);
					if (result.success) {
						createdResources.insights.push(result.data.id);
					}
				}
			});
		});

		describe("HogQL Query Tests", () => {
			it("should create HogQL insight with basic query", async () => {
				const insightData: CreateInsightInput = {
					name: "Basic HogQL Test",
					query: {
						kind: "DataVisualizationNode" as const,
						source: {
							kind: "HogQLQuery" as const,
							query: "SELECT count() as total_events FROM events WHERE event = '$pageview'",
							filters: {
								dateRange: {
									date_from: "-7d",
									date_to: null,
								},
								filterTestAccounts: true,
							},
						},
					},
					saved: true,
					favorited: false,
				};

				const result = await client.insights({ projectId: testProjectId }).create({
					data: insightData,
				});

				logApiResponse(
					"Basic HogQL",
					result.success,
					result.success ? result.data : undefined,
					result.success ? undefined : (result as any).error,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					createdResources.insights.push(result.data.id);
				}
			});

			it("should create HogQL insight with aggregation query", async () => {
				const insightData: CreateInsightInput = {
					name: "HogQL Aggregation Test",
					query: {
						kind: "DataVisualizationNode" as const,
						source: {
							kind: "HogQLQuery" as const,
							query: `
								SELECT 
									toDate(timestamp) as date,
									count() as events,
									uniq(distinct_id) as unique_users,
									avg(toFloat(JSONExtractString(properties, '$screen_width'))) as avg_screen_width
								FROM events 
								WHERE event = '$pageview' 
									AND timestamp >= now() - INTERVAL 30 DAY
								GROUP BY date 
								ORDER BY date
							`,
							filters: {
								dateRange: {
									date_from: "-30d",
									date_to: null,
								},
								filterTestAccounts: true,
							},
						},
					},
					saved: true,
					favorited: false,
				};

				const result = await client.insights({ projectId: testProjectId }).create({
					data: insightData,
				});

				logApiResponse(
					"HogQL Aggregation",
					result.success,
					result.success ? result.data : undefined,
					result.success ? undefined : (result as any).error,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					createdResources.insights.push(result.data.id);
				}
			});

			it("should create HogQL insight with property filters", async () => {
				const insightData: CreateInsightInput = {
					name: "HogQL Property Filter Test",
					query: {
						kind: "DataVisualizationNode" as const,
						source: {
							kind: "HogQLQuery" as const,
							query: `
								SELECT 
									JSONExtractString(properties, '$browser') as browser,
									count() as pageviews
								FROM events 
								WHERE event = '$pageview'
								GROUP BY browser
								ORDER BY pageviews DESC
								LIMIT 10
							`,
							filters: {
								dateRange: {
									date_from: "-30d",
									date_to: null,
								},
								filterTestAccounts: true,
								properties: [
									{
										key: "$browser",
										value: "Chrome",
										operator: "exact",
										type: "event",
									},
								],
							},
						},
					},
					saved: true,
					favorited: false,
				};

				const result = await client.insights({ projectId: testProjectId }).create({
					data: insightData,
				});

				logApiResponse(
					"HogQL Property Filter",
					result.success,
					result.success ? result.data : undefined,
					result.success ? undefined : (result as any).error,
				);

				expect(result.success).toBe(true);
				if (result.success) {
					createdResources.insights.push(result.data.id);
				}
			});
		});
	});

	describe("Dashboards API", () => {
		it("should list dashboards", async () => {
			const result = await client.dashboards({ projectId: testProjectId }).list();

			expect(result.success).toBe(true);

			if (result.success) {
				expect(Array.isArray(result.data)).toBe(true);
				for (const dashboard of result.data) {
					expect(dashboard).toHaveProperty("id");
					expect(dashboard).toHaveProperty("name");
					expect(typeof dashboard.id).toBe("number");
					expect(typeof dashboard.name).toBe("string");
				}
			}
		});

		it("should create, get, update, and delete a dashboard", async () => {
			const createResult = await client.dashboards({ projectId: testProjectId }).create({
				data: {
					name: "Test Dashboard",
					description: "Test dashboard for API tests",
					pinned: false,
				},
			});

			expect(createResult.success).toBe(true);

			if (createResult.success) {
				const dashboardId = createResult.data.id;
				createdResources.dashboards.push(dashboardId);

				// Get
				const getResult = await client
					.dashboards({ projectId: testProjectId })
					.get({ dashboardId });
				expect(getResult.success).toBe(true);

				if (getResult.success) {
					expect(getResult.data.name).toBe("Test Dashboard");
				}

				// Update
				const updateResult = await client.dashboards({ projectId: testProjectId }).update({
					dashboardId,
					data: {
						name: "Updated Test Dashboard",
					},
				});
				expect(updateResult.success).toBe(true);

				// Delete will be handled by afterEach cleanup
			}
		});
	});

	describe("Query API", () => {
		it("should execute error tracking query", async () => {
			const errorQuery = {
				kind: "ErrorTrackingQuery",
				orderBy: "occurrences",
				dateRange: {
					date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
					date_to: new Date().toISOString(),
				},
				volumeResolution: 1,
				orderDirection: "DESC",
				filterTestAccounts: true,
				status: "active",
			};

			const result = await client
				.query({ projectId: testProjectId })
				.execute({ queryBody: errorQuery });

			if (!result.success) {
				console.error("Failed to execute error query:", (result as any).error);
			}

			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data).toHaveProperty("results");
				expect(Array.isArray(result.data.results)).toBe(true);
			}
		});

		it("should execute trends query for LLM costs", async () => {
			const trendsQuery = {
				kind: "TrendsQuery",
				dateRange: {
					date_from: "-6d",
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

			const result = await client
				.query({ projectId: testProjectId })
				.execute({ queryBody: trendsQuery });

			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data).toHaveProperty("results");
				expect(Array.isArray(result.data.results)).toBe(true);
			}
		});
	});

	describe("Users API", () => {
		it("should get current user", async () => {
			const result = await client.users().me();

			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data).toHaveProperty("distinctId");
				expect(typeof result.data.distinctId).toBe("string");
			}
		});
	});
});

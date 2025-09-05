import { ApiClient } from "@/api/client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

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
				.propertyDefinitions({ 
					projectId: testProjectId,
					eventNames: ["$pageview"],
					excludeCoreProperties: true,
					filterByEventNames: true,
					isFeatureFlag: false,
					limit: 100
				});

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

		it("should get event definitions", async () => {
			const result = await client
				.projects()
				.eventDefinitions({ projectId: testProjectId });

			expect(result.success).toBe(true);

			if (result.success) {
				expect(Array.isArray(result.data)).toBe(true);
				if (result.data.length > 0) {
					const eventDef = result.data[0];
					expect(eventDef).toHaveProperty("id");
					expect(eventDef).toHaveProperty("name");
					expect(eventDef).toHaveProperty("last_seen_at");
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

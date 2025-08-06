import { describe, it, expect, beforeAll, afterEach } from "vitest";
import {
	validateEnvironmentVariables,
	createTestClient,
	createTestContext,
	setActiveProjectAndOrg,
	cleanupResources,
	parseToolResponse,
	generateUniqueKey,
	SAMPLE_HOGQL_QUERIES,
	TEST_PROJECT_ID,
	TEST_ORG_ID,
	type CreatedResources,
} from "@/shared/test-utils";
import createInsightTool from "@/tools/insights/create";
import updateInsightTool from "@/tools/insights/update";
import deleteInsightTool from "@/tools/insights/delete";
import getAllInsightsTool from "@/tools/insights/getAll";
import getInsightTool from "@/tools/insights/get";
import type { Context } from "@/tools/types";

describe("Insights", { concurrent: false }, () => {
	// All tests run sequentially to avoid conflicts with shared PostHog project
	let context: Context;
	const createdResources: CreatedResources = {
		featureFlags: [],
		insights: [],
		dashboards: [],
	};

	beforeAll(async () => {
		validateEnvironmentVariables();
		const client = createTestClient();
		context = createTestContext(client);
		await setActiveProjectAndOrg(context, TEST_PROJECT_ID!, TEST_ORG_ID!);
	});

	afterEach(async () => {
		await cleanupResources(context.api, TEST_PROJECT_ID!, createdResources);
	});

	describe("create-insight tool", () => {
		const createTool = createInsightTool();

		it("should create an insight with pageview query", async () => {
			const params = {
				data: {
					name: generateUniqueKey("Test Pageview Insight"),
					description: "Integration test for pageview insight",
					query: SAMPLE_HOGQL_QUERIES.pageviews,
					saved: true,
					favorited: false,
				},
			};

			const result = await createTool.handler(context, params);

			const insightData = parseToolResponse(result);
			expect(insightData.id).toBeDefined();
			expect(insightData.name).toBe(params.data.name);
			expect(insightData.url).toContain("/insights/");

			createdResources.insights.push(insightData.id);
		});

		it("should create an insight with top events query", async () => {
			const params = {
				data: {
					name: generateUniqueKey("Test Top Events Insight"),
					description: "Integration test for top events insight",
					query: SAMPLE_HOGQL_QUERIES.topEvents,
					saved: true,
					favorited: false,
				},
			};

			const result = await createTool.handler(context, params);

			const insightData = parseToolResponse(result);
			expect(insightData.id).toBeDefined();
			expect(insightData.name).toBe(params.data.name);

			createdResources.insights.push(insightData.id);
		});

		it("should create an insight with tags", async () => {
			const params = {
				data: {
					name: generateUniqueKey("Test Tagged Insight"),
					description: "Integration test with tags",
					query: SAMPLE_HOGQL_QUERIES.pageviews,
					tags: ["test", "integration"],
					saved: true,
					favorited: false,
				},
			};

			const result = await createTool.handler(context, params);

			const insightData = parseToolResponse(result);
			expect(insightData.id).toBeDefined();
			expect(insightData.name).toBe(params.data.name);

			createdResources.insights.push(insightData.id);
		});
	});

	describe("update-insight tool", () => {
		const createTool = createInsightTool();
		const updateTool = updateInsightTool();

		it("should update an insight's name and description", async () => {
			const createParams = {
				data: {
					name: generateUniqueKey("Original Insight Name"),
					description: "Original description",
					query: SAMPLE_HOGQL_QUERIES.pageviews,
					saved: true,
					favorited: false,
				},
			};

			const createResult = await createTool.handler(context, createParams);
			const createdInsight = parseToolResponse(createResult);
			createdResources.insights.push(createdInsight.id);

			const updateParams = {
				insightId: createdInsight.id,
				data: {
					name: "Updated Insight Name",
					description: "Updated description",
				},
			};

			const updateResult = await updateTool.handler(context, updateParams);

			const updatedInsight = parseToolResponse(updateResult);
			expect(updatedInsight.id).toBe(createdInsight.id);
			expect(updatedInsight.name).toBe(updateParams.data.name);
		});

		it("should update an insight's query", async () => {
			const createParams = {
				data: {
					name: generateUniqueKey("Query Update Test"),
					description: "Testing query updates",
					query: SAMPLE_HOGQL_QUERIES.pageviews,
					saved: true,
					favorited: false,
				},
			};

			const createResult = await createTool.handler(context, createParams);
			const createdInsight = parseToolResponse(createResult);
			createdResources.insights.push(createdInsight.id);

			const updateParams = {
				insightId: createdInsight.id,
				data: {
					query: SAMPLE_HOGQL_QUERIES.topEvents,
				},
			};

			const updateResult = await updateTool.handler(context, updateParams);

			const updatedInsight = parseToolResponse(updateResult);
			expect(updatedInsight.id).toBe(createdInsight.id);
			expect(updatedInsight.name).toBe(createParams.data.name);
		});
	});

	describe("get-all-insights tool", () => {
		const getAllTool = getAllInsightsTool();

		it("should return insights with proper structure", async () => {
			const result = await getAllTool.handler(context, {});
			const insights = parseToolResponse(result);

			expect(Array.isArray(insights)).toBe(true);
			if (insights.length > 0) {
				const insight = insights[0];
				expect(insight).toHaveProperty("id");
				expect(insight).toHaveProperty("name");
				expect(insight).toHaveProperty("description");
				expect(insight).toHaveProperty("url");
			}
		});
	});

	describe("get-insight tool", () => {
		const createTool = createInsightTool();
		const getTool = getInsightTool();

		it("should get a specific insight by ID", async () => {
			const createParams = {
				data: {
					name: generateUniqueKey("Get Test Insight"),
					description: "Test insight for get operation",
					query: SAMPLE_HOGQL_QUERIES.pageviews,
					saved: true,
					favorited: false,
				},
			};

			const createResult = await createTool.handler(context, createParams);
			const createdInsight = parseToolResponse(createResult);
			createdResources.insights.push(createdInsight.id);

			const result = await getTool.handler(context, { insightId: createdInsight.id });
			const retrievedInsight = parseToolResponse(result);

			expect(retrievedInsight.id).toBe(createdInsight.id);
			expect(retrievedInsight.name).toBe(createParams.data.name);
			expect(retrievedInsight.description).toBe(createParams.data.description);
			expect(retrievedInsight.url).toContain("/insights/");
		});
	});

	describe("delete-insight tool", () => {
		const createTool = createInsightTool();
		const deleteTool = deleteInsightTool();

		it("should delete an insight", async () => {
			const createParams = {
				data: {
					name: generateUniqueKey("Delete Test Insight"),
					description: "Test insight for deletion",
					query: SAMPLE_HOGQL_QUERIES.pageviews,
					saved: true,
					favorited: false,
				},
			};

			const createResult = await createTool.handler(context, createParams);
			const createdInsight = parseToolResponse(createResult);

			const deleteResult = await deleteTool.handler(context, {
				insightId: createdInsight.id,
			});

			const deleteResponse = parseToolResponse(deleteResult);
			expect(deleteResponse.success).toBe(true);
			expect(deleteResponse.message).toContain("deleted successfully");
		});
	});

	describe("Insights workflow", () => {
		it("should support full CRUD workflow", async () => {
			const createTool = createInsightTool();
			const updateTool = updateInsightTool();
			const getTool = getInsightTool();
			const deleteTool = deleteInsightTool();

			const createParams = {
				data: {
					name: generateUniqueKey("Workflow Test Insight"),
					description: "Testing full workflow",
					query: SAMPLE_HOGQL_QUERIES.pageviews,
					saved: true,
					favorited: false,
				},
			};

			const createResult = await createTool.handler(context, createParams);
			const createdInsight = parseToolResponse(createResult);

			const getResult = await getTool.handler(context, { insightId: createdInsight.id });
			const retrievedInsight = parseToolResponse(getResult);
			expect(retrievedInsight.id).toBe(createdInsight.id);

			const updateParams = {
				insightId: createdInsight.id,
				data: {
					name: "Updated Workflow Insight",
					description: "Updated workflow description",
				},
			};

			const updateResult = await updateTool.handler(context, updateParams);
			const updatedInsight = parseToolResponse(updateResult);
			expect(updatedInsight.name).toBe(updateParams.data.name);

			const deleteResult = await deleteTool.handler(context, {
				insightId: createdInsight.id,
			});
			const deleteResponse = parseToolResponse(deleteResult);
			expect(deleteResponse.success).toBe(true);
		});
	});
});

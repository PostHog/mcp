import { expect } from "vitest";
import { ApiClient } from "@/api/client";
import type { Context } from "@/tools/types";
import { MemoryCache } from "@/lib/utils/cache/MemoryCache";

export const API_BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:8010";
export const API_TOKEN = process.env.TEST_API_TOKEN;
export const TEST_ORG_ID = process.env.TEST_ORG_ID;
export const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID;

export interface CreatedResources {
	featureFlags: number[];
	insights: number[];
	dashboards: number[];
}

export function validateEnvironmentVariables() {
	if (!API_TOKEN) {
		throw new Error("TEST_API_TOKEN environment variable is required");
	}

	if (!TEST_ORG_ID) {
		throw new Error("TEST_ORG_ID environment variable is required");
	}

	if (!TEST_PROJECT_ID) {
		throw new Error("TEST_PROJECT_ID environment variable is required");
	}
}

export function createTestClient(): ApiClient {
	return new ApiClient({
		apiToken: API_TOKEN!,
		baseUrl: API_BASE_URL,
	});
}

export function createTestContext(client: ApiClient): Context {
	const cache = new MemoryCache<any>("test-user");

	const context: Context = {
		api: client,
		cache,
		env: {} as any,
		getProjectId: async () => {
			const projectId = await cache.get("projectId");
			if (!projectId) {
				throw new Error("No active project set");
			}
			return projectId;
		},
		getOrgID: async () => {
			const orgId = await cache.get("orgId");
			if (!orgId) {
				throw new Error("No active organization set");
			}
			return orgId;
		},
		getDistinctId: async () => {
			const distinctId = await cache.get("distinctId");
			return distinctId || "";
		},
	};

	return context;
}

export async function setActiveProjectAndOrg(context: Context, projectId: string, orgId: string) {
	const cache = context.cache;
	await cache.set("projectId", projectId);
	await cache.set("orgId", orgId);
}

export async function cleanupResources(
	client: ApiClient,
	projectId: string,
	resources: CreatedResources,
) {
	for (const flagId of resources.featureFlags) {
		try {
			await client.featureFlags({ projectId }).delete({ flagId });
		} catch (error) {
			console.warn(`Failed to cleanup feature flag ${flagId}:`, error);
		}
	}
	resources.featureFlags = [];

	for (const insightId of resources.insights) {
		try {
			await client.insights({ projectId }).delete({ insightId });
		} catch (error) {
			console.warn(`Failed to cleanup insight ${insightId}:`, error);
		}
	}
	resources.insights = [];

	for (const dashboardId of resources.dashboards) {
		try {
			await client.dashboards({ projectId }).delete({ dashboardId });
		} catch (error) {
			console.warn(`Failed to cleanup dashboard ${dashboardId}:`, error);
		}
	}
	resources.dashboards = [];
}

export function parseToolResponse(result: any) {
	expect(result.content).toBeDefined();
	expect(result.content[0].type).toBe("text");
	return JSON.parse(result.content[0].text);
}

export function generateUniqueKey(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export const SAMPLE_HOGQL_QUERIES = {
	pageviews: {
		kind: "DataVisualizationNode" as const,
		source: {
			kind: "HogQLQuery" as const,
			query: "SELECT event, count() AS event_count FROM events WHERE timestamp >= now() - INTERVAL 7 DAY AND event = '$pageview' GROUP BY event ORDER BY event_count DESC LIMIT 10",
			filters: {
				dateRange: {
					date_from: "-7d",
					date_to: "-1d",
				},
			},
		},
	},
	topEvents: {
		kind: "DataVisualizationNode" as const,
		source: {
			kind: "HogQLQuery" as const,
			query: "SELECT event, count() AS event_count FROM events WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY event ORDER BY event_count DESC LIMIT 10",
			filters: {
				dateRange: {
					date_from: "-7d",
					date_to: "-1d",
				},
			},
		},
	},
};

import { withPagination } from "./lib/utils/api";
import { ApiPropertyDefinitionSchema } from "./schema/api";

import { BASE_URL } from "./lib/constants";
import { ErrorCode } from "./lib/errors";
import {
	type AddInsightToDashboardInput,
	type CreateDashboardInput,
	DashboardSchema,
	type ListDashboardsData,
	type PostHogDashboard,
	type UpdateDashboardInput,
} from "./schema/dashboards";
import {
	type ErrorDetailsData,
	type ListErrorsData,
	OrderByErrors,
	OrderDirectionErrors,
	StatusErrors,
} from "./schema/errors";
import {
	type CreateFeatureFlagInput,
	FeatureFlagSchema,
	type PostHogFeatureFlag,
	type UpdateFeatureFlagInput,
} from "./schema/flags";
import {
	type CreateInsightInput,
	InsightSchema,
	type ListInsightsData,
	type PostHogInsight,
	type UpdateInsightInput,
} from "./schema/insights";
import type { Organization } from "./schema/orgs";
import type { Project } from "./schema/projects";
import { PropertyDefinitionSchema } from "./schema/properties";

export async function getFeatureFlagDefinition(
	projectId: string,
	flagId: string,
	apiToken: string,
) {
	const response = await fetch(`${BASE_URL}/api/projects/${projectId}/feature_flags/${flagId}/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch feature flag: ${response.statusText}`);
	}
	return response.json();
}
export async function getFeatureFlags(
	projectId: string,
	apiToken: string,
): Promise<PostHogFeatureFlag[]> {
	const response = await withPagination(
		`${BASE_URL}/api/projects/${projectId}/feature_flags/`,
		apiToken,
		FeatureFlagSchema.pick({
			id: true,
			key: true,
			name: true,
			active: true,
		}),
	);

	return response;
}

export async function getOrganizations(apiToken: string): Promise<Organization[]> {
	const response = await fetch(`${BASE_URL}/api/organizations/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
	});
	if (!response.ok) {
		if (response.status === 401) {
			throw new Error(ErrorCode.INVALID_API_KEY);
		}

		throw new Error(`Failed to fetch organizations: ${response.statusText}`);
	}
	return response.json();
}

export async function getOrganizationDetails(orgId: string, apiToken: string) {
	const response = await fetch(`${BASE_URL}/api/organizations/${orgId}/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch organization details: ${response.statusText}`);
	}
	return response.json();
}

export async function getProjects(orgId: string, apiToken: string): Promise<Project[]> {

	const response = await fetch(`${BASE_URL}/api/organizations/${orgId}/projects/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
	});
	if (!response.ok) {
		if (response.status === 401) {
			throw new Error(ErrorCode.INVALID_API_KEY);
		}

		throw new Error(`Failed to fetch projects: ${response.statusText}`);
	}
	return response.json();
}

export async function getPropertyDefinitions({
	projectId,
	apiToken,
}: { projectId: string; apiToken: string }) {
	const propertyDefinitions = await withPagination(
		`${BASE_URL}/api/projects/${projectId}/property_definitions/`,
		apiToken,
		ApiPropertyDefinitionSchema,
	);

	const propertyDefinitionsWithoutHidden = propertyDefinitions.filter((def) => !def.hidden);

	return propertyDefinitionsWithoutHidden.map((def) => PropertyDefinitionSchema.parse(def));
}

export async function createFeatureFlag({
	projectId,
	apiToken,
	data,
}: { projectId: string; apiToken: string; data: CreateFeatureFlagInput }) {
	const body = {
		key: data.key,
		name: data.name,
		description: data.description,
		active: data.active,
		filters: data.filters,
	};

	const response = await fetch(`${BASE_URL}/api/projects/${projectId}/feature_flags/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const responseData = (await response.json()) as { type?: string; code?: string };

		if (responseData.type === "validation_error" && responseData.code === "unique") {
			throw new Error("Feature flag already exists with this key");
		}

		throw new Error(`Failed to create feature flag: ${response.statusText}`);
	}

	const responseData = await response.json();

	return responseData;
}

function hasResultsProperty(data: unknown): data is { results: PostHogInsight[] } {
	return typeof data === "object" && data !== null && "results" in data;
}

function isErrorResponse(data: unknown): data is { results: unknown[] } {
	return typeof data === "object" && data !== null && "results" in data;
}

function isLLMCostsResponse(data: unknown): data is { results: unknown[] } {
	if (typeof data !== "object" || data === null) {
		return false;
	}

	if (!("results" in data)) {
		return false;
	}

	const obj = data as Record<string, unknown>;
	return Array.isArray(obj.results);
}

export async function listErrors({
	projectId,
	data,
	apiToken,
}: { projectId: string; data: ListErrorsData; apiToken: string | undefined }): Promise<{
	results: unknown[];
}> {
	const date = new Date();
	date.setDate(date.getDate() - 7);
	const dateFromToUse = data.dateFrom?.toISOString() ?? date.toISOString();
	const dateToToUse = data.dateTo?.toISOString() ?? new Date().toISOString();
	const orderByToUse = data.orderBy ?? OrderByErrors.Occurrences;
	const orderDirectionToUse = data.orderDirection ?? OrderDirectionErrors.Descending;
	const filterTestAccountsToUse = data.filterTestAccounts ?? true;
	// const limitToUse = data.limit ?? 50;
	const statusToUse = data.status ?? StatusErrors.Active;
	const body = {
		query: {
			kind: "ErrorTrackingQuery",
			orderBy: orderByToUse,
			dateRange: {
				date_from: dateFromToUse,
				date_to: dateToToUse,
			},
			volumeResolution: 1, // we dont care about sparkline volumes yet mandatory
			orderDirection: orderDirectionToUse,
			filterTestAccounts: filterTestAccountsToUse,
			// limit: limitToUse,
			status: statusToUse,
		},
	};

	const response = await fetch(`${BASE_URL}/api/environments/${projectId}/query/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch errors: ${response.statusText}`);
	}

	const responseData: unknown = await response.json();

	if (!isErrorResponse(responseData)) {
		throw new Error("Invalid response format: expected object with results property");
	}

	return responseData;
}

export async function errorDetails({
	projectId,
	data,
	apiToken,
}: { projectId: string; data: ErrorDetailsData; apiToken: string | undefined }): Promise<{
	results: unknown[];
}> {
	const date = new Date();
	date.setDate(date.getDate() - 7);
	const dateFromToUse = data.dateFrom?.toISOString() ?? date.toISOString();
	const dateToToUse = data.dateTo?.toISOString() ?? new Date().toISOString();
	const body = {
		query: {
			kind: "ErrorTrackingQuery",
			dateRange: {
				date_from: dateFromToUse,
				date_to: dateToToUse,
			},
			volumeResolution: 0, // we dont care about sparkline volumes yet mandatory
			issueId: data.issueId,
		},
	};

	const response = await fetch(`https://us.posthog.com/api/environments/${projectId}/query/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch error details: ${response.statusText}`);
	}

	const responseData: unknown = await response.json();

	if (!isErrorResponse(responseData)) {
		throw new Error("Invalid response format: expected object with results property");
	}

	return responseData;
}

export async function updateFeatureFlag({
	projectId,
	apiToken,
	key,
	data,
}: { projectId: string; apiToken: string; key: string; data: UpdateFeatureFlagInput }) {
	const allFlags = await getFeatureFlags(projectId, apiToken);
	const flag = allFlags.find((f) => f.key === key);

	if (!flag) {
		throw new Error(`Feature flag not found: ${key}`);
	}

	const body = {
		key: key,
		name: data.name,
		description: data.description,
		active: data.active,
		filters: data.filters,
	};

	const response = await fetch(
		`${BASE_URL}/api/projects/${projectId}/feature_flags/${flag.id}/`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to update feature flag: ${response.statusText}`);
	}

	const responseData = await response.json();

	return responseData;
}

export async function deleteFeatureFlag({
	projectId,
	apiToken,
	flagId,
}: { projectId: string; apiToken: string; flagId: number }) {
	const response = await fetch(`${BASE_URL}/api/projects/${projectId}/feature_flags/${flagId}/`, {
		method: "PATCH",
		body: JSON.stringify({ deleted: true }),
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to delete feature flag: ${response.statusText}`);
	}

	return {
		success: true,
		message: "Feature flag deleted successfully",
	};
}

export async function getSqlInsight({
	projectId,
	apiToken,
	query,
}: {
	projectId: string;
	apiToken: string;
	query: string;
}): Promise<ReadableStream<Uint8Array>> {
	const requestBody = {
		query: query,
		insight_type: "sql",
	};

	const response = await fetch(
		`${BASE_URL}/api/environments/${projectId}/max_tools/create_and_query_insight/`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Failed to create and query SQL insight: ${response.statusText}. Details: ${errorText}`,
		);
	}

	if (!response.body) {
		throw new Error("Response body is null, but an SSE stream was expected.");
	}

	return response.body;
}

// Type guards for API responses
function isPostHogInsightArray(data: unknown): data is PostHogInsight[] {
	return Array.isArray(data);
}

export async function getLLMTotalCostsForProject({
	projectId,
	apiToken,
	days,
}: { projectId: string; apiToken: string; days?: number }): Promise<{ results: unknown[] }> {
	const body = {
		query: {
			kind: "TrendsQuery",
			dateRange: {
				date_from: `-${days ?? 6}d`,
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
		},
	};
	const response = await fetch(`https://us.posthog.com/api/environments/${projectId}/query/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to fetch llm total costs for project: ${response.statusText}`);
	}

	const responseData: unknown = await response.json();

	if (!isLLMCostsResponse(responseData)) {
		throw new Error("Invalid response format: expected object with results array");
	}

	return responseData;
}

export async function getInsights(
	projectId: string,
	apiToken: string,
	params?: ListInsightsData,
): Promise<PostHogInsight[]> {

	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.append("limit", String(params.limit));
	if (params?.offset) searchParams.append("offset", String(params.offset));
	if (params?.saved !== undefined) searchParams.append("saved", String(params.saved));
	if (params?.favorited !== undefined) searchParams.append("favorited", String(params.favorited));
	if (params?.search) searchParams.append("search", params.search);

	const url = `${BASE_URL}/api/projects/${projectId}/insights/${searchParams.toString() ? `?${searchParams}` : ""}`;

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch insights: ${response.statusText}`);
	}

	const data: unknown = await response.json();

	if (isPostHogInsightArray(data)) {
		return data;
	}

	if (hasResultsProperty(data)) {
		return data.results;
	}

	throw new Error(
		"Invalid response format: expected PostHogInsight array or object with results property",
	);
}

export async function getInsight(
	projectId: string,
	insightId: number,
	apiToken: string,
): Promise<PostHogInsight> {

	const response = await fetch(`${BASE_URL}/api/projects/${projectId}/insights/${insightId}/`, {
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch insight: ${response.statusText}`);
	}

	return response.json();
}

export async function createInsight({
	projectId,
	apiToken,
	data,
}: { projectId: string; apiToken: string; data: CreateInsightInput }): Promise<PostHogInsight> {

	const response = await fetch(`${BASE_URL}/api/projects/${projectId}/insights/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to create insight: ${response.statusText}. ${errorText}`);
	}

	return response.json();
}

export async function updateInsight({
	projectId,
	insightId,
	apiToken,
	data,
}: {
	projectId: string;
	insightId: number;
	apiToken: string;
	data: UpdateInsightInput;
}): Promise<PostHogInsight> {

	const response = await fetch(`${BASE_URL}/api/projects/${projectId}/insights/${insightId}/`, {
		method: "PATCH",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to update insight: ${response.statusText}. ${errorText}`);
	}

	return response.json();
}

export async function deleteInsight({
	projectId,
	insightId,
	apiToken,
}: { projectId: string; insightId: number; apiToken: string }) {

	const response = await fetch(`${BASE_URL}/api/projects/${projectId}/insights/${insightId}/`, {
		method: "PATCH",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ deleted: true }),
	});

	if (!response.ok) {
		throw new Error(`Failed to delete insight: ${response.statusText}`);
	}

	return {
		success: true,
		message: "Insight deleted successfully",
	};
}

// Dashboard API functions

function isDashboardArray(data: unknown): data is PostHogDashboard[] {
	return Array.isArray(data);
}

function hasDashboardResults(data: unknown): data is { results: PostHogDashboard[] } {
	return typeof data === "object" && data !== null && "results" in data;
}

export async function getDashboards(
	projectId: string,
	apiToken: string,
	params?: ListDashboardsData,
): Promise<PostHogDashboard[]> {

	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.append("limit", String(params.limit));
	if (params?.offset) searchParams.append("offset", String(params.offset));
	if (params?.search) searchParams.append("search", params.search);
	if (params?.pinned !== undefined) searchParams.append("pinned", String(params.pinned));

	const url = `${BASE_URL}/api/projects/${projectId}/dashboards/${searchParams.toString() ? `?${searchParams}` : ""}`;

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch dashboards: ${response.statusText}`);
	}

	const data: unknown = await response.json();

	if (isDashboardArray(data)) {
		return data;
	}

	if (hasDashboardResults(data)) {
		try {
			return data.results.map((dashboard) => DashboardSchema.parse(dashboard));
		} catch (error) {
			throw new Error("Error parsing dashboard: " + error);
		}
	}

	throw new Error(
		"Invalid response format: expected PostHogDashboard array or object with results property",
	);
	
}

export async function getDashboard(
	projectId: string,
	dashboardId: number,
	apiToken: string,
): Promise<PostHogDashboard> {

	const response = await fetch(
		`${BASE_URL}/api/projects/${projectId}/dashboards/${dashboardId}/`,
		{
			headers: {
				Authorization: `Bearer ${apiToken}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
	}

	return response.json();
}

export async function createDashboard({
	projectId,
	apiToken,
	data,
}: { projectId: string; apiToken: string; data: CreateDashboardInput }): Promise<PostHogDashboard> {

	const response = await fetch(`${BASE_URL}/api/projects/${projectId}/dashboards/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to create dashboard: ${response.statusText}. ${errorText}`);
	}

	return response.json();
}

export async function updateDashboard({
	projectId,
	dashboardId,
	apiToken,
	data,
}: {
	projectId: string;
	dashboardId: number;
	apiToken: string;
	data: UpdateDashboardInput;
}): Promise<PostHogDashboard> {

	const response = await fetch(
		`${BASE_URL}/api/projects/${projectId}/dashboards/${dashboardId}/`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to update dashboard: ${response.statusText}. ${errorText}`);
	}

	return response.json();
}

export async function deleteDashboard({
	projectId,
	dashboardId,
	apiToken,
}: { projectId: string; dashboardId: number; apiToken: string }) {

	const response = await fetch(
		`${BASE_URL}/api/projects/${projectId}/dashboards/${dashboardId}/`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ deleted: true }),
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to delete dashboard: ${response.statusText}`);
	}

	return {
		success: true,
		message: "Dashboard deleted successfully",
	};
}

export async function addInsightToDashboard({
	projectId,
	apiToken,
	data,
}: { projectId: string; apiToken: string; data: AddInsightToDashboardInput }) {

	// Based on PostHog API documentation and community feedback:
	// - The dashboard_tiles endpoint doesn't exist for creation
	// - The Dashboard API can only UPDATE tiles, not CREATE them
	// - We must use the deprecated 'dashboards' array field as it's the only way that works
	// See: https://posthog.com/docs/api/insights (Community Questions section)
	const updateData: any = {
		dashboards: [data.dashboard_id], // Use deprecated array field - only working approach
	};

	const response = await fetch(
		`${BASE_URL}/api/projects/${projectId}/insights/${data.insight_id}/`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(updateData),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to add insight to dashboard: ${response.statusText}. ${errorText}`);
	}

	return response.json();
}

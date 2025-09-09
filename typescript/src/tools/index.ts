import type { Context, Tool, ZodObjectAny } from "./types";

import { ApiClient } from "@/api/client";
import { StateManager } from "@/lib/utils/StateManager";
import { MemoryCache } from "@/lib/utils/cache/MemoryCache";
import { hash } from "@/lib/utils/helper-functions";
import { getToolsForFeatures as getFilteredToolNames } from "./toolDefinitions";

import createFeatureFlag from "./featureFlags/create";
import deleteFeatureFlag from "./featureFlags/delete";
import getAllFeatureFlags from "./featureFlags/getAll";
// Feature Flags
import getFeatureFlagDefinition from "./featureFlags/getDefinition";
import updateFeatureFlag from "./featureFlags/update";

import getOrganizationDetails from "./organizations/getDetails";
// Organizations
import getOrganizations from "./organizations/getOrganizations";
import setActiveOrganization from "./organizations/setActive";

import eventDefinitions from "./projects/eventDefinitions";
// Projects
import getProjects from "./projects/getProjects";
import getProperties from "./projects/propertyDefinitions";
import setActiveProject from "./projects/setActive";

// Documentation
import searchDocs from "./documentation/searchDocs";

import errorDetails from "./errorTracking/errorDetails";
// Error Tracking
import listErrors from "./errorTracking/listErrors";

import getExperiment from "./experiments/get";
// Experiments
import getAllExperiments from "./experiments/getAll";

import createInsight from "./insights/create";
import deleteInsight from "./insights/delete";

import getInsight from "./insights/get";
// Insights
import getAllInsights from "./insights/getAll";
import queryInsight from "./insights/query";
import updateInsight from "./insights/update";

import addInsightToDashboard from "./dashboards/addInsight";
import createDashboard from "./dashboards/create";
import deleteDashboard from "./dashboards/delete";
import getDashboard from "./dashboards/get";

// Dashboards
import getAllDashboards from "./dashboards/getAll";
import updateDashboard from "./dashboards/update";
import generateHogQLFromQuestion from "./query/generateHogQLFromQuestion";
// Query
import queryRun from "./query/run";

// LLM Observability
import getLLMCosts from "./llmObservability/getLLMCosts";

// Map of tool names to tool factory functions
const TOOL_MAP: Record<string, () => Tool<ZodObjectAny>> = {
	// Feature Flags
	"feature-flag-get-definition": getFeatureFlagDefinition,
	"feature-flag-get-all": getAllFeatureFlags,
	"create-feature-flag": createFeatureFlag,
	"update-feature-flag": updateFeatureFlag,
	"delete-feature-flag": deleteFeatureFlag,

	// Organizations
	"organizations-get": getOrganizations,
	"switch-organization": setActiveOrganization,
	"organization-details-get": getOrganizationDetails,

	// Projects
	"projects-get": getProjects,
	"switch-project": setActiveProject,
	"event-definitions-list": eventDefinitions,
	"properties-list": getProperties,

	// Documentation - handled separately due to env check
	// "docs-search": searchDocs,

	// Error Tracking
	"list-errors": listErrors,
	"error-details": errorDetails,

	// Experiments
	"experiment-get-all": getAllExperiments,
	"experiment-get": getExperiment,

	// Insights
	"insights-get-all": getAllInsights,
	"insight-get": getInsight,
	"insight-create-from-query": createInsight,
	"insight-update": updateInsight,
	"insight-delete": deleteInsight,
	"insight-query": queryInsight,

	// Queries
	"query-generate-hogql-from-question": generateHogQLFromQuestion,
	"query-run": queryRun,

	// Dashboards
	"dashboards-get-all": getAllDashboards,
	"dashboard-get": getDashboard,
	"dashboard-create": createDashboard,
	"dashboard-update": updateDashboard,
	"dashboard-delete": deleteDashboard,
	"add-insight-to-dashboard": addInsightToDashboard,

	// LLM Observability
	"get-llm-total-costs-for-project": getLLMCosts,
};

export const getToolsFromContext = (
	context: Context,
	features?: string[],
): Tool<ZodObjectAny>[] => {
	const allowedToolNames = getFilteredToolNames(features);
	const tools: Tool<ZodObjectAny>[] = [];

	for (const toolName of allowedToolNames) {
		// Special handling for docs-search which requires API key
		if (toolName === "docs-search" && context.env.INKEEP_API_KEY) {
			tools.push(searchDocs());
		} else if (TOOL_MAP[toolName]) {
			tools.push(TOOL_MAP[toolName]());
		}
	}

	return tools;
};

export type PostHogToolsOptions = {
	posthogApiToken: string;
	posthogApiBaseUrl: string;
	inkeepApiKey?: string;
};
export class PostHogAgentToolkit {
	public options: PostHogToolsOptions;

	constructor(options: PostHogToolsOptions) {
		this.options = options;
	}

	getContext(): Context {
		const api = new ApiClient({
			apiToken: this.options.posthogApiToken,
			baseUrl: this.options.posthogApiBaseUrl,
		});

		const scope = hash(this.options.posthogApiToken);
		const cache = new MemoryCache(scope);

		return {
			api,
			cache,
			env: {
				INKEEP_API_KEY: this.options.inkeepApiKey,
			},
			stateManager: new StateManager(cache, api),
		};
	}
	getTools(): Tool<ZodObjectAny>[] {
		const context = this.getContext();
		return getToolsFromContext(context);
	}
}

export type { Context, State, Tool } from "./types";

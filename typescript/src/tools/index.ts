import type { Context, Tool, ZodObjectAny } from "./types";

import { ApiClient } from "@/api/client";
import { StateManager } from "@/lib/utils/StateManager";
import { MemoryCache } from "@/lib/utils/cache/MemoryCache";
import { hash } from "@/lib/utils/helper-functions";

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

// Projects
import getProjects from "./projects/getProjects";
import propertyDefinitions from "./projects/propertyDefinitions";
import setActiveProject from "./projects/setActive";

// Documentation
import searchDocs from "./documentation/searchDocs";

import errorDetails from "./errorTracking/errorDetails";
// Error Tracking
import listErrors from "./errorTracking/listErrors";

// Experiments
import getAllExperiments from "./experiments/getAll";
import getExperiment from "./experiments/get";

import createInsight from "./insights/create";
import deleteInsight from "./insights/delete";
import getInsight from "./insights/get";
// Insights
import getAllInsights from "./insights/getAll";
import getSqlInsight from "./insights/getSqlInsight";
import queryInsight from "./insights/query";
import updateInsight from "./insights/update";

import addInsightToDashboard from "./dashboards/addInsight";
import createDashboard from "./dashboards/create";
import deleteDashboard from "./dashboards/delete";
import getDashboard from "./dashboards/get";
// Dashboards
import getAllDashboards from "./dashboards/getAll";
import updateDashboard from "./dashboards/update";

// LLM Analytics
import getLLMCosts from "./llmAnalytics/getLLMCosts";
import eventDefinitions from "./projects/eventDefinitions";

export const getToolsFromContext = (context: Context): Tool<ZodObjectAny>[] => [
	// Feature Flags
	getFeatureFlagDefinition(),
	getAllFeatureFlags(),
	createFeatureFlag(),
	updateFeatureFlag(),
	deleteFeatureFlag(),

	// Organizations
	getOrganizations(),
	setActiveOrganization(),
	getOrganizationDetails(),

	// Projects
	getProjects(),
	setActiveProject(),
	propertyDefinitions(),
	eventDefinitions(),

	// Documentation
	...(context.env.INKEEP_API_KEY ? [searchDocs()] : []),

	// Error Tracking
	listErrors(),
	errorDetails(),

	// Experiments
	getAllExperiments(),
	getExperiment(),

	// Insights
	getAllInsights(),
	getInsight(),
	createInsight(),
	updateInsight(),
	deleteInsight(),
	queryInsight(),
	getSqlInsight(),

	// Dashboards
	getAllDashboards(),
	getDashboard(),
	createDashboard(),
	updateDashboard(),
	deleteDashboard(),
	addInsightToDashboard(),

	// LLM Analytics
	getLLMCosts(),
];

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

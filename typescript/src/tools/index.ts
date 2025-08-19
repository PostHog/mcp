import type { Context, Tool, ZodObjectAny } from "./types";

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

// LLM Observability
import getLLMCosts from "./llmObservability/getLLMCosts";

const tools = (_context: Context): Tool<ZodObjectAny>[] => [
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

	// Documentation
	searchDocs(),

	// Error Tracking
	listErrors(),
	errorDetails(),

	// Experiments
	getAllExperiments(),

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

	// LLM Observability
	getLLMCosts(),
];

export default tools;
export type { Context, State, Tool } from "./types";


import type { Context, Tool, ZodObjectAny } from "./types";

// Feature Flags
import getFeatureFlagDefinition from "./featureFlags/getDefinition";
import getAllFeatureFlags from "./featureFlags/getAll";
import createFeatureFlag from "./featureFlags/create";
import updateFeatureFlag from "./featureFlags/update";
import deleteFeatureFlag from "./featureFlags/delete";

// Organizations
import getOrganizations from "./organizations/getOrganizations";
import setActiveOrganization from "./organizations/setActive";
import getOrganizationDetails from "./organizations/getDetails";

// Projects
import getProjects from "./projects/getProjects";
import setActiveProject from "./projects/setActive";
import propertyDefinitions from "./projects/propertyDefinitions";

// Documentation
import searchDocs from "./documentation/searchDocs";

// Error Tracking
import listErrors from "./errorTracking/listErrors";
import errorDetails from "./errorTracking/errorDetails";

// Insights
import getAllInsights from "./insights/getAll";
import getInsight from "./insights/get";
import createInsight from "./insights/create";
import updateInsight from "./insights/update";
import deleteInsight from "./insights/delete";
import getSqlInsight from "./insights/getSqlInsight";

// Dashboards
import getAllDashboards from "./dashboards/getAll";
import getDashboard from "./dashboards/get";
import createDashboard from "./dashboards/create";
import updateDashboard from "./dashboards/update";
import deleteDashboard from "./dashboards/delete";
import addInsightToDashboard from "./dashboards/addInsight";

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

	// Insights
	getAllInsights(),
	getInsight(),
	createInsight(),
	updateInsight(),
	deleteInsight(),
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
export type { Tool, Context, State } from "./types";

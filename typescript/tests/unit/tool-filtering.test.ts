import { getToolsForFeatures } from "@/tools/toolDefinitions";
import { describe, expect, it } from "vitest";

describe("Tool Filtering", () => {
	const featureTests = [
		{
			features: undefined,
			description: "all tools when no features specified",
			expectedTools: [
				"feature-flag-get-definition",
				"dashboard-create",
				"insights-get-all",
				"organizations-get",
			],
		},
		{
			features: [],
			description: "all tools when empty array passed",
			expectedTools: ["feature-flag-get-definition", "dashboard-create"],
		},
		{
			features: ["flags"],
			description: "flag tools only",
			expectedTools: [
				"feature-flag-get-definition",
				"feature-flag-get-all",
				"create-feature-flag",
				"update-feature-flag",
				"delete-feature-flag",
			],
		},
		{
			features: ["dashboards", "insights"],
			description: "dashboard and insight tools",
			expectedTools: [
				"dashboard-create",
				"dashboards-get-all",
				"add-insight-to-dashboard",
				"insights-get-all",
				"query-generate-hogql-from-question",
				"query-run",
				"insight-create-from-query",
			],
		},
		{
			features: ["workspace"],
			description: "workspace tools",
			expectedTools: [
				"organizations-get",
				"switch-organization",
				"projects-get",
				"switch-project",
				"property-definitions",
			],
		},
		{
			features: ["error-tracking"],
			description: "error tracking tools",
			expectedTools: ["list-errors", "error-details"],
		},
		{
			features: ["experiments"],
			description: "experiment tools",
			expectedTools: ["experiment-get-all"],
		},
		{
			features: ["llm-analytics"],
			description: "LLM analytics tools",
			expectedTools: ["get-llm-total-costs-for-project"],
		},
		{
			features: ["docs"],
			description: "documentation tools",
			expectedTools: ["docs-search"],
		},
		{
			features: ["invalid", "flags"],
			description: "valid tools when mixed with invalid features",
			expectedTools: ["feature-flag-get-definition"],
		},
		{
			features: ["invalid", "unknown"],
			description: "empty array for only invalid features",
			expectedTools: [],
		},
	];

	describe("getToolsForFeatures", () => {
		it.each(featureTests)("should return $description", ({ features, expectedTools }) => {
			const tools = getToolsForFeatures(features);

			for (const tool of expectedTools) {
				expect(tools).toContain(tool);
			}
		});
	});
});

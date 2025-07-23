import { describe, it, expect, beforeAll, afterEach } from "vitest";
import {
	validateEnvironmentVariables,
	createTestClient,
	createTestContext,
	setActiveProjectAndOrg,
	cleanupResources,
	TEST_PROJECT_ID,
	TEST_ORG_ID,
	type CreatedResources,
	parseToolResponse,
} from "../shared/test-utils";
import getProjectsTool from "../../src/tools/projects/getProjects";
import setActiveProjectTool from "../../src/tools/projects/setActive";
import propertyDefinitionsTool from "../../src/tools/projects/propertyDefinitions";
import type { Context } from "../../src/tools/types";

describe("Projects", { concurrent: false }, () => {
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

	describe("get-projects tool", () => {
		const getTool = getProjectsTool();

		it("should list all projects for the active organization", async () => {
			const result = await getTool.handler(context, {});
			const projects = parseToolResponse(result);

			expect(Array.isArray(projects)).toBe(true);
			expect(projects.length).toBeGreaterThan(0);

			const project = projects[0];
			expect(project).toHaveProperty("id");
			expect(project).toHaveProperty("name");
		});

		it("should return projects with proper structure", async () => {
			const result = await getTool.handler(context, {});
			const projects = parseToolResponse(result);

			const testProject = projects.find((proj: any) => proj.id === Number(TEST_PROJECT_ID));
			expect(testProject).toBeDefined();
			expect(testProject.id).toBe(Number(TEST_PROJECT_ID));
		});
	});

	describe("set-active-project tool", () => {
		const setTool = setActiveProjectTool();
		const getTool = getProjectsTool();

		it("should set active project", async () => {
			const projectsResult = await getTool.handler(context, {});
			const projects = parseToolResponse(projectsResult);
			expect(projects.length).toBeGreaterThan(0);

			const targetProject = projects[0];
			const setResult = await setTool.handler(context, { projectId: targetProject.id });

			expect(setResult.content[0].text).toBe(`Switched to project ${targetProject.id}`);
		});

		it("should set project ID as expected", async () => {
			const projectId = 123456;
			const result = await setTool.handler(context, { projectId: projectId });

			expect(result.content[0].text).toBe(`Switched to project ${projectId}`);
		});
	});

	describe("property-definitions tool", () => {
		const propertyDefsTool = propertyDefinitionsTool();

		it.skip("should get property definitions for active project", async () => {
			const result = await propertyDefsTool.handler(context, {});
			const propertyDefs = parseToolResponse(result);

			expect(propertyDefs).toHaveProperty("event_properties");
			expect(propertyDefs).toHaveProperty("person_properties");
			expect(propertyDefs).toHaveProperty("group_properties");

			expect(Array.isArray(propertyDefs.event_properties)).toBe(true);
			expect(Array.isArray(propertyDefs.person_properties)).toBe(true);
			expect(typeof propertyDefs.group_properties).toBe("object");
		});

		it.skip("should return property definitions with proper structure", async () => {
			const result = await propertyDefsTool.handler(context, {});
			const propertyDefs = parseToolResponse(result);

			if (propertyDefs.event_properties.length > 0) {
				const eventProp = propertyDefs.event_properties[0];
				expect(eventProp).toHaveProperty("name");
				expect(eventProp).toHaveProperty("is_seen_on_filtered_events");
			}

			if (propertyDefs.person_properties.length > 0) {
				const personProp = propertyDefs.person_properties[0];
				expect(personProp).toHaveProperty("name");
				expect(personProp).toHaveProperty("count");
			}
		});
	});

	describe("Projects workflow", () => {
		it("should support listing and setting active project workflow", async () => {
			const getTool = getProjectsTool();
			const setTool = setActiveProjectTool();

			const projectsResult = await getTool.handler(context, {});
			const projects = parseToolResponse(projectsResult);
			expect(projects.length).toBeGreaterThan(0);

			const targetProject =
				projects.find((p: any) => p.id === Number(TEST_PROJECT_ID)) || projects[0];

			const setResult = await setTool.handler(context, { projectId: targetProject.id });
			expect(setResult.content[0].text).toBe(`Switched to project ${targetProject.id}`);

			await context.cache.set("projectId", targetProject.id.toString());
		});
	});
});

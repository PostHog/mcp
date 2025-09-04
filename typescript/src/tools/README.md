# Adding Tools to the PostHog MCP

This guide explains how to add new tools to the PostHog MCP server. Tools are the interface between MCP clients (like Claude Desktop) and PostHog.

## Quick Start

To add a new tool, you'll need to:

1. Define the tool's input schema
2. Create the tool handler
3. Add the tool definition
4. Write integration tests
5. Update the API client if needed

## Example: Creating a Feature Flag Tool

Let's walk through the `create-feature-flag` tool as a reference example.

### 1. Define Input Schema (`schema/tool-inputs.ts`)

Define your tool's input schema using Zod. Keep inputs **simple and user-friendly**, not necessarily matching the API exactly:

```typescript
export const FeatureFlagCreateSchema = z.object({
    name: z.string(),
    key: z.string(),
    description: z.string(),
    filters: FilterGroupsSchema,
    active: z.boolean(),
    tags: z.array(z.string()).optional(),
});
```

**Best Practices:**
- **Keep inputs simple**: Focus on what users would naturally want to provide
- **Make schemas tight for inputs**: Use strict validation to catch errors early
- **Make schemas loose for outputs**: Be permissive when parsing API responses
- **Use descriptive field names**: Prefer `name` over `flag_name` if it's clear from context

### 2. Create Tool Handler (`tools/featureFlags/create.ts`)

```typescript
import { FeatureFlagCreateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = FeatureFlagCreateSchema;
type Params = z.infer<typeof schema>;

export const createHandler = async (context: Context, params: Params) => {
    const { name, key, description, filters, active, tags } = params;
    const projectId = await context.stateManager.getProjectId();

    // Call API client method
    const flagResult = await context.api.featureFlags({ projectId }).create({
        data: { name, key, description, filters, active, tags },
    });

    if (!flagResult.success) {
        throw new Error(`Failed to create feature flag: ${flagResult.error.message}`);
    }

    // Add context that is useful, like in this case a URL for the LLM to link to.
    const featureFlagWithUrl = {
        ...flagResult.data,
        url: `${context.api.getProjectBaseUrl(projectId)}/feature_flags/${flagResult.data.id}`,
    };

    return {
        content: [{ type: "text", text: JSON.stringify(featureFlagWithUrl) }],
    };
};

const definition = getToolDefinition("create-feature-flag");

const tool = (): Tool<typeof schema> => ({
    name: "create-feature-flag",
    description: definition.description,
    schema,
    handler: createHandler,
    annotations: {
        destructiveHint: false,  // Tool doesn't delete existing data
        idempotentHint: false,   // Creating flags isn't idempotent (creates new each time)
        openWorldHint: true,     // Tool creates new resources in the world
        readOnlyHint: false,     // Tool modifies state (creates new flags)
    },
});

export default tool;
```

**Key Points:**
- Use `context.stateManager.getProjectId()` to get the active project
- Use `context.api` to make API calls
- Add helpful information like URLs to responses
- Handle errors gracefully with descriptive messages
- Include annotations to hint at tool behavior (see below)

### 3. Add Tool Definition (`schema/tool-definitions.json`)

Add a clear, actionable description for your tool and assign it to a feature:

```json
{
    "create-feature-flag": {
        "description": "Creates a new feature flag in the project. Once you have created a feature flag, you should: Ask the user if they want to add it to their codebase, Use the \"search-docs\" tool to find documentation on how to add feature flags to the codebase (search for the right language / framework), Clarify where it should be added and then add it.",
        "category": "Feature flags",
        "feature": "flags",
        "summary": "Creates a new feature flag in the project."
    }
}
```

**Available Features:**
- `flags` - [Feature flag management](https://posthog.com/docs/feature-flags)
- `workspace` - [Organization and project management](https://posthog.com/docs/getting-started/cloud)
- `error-tracking` - [Error monitoring and debugging](https://posthog.com/docs/errors)
- `dashboards` - [Dashboard creation and management](https://posthog.com/docs/product-analytics/dashboards)
- `insights` - [Analytics insights and SQL queries](https://posthog.com/docs/product-analytics/insights)
- `experiments` - [A/B testing experiments](https://posthog.com/docs/experiments)
- `llm-analytics` - [LLM usage and cost tracking](https://posthog.com/docs/llm-analytics)
- `docs` - PostHog documentation search

If your tool doesn't fit any of these features, you can create a new feature category yourself.
If you do add a new feature, make sure to update the `README.md` in the root of the repository to list the new feature and include it in the tests at `typescript/tests/unit/tool-filtering.test.ts`. You'll also need to update the `AVAILABLE_FEATURES` list in `https://github.com/posthog/wizard/` so it shows up during feature selection when running `wizard mcp add`.

**Description Tips:**
- Be specific about what the tool does
- Include follow-up actions if relevant
- Mention any prerequisites or limitations
- Use clear, concise language

### 4. Write Integration Tests (`tests/tools/featureFlags.integration.test.ts`)

Always include integration tests to help us catch if there is a change to the underlying API:

```typescript
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import {
    createTestClient,
    createTestContext,
    setActiveProjectAndOrg,
    cleanupResources,
    parseToolResponse,
    generateUniqueKey,
} from "@/shared/test-utils";
import createFeatureFlagTool from "@/tools/featureFlags/create";

describe("Feature Flags", () => {
    let context: Context;
    const createdResources: CreatedResources = {
        featureFlags: [],
        insights: [],
        dashboards: [],
    };

    beforeAll(async () => {
        const client = createTestClient();
        context = createTestContext(client);
        await setActiveProjectAndOrg(context, TEST_PROJECT_ID!, TEST_ORG_ID!);
    });

    afterEach(async () => {
        await cleanupResources(context.api, TEST_PROJECT_ID!, createdResources);
    });

    describe("create-feature-flag tool", () => {
        const createTool = createFeatureFlagTool();

        it("should create a feature flag with minimal required fields", async () => {
            const params = {
                name: "Test Feature Flag",
                key: generateUniqueKey("test-flag"),
                description: "Integration test flag",
                filters: { groups: [] },
                active: true,
            };

            const result = await createTool.handler(context, params);
            const flagData = parseToolResponse(result);

            expect(flagData.id).toBeDefined();
            expect(flagData.key).toBe(params.key);
            expect(flagData.name).toBe(params.name);
            expect(flagData.active).toBe(params.active);
            expect(flagData.url).toContain("/feature_flags/");

            createdResources.featureFlags.push(flagData.id);
        });

        it("should create a feature flag with complex filters", async () => {
            // Test with more complex scenarios
        });
    });
});
```

**Testing Best Practices:**
- Clean up created resources after each test
- Use unique keys/names to avoid conflicts
- Test both minimal and complex scenarios
- Verify the response structure and content
- Test error cases and edge conditions

### 5. Update API Client if Needed (`api/client.ts`)

If your tool requires new API endpoints, add them to the ApiClient:

```typescript
public featureFlags(params: { projectId: number }) {
    return {
        create: async ({ data }: { data: CreateFeatureFlagInput }) => {
            return this.request<FeatureFlagResponseSchema>({
                method: "POST",
                path: `/api/projects/${params.projectId}/feature_flags/`,
                body: data,
                schema: FeatureFlagResponseSchema,
            });
        },
        // Add other methods as needed
    };
}
```

**API Client Guidelines:**
- Group related endpoints under resource methods
- Use consistent naming patterns
- Return `Result<T, Error>` types
- Add proper TypeScript types for all parameters and responses
- Include schema validation for responses

## Schema Design Philosophy

### Input Schemas
- **Be strict**: Validate inputs thoroughly to catch errors early
- **Be user-friendly**: Design inputs around what users naturally want to provide
- **Be minimal**: Only require essential fields, make others optional
- **Be clear**: Use descriptive names that don't require API knowledge

### Output Schemas
- **Be permissive**: Don't fail on unexpected fields from the API
- **Be comprehensive**: Include useful information in responses, but don't stuff the context window with unnecessary information
- **Add context**: Include helpful URLs, descriptions, or related data
- **Be consistent**: Use similar patterns across tools

## Tool Annotations

Tools should include annotations that provide hints about their behavior to MCP clients. These help clients understand what a tool does and how it might affect the system:

```typescript
annotations: {
    destructiveHint: boolean,  // Does the tool delete or destructively modify data?
    idempotentHint: boolean,   // Can the tool be safely called multiple times with same result?
    openWorldHint: boolean,    // Does the tool interact with external systems or create new resources?
    readOnlyHint: boolean,     // Is the tool read-only (doesn't modify any state)?
}
```

# Creating automatic event instrumentation for PostHog users

We're going to create a prompt and resource to enable automatic instrumentation for PostHog events in a user project.

Prompt:

- setup-events

Resources:

- Integration docs: https://posthog.com/docs/libraries/next-js.md
- Integration guide: workflow-prompts/event-setup.md

## MCP Implementation Guide: Prompts and Resources

### Prompts
Prompts are reusable templates that provide structured workflows for specific tasks in MCP.

#### Key Concepts
- **Purpose**: Parameterized interaction patterns that demonstrate best practices for using an MCP server
- **User-controlled**: Require explicit invocation by the user
- **Context-aware**: Can reference available resources and tools
- **Discovery**: Exposed through slash commands, command palettes, UI buttons, or context menus

#### Implementation in McpServer
```typescript
// Register a prompt with arguments
server.prompt(
  "analyze-feature-flag",
  "Analyze feature flag usage and performance",
  {
    flagKey: z.string().describe("The feature flag key to analyze"),
    days: z.number().optional().describe("Number of days to analyze (default: 7)")
  },
  async (args) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Analyze the feature flag '${args.flagKey}' for the last ${args.days || 7} days`
          }
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: "I'll analyze the feature flag usage. Let me gather the data..."
          }
        }
      ]
    };
  }
);
```

#### Prompt Structure
- `name`: Unique identifier
- `description`: Human-readable explanation
- `arguments`: Zod schema for input parameters
- `callback`: Returns `GetPromptResult` with messages array

### Resources
Resources provide access to data that can be read by the MCP client.

#### Key Concepts
- **Static Resources**: Fixed URIs with direct content
- **Dynamic Resources**: URI templates with variable interpolation
- **Metadata**: Optional annotations like MIME type, description
- **List Operations**: Enumerate available resources

#### Implementation in McpServer
```typescript
// Static resource
server.resource(
  "current-project",
  "posthog://project/current",
  {
    mimeType: "application/json",
    description: "Current active PostHog project"
  },
  async () => {
    const project = await getActiveProject();
    return {
      contents: [{
        type: "text",
        text: JSON.stringify(project, null, 2)
      }]
    };
  }
);

// Dynamic resource with template
server.resource(
  "feature-flag",
  new ResourceTemplate(
    "posthog://feature-flag/{key}",
    {
      list: async () => {
        const flags = await listFeatureFlags();
        return {
          resources: flags.map(f => ({
            uri: `posthog://feature-flag/${f.key}`,
            name: `Feature Flag: ${f.key}`,
            mimeType: "application/json"
          }))
        };
      }
    }
  ),
  async (uri, variables) => {
    const flag = await getFeatureFlag(variables.key);
    return {
      contents: [{
        type: "text",
        text: JSON.stringify(flag, null, 2)
      }]
    };
  }
);
```

### Integration with PostHog MCP Server

#### Current Architecture
- `MyMCP` class extends `McpAgent`
- Uses `McpServer` instance accessible via `this.server`
- Tools registered in `init()` method
- Add prompts and resources alongside tools

#### Implementation Steps
1. Create prompt definitions for common PostHog workflows
2. Define resources for project data, feature flags, insights
3. Register in `MyMCP.init()` after tools
4. Use existing `ApiClient` and `StateManager` for data access
5. Leverage caching for performance

#### Protocol Operations
- **Prompts**: `prompts/list`, `prompts/get`
- **Resources**: `resources/list`, `resources/read`
- **Notifications**: `promptListChanged`, `resourceListChanged`


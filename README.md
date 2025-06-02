# PostHog MCP

## Use the MCP Server

### Quick install

You can install the MCP server automatically into popular clients by running the following command:

```
npx @posthog/wizard@latest mcp add
```

### Manual install

1. Obtain a personal API key using the MCP Server preset [here](https://app.posthog.com/settings/user-api-keys?preset=mcp_server).

2. Add the MCP configuration to your desktop client (e.g. Cursor, Windsurf, Claude Desktop) and add your personal API key

```json
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.posthog.com/sse",
        "--header",
        "Authorization:${POSTHOG_AUTH_HEADER}"
      ],
      "env": {
        "POSTHOG_AUTH_HEADER": "Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
      }
    }
  }
}
```


**Here are some examples of prompts you can use:**
- What feature flags do I have active?
- Add a new feature flag for our homepage redesign
- What are my most common errors?

## Running locally

### Environment variables

- Create `.dev.vars` in the root
- Add Inkeep API key to enable `docs-search` tool (see `Inkeep API key - mcp`)


```
INKEEP_API_KEY="..."
```


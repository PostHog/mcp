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

### Using EU cloud or self-hosted instances

If you're using PostHog EU cloud or a self-hosted instance, you can specify a custom base URL by adding the `POSTHOG_BASE_URL` environment variable in `.dev.vars` when running the MCP server locally or on your own infrastructure, e.g. `POSTHOG_BASE_URL=https://eu.posthog.com`

**Here are some examples of prompts you can use:**
- What feature flags do I have active?
- Add a new feature flag for our homepage redesign
- What are my most common errors?


# Development

To run the MCP server locally, run the following command:

```
pnpm run dev
```

And replace `https://mcp.posthog.com/sse` with `http://localhost:8787/sse` in the MCP configuration.

## Project Structure

This repository is organized to support multiple language implementations:

- `typescript/` - TypeScript implementation (current)
- `python/` - Python implementation (planned)
- `schema/` - Shared schema files generated from TypeScript for cross-language compatibility

### Development Commands

- `pnpm run dev` - Start development server
- `pnpm run schema:build:json` - Generate JSON schema for other language implementations
- `pnpm run lint:fix` - Format and lint code

### Environment variables

- Create `.dev.vars` in the root
- Add Inkeep API key to enable `docs-search` tool (see `Inkeep API key - mcp`)

```
INKEEP_API_KEY="..."
```


### Configuring the Model Context Protocol Inspector

During development you can directly inspect the MCP tool call results using the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector). 

You can run it using the following command:

```bash
npx @modelcontextprotocol/inspector npx -y mcp-remote@latest http://localhost:8787/sse --header "\"Authorization: Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}\""
```

Alternatively, you can use the following configuration in the MCP Inspector:

Use transport type `STDIO`.

**Command:**

```
npx
```

**Arguments:**

```
-y mcp-remote@latest http://localhost:8787/sse --header "Authorization: Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
```


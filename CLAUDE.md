# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm run dev` - Start development server using Wrangler
- `pnpm run deploy` - Deploy to Cloudflare Workers
- `pnpm run format` - Format code using Biome
- `pnpm run lint:fix` - Lint and fix code using Biome
- `pnpm run schema:build:json` - Generate JSON schema from Zod schemas for Python/other language implementations
- `wrangler types` - Generate TypeScript types for Cloudflare Workers

## Code Architecture

This is a PostHog MCP (Model Context Protocol) server built on Cloudflare Workers that provides API access to PostHog analytics data. The server acts as a bridge between MCP clients (like Claude Desktop, Cursor, Windsurf) and PostHog's API.

### Project Structure

The repository is organized to support multiple language implementations:

```
mcp/
├── typescript/          # TypeScript implementation
│   ├── src/            # TypeScript source code
│   ├── tests/          # TypeScript tests
│   └── scripts/        # TypeScript build scripts
├── python/             # Python implementation (planned)
├── schema/             # Shared schema files for all implementations
│   └── tool-inputs.json # Generated JSON schema for cross-language compatibility
├── biome.json          # Shared code formatting configuration
└── CLAUDE.md           # Project documentation
```

### Key Components (TypeScript Implementation)

- **Main MCP Class (`typescript/src/integrations/mcp/index.ts`)**: `MyMCP` extends `McpAgent` and defines all available tools for interacting with PostHog
- **Unified API Client (`typescript/src/api/client.ts`)**: `ApiClient` class provides type-safe methods for all PostHog API interactions with proper error handling and schema validation
- **Schema Validation (`typescript/src/schema/`)**: Zod schemas for validating API requests and responses
- **Tool Input Schemas (`typescript/src/schema/tool-inputs.ts`)**: Centralized Zod schemas for all MCP tool inputs, exported to `schema/tool-inputs.json` for other language implementations
- **Caching (`typescript/src/lib/utils/cache/`)**: User-scoped memory cache for storing project/org state
- **Documentation Search (`typescript/src/inkeepApi.ts`)**: Integration with Inkeep for PostHog docs search
- **Utility Functions (`typescript/src/lib/utils/api.ts`)**: Helper functions for pagination and URL generation

### Authentication & State Management

- Uses Bearer token authentication via `Authorization` header
- User state (active project/org) is cached per user hash derived from API token
- Automatic project/org selection when user has only one option
- State persists across requests within the same session

### API Architecture

The codebase uses a unified API client pattern:

- **API Client (`ApiClient`)**: Central class that handles all PostHog API requests with consistent error handling, authentication, and response validation
- **Resource Methods**: API client is organized into resource-based methods:
  - `organizations()`: Organization CRUD and project listing
  - `projects()`: Project details and property definitions
  - `featureFlags()`: Feature flag CRUD operations
  - `insights()`: Insight CRUD, listing, and SQL queries
  - `dashboards()`: Dashboard CRUD and insight management
  - `query()`: Generic query execution for analytics
  - `users()`: User information and authentication
- **Type Safety**: All methods return `Result<T, Error>` types with proper TypeScript definitions
- **URL Generation**: Uses configurable `BASE_URL` from constants for environment-aware URLs (localhost in dev, PostHog production in prod)

### Tool Categories

1. **Organization/Project Management**: Get orgs, projects, set active context
2. **Feature Flags**: CRUD operations on feature flags  
3. **Insights & Dashboards**: CRUD operations on insights and dashboards with proper URL generation
4. **Error Tracking**: Query errors and error details
5. **Data Warehouse**: SQL insights via natural language queries
6. **Documentation**: Search PostHog docs via Inkeep API
7. **Analytics**: LLM cost tracking and other metrics

### Environment Setup

- Create `.dev.vars` file with `INKEEP_API_KEY` for docs search functionality
- API token passed via Authorization header from MCP client configuration
- **Development Mode**: Set `DEV = true` in `typescript/src/lib/constants.ts` to use `http://localhost:8010` for API calls and URLs
- **Production Mode**: Set `DEV = false` to use `https://us.posthog.com` for API calls and URLs

### Schema Generation

The project uses a centralized schema system to support multiple language implementations:

- **Source**: Tool input schemas are defined in `typescript/src/schema/tool-inputs.ts` using Zod
- **Generation**: Run `pnpm run schema:build:json` to generate `schema/tool-inputs.json` from Zod schemas
- **Usage**: The generated JSON schema can be used to create Pydantic models or other language-specific types
- **Script**: Schema generation logic is in `typescript/scripts/generate-tool-schema.ts`

### Code Style

- Uses Biome for formatting (4-space indentation, 100 character line width)
- TypeScript with strict mode enabled
- Zod for runtime type validation
- No explicit `any` types allowed (disabled in linter)
- **Import Style**: Uses absolute imports with `@/` prefix (e.g., `import { ApiClient } from "@/api/client"`)
  - `@/` maps to `typescript/src/` directory
  - Configured in `tsconfig.json` path mapping
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm run dev` - Start development server using Wrangler
- `pnpm run deploy` - Deploy to Cloudflare Workers
- `pnpm run format` - Format code using Biome
- `pnpm run lint:fix` - Lint and fix code using Biome
- `wrangler types` - Generate TypeScript types for Cloudflare Workers

## Code Architecture

This is a PostHog MCP (Model Context Protocol) server built on Cloudflare Workers that provides API access to PostHog analytics data. The server acts as a bridge between MCP clients (like Claude Desktop, Cursor, Windsurf) and PostHog's API.

### Key Components

- **Main MCP Class (`src/index.ts`)**: `MyMCP` extends `McpAgent` and defines all available tools for interacting with PostHog
- **Unified API Client (`src/api/client.ts`)**: `ApiClient` class provides type-safe methods for all PostHog API interactions with proper error handling and schema validation
- **Schema Validation (`src/schema/`)**: Zod schemas for validating API requests and responses
- **Caching (`src/lib/utils/cache/`)**: User-scoped memory cache for storing project/org state
- **Documentation Search (`src/inkeepApi.ts`)**: Integration with Inkeep for PostHog docs search
- **Utility Functions (`src/lib/utils/api.ts`)**: Helper functions for pagination and URL generation

### Authentication & State Management

- Uses Bearer token authentication via `Authorization` header
- User state (active project/org) is cached per user hash derived from API token
- Automatic project/org selection when user has only one option
- State persists across requests within the same session

### Tool Categories

1. **Organization/Project Management**: Get orgs, projects, set active context
2. **Feature Flags**: CRUD operations on feature flags
3. **Error Tracking**: Query errors and error details
4. **Data Warehouse**: SQL insights via natural language queries
5. **Documentation**: Search PostHog docs via Inkeep API
6. **Analytics**: LLM cost tracking and other metrics

### Environment Setup

- Create `.dev.vars` file with `INKEEP_API_KEY` for docs search functionality
- API token passed via Authorization header from MCP client configuration

### Code Style

- Uses Biome for formatting (4-space indentation, 100 character line width)
- TypeScript with strict mode enabled
- Zod for runtime type validation
- No explicit `any` types allowed (disabled in linter)
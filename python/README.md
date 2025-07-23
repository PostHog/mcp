# PostHog MCP Python Implementation

This is a Python implementation of the PostHog MCP (Model Context Protocol) tools, equivalent to the TypeScript version. It provides a unified API client and tool registry for interacting with PostHog's analytics platform.

## Features

- **Unified API Client**: Type-safe API client with resource-based organization
- **Pydantic Models**: Full schema validation using Pydantic models
- **Async Support**: Built with async/await for optimal performance
- **Tool Registry**: Easy-to-use tool registry for executing MCP tools
- **Memory Caching**: Built-in caching for user state management

## Installation

```bash
pip install -r requirements.txt
```

## Quick Start

```python
import asyncio
from src.tools.registry import ToolRegistry

async def main():
    # Initialize with your PostHog API token
    registry = ToolRegistry("your-posthog-api-token")
    
    try:
        # Get organizations
        orgs = await registry.execute_tool("organizations-get", {})
        print(orgs)
        
        # Set active organization and project
        await registry.execute_tool("organization-set-active", {"orgId": "org-id"})
        await registry.execute_tool("project-set-active", {"projectId": "project-id"})
        
        # Get feature flags
        flags = await registry.execute_tool("feature-flags-get-all", {})
        print(flags)
        
    finally:
        await registry.close()

asyncio.run(main())
```

## Available Tools

### Organizations
- `organizations-get`: Get all organizations
- `organization-set-active`: Set active organization

### Projects  
- `projects-get`: Get all projects
- `project-set-active`: Set active project

### Feature Flags
- `feature-flags-get-all`: List all feature flags
- `create-feature-flag`: Create a new feature flag
- `update-feature-flag`: Update existing feature flag
- `delete-feature-flag`: Delete a feature flag

### Insights
- `insights-get-all`: List all insights
- `create-insight`: Create a new insight
- `get-sql-insight`: Execute SQL query as insight

## Architecture

The implementation follows the same patterns as the TypeScript version:

- **API Client**: Unified client with resource-based methods
- **Schema Validation**: Pydantic models for type safety
- **Tool Pattern**: Standardized tool interface with handlers
- **Result Type**: Consistent error handling with Result pattern
- **Context Injection**: Shared context for API client, cache, and state

## Configuration

Set environment mode by modifying `src/lib/constants.py`:

```python
DEV = False  # Set to True for localhost development
BASE_URL = "http://localhost:8010" if DEV else "https://us.posthog.com"
```

## Error Handling

All methods return a consistent Result type:

```python
@dataclass
class Result:
    success: bool
    data: Optional[Any] = None
    error: Optional[Exception] = None
```

## Development

The codebase is organized as follows:

```
src/
├── api/           # API client implementation
├── lib/           # Utilities and constants
├── schema/        # Pydantic model definitions
└── tools/         # MCP tool implementations
```

## Comparison with TypeScript Version

This Python implementation provides feature parity with the TypeScript MCP server:

- Same API methods and endpoints
- Equivalent schema validation (Pydantic vs Zod)
- Identical tool interface and functionality
- Consistent error handling patterns
- Same caching and state management approach
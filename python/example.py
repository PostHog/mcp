"""
Example usage of the PostHog MCP Python tools.

This demonstrates how to use the Python implementation equivalent
to the TypeScript MCP server.
"""

import asyncio
import json

from src.tools.registry import ToolRegistry


async def main():
    # Initialize the tool registry with your PostHog API token
    # In production, get this from environment variables
    api_token = "your-posthog-api-token-here"
    registry = ToolRegistry(api_token)

    try:
        # Example 1: Get organizations
        print("Getting organizations...")
        org_result = await registry.execute_tool("organizations-get", {})
        print(json.dumps(org_result, indent=2))

        # Example 2: Set active organization (you'll need a real org ID)
        # org_id = "your-org-id-here"
        # await registry.execute_tool("organization-set-active", {"orgId": org_id})

        # Example 3: Get projects
        # print("\nGetting projects...")
        # projects_result = await registry.execute_tool("projects-get", {})
        # print(json.dumps(projects_result, indent=2))

        # Example 4: Set active project (you'll need a real project ID)
        # project_id = "your-project-id-here"
        # await registry.execute_tool("project-set-active", {"projectId": project_id})

        # Example 5: Get feature flags
        # print("\nGetting feature flags...")
        # flags_result = await registry.execute_tool("feature-flags-get-all", {})
        # print(json.dumps(flags_result, indent=2))

        # Example 6: Create a feature flag
        # flag_data = {
        #     "name": "Test Flag",
        #     "key": "test-flag",
        #     "description": "A test feature flag",
        #     "filters": {
        #         "groups": [{
        #             "properties": [],
        #             "rollout_percentage": 100
        #         }]
        #     },
        #     "active": True,
        #     "tags": ["test"]
        # }
        # create_result = await registry.execute_tool("create-feature-flag", flag_data)
        # print(json.dumps(create_result, indent=2))

        # Example 7: Get insights
        # print("\nGetting insights...")
        # insights_result = await registry.execute_tool("insights-get-all", {"limit": 10})
        # print(json.dumps(insights_result, indent=2))

        # Example 8: SQL Insight
        # sql_result = await registry.execute_tool("get-sql-insight", {
        #     "query": "SELECT event, count() FROM events WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY event"
        # })
        # print(json.dumps(sql_result, indent=2))

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await registry.close()


if __name__ == "__main__":
    asyncio.run(main())

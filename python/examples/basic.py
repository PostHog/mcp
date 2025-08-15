#!/usr/bin/env python3
"""
Basic example of using PostHog MCP tools.

This example demonstrates how to:
1. Create a configuration from environment variables
2. Initialize the tool registry with context management
3. List available tools
4. Execute a simple tool (get organizations)

To run this example, you need to set environment variables:
- POSTHOG_PERSONAL_API_KEY: Your PostHog API token
- POSTHOG_API_BASE_URL: Your PostHog instance URL (e.g., https://us.posthog.com)
"""

import asyncio
import json

from dotenv import load_dotenv
from lib.config import load_config_from_env
from tools.registry import ToolRegistry


async def main():
    print("🚀 PostHog MCP Tools Basic Example")
    print("=" * 50)

    load_dotenv()

    config = load_config_from_env()

    async with ToolRegistry(config) as registry:
        print(f"🔧 Loaded {len(registry.tools)} tools:")

        # List all available tools
        for i, tool in enumerate(registry.tools, 1):
            print(f"  {i:2d}. {tool.name}")

        print("\n" + "=" * 50)
        print("🎯 Executing: organizations-get")
        print("=" * 50)

        try:
            # Execute the get-organizations tool
            result = await registry.execute_tool("organizations-get", {})
            orgs_data = json.loads(result.content)

            if orgs_data and len(orgs_data) > 0:
                # Use the first organization
                first_org = orgs_data[0]
                org_id = first_org["id"]
                org_name = first_org["name"]

                print(f"🏢 Found {len(orgs_data)} organization(s)")
                print(f"🎯 Setting active organization: {org_name} (ID: {org_id})")

                # Set the active organization
                await registry.execute_tool("organization-set-active", {"orgId": org_id})
                print("✅ Active organization set successfully!")
            else:
                print("❌ No organizations found")
                return

        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON response: {e}")
            return
        except Exception as e:
            print(f"❌ Error executing tool: {e}")
            print(f"Error type: {type(e).__name__}")
            return

        print("\n" + "=" * 50)
        print("🎯 Getting and setting active project")
        print("=" * 50)

        try:
            # Get projects for the organization
            projects_result = await registry.execute_tool("projects-get", {})
            projects_data = json.loads(projects_result.content)

            if projects_data and len(projects_data) > 0:
                # Use the first project
                first_project = projects_data[0]
                project_id = first_project["id"]
                project_name = first_project["name"]

                print(f"📋 Found {len(projects_data)} project(s)")
                print(f"🎯 Setting active project: {project_name} (ID: {project_id})")

                # Set the active project
                await registry.execute_tool("project-set-active", {"projectId": project_id})
                print("✅ Active project set successfully!")
            else:
                print("❌ No projects found")
                return

        except Exception as e:
            print(f"❌ Error setting active project: {e}")
            print(f"Error type: {type(e).__name__}")
            return

        print("\n" + "=" * 50)
        print("🎯 Creating a feature flag")
        print("=" * 50)

        try:
            # Create a simple feature flag
            flag_data = {
                "name": "Example Flag",
                "key": "example-flag",
                "description": "This is an example feature flag created via the API",
                "filters": {"groups": [{"properties": [], "rollout_percentage": 100}]},
                "active": True,
                "tags": ["example", "demo"],
            }

            result = await registry.execute_tool("create-feature-flag", flag_data)
            print("✅ Feature flag created successfully!")
            print(result.content)

            # Parse the result to get the flag key for updates/deletion
            flag_response = json.loads(result.content)
            flag_key = flag_response.get("key", "example-flag")

        except Exception as e:
            print(f"❌ Error creating feature flag: {e}")
            print(f"Error type: {type(e).__name__}")
            return

        print("\n" + "=" * 50)
        print("🎯 Updating the feature flag")
        print("=" * 50)

        try:
            # Update the feature flag
            update_data = {
                "flagKey": flag_key,
                "data": {
                    "name": "Updated Example Flag",
                    "description": "This flag has been updated via the API",
                    "filters": {
                        "groups": [
                            {
                                "properties": [],
                                "rollout_percentage": 50,  # Changed rollout to 50%
                            }
                        ]
                    },
                    "active": True,
                    "tags": ["example", "demo", "updated"],
                },
            }

            result = await registry.execute_tool("update-feature-flag", update_data)
            print("✅ Feature flag updated successfully!")
            print(result.content)

        except Exception as e:
            print(f"❌ Error updating feature flag: {e}")
            print(f"Error type: {type(e).__name__}")

        print("\n" + "=" * 50)
        print("🎯 Deleting the feature flag")
        print("=" * 50)

        try:
            # Delete the feature flag
            delete_data = {"flagKey": flag_key}

            result = await registry.execute_tool("delete-feature-flag", delete_data)
            print("✅ Feature flag deleted successfully!")
            print(result.content)

        except Exception as e:
            print(f"❌ Error deleting feature flag: {e}")
            print(f"Error type: {type(e).__name__}")

        print("\n🎉 Example completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())

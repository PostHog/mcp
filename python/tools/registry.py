from typing import Any

from api.client import ApiClient, ApiConfig, is_error, is_success
from lib.config import PostHogToolConfig
from lib.utils.cache.memory_cache import MemoryCache
from tools.dashboards.add_insight import add_insight_to_dashboard_tool
from tools.dashboards.create import create_dashboard_tool
from tools.dashboards.delete import delete_dashboard_tool
from tools.dashboards.get import get_dashboard_tool
from tools.dashboards.get_all import get_all_dashboards_tool
from tools.dashboards.update import update_dashboard_tool
from tools.documentation.search_docs import search_docs_tool
from tools.error_tracking.error_details import error_details_tool
from tools.error_tracking.list_errors import list_errors_tool
from tools.feature_flags.create import create_feature_flag_tool
from tools.feature_flags.delete import delete_feature_flag_tool
from tools.feature_flags.get_all import get_all_feature_flags_tool
from tools.feature_flags.get_definition import get_feature_flag_definition_tool
from tools.feature_flags.update import update_feature_flag_tool
from tools.insights.create import create_insight_tool
from tools.insights.delete import delete_insight_tool
from tools.insights.get import get_insight_tool
from tools.insights.get_all import get_all_insights_tool
from tools.insights.get_sql_insight import get_sql_insight_tool
from tools.insights.update import update_insight_tool
from tools.llm_observability.get_llm_costs import get_llm_costs_tool
from tools.organizations.get_details import get_organization_details_tool
from tools.organizations.get_organizations import get_organizations_tool
from tools.organizations.set_active import set_active_org_tool
from tools.projects.get_projects import get_projects_tool
from tools.projects.property_definitions import property_definitions_tool
from tools.projects.set_active import set_active_project_tool
from tools.types import Context


class ToolRegistry:
    def __init__(self, config: PostHogToolConfig):
        self.config = config
        self.api = ApiClient(ApiConfig(api_token=config.api_token, base_url=config.api_base_url))
        self.cache = MemoryCache()

        self.tools = [
            # Organization tools
            get_organizations_tool(),
            set_active_org_tool(),
            get_organization_details_tool(),
            # Project tools
            get_projects_tool(),
            set_active_project_tool(),
            property_definitions_tool(),
            # Feature flag tools
            create_feature_flag_tool(),
            get_all_feature_flags_tool(),
            get_feature_flag_definition_tool(),
            update_feature_flag_tool(),
            delete_feature_flag_tool(),
            # Insight tools
            create_insight_tool(),
            get_all_insights_tool(),
            get_insight_tool(),
            update_insight_tool(),
            delete_insight_tool(),
            get_sql_insight_tool(),
            # Dashboard tools
            get_all_dashboards_tool(),
            create_dashboard_tool(),
            get_dashboard_tool(),
            update_dashboard_tool(),
            delete_dashboard_tool(),
            add_insight_to_dashboard_tool(),
            # Error tracking tools
            list_errors_tool(),
            error_details_tool(),
            # Documentation tools
            search_docs_tool(),
            # LLM observability tools
            get_llm_costs_tool(),
        ]

    async def get_project_id(self) -> str:
        project_id = await self.cache.get("project_id")
        if not project_id:
            raise Exception("No active project set. Please use project-set-active first.")
        return project_id

    async def get_org_id(self) -> str:
        org_id = await self.cache.get("org_id")
        if not org_id:
            raise Exception("No active organization set. Please use organization-set-active first.")
        return org_id

    async def get_distinct_id(self) -> str:
        distinct_id = await self.cache.get("distinct_id")

        if not distinct_id:
            # Fetch from API if not cached
            user_result = await self.api.users().me()

            if is_error(user_result):
                raise Exception(f"Failed to get user info: {user_result.error}")

            assert is_success(user_result)

            distinct_id = user_result.data.distinct_id

            await self.cache.set("distinct_id", distinct_id)

        return distinct_id

    def get_context(self) -> Context:
        return Context(
            api=self.api,
            cache=self.cache,
            config=self.config,
            get_project_id=self.get_project_id,
            get_org_id=self.get_org_id,
            get_distinct_id=self.get_distinct_id,
        )

    async def execute_tool(self, tool_name: str, params: dict[str, Any]) -> dict[str, Any]:
        tool = next((t for t in self.tools if t.name == tool_name), None)
        if not tool:
            raise Exception(f"Tool '{tool_name}' not found")

        context = self.get_context()
        validated_params = tool.schema.model_validate(params)
        result = await tool.execute(context, validated_params)

        return {"content": [{"type": content.type, "text": content.text} for content in result.content]}

    async def close(self):
        await self.api.close()

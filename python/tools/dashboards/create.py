import json

from api.client import is_error, is_success
from lib.utils.api import get_project_base_url
from schema.tool_inputs import DashboardCreateSchema
from tools.types import Context, Tool, ToolResult


async def create_dashboard_handler(context: Context, params: DashboardCreateSchema) -> ToolResult:
    project_id = await context.get_project_id()
    dashboard_result = await context.api.dashboards(project_id).create(params.data)

    if is_error(dashboard_result):
        raise Exception(f"Failed to create dashboard: {dashboard_result.error}")

    assert is_success(dashboard_result)

    dashboard_data = dashboard_result.data

    dashboard_with_url = {
        **dashboard_data.model_dump(),
        "url": f"{get_project_base_url(project_id, context.api.base_url)}/dashboard/{dashboard_data.id}",
    }

    return ToolResult(content=json.dumps(dashboard_with_url))


def create_dashboard_tool() -> Tool[DashboardCreateSchema]:
    return Tool(
        name="dashboard-create",
        description="""
        - Create a new dashboard in the project.
        - Requires name and optional description, tags, and other properties.
        """,
        schema=DashboardCreateSchema,
        handler=create_dashboard_handler,
    )

import json

from lib.utils.api import get_project_base_url
from schema.tool_inputs import DashboardCreateSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def create_dashboard_handler(context: Context, params: DashboardCreateSchema) -> ToolResult:
    project_id = await context.get_project_id()
    dashboard_result = await context.api.dashboards(project_id).create(params.data)

    if not dashboard_result.success:
        raise Exception(f"Failed to create dashboard: {dashboard_result.error}")

    dashboard_with_url = {
        **dashboard_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/dashboard/{dashboard_result.data.id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(dashboard_with_url))])


def create_dashboard_tool() -> Tool[DashboardCreateSchema]:
    return Tool(
        name="dashboard-create",
        description="""
        - Create a new dashboard in the project.
        - Requires name and optional description, tags, and other properties.
        """,
        schema=DashboardCreateSchema,
        handler=create_dashboard_handler
    )

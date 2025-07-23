import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.schema.dashboards import CreateDashboardInput
from src.lib.utils.api import get_project_base_url


class CreateDashboardParams(BaseModel):
    data: CreateDashboardInput


async def create_dashboard_handler(context: Context, params: CreateDashboardParams) -> ToolResult:
    project_id = await context.get_project_id()
    dashboard_result = await context.api.dashboards(project_id).create(params.data)

    if not dashboard_result.success:
        raise Exception(f"Failed to create dashboard: {dashboard_result.error}")

    dashboard_with_url = {
        **dashboard_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/dashboard/{dashboard_result.data.id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(dashboard_with_url))])


def create_dashboard_tool() -> Tool[CreateDashboardParams]:
    return Tool(
        name="dashboard-create",
        description="""
        - Create a new dashboard in the project.
        - Requires name and optional description, tags, and other properties.
        """,
        schema=CreateDashboardParams,
        handler=create_dashboard_handler
    )
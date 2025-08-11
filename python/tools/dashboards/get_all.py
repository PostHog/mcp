import json

from api.client import is_error, is_success
from schema.tool_inputs import DashboardGetAllSchema
from tools.types import Context, Tool, ToolResult


async def get_all_dashboards_handler(context: Context, params: DashboardGetAllSchema) -> ToolResult:
    project_id = await context.get_project_id()
    dashboards_result = await context.api.dashboards(project_id).list(params.data)

    if is_error(dashboards_result):
        raise Exception(f"Failed to get dashboards: {dashboards_result.error}")

    assert is_success(dashboards_result)

    dashboards_data = [dashboard.model_dump() for dashboard in dashboards_result.data]

    return ToolResult(content=json.dumps(dashboards_data))


def get_all_dashboards_tool() -> Tool[DashboardGetAllSchema]:
    return Tool(
        name="dashboards-get-all",
        description="""
        - Get all dashboards in the project with optional filtering.
        - Can filter by pinned status, search term, or pagination.
        """,
        schema=DashboardGetAllSchema,
        handler=get_all_dashboards_handler,
    )

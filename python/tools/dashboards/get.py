import json

from api.client import is_error, is_success
from schema.tool_inputs import DashboardGetSchema
from tools.types import Context, Tool, ToolResult


async def get_dashboard_handler(context: Context, params: DashboardGetSchema) -> ToolResult:
    project_id = await context.get_project_id()
    dashboard_result = await context.api.dashboards(project_id).get(int(params.dashboardId))

    if is_error(dashboard_result):
        raise Exception(f"Failed to get dashboard: {dashboard_result.error}")

    assert is_success(dashboard_result)
    return ToolResult(json.dumps(dashboard_result.data.model_dump()))


def get_dashboard_tool() -> Tool[DashboardGetSchema]:
    return Tool(
        name="dashboard-get",
        description="Get a specific dashboard by ID.",
        schema=DashboardGetSchema,
        handler=get_dashboard_handler,
    )

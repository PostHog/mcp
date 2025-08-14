import json

from api.client import is_error, is_success
from schema.tool_inputs import DashboardGetSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def get_dashboard_handler(context: Context, params: DashboardGetSchema) -> ToolResult:
    project_id = await context.get_project_id()
    dashboard_result = await context.api.dashboards(project_id).get(int(params.dashboardId))

    if is_error(dashboard_result):
        raise Exception(f"Failed to get dashboard: {dashboard_result.error}")

    assert is_success(dashboard_result)
    return ToolResult(json.dumps(dashboard_result.data.model_dump()))


def get_dashboard_tool() -> Tool[DashboardGetSchema]:
    definition = get_tool_definition("dashboard-get")

    return Tool(
        name="dashboard-get",
        description=definition["description"],
        schema=DashboardGetSchema,
        handler=get_dashboard_handler,
    )

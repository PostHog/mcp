import json

from api.client import is_error, is_success
from schema.tool_inputs import DashboardDeleteSchema
from tools.types import Context, Tool, ToolResult


async def delete_dashboard_handler(context: Context, params: DashboardDeleteSchema) -> ToolResult:
    project_id = await context.get_project_id()
    result = await context.api.dashboards(project_id).delete(int(params.dashboardId))

    if is_error(result):
        raise Exception(f"Failed to delete dashboard: {result.error}")

    assert is_success(result)
    return ToolResult(content=json.dumps(result.data))


def delete_dashboard_tool() -> Tool[DashboardDeleteSchema]:
    return Tool(
        name="dashboard-delete",
        description="Delete a dashboard by ID (soft delete - marks as deleted).",
        schema=DashboardDeleteSchema,
        handler=delete_dashboard_handler,
    )

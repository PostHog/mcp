import json

from schema.tool_inputs import DashboardDeleteSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def delete_dashboard_handler(context: Context, params: DashboardDeleteSchema) -> ToolResult:
    project_id = await context.get_project_id()
    result = await context.api.dashboards(project_id).delete(int(params.dashboardId))

    if not result.success:
        raise Exception(f"Failed to delete dashboard: {result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(result.data))])


def delete_dashboard_tool() -> Tool[DashboardDeleteSchema]:
    return Tool(
        name="dashboard-delete",
        description="Delete a dashboard by ID (soft delete - marks as deleted).",
        schema=DashboardDeleteSchema,
        handler=delete_dashboard_handler,
    )

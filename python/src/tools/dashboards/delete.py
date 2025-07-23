import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class DeleteDashboardParams(BaseModel):
    dashboardId: int


async def delete_dashboard_handler(context: Context, params: DeleteDashboardParams) -> ToolResult:
    project_id = await context.get_project_id()
    result = await context.api.dashboards(project_id).delete(params.dashboardId)

    if not result.success:
        raise Exception(f"Failed to delete dashboard: {result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(result.data))])


def delete_dashboard_tool() -> Tool[DeleteDashboardParams]:
    return Tool(
        name="dashboard-delete",
        description="Delete a dashboard by ID (soft delete - marks as deleted).",
        schema=DeleteDashboardParams,
        handler=delete_dashboard_handler
    )
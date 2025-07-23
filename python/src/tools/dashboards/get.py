import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class GetDashboardParams(BaseModel):
    dashboardId: int


async def get_dashboard_handler(context: Context, params: GetDashboardParams) -> ToolResult:
    project_id = await context.get_project_id()
    dashboard_result = await context.api.dashboards(project_id).get(params.dashboardId)

    if not dashboard_result.success:
        raise Exception(f"Failed to get dashboard: {dashboard_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(dashboard_result.data.model_dump()))])


def get_dashboard_tool() -> Tool[GetDashboardParams]:
    return Tool(
        name="dashboard-get",
        description="Get a specific dashboard by ID.",
        schema=GetDashboardParams,
        handler=get_dashboard_handler
    )
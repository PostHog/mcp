import json

from schema.tool_inputs import DashboardGetSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def get_dashboard_handler(context: Context, params: DashboardGetSchema) -> ToolResult:
    project_id = await context.get_project_id()
    dashboard_result = await context.api.dashboards(project_id).get(int(params.dashboardId))

    if not dashboard_result.success:
        raise Exception(f"Failed to get dashboard: {dashboard_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(dashboard_result.data.model_dump()))])


def get_dashboard_tool() -> Tool[DashboardGetSchema]:
    return Tool(
        name="dashboard-get",
        description="Get a specific dashboard by ID.",
        schema=DashboardGetSchema,
        handler=get_dashboard_handler
    )

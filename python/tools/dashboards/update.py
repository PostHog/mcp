import json

from lib.utils.api import get_project_base_url
from schema.tool_inputs import DashboardUpdateSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def update_dashboard_handler(context: Context, params: DashboardUpdateSchema) -> ToolResult:
    project_id = await context.get_project_id()
    dashboard_result = await context.api.dashboards(project_id).update(
        int(params.dashboardId), params.data
    )

    if not dashboard_result.success:
        raise Exception(f"Failed to update dashboard: {dashboard_result.error}")

    dashboard_with_url = {
        **dashboard_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/dashboard/{dashboard_result.data.id}",
    }

    return ToolResult(content=[TextContent(text=json.dumps(dashboard_with_url))])


def update_dashboard_tool() -> Tool[DashboardUpdateSchema]:
    return Tool(
        name="dashboard-update",
        description="""
        - Update an existing dashboard by ID.
        - Can update name, description, pinned status or tags.
        """,
        schema=DashboardUpdateSchema,
        handler=update_dashboard_handler,
    )

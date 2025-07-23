import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.schema.dashboards import UpdateDashboardInput
from src.lib.utils.api import get_project_base_url


class UpdateDashboardParams(BaseModel):
    dashboardId: int
    data: UpdateDashboardInput


async def update_dashboard_handler(context: Context, params: UpdateDashboardParams) -> ToolResult:
    project_id = await context.get_project_id()
    dashboard_result = await context.api.dashboards(project_id).update(params.dashboardId, params.data)

    if not dashboard_result.success:
        raise Exception(f"Failed to update dashboard: {dashboard_result.error}")

    dashboard_with_url = {
        **dashboard_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/dashboard/{dashboard_result.data.id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(dashboard_with_url))])


def update_dashboard_tool() -> Tool[UpdateDashboardParams]:
    return Tool(
        name="dashboard-update",
        description="""
        - Update an existing dashboard by ID.
        - Can update name, description, pinned status or tags.
        """,
        schema=UpdateDashboardParams,
        handler=update_dashboard_handler
    )
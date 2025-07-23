import json
from typing import Optional
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.schema.dashboards import ListDashboards


class GetAllDashboardsParams(BaseModel):
    data: Optional[ListDashboards] = None


async def get_all_dashboards_handler(context: Context, params: GetAllDashboardsParams) -> ToolResult:
    project_id = await context.get_project_id()
    dashboards_result = await context.api.dashboards(project_id).list(params.data)

    if not dashboards_result.success:
        raise Exception(f"Failed to get dashboards: {dashboards_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps([dashboard.model_dump() for dashboard in dashboards_result.data]))])


def get_all_dashboards_tool() -> Tool[GetAllDashboardsParams]:
    return Tool(
        name="dashboards-get-all",
        description="""
        - Get all dashboards in the project with optional filtering.
        - Can filter by pinned status, search term, or pagination.
        """,
        schema=GetAllDashboardsParams,
        handler=get_all_dashboards_handler
    )
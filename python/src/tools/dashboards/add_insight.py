import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.schema.dashboards import AddInsightToDashboard
from src.lib.utils.api import get_project_base_url


class AddInsightToDashboardParams(BaseModel):
    data: AddInsightToDashboard


async def add_insight_to_dashboard_handler(context: Context, params: AddInsightToDashboardParams) -> ToolResult:
    project_id = await context.get_project_id()

    # First get the insight to get its short_id for URL generation
    insight_result = await context.api.insights(project_id).get(params.data.insight_id)
    
    if not insight_result.success:
        raise Exception(f"Failed to get insight: {insight_result.error}")

    # Then add the insight to the dashboard
    result = await context.api.dashboards(project_id).add_insight(params.data)

    if not result.success:
        raise Exception(f"Failed to add insight to dashboard: {result.error}")

    result_with_urls = {
        **result.data,
        "dashboard_url": f"{get_project_base_url(project_id)}/dashboard/{params.data.dashboard_id}",
        "insight_url": f"{get_project_base_url(project_id)}/insights/{insight_result.data.short_id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(result_with_urls))])


def add_insight_to_dashboard_tool() -> Tool[AddInsightToDashboardParams]:
    return Tool(
        name="add-insight-to-dashboard",
        description="""
        - Add an existing insight to a dashboard.
        - Requires insight ID and dashboard ID.
        - Optionally supports layout and color customization.
        """,
        schema=AddInsightToDashboardParams,
        handler=add_insight_to_dashboard_handler
    )
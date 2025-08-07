import json

from api.client import is_error, is_success
from lib.utils.api import get_project_base_url
from schema.dashboards import AddInsightToDashboard
from schema.tool_inputs import DashboardAddInsightSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def add_insight_to_dashboard_handler(context: Context, params: DashboardAddInsightSchema) -> ToolResult:
    project_id = await context.get_project_id()

    insight_result = await context.api.insights(project_id).get(params.data.insightId)

    if is_error(insight_result):
        raise Exception(f"Failed to get insight: {insight_result.error}")

    assert is_success(insight_result)

    add_insight_data = AddInsightToDashboard(insight_id=params.data.insightId, dashboard_id=params.data.dashboardId)

    result = await context.api.dashboards(project_id).add_insight(add_insight_data)

    if is_error(result):
        raise Exception(f"Failed to add insight to dashboard: {result.error}")

    assert is_success(result)

    result_with_urls = {
        **result.data,
        "dashboard_url": f"{get_project_base_url(project_id)}/dashboard/{params.data.dashboardId}",
        "insight_url": f"{get_project_base_url(project_id)}/insights/{insight_result.data.short_id}",
    }

    return ToolResult(content=[TextContent(text=json.dumps(result_with_urls))])


def add_insight_to_dashboard_tool() -> Tool[DashboardAddInsightSchema]:
    return Tool(
        name="add-insight-to-dashboard",
        description="""
        - Add an existing insight to a dashboard.
        - Requires insight ID and dashboard ID.
        - Optionally supports layout and color customization.
        """,
        schema=DashboardAddInsightSchema,
        handler=add_insight_to_dashboard_handler,
    )

import json

from api.client import is_error, is_success
from lib.utils.api import get_project_base_url
from schema.tool_inputs import InsightGetSchema
from tools.types import Context, Tool, ToolResult


async def get_insight_handler(context: Context, params: InsightGetSchema) -> ToolResult:
    project_id = await context.get_project_id()
    insight_result = await context.api.insights(project_id).get(int(params.insightId))

    if is_error(insight_result):
        raise Exception(f"Failed to get insight: {insight_result.error}")

    assert is_success(insight_result)

    insight_data = insight_result.data

    insight_with_url = {
        **insight_data.model_dump(),
        "url": f"{get_project_base_url(project_id, context.api.base_url)}/insights/{insight_data.short_id}",
    }

    return ToolResult(content=json.dumps(insight_with_url))


def get_insight_tool() -> Tool[InsightGetSchema]:
    return Tool(
        name="insight-get",
        description="Get a specific insight by ID.",
        schema=InsightGetSchema,
        handler=get_insight_handler,
    )

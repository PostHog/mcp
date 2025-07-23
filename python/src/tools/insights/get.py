import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.lib.utils.api import get_project_base_url


class GetInsightParams(BaseModel):
    insightId: int


async def get_insight_handler(context: Context, params: GetInsightParams) -> ToolResult:
    project_id = await context.get_project_id()
    insight_result = await context.api.insights(project_id).get(params.insightId)
    
    if not insight_result.success:
        raise Exception(f"Failed to get insight: {insight_result.error}")

    insight_with_url = {
        **insight_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/insights/{insight_result.data.short_id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(insight_with_url))])


def get_insight_tool() -> Tool[GetInsightParams]:
    return Tool(
        name="insight-get",
        description="Get a specific insight by ID.",
        schema=GetInsightParams,
        handler=get_insight_handler
    )
import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.schema.insights import UpdateInsightInput
from src.lib.utils.api import get_project_base_url


class UpdateInsightParams(BaseModel):
    insightId: int
    data: UpdateInsightInput


async def update_insight_handler(context: Context, params: UpdateInsightParams) -> ToolResult:
    project_id = await context.get_project_id()
    insight_result = await context.api.insights(project_id).update(params.insightId, params.data)

    if not insight_result.success:
        raise Exception(f"Failed to update insight: {insight_result.error}")

    insight_with_url = {
        **insight_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/insights/{insight_result.data.short_id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(insight_with_url))])


def update_insight_tool() -> Tool[UpdateInsightParams]:
    return Tool(
        name="insight-update",
        description="""
        - Update an existing insight by ID.
        - Can update name, description, filters, and other properties.
        """,
        schema=UpdateInsightParams,
        handler=update_insight_handler
    )
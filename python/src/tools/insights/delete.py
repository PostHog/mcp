import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class DeleteInsightParams(BaseModel):
    insightId: int


async def delete_insight_handler(context: Context, params: DeleteInsightParams) -> ToolResult:
    project_id = await context.get_project_id()
    result = await context.api.insights(project_id).delete(params.insightId)

    if not result.success:
        raise Exception(f"Failed to delete insight: {result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(result.data))])


def delete_insight_tool() -> Tool[DeleteInsightParams]:
    return Tool(
        name="insight-delete",
        description="Delete an insight by ID (soft delete - marks as deleted).",
        schema=DeleteInsightParams,
        handler=delete_insight_handler
    )
import json

from api.client import is_error, is_success
from schema.tool_inputs import InsightDeleteSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def delete_insight_handler(context: Context, params: InsightDeleteSchema) -> ToolResult:
    project_id = await context.get_project_id()
    result = await context.api.insights(project_id).delete(int(params.insightId))

    if is_error(result):
        raise Exception(f"Failed to delete insight: {result.error}")

    assert is_success(result)
    return ToolResult(content=[TextContent(text=json.dumps(result.data))])


def delete_insight_tool() -> Tool[InsightDeleteSchema]:
    return Tool(
        name="insight-delete",
        description="Delete an insight by ID (soft delete - marks as deleted).",
        schema=InsightDeleteSchema,
        handler=delete_insight_handler,
    )

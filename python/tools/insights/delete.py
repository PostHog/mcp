import json

from api.client import is_error, is_success
from schema.tool_inputs import InsightDeleteSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def delete_insight_handler(context: Context, params: InsightDeleteSchema) -> ToolResult:
    project_id = await context.get_project_id()
    result = await context.api.insights(project_id).delete(int(params.insightId))

    if is_error(result):
        raise Exception(f"Failed to delete insight: {result.error}")

    assert is_success(result)
    return ToolResult(content=json.dumps(result.data))


def delete_insight_tool() -> Tool[InsightDeleteSchema]:
    definition = get_tool_definition("insight-delete")

    return Tool(
        name="insight-delete",
        description=definition["description"],
        schema=InsightDeleteSchema,
        handler=delete_insight_handler,
    )

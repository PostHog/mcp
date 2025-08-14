import json

from api.client import is_error, is_success
from lib.utils.api import get_project_base_url
from schema.tool_inputs import InsightCreateSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def create_insight_handler(context: Context, params: InsightCreateSchema) -> ToolResult:
    project_id = await context.get_project_id()

    insight_result = await context.api.insights(project_id).create(params.data)

    if is_error(insight_result):
        raise Exception(f"Failed to create insight: {insight_result.error}")

    assert is_success(insight_result)

    insight_data = insight_result.data

    insight_with_url = {
        **insight_data.model_dump(),
        "url": f"{get_project_base_url(project_id, context.api.base_url)}/insights/{insight_data.short_id}",
    }

    return ToolResult(content=json.dumps(insight_with_url))


def create_insight_tool() -> Tool[InsightCreateSchema]:
    definition = get_tool_definition("insight-create-from-query")

    return Tool(
        name="insight-create-from-query",
        description=definition["description"],
        schema=InsightCreateSchema,
        handler=create_insight_handler,
    )

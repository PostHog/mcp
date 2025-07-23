import json

from lib.utils.api import get_project_base_url
from schema.tool_inputs import InsightCreateSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def create_insight_handler(context: Context, params: InsightCreateSchema) -> ToolResult:
    project_id = await context.get_project_id()

    insight_result = await context.api.insights(project_id).create(params.data)

    if not insight_result.success:
        raise Exception(f"Failed to create insight: {insight_result.error}")

    insight_with_url = {
        **insight_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/insights/{insight_result.data.short_id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(insight_with_url))])


def create_insight_tool() -> Tool[InsightCreateSchema]:
    return Tool(
        name="create-insight",
        description="Creates a new insight in the project.",
        schema=InsightCreateSchema,
        handler=create_insight_handler
    )

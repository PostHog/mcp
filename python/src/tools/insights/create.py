import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.schema.insights import CreateInsightInput
from src.lib.utils.api import get_project_base_url


async def create_insight_handler(context: Context, params: CreateInsightInput) -> ToolResult:
    project_id = await context.get_project_id()

    insight_result = await context.api.insights(project_id).create(params)

    if not insight_result.success:
        raise Exception(f"Failed to create insight: {insight_result.error}")

    insight_with_url = {
        **insight_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/insights/{insight_result.data.short_id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(insight_with_url))])


def create_insight_tool() -> Tool[CreateInsightInput]:
    return Tool(
        name="create-insight",
        description="Creates a new insight in the project.",
        schema=CreateInsightInput,
        handler=create_insight_handler
    )
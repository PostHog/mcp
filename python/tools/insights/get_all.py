import json

from schema.insights import ListInsights
from schema.tool_inputs import InsightGetAllSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def get_all_insights_handler(context: Context, params: InsightGetAllSchema) -> ToolResult:
    project_id = await context.get_project_id()

    # Extract parameters from the nested data structure
    data = params.data

    if data:
        list_params = ListInsights(
            limit=int(data.limit) if data.limit else None,
            offset=int(data.offset) if data.offset else None,
            saved=data.saved,
            favorited=data.favorited,
            search=data.search
        )
    else:
        list_params = ListInsights()

    insights_result = await context.api.insights(project_id).list(list_params)

    if not insights_result.success:
        raise Exception(f"Failed to get insights: {insights_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps([insight.model_dump() for insight in insights_result.data]))])


def get_all_insights_tool() -> Tool[InsightGetAllSchema]:
    return Tool(
        name="insights-get-all",
        description="Use this tool to get all insights for the project. Supports filtering by saved, favorited, and search query.",
        schema=InsightGetAllSchema,
        handler=get_all_insights_handler
    )

import json
from typing import Optional
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.schema.insights import ListInsights


class GetAllInsightsParams(BaseModel):
    limit: Optional[int] = None
    offset: Optional[int] = None
    saved: Optional[bool] = None
    favorited: Optional[bool] = None
    search: Optional[str] = None


async def get_all_insights_handler(context: Context, params: GetAllInsightsParams) -> ToolResult:
    project_id = await context.get_project_id()
    
    list_params = ListInsights(
        limit=params.limit,
        offset=params.offset,
        saved=params.saved,
        favorited=params.favorited,
        search=params.search
    )
    
    insights_result = await context.api.insights(project_id).list(list_params)

    if not insights_result.success:
        raise Exception(f"Failed to get insights: {insights_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps([insight.model_dump() for insight in insights_result.data]))])


def get_all_insights_tool() -> Tool[GetAllInsightsParams]:
    return Tool(
        name="insights-get-all",
        description="Use this tool to get all insights for the project. Supports filtering by saved, favorited, and search query.",
        schema=GetAllInsightsParams,
        handler=get_all_insights_handler
    )
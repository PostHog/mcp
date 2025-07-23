import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class GetSqlInsightParams(BaseModel):
    query: str


async def get_sql_insight_handler(context: Context, params: GetSqlInsightParams) -> ToolResult:
    project_id = await context.get_project_id()

    insight_result = await context.api.insights(project_id).sql_insight(params.query)

    if not insight_result.success:
        raise Exception(f"Failed to execute SQL insight: {insight_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(insight_result.data))])


def get_sql_insight_tool() -> Tool[GetSqlInsightParams]:
    return Tool(
        name="get-sql-insight",
        description="Executes a SQL query and returns the results as an insight.",
        schema=GetSqlInsightParams,
        handler=get_sql_insight_handler
    )
import json

from api.client import is_error, is_success
from schema.tool_inputs import InsightGetSqlSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def get_sql_insight_handler(context: Context, params: InsightGetSqlSchema) -> ToolResult:
    project_id = await context.get_project_id()

    insight_result = await context.api.insights(project_id).sql_insight(params.query)

    if is_error(insight_result):
        raise Exception(f"Failed to execute SQL insight: {insight_result.error}")

    assert is_success(insight_result)

    return ToolResult(content=[TextContent(text=json.dumps(insight_result.data))])


def get_sql_insight_tool() -> Tool[InsightGetSqlSchema]:
    return Tool(
        name="get-sql-insight",
        description="Executes a SQL query and returns the results as an insight.",
        schema=InsightGetSqlSchema,
        handler=get_sql_insight_handler,
    )

from api.client import is_error, is_success
from schema.tool_inputs import InsightGetSqlSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def get_sql_insight_handler(context: Context, params: InsightGetSqlSchema) -> ToolResult:
    project_id = await context.get_project_id()

    insight_result = await context.api.insights(project_id).sql_insight(params.query)

    if is_error(insight_result):
        error_msg = str(insight_result.error)
        error_type = type(insight_result.error).__name__
        if not error_msg or error_msg == "None":
            error_msg = f"Unknown error occurred (type: {error_type})"

        raise Exception(f"Failed to execute SQL insight: {error_msg}")

    assert is_success(insight_result)

    return ToolResult(content=insight_result.data)


def get_sql_insight_tool() -> Tool[InsightGetSqlSchema]:
    definition = get_tool_definition("get-sql-insight")

    return Tool(
        name="get-sql-insight",
        description=definition["description"],
        schema=InsightGetSqlSchema,
        handler=get_sql_insight_handler,
    )

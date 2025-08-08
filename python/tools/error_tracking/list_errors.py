import json
from datetime import datetime, timedelta

from api.client import is_error, is_success
from schema.tool_inputs import ErrorTrackingListSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def list_errors_handler(context: Context, params: ErrorTrackingListSchema) -> ToolResult:
    project_id = await context.get_project_id()

    order_by = params.orderBy or "occurrences"
    date_from = params.dateFrom or datetime.now() - timedelta(days=7)
    date_to = params.dateTo or datetime.now()
    order_direction = params.orderDirection or "DESC"
    filter_test_accounts = params.filterTestAccounts if params.filterTestAccounts is not None else True
    status = params.status or "active"

    error_query = {
        "kind": "ErrorTrackingQuery",
        "orderBy": order_by,
        "dateRange": {"date_from": date_from.isoformat(), "date_to": date_to.isoformat()},
        "volumeResolution": 1,
        "orderDirection": order_direction,
        "filterTestAccounts": filter_test_accounts,
        "status": status,
    }

    errors_result = await context.api.query(project_id).execute({"query": error_query})

    if is_error(errors_result):
        raise Exception(f"Failed to list errors: {errors_result.error}")

    assert is_success(errors_result)

    return ToolResult(content=[TextContent(text=json.dumps(errors_result.data.results))])


def list_errors_tool() -> Tool[ErrorTrackingListSchema]:
    return Tool(
        name="list-errors",
        description="Use this tool to list errors in the project.",
        schema=ErrorTrackingListSchema,
        handler=list_errors_handler,
    )

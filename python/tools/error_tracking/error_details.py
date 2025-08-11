import json
from datetime import datetime, timedelta

from api.client import is_error, is_success
from schema.tool_inputs import ErrorTrackingDetailsSchema
from tools.types import Context, Tool, ToolResult


async def error_details_handler(context: Context, params: ErrorTrackingDetailsSchema) -> ToolResult:
    project_id = await context.get_project_id()

    date_from = params.dateFrom or datetime.now() - timedelta(days=7)
    date_to = params.dateTo or datetime.now()

    error_query = {
        "kind": "ErrorTrackingQuery",
        "dateRange": {"date_from": date_from.isoformat(), "date_to": date_to.isoformat()},
        "volumeResolution": 0,
        "issueId": str(params.issueId),
    }

    errors_result = await context.api.query(project_id).execute({"query": error_query})
    if is_error(errors_result):
        raise Exception(f"Failed to get error details: {errors_result.error}")

    assert is_success(errors_result)
    return ToolResult(content=json.dumps(errors_result.data.results))


def error_details_tool() -> Tool[ErrorTrackingDetailsSchema]:
    return Tool(
        name="error-details",
        description="Use this tool to get the details of an error in the project.",
        schema=ErrorTrackingDetailsSchema,
        handler=error_details_handler,
    )

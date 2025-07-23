import json
from datetime import datetime, timedelta

from schema.tool_inputs import ErrorTrackingDetailsSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def error_details_handler(context: Context, params: ErrorTrackingDetailsSchema) -> ToolResult:
    project_id = await context.get_project_id()

    # Set default dates if not provided
    date_from = params.dateFrom or datetime.now() - timedelta(days=7)
    date_to = params.dateTo or datetime.now()

    error_query = {
        "kind": "ErrorTrackingQuery",
        "dateRange": {"date_from": date_from.isoformat(), "date_to": date_to.isoformat()},
        "volumeResolution": 0,
        "issueId": str(params.issueId),
    }

    errors_result = await context.api.query(project_id).execute({"query": error_query})
    if not errors_result.success:
        raise Exception(f"Failed to get error details: {errors_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(errors_result.data.results))])


def error_details_tool() -> Tool[ErrorTrackingDetailsSchema]:
    return Tool(
        name="error-details",
        description="Use this tool to get the details of an error in the project.",
        schema=ErrorTrackingDetailsSchema,
        handler=error_details_handler,
    )

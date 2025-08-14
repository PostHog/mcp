import json

from api.client import is_error, is_success
from schema.tool_inputs import FeatureFlagGetAllSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def get_all_feature_flags_handler(context: Context, _params: FeatureFlagGetAllSchema) -> ToolResult:
    project_id = await context.get_project_id()

    flags_result = await context.api.feature_flags(project_id).list()

    if is_error(flags_result):
        raise Exception(f"Failed to get feature flags: {flags_result.error}")

    assert is_success(flags_result)

    flags_data = [flag.model_dump() for flag in flags_result.data]

    return ToolResult(content=json.dumps(flags_data))


def get_all_feature_flags_tool() -> Tool[FeatureFlagGetAllSchema]:
    definition = get_tool_definition("feature-flag-get-all")

    return Tool(
        name="feature-flag-get-all",
        description=definition["description"],
        schema=FeatureFlagGetAllSchema,
        handler=get_all_feature_flags_handler,
    )

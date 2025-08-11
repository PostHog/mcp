import json

from api.client import is_error, is_success
from schema.tool_inputs import FeatureFlagDeleteSchema
from tools.types import Context, Tool, ToolResult


async def delete_feature_flag_handler(context: Context, params: FeatureFlagDeleteSchema) -> ToolResult:
    project_id = await context.get_project_id()

    flag_result = await context.api.feature_flags(project_id).find_by_key(params.flagKey)

    if is_error(flag_result):
        raise Exception(f"Failed to find feature flag: {flag_result.error}")

    assert is_success(flag_result)

    if flag_result.data is None:
        return ToolResult(content="Feature flag is already deleted.")

    delete_result = await context.api.feature_flags(project_id).delete(flag_result.data.id)

    if is_error(delete_result):
        error_str = str(delete_result.error)

        if "not_found" in error_str or "Not found" in error_str:
            return ToolResult(content="Feature flag is already deleted.")

        raise Exception(f"Failed to delete feature flag: {delete_result.error}")

    assert is_success(delete_result)

    return ToolResult(content=json.dumps(delete_result.data))


def delete_feature_flag_tool() -> Tool[FeatureFlagDeleteSchema]:
    return Tool(
        name="delete-feature-flag",
        description="Deletes a feature flag from the project.",
        schema=FeatureFlagDeleteSchema,
        handler=delete_feature_flag_handler,
    )

import json

from api.client import is_error, is_success
from lib.utils.api import get_project_base_url
from schema.tool_inputs import FeatureFlagUpdateSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def update_feature_flag_handler(context: Context, params: FeatureFlagUpdateSchema) -> ToolResult:
    project_id = await context.get_project_id()

    key = params.flagKey
    update_data = params.data

    flag_result = await context.api.feature_flags(project_id).update(key, update_data)

    if is_error(flag_result):
        raise Exception(f"Failed to update feature flag: {flag_result.error}")

    assert is_success(flag_result)

    flag_data = flag_result.data

    feature_flag_with_url = {
        **flag_data.model_dump(),
        "url": f"{get_project_base_url(project_id, context.api.base_url)}/feature_flags/{flag_data.id}",
    }

    return ToolResult(content=[TextContent(text=json.dumps(feature_flag_with_url))])


def update_feature_flag_tool() -> Tool[FeatureFlagUpdateSchema]:
    return Tool(
        name="update-feature-flag",
        description="Updates an existing feature flag in the project.",
        schema=FeatureFlagUpdateSchema,
        handler=update_feature_flag_handler,
    )

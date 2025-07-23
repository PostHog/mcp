import json

from lib.utils.api import get_project_base_url
from schema.tool_inputs import FeatureFlagUpdateSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def update_feature_flag_handler(
    context: Context, params: FeatureFlagUpdateSchema
) -> ToolResult:
    project_id = await context.get_project_id()

    # Extract key and update data from the new schema structure
    key = params.flagKey
    update_data = params.data

    flag_result = await context.api.feature_flags(project_id).update(key, update_data)

    if not flag_result.success:
        raise Exception(f"Failed to update feature flag: {flag_result.error}")

    feature_flag_with_url = {
        **flag_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/feature_flags/{flag_result.data.id}",
    }

    return ToolResult(content=[TextContent(text=json.dumps(feature_flag_with_url))])


def update_feature_flag_tool() -> Tool[FeatureFlagUpdateSchema]:
    return Tool(
        name="update-feature-flag",
        description="Updates an existing feature flag in the project.",
        schema=FeatureFlagUpdateSchema,
        handler=update_feature_flag_handler,
    )

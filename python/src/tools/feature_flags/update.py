import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.schema.flags import UpdateFeatureFlagInput
from src.lib.utils.api import get_project_base_url


class UpdateFeatureFlagParams(UpdateFeatureFlagInput):
    key: str


async def update_feature_flag_handler(context: Context, params: UpdateFeatureFlagParams) -> ToolResult:
    project_id = await context.get_project_id()
    
    # Extract key and create update data
    key = params.key
    # Create update data by excluding the key field
    params_dict = params.model_dump(exclude={"key"}, exclude_unset=True)
    update_data = UpdateFeatureFlagInput(**params_dict)

    flag_result = await context.api.feature_flags(project_id).update(key, update_data)

    if not flag_result.success:
        raise Exception(f"Failed to update feature flag: {flag_result.error}")

    feature_flag_with_url = {
        **flag_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/feature_flags/{flag_result.data.id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(feature_flag_with_url))])


def update_feature_flag_tool() -> Tool[UpdateFeatureFlagParams]:
    return Tool(
        name="update-feature-flag",
        description="Updates an existing feature flag in the project.",
        schema=UpdateFeatureFlagParams,
        handler=update_feature_flag_handler
    )
import json

from api.client import is_error, is_success
from lib.utils.api import get_project_base_url
from schema.tool_inputs import FeatureFlagCreateSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def create_feature_flag_handler(context: Context, params: FeatureFlagCreateSchema) -> ToolResult:
    project_id = await context.get_project_id()

    flag_result = await context.api.feature_flags(project_id).create(params)

    if is_error(flag_result):
        raise Exception(f"Failed to create feature flag: {flag_result.error}")

    assert is_success(flag_result)

    flag_data = flag_result.data

    feature_flag_with_url = {
        **flag_data.model_dump(),
        "url": f"{get_project_base_url(project_id, context.api.base_url)}/feature_flags/{flag_data.id}",
    }

    return ToolResult(content=json.dumps(feature_flag_with_url))


def create_feature_flag_tool() -> Tool[FeatureFlagCreateSchema]:
    definition = get_tool_definition("create-feature-flag")

    return Tool(
        name="create-feature-flag",
        description=definition["description"],
        schema=FeatureFlagCreateSchema,
        handler=create_feature_flag_handler,
    )

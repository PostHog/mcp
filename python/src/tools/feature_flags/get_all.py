import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class GetAllFeatureFlagsParams(BaseModel):
    pass


async def get_all_feature_flags_handler(context: Context, _params: GetAllFeatureFlagsParams) -> ToolResult:
    project_id = await context.get_project_id()
    flags_result = await context.api.feature_flags(project_id).list()

    if not flags_result.success:
        raise Exception(f"Failed to get feature flags: {flags_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps([flag.model_dump() for flag in flags_result.data]))])


def get_all_feature_flags_tool() -> Tool[GetAllFeatureFlagsParams]:
    return Tool(
        name="feature-flags-get-all",
        description="Use this tool to get all feature flags for the project.",
        schema=GetAllFeatureFlagsParams,
        handler=get_all_feature_flags_handler
    )
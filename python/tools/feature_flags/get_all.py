import json

from schema.tool_inputs import FeatureFlagGetAllSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def get_all_feature_flags_handler(context: Context, _params: FeatureFlagGetAllSchema) -> ToolResult:
    project_id = await context.get_project_id()
    flags_result = await context.api.feature_flags(project_id).list()

    if not flags_result.success:
        raise Exception(f"Failed to get feature flags: {flags_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps([flag.model_dump() for flag in flags_result.data]))])


def get_all_feature_flags_tool() -> Tool[FeatureFlagGetAllSchema]:
    return Tool(
        name="feature-flags-get-all",
        description="Use this tool to get all feature flags for the project.",
        schema=FeatureFlagGetAllSchema,
        handler=get_all_feature_flags_handler
    )

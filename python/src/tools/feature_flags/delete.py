import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class DeleteFeatureFlagParams(BaseModel):
    flagId: int


async def delete_feature_flag_handler(context: Context, params: DeleteFeatureFlagParams) -> ToolResult:
    project_id = await context.get_project_id()
    
    delete_result = await context.api.feature_flags(project_id).delete(params.flagId)

    if not delete_result.success:
        # Check if it's a "not found" error
        error_str = str(delete_result.error)
        if "not_found" in error_str or "Not found" in error_str:
            return ToolResult(content=[TextContent(text="Feature flag is already deleted.")])
        raise Exception(f"Failed to delete feature flag: {delete_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(delete_result.data))])


def delete_feature_flag_tool() -> Tool[DeleteFeatureFlagParams]:
    return Tool(
        name="delete-feature-flag",
        description="Deletes a feature flag from the project.",
        schema=DeleteFeatureFlagParams,
        handler=delete_feature_flag_handler
    )
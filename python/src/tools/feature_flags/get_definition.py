import json
from typing import Optional
from pydantic import BaseModel, model_validator
from src.tools.types import Context, Tool, ToolResult, TextContent


class GetFeatureFlagDefinitionParams(BaseModel):
    flagId: Optional[int] = None
    flagKey: Optional[str] = None

    @model_validator(mode='after')
    def validate_flag_identifier(self):
        if not self.flagId and not self.flagKey:
            raise ValueError("Either flagId or flagKey must be provided")
        return self


async def get_feature_flag_definition_handler(context: Context, params: GetFeatureFlagDefinitionParams) -> ToolResult:
    project_id = await context.get_project_id()

    # Use flagId if provided (takes precedence)
    if params.flagId:
        flag_result = await context.api.feature_flags(project_id).get(params.flagId)
        if not flag_result.success:
            raise Exception(f"Failed to get feature flag: {flag_result.error}")
        return ToolResult(content=[TextContent(text=json.dumps(flag_result.data.model_dump()))])

    # Use flagKey if provided
    if params.flagKey:
        flag_result = await context.api.feature_flags(project_id).find_by_key(params.flagKey)
        if not flag_result.success:
            raise Exception(f"Failed to find feature flag: {flag_result.error}")
        
        if flag_result.data:
            return ToolResult(content=[TextContent(text=json.dumps(flag_result.data.model_dump()))])
        else:
            return ToolResult(content=[TextContent(text=f'Error: Flag with key "{params.flagKey}" not found.')])

    return ToolResult(content=[TextContent(text="Error: Could not determine or find the feature flag.")])


def get_feature_flag_definition_tool() -> Tool[GetFeatureFlagDefinitionParams]:
    return Tool(
        name="feature-flag-get-definition",
        description="""
        - Use this tool to get the definition of a feature flag. 
        - You can provide either the flagId or the flagKey. 
        - If you provide both, the flagId will be used.
        """,
        schema=GetFeatureFlagDefinitionParams,
        handler=get_feature_flag_definition_handler
    )
import json
from typing import List, Optional
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent
from src.schema.flags import FilterGroups
from src.lib.utils.api import get_project_base_url


class CreateFeatureFlagParams(BaseModel):
    name: str
    key: str
    description: str
    filters: FilterGroups
    active: bool
    tags: Optional[List[str]] = None


async def create_feature_flag_handler(context: Context, params: CreateFeatureFlagParams) -> ToolResult:
    project_id = await context.get_project_id()

    flag_result = await context.api.feature_flags(project_id).create(params)

    if not flag_result.success:
        raise Exception(f"Failed to create feature flag: {flag_result.error}")

    feature_flag_with_url = {
        **flag_result.data.model_dump(),
        "url": f"{get_project_base_url(project_id)}/feature_flags/{flag_result.data.id}"
    }

    return ToolResult(content=[TextContent(text=json.dumps(feature_flag_with_url))])


def create_feature_flag_tool() -> Tool[CreateFeatureFlagParams]:
    return Tool(
        name="create-feature-flag",
        description="""Creates a new feature flag in the project. Once you have created a feature flag, you should:
     - Ask the user if they want to add it to their codebase
     - Use the "search-docs" tool to find documentation on how to add feature flags to the codebase (search for the right language / framework)
     - Clarify where it should be added and then add it.
        """,
        schema=CreateFeatureFlagParams,
        handler=create_feature_flag_handler
    )
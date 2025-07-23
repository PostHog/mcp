import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class PropertyDefinitionsParams(BaseModel):
    pass


async def property_definitions_handler(context: Context, _params: PropertyDefinitionsParams) -> ToolResult:
    project_id = await context.get_project_id()
    prop_defs_result = await context.api.projects().property_definitions(project_id)

    if not prop_defs_result.success:
        raise Exception(f"Failed to get property definitions: {prop_defs_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps([prop.model_dump() for prop in prop_defs_result.data]))])


def property_definitions_tool() -> Tool[PropertyDefinitionsParams]:
    return Tool(
        name="property-definitions",
        description="Use this tool to get the property definitions of the active project.",
        schema=PropertyDefinitionsParams,
        handler=property_definitions_handler
    )
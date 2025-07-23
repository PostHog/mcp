import json

from schema.tool_inputs import ProjectPropertyDefinitionsSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def property_definitions_handler(context: Context, _params: ProjectPropertyDefinitionsSchema) -> ToolResult:
    project_id = await context.get_project_id()
    prop_defs_result = await context.api.projects().property_definitions(project_id)

    if not prop_defs_result.success:
        raise Exception(f"Failed to get property definitions: {prop_defs_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps([prop.model_dump() for prop in prop_defs_result.data]))])


def property_definitions_tool() -> Tool[ProjectPropertyDefinitionsSchema]:
    return Tool(
        name="property-definitions",
        description="Use this tool to get the property definitions of the active project.",
        schema=ProjectPropertyDefinitionsSchema,
        handler=property_definitions_handler
    )

import json

from api.client import is_error, is_success
from schema.tool_inputs import ProjectPropertyDefinitionsSchema
from tools.types import Context, Tool, ToolResult


async def property_definitions_handler(context: Context, _params: ProjectPropertyDefinitionsSchema) -> ToolResult:
    project_id = await context.get_project_id()
    prop_defs_result = await context.api.projects().property_definitions(project_id)

    if is_error(prop_defs_result):
        raise Exception(f"Failed to get property definitions: {prop_defs_result.error}")

    assert is_success(prop_defs_result)

    prop_defs_data = [prop_def.model_dump() for prop_def in prop_defs_result.data]

    return ToolResult(content=json.dumps(prop_defs_data))


def property_definitions_tool() -> Tool[ProjectPropertyDefinitionsSchema]:
    return Tool(
        name="property-definitions",
        description="Use this tool to get the property definitions of the active project.",
        schema=ProjectPropertyDefinitionsSchema,
        handler=property_definitions_handler,
    )

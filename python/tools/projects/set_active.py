from schema.tool_inputs import ProjectSetActiveSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def set_active_project_handler(context: Context, params: ProjectSetActiveSchema) -> ToolResult:
    project_id = str(params.projectId)

    await context.cache.set("project_id", project_id)

    return ToolResult(content=f"Switched to project {project_id}")


def set_active_project_tool() -> Tool[ProjectSetActiveSchema]:
    definition = get_tool_definition("project-set-active")

    return Tool(
        name="project-set-active",
        description=definition["description"],
        schema=ProjectSetActiveSchema,
        handler=set_active_project_handler,
    )

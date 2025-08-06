from schema.tool_inputs import ProjectSetActiveSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def set_active_project_handler(context: Context, params: ProjectSetActiveSchema) -> ToolResult:
    project_id = str(params.projectId)
    await context.cache.set("project_id", project_id)

    return ToolResult(content=[TextContent(text=f"Switched to project {project_id}")])


def set_active_project_tool() -> Tool[ProjectSetActiveSchema]:
    return Tool(
        name="project-set-active",
        description="Use this tool to set the active project.",
        schema=ProjectSetActiveSchema,
        handler=set_active_project_handler,
    )

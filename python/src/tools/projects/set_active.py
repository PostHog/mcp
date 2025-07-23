from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class SetActiveProjectParams(BaseModel):
    projectId: str


async def set_active_project_handler(context: Context, params: SetActiveProjectParams) -> ToolResult:
    project_id = params.projectId
    state = await context.cache.get("state") or {}
    state["project_id"] = project_id
    await context.cache.set("state", state)

    return ToolResult(content=[TextContent(text=f"Switched to project {project_id}")])


def set_active_project_tool() -> Tool[SetActiveProjectParams]:
    return Tool(
        name="project-set-active",
        description="Use this tool to set the active project.",
        schema=SetActiveProjectParams,
        handler=set_active_project_handler
    )
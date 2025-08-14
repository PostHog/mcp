import json

from api.client import is_error, is_success
from schema.tool_inputs import ProjectGetAllSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def get_projects_handler(context: Context, _params: ProjectGetAllSchema) -> ToolResult:
    org_id = await context.get_org_id()
    projects_result = await context.api.organizations().projects(org_id).list()

    if is_error(projects_result):
        raise Exception(f"Failed to get projects: {projects_result.error}")

    assert is_success(projects_result)

    projects_data = [project.model_dump() for project in projects_result.data]

    return ToolResult(content=json.dumps(projects_data))


def get_projects_tool() -> Tool[ProjectGetAllSchema]:
    definition = get_tool_definition("projects-get")

    return Tool(
        name="projects-get",
        description=definition["description"],
        schema=ProjectGetAllSchema,
        handler=get_projects_handler,
    )

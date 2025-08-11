import json

from api.client import is_error, is_success
from schema.tool_inputs import ProjectGetAllSchema
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
    return Tool(
        name="projects-get",
        description="""
        - Fetches projects that the user has access to - the orgId is optional.
        - Use this tool before you use any other tools (besides organization-* and docs-search) to allow user to select the project they want to use for subsequent requests.
        """,
        schema=ProjectGetAllSchema,
        handler=get_projects_handler,
    )

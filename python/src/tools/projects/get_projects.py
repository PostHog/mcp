import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class GetProjectsParams(BaseModel):
    pass


async def get_projects_handler(context: Context, _params: GetProjectsParams) -> ToolResult:
    org_id = await context.get_org_id()
    projects_result = await context.api.organizations().projects(org_id).list()

    if not projects_result.success:
        raise Exception(f"Failed to get projects: {projects_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps([project.model_dump() for project in projects_result.data]))])


def get_projects_tool() -> Tool[GetProjectsParams]:
    return Tool(
        name="projects-get",
        description="""
        - Fetches projects that the user has access to - the orgId is optional. 
        - Use this tool before you use any other tools (besides organization-* and docs-search) to allow user to select the project they want to use for subsequent requests.
        """,
        schema=GetProjectsParams,
        handler=get_projects_handler
    )
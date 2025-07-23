import json

from schema.tool_inputs import OrganizationGetAllSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def get_organizations_handler(context: Context, _params: OrganizationGetAllSchema) -> ToolResult:
    orgs_result = await context.api.organizations().list()
    if not orgs_result.success:
        raise Exception(f"Failed to get organizations: {orgs_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps([org.model_dump(mode='json') for org in orgs_result.data]))])


def get_organizations_tool() -> Tool[OrganizationGetAllSchema]:
    return Tool(
        name="organizations-get",
        description="Use this tool to get the organizations the user has access to.",
        schema=OrganizationGetAllSchema,
        handler=get_organizations_handler
    )

import json

from api.client import is_error, is_success
from schema.tool_inputs import OrganizationGetAllSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def get_organizations_handler(context: Context, _params: OrganizationGetAllSchema) -> ToolResult:
    orgs_result = await context.api.organizations().list()

    if is_error(orgs_result):
        raise Exception(f"Failed to get organizations: {orgs_result.error}")

    assert is_success(orgs_result)

    return ToolResult(content=json.dumps([org.model_dump(mode="json") for org in orgs_result.data]))


def get_organizations_tool() -> Tool[OrganizationGetAllSchema]:
    definition = get_tool_definition("organizations-get")

    return Tool(
        name="organizations-get",
        description=definition["description"],
        schema=OrganizationGetAllSchema,
        handler=get_organizations_handler,
    )

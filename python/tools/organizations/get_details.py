import json

from api.client import is_error, is_success
from schema.tool_inputs import OrganizationGetDetailsSchema
from tools.types import Context, Tool, ToolResult


async def get_organization_details_handler(context: Context, _params: OrganizationGetDetailsSchema) -> ToolResult:
    org_id = await context.get_org_id()
    org_result = await context.api.organizations().get(org_id)

    if is_error(org_result):
        raise Exception(f"Failed to get organization details: {org_result.error}")

    assert is_success(org_result)

    return ToolResult(content=json.dumps(org_result.data.model_dump(mode="json")))


def get_organization_details_tool() -> Tool[OrganizationGetDetailsSchema]:
    return Tool(
        name="organization-details-get",
        description="Use this tool to get the details of the active organization.",
        schema=OrganizationGetDetailsSchema,
        handler=get_organization_details_handler,
    )

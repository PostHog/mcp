import json

from schema.tool_inputs import OrganizationGetDetailsSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def get_organization_details_handler(context: Context, _params: OrganizationGetDetailsSchema) -> ToolResult:
    org_id = await context.get_org_id()
    org_result = await context.api.organizations().get(org_id)

    if not org_result.success:
        raise Exception(f"Failed to get organization details: {org_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(org_result.data.model_dump()))])


def get_organization_details_tool() -> Tool[OrganizationGetDetailsSchema]:
    return Tool(
        name="organization-details-get",
        description="Use this tool to get the details of the active organization.",
        schema=OrganizationGetDetailsSchema,
        handler=get_organization_details_handler
    )

import json
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class GetOrganizationDetailsParams(BaseModel):
    pass


async def get_organization_details_handler(context: Context, _params: GetOrganizationDetailsParams) -> ToolResult:
    org_id = await context.get_org_id()
    org_result = await context.api.organizations().get(org_id)

    if not org_result.success:
        raise Exception(f"Failed to get organization details: {org_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(org_result.data.model_dump()))])


def get_organization_details_tool() -> Tool[GetOrganizationDetailsParams]:
    return Tool(
        name="organization-details-get", 
        description="Use this tool to get the details of the active organization.",
        schema=GetOrganizationDetailsParams,
        handler=get_organization_details_handler
    )
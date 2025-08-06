from schema.tool_inputs import OrganizationSetActiveSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def set_active_handler(context: Context, params: OrganizationSetActiveSchema) -> ToolResult:
    org_id = str(params.orgId)
    await context.cache.set("org_id", org_id)

    return ToolResult(content=[TextContent(text=f"Switched to organization {org_id}")])


def set_active_org_tool() -> Tool[OrganizationSetActiveSchema]:
    return Tool(
        name="organization-set-active",
        description="Use this tool to set the active organization.",
        schema=OrganizationSetActiveSchema,
        handler=set_active_handler,
    )

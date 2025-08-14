from schema.tool_inputs import OrganizationSetActiveSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def set_active_handler(context: Context, params: OrganizationSetActiveSchema) -> ToolResult:
    org_id = str(params.orgId)

    await context.cache.set("org_id", org_id)

    return ToolResult(content=f"Switched to organization {org_id}")


def set_active_org_tool() -> Tool[OrganizationSetActiveSchema]:
    definition = get_tool_definition("organization-set-active")

    return Tool(
        name="organization-set-active",
        description=definition["description"],
        schema=OrganizationSetActiveSchema,
        handler=set_active_handler,
    )

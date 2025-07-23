from uuid import UUID
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class SetActiveOrgParams(BaseModel):
    orgId: UUID


async def set_active_handler(context: Context, params: SetActiveOrgParams) -> ToolResult:
    org_id = str(params.orgId)
    state = await context.cache.get("state") or {}
    state["org_id"] = org_id
    await context.cache.set("state", state)

    return ToolResult(content=[TextContent(text=f"Switched to organization {org_id}")])


def set_active_org_tool() -> Tool[SetActiveOrgParams]:
    return Tool(
        name="organization-set-active",
        description="Use this tool to set the active organization.",
        schema=SetActiveOrgParams,
        handler=set_active_handler
    )
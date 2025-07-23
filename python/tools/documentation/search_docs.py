from schema.tool_inputs import DocumentationSearchSchema
from tools.types import Context, TextContent, Tool, ToolResult


async def search_docs_handler(context: Context, params: DocumentationSearchSchema) -> ToolResult:
    inkeep_api_key = context.env.get("INKEEP_API_KEY")

    if not inkeep_api_key:
        return ToolResult(content=[TextContent(text="Error: INKEEP_API_KEY is not configured.")])

    # TODO: Implement actual Inkeep API search
    # For now, return a placeholder response
    result_text = f"Documentation search results for query: '{params.query}'\n\nPlaceholder: This would search PostHog documentation using the Inkeep API."

    return ToolResult(content=[TextContent(text=result_text)])


def search_docs_tool() -> Tool[DocumentationSearchSchema]:
    return Tool(
        name="docs-search",
        description="""
        - Use this tool to search the PostHog documentation for information that can help the user with their request.
        - Use it as a fallback when you cannot answer the user's request using other tools in this MCP.
        """,
        schema=DocumentationSearchSchema,
        handler=search_docs_handler,
    )

import json

import httpx

from schema.tool_inputs import DocumentationSearchSchema
from tools.types import Context, Tool, ToolResult


async def search_docs_handler(context: Context, params: DocumentationSearchSchema) -> ToolResult:
    inkeep_api_key = context.config.inkeep_api_key

    if not inkeep_api_key:
        return ToolResult(content="Error: INKEEP_API_KEY is not configured.")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.inkeep.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {inkeep_api_key}",
                },
                json={
                    "model": "inkeep-context-gpt-4o",
                    "messages": [{"role": "user", "content": params.query}],
                },
                timeout=30.0,
            )

            if not response.is_success:
                error_text = response.text
                return ToolResult(content=f"Error querying Inkeep API: {response.status_code} {error_text}")

            data = response.json()

            if "choices" in data and len(data["choices"]) > 0 and "message" in data["choices"][0] and "content" in data["choices"][0]["message"]:
                return ToolResult(content=f"{data['choices'][0]['message']['content']}")
            else:
                return ToolResult(content=f"Unexpected response format from Inkeep API: {json.dumps(data)}")

    except httpx.TimeoutException:
        return ToolResult(content="Error: Documentation search timed out.")
    except Exception as e:
        return ToolResult(content=f"Error searching documentation: {str(e)}")


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

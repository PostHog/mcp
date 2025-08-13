
import asyncio
from typing import Any

from langchain.tools import BaseTool
from pydantic import PrivateAttr

from lib.config import PostHogToolConfig
from tools.registry import ToolRegistry
from tools.types import Context, Tool


class PostHogTool(BaseTool):
    name: str = ""
    description: str = ""

    _context: Context
    _tool: Tool

    def __init__(self, tool: Tool, context: Context) -> None:
        super().__init__()
        self._tool = tool
        self._context = context
        self.name = tool.name
        self.description = tool.description

    def _run(self, *args: Any, **kwargs: Any) -> str:
        result = asyncio.run(self._tool.execute(self._context, *args, **kwargs))
        return result.content

    async def _arun(self, *args: Any, **kwargs: Any) -> str:
        result = await self._tool.execute(self._context, *args, **kwargs)
        return result.content


class PostHogAgentToolkit:
    _tools: list[PostHogTool] = PrivateAttr(default=[])
    _registry: ToolRegistry = PrivateAttr()

    def __init__(
        self,
        *,
        personal_api_key: str | None = None,
        api_base_url: str | None = None,
        inkeep_api_key: str | None = None,
    ):
        """Initialize PostHog Agent Toolkit.

        Args:
            personal_api_key: PostHog personal API key
            api_base_url: PostHog API base URL (defaults to https://us.posthog.com)
            inkeep_api_key: Optional Inkeep API key for documentation search
        """
        super().__init__()

        if personal_api_key is None:
            raise ValueError("personal_api_key must be provided")

        final_config = PostHogToolConfig(
            personal_api_key=personal_api_key,
            api_base_url=api_base_url or "https://us.posthog.com",
            inkeep_api_key=inkeep_api_key,
            dev=False
        )

        self._registry = ToolRegistry(final_config)

        tools = self._registry.get_tools()

        context = self._registry.get_context()

        self._tools = [PostHogTool(tool=tool, context=context) for tool in tools]

    def get_tools(self) -> list[PostHogTool]:
        return self._tools

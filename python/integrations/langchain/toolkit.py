
import asyncio
from typing import Any

from langchain.tools import BaseTool
from pydantic import PrivateAttr

from tools.registry import ToolRegistry
from tools.types import Context, Tool


class PostHogTool(BaseTool):

    _context: Context
    _tool: Tool

    def __init__(self, tool: Tool, context: Context) -> None:
        super().__init__()
        self._tool = tool
        self._context = context

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
        self, context: Context
    ):
        super().__init__()

        self._registry = ToolRegistry(context.config)

        tools = self._registry.get_tools()

        self._tools = [PostHogTool(tool=tool, context=context) for tool in tools]

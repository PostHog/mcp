from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any, Generic, TypeVar

from pydantic import BaseModel

from api.client import ApiClient

T = TypeVar("T", bound=BaseModel)


@dataclass
class State:
    project_id: str | None = None
    org_id: str | None = None
    distinct_id: str | None = None


class ScopedCache(ABC, Generic[T]):
    @abstractmethod
    async def get(self, key: str) -> T | None:
        pass

    @abstractmethod
    async def set(self, key: str, value: T) -> None:
        pass


@dataclass
class Context:
    api: ApiClient
    cache: ScopedCache[State]
    env: dict[str, Any]
    get_project_id: Callable[[], Awaitable[str]]
    get_org_id: Callable[[], Awaitable[str]]
    get_distinct_id: Callable[[], Awaitable[str]]


@dataclass
class ToolResult:
    content: list


@dataclass
class TextContent:
    type: str = "text"
    text: str = ""


class Tool(Generic[T]):
    def __init__(
        self,
        name: str,
        description: str,
        schema: type[T],
        handler: Callable[[Context, T], Awaitable[ToolResult]],
    ):
        self.name = name
        self.description = description
        self.schema = schema
        self.handler = handler

    async def execute(self, context: Context, params: T) -> ToolResult:
        return await self.handler(context, params)

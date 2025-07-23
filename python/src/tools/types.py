from typing import Any, Dict, Optional, Callable, Awaitable, TypeVar, Generic
from dataclasses import dataclass
from pydantic import BaseModel
from abc import ABC, abstractmethod

from src.api.client import ApiClient

T = TypeVar('T', bound=BaseModel)


@dataclass
class State:
    project_id: Optional[str] = None
    org_id: Optional[str] = None
    distinct_id: Optional[str] = None


class ScopedCache(ABC, Generic[T]):
    @abstractmethod
    async def get(self, key: str) -> Optional[T]:
        pass
    
    @abstractmethod
    async def set(self, key: str, value: T) -> None:
        pass


@dataclass
class Context:
    api: ApiClient
    cache: ScopedCache[State]
    env: Dict[str, Any]
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
        handler: Callable[[Context, T], Awaitable[ToolResult]]
    ):
        self.name = name
        self.description = description
        self.schema = schema
        self.handler = handler

    async def execute(self, context: Context, params: T) -> ToolResult:
        return await self.handler(context, params)
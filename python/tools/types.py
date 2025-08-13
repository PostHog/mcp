import uuid
from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Generic, TypeVar

from api.client import ApiClient, is_error, is_success
from lib.config import PostHogToolConfig


@dataclass
class State:
    project_id: str | None = None
    org_id: str | None = None
    distinct_id: str | None = None


class ScopedCache(ABC):
    @abstractmethod
    async def get(self, key: str) -> str | None:
        pass

    @abstractmethod
    async def set(self, key: str, value: str) -> None:
        pass


@dataclass
class Context:
    api: ApiClient
    cache: ScopedCache
    config: PostHogToolConfig

    async def get_project_id(self) -> str:
        project_id = await self.cache.get("project_id")
        if not project_id:
            raise Exception("No active project set. Please use project-set-active first.")
        return project_id

    async def get_org_id(self) -> str:
        org_id = await self.cache.get("org_id")
        if not org_id:
            raise Exception("No active organization set. Please use organization-set-active first.")
        return org_id

    async def get_distinct_id(self) -> str:
        distinct_id = await self.cache.get("distinct_id")

        if not distinct_id:
            # Fetch from API if not cached
            user_result = await self.api.users().me()

            if is_error(user_result):
                raise Exception(f"Failed to get user info: {user_result.error}")

            assert is_success(user_result)

            distinct_id = user_result.data.distinct_id

            if distinct_id:
                await self.cache.set("distinct_id", distinct_id)

        return distinct_id or uuid.uuid4().hex


@dataclass
class ToolResult:
    content: str


T = TypeVar("T")


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

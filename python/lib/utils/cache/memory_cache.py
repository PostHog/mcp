from typing import Any, TypeVar

from tools.types import ScopedCache

T = TypeVar("T")


class MemoryCache(ScopedCache[T]):
    def __init__(self):
        self._cache: dict[str, Any] = {}

    async def get(self, key: str) -> T | None:
        return self._cache.get(key)

    async def set(self, key: str, value: T) -> None:
        self._cache[key] = value

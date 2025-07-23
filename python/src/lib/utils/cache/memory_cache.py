from typing import Any, Dict, Optional, TypeVar
from src.tools.types import ScopedCache

T = TypeVar('T')


class MemoryCache(ScopedCache[T]):
    def __init__(self):
        self._cache: Dict[str, Any] = {}

    async def get(self, key: str) -> Optional[T]:
        return self._cache.get(key)

    async def set(self, key: str, value: T) -> None:
        self._cache[key] = value
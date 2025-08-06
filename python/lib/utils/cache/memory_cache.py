from tools.types import ScopedCache


class MemoryCache(ScopedCache):
    def __init__(self):
        self._cache: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._cache.get(key)

    async def set(self, key: str, value: str) -> None:
        self._cache[key] = value

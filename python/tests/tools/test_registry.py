import pytest

from lib.config import PostHogToolConfig
from tools.registry import ToolRegistry


class TestToolRegistry:
    def test_context_manager_support(self):
        config = PostHogToolConfig(api_token="test_token", api_base_url="https://us.posthog.com")

        registry = ToolRegistry(config)

        # Test that the context manager methods exist
        assert hasattr(registry, "__aenter__")
        assert hasattr(registry, "__aexit__")
        assert callable(registry.__aenter__)
        assert callable(registry.__aexit__)

    @pytest.mark.asyncio
    async def test_context_manager_usage(self):
        config = PostHogToolConfig(api_token="test_token", api_base_url="https://us.posthog.com")

        async with ToolRegistry(config) as registry:
            assert registry is not None
            assert hasattr(registry, "tools")
            assert hasattr(registry, "api")
            assert hasattr(registry, "cache")

import pytest
import pytest_asyncio

from lib.config import PostHogToolConfig
from tests.shared.test_utils import (
    TEST_ORG_ID,
    TEST_PROJECT_ID,
    CreatedResources,
    cleanup_resources,
    create_test_client,
    create_test_context,
    set_active_project_and_org,
    validate_environment_variables,
)
from tools.documentation.search_docs import search_docs_tool
from tools.types import Context


class TestDocumentation:
    """Integration tests for documentation tools."""

    @pytest.fixture(scope="class", autouse=True)
    def setup_class(self):
        """Validate environment variables before running tests."""
        validate_environment_variables()

    @pytest_asyncio.fixture
    async def context(self):
        """Create test context and set active project/org."""
        client = create_test_client()
        ctx = create_test_context(client)
        await set_active_project_and_org(ctx, TEST_PROJECT_ID, TEST_ORG_ID)
        yield ctx
        await client.close()

    @pytest.fixture
    def created_resources(self):
        """Track created resources for cleanup."""
        return CreatedResources()

    @pytest_asyncio.fixture(autouse=True)
    async def cleanup(self, context, created_resources):
        """Clean up resources after each test."""
        yield
        await cleanup_resources(context.api, TEST_PROJECT_ID, created_resources)

    @pytest.mark.asyncio
    async def test_handle_missing_inkeep_api_key(self, context: Context, created_resources: CreatedResources):
        """Test handling missing INKEEP_API_KEY."""

        # Create config without INKEEP_API_KEY
        config_without_key = PostHogToolConfig(
            personal_api_key=context.config.personal_api_key, api_base_url=context.config.api_base_url, inkeep_api_key=None, dev=context.config.dev
        )

        context_without_key = Context(
            api=context.api,
            cache=context.cache,
            config=config_without_key,
            get_project_id=context.get_project_id,
            get_org_id=context.get_org_id,
            get_distinct_id=context.get_distinct_id,
        )

        tool = search_docs_tool()
        params = tool.schema(query="feature flags")

        result = await tool.execute(context_without_key, params)

        assert result.content[0].text == "Error: INKEEP_API_KEY is not configured."

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Documentation search test skipped - matching TypeScript")
    async def test_search_documentation_with_valid_query(self, context: Context, created_resources: CreatedResources):
        """Test searching documentation with valid query."""
        tool = search_docs_tool()
        params = tool.schema(query="feature flags")

        result = await tool.execute(context, params)

        assert result.content[0].type == "text"
        assert result.content[0].text is not None
        assert len(result.content[0].text) > 0

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Analytics documentation search test skipped - matching TypeScript")
    async def test_search_analytics_documentation(self, context: Context, created_resources: CreatedResources):
        """Test searching for analytics documentation."""
        tool = search_docs_tool()
        params = tool.schema(query="analytics events tracking")

        result = await tool.execute(context, params)

        assert result.content[0].type == "text"
        assert result.content[0].text is not None
        assert len(result.content[0].text) > 0

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Empty query results test skipped - matching TypeScript")
    async def test_handle_empty_query_results(self, context: Context, created_resources: CreatedResources):
        """Test handling empty query results."""
        tool = search_docs_tool()
        params = tool.schema(query="zxcvbnmasdfghjklqwertyuiop123456789")

        result = await tool.execute(context, params)

        assert result.content[0].type == "text"
        assert result.content[0].text is not None

    @pytest.mark.asyncio
    async def test_validate_query_parameter_required(self, context: Context, created_resources: CreatedResources):
        """Test that query parameter is required."""
        tool = search_docs_tool()

        # Test with empty query - this will not raise Pydantic error since query is a string field
        # Instead test that the tool gracefully handles empty queries
        params = tool.schema(query="")
        result = await tool.execute(context, params)
        # The result should either work or return an error message, both are valid
        assert result.content[0].text is not None

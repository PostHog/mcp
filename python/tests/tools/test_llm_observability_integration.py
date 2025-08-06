import pytest
import pytest_asyncio

from tests.shared.test_utils import (
    TEST_ORG_ID,
    TEST_PROJECT_ID,
    CreatedResources,
    cleanup_resources,
    create_test_client,
    create_test_context,
    parse_tool_response,
    set_active_project_and_org,
    validate_environment_variables,
)
from tools.llm_observability.get_llm_costs import get_llm_costs_tool
from tools.types import Context


class TestLLMObservability:
    """Integration tests for LLM observability tools."""

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
    async def test_get_llm_costs_default_days(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test getting LLM costs with default days (6 days)."""
        tool = get_llm_costs_tool()
        params = tool.schema(projectId=int(TEST_PROJECT_ID))

        result = await tool.execute(context, params)
        costs_data = parse_tool_response(result.__dict__)

        assert isinstance(costs_data, list)

    @pytest.mark.asyncio
    async def test_get_llm_costs_custom_time_period(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test getting LLM costs for custom time period."""
        tool = get_llm_costs_tool()
        params = tool.schema(projectId=int(TEST_PROJECT_ID), days=30)

        result = await tool.execute(context, params)
        costs_data = parse_tool_response(result.__dict__)

        assert isinstance(costs_data, list)

    @pytest.mark.asyncio
    async def test_get_llm_costs_single_day(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test getting LLM costs for single day."""
        tool = get_llm_costs_tool()
        params = tool.schema(projectId=int(TEST_PROJECT_ID), days=1)

        result = await tool.execute(context, params)
        costs_data = parse_tool_response(result.__dict__)

        assert isinstance(costs_data, list)

    @pytest.mark.asyncio
    async def test_llm_observability_workflow_different_time_periods(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test getting costs for different time periods."""
        tool = get_llm_costs_tool()

        # Test week data
        week_params = tool.schema(projectId=int(TEST_PROJECT_ID), days=7)
        week_result = await tool.execute(context, week_params)
        week_data = parse_tool_response(week_result.__dict__)
        assert isinstance(week_data, list)

        # Test month data
        month_params = tool.schema(projectId=int(TEST_PROJECT_ID), days=30)
        month_result = await tool.execute(context, month_params)
        month_data = parse_tool_response(month_result.__dict__)
        assert isinstance(month_data, list)
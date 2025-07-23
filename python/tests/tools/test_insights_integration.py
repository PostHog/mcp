import pytest
import pytest_asyncio

from schema.tool_inputs import Data5
from tests.shared.test_utils import (
    SAMPLE_HOGQL_QUERIES,
    TEST_ORG_ID,
    TEST_PROJECT_ID,
    CreatedResources,
    cleanup_resources,
    create_test_client,
    create_test_context,
    generate_unique_key,
    parse_tool_response,
    set_active_project_and_org,
    validate_environment_variables,
)
from tools.insights.create import create_insight_tool
from tools.insights.delete import delete_insight_tool
from tools.insights.get import get_insight_tool
from tools.insights.get_all import get_all_insights_tool
from tools.insights.update import update_insight_tool
from tools.types import Context


class TestInsights:
    """Integration tests for insight tools."""

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
    async def test_create_insight_with_pageview_query(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test creating an insight with pageview query."""
        tool = create_insight_tool()
        params = tool.schema(
            data={
                "name": generate_unique_key("Test Pageview Insight"),
                "description": "Integration test for pageview insight",
                "query": SAMPLE_HOGQL_QUERIES["pageviews"].model_dump(),
            }
        )

        result = await tool.execute(context, params)
        insight_data = parse_tool_response(result.__dict__)

        assert "id" in insight_data
        assert insight_data["name"] == params.data.name
        assert "/insights/" in insight_data["url"]

        created_resources.insights.append(insight_data["id"])

    @pytest.mark.asyncio
    async def test_create_insight_with_top_events_query(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test creating an insight with top events query."""
        tool = create_insight_tool()
        params = tool.schema(
            data={
                "name": generate_unique_key("Test Top Events Insight"),
                "description": "Integration test for top events insight",
                "query": SAMPLE_HOGQL_QUERIES["top_events"].model_dump(),
            }
        )

        result = await tool.execute(context, params)
        insight_data = parse_tool_response(result.__dict__)

        assert "id" in insight_data
        assert insight_data["name"] == params.data.name

        created_resources.insights.append(insight_data["id"])

    @pytest.mark.asyncio
    async def test_create_insight_with_tags(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test creating an insight with tags."""
        tool = create_insight_tool()
        params = tool.schema(
            data={
                "name": generate_unique_key("Test Tagged Insight"),
                "description": "Integration test with tags",
                "query": SAMPLE_HOGQL_QUERIES["pageviews"].model_dump(),
                "tags": ["test", "integration"],
            }
        )

        result = await tool.execute(context, params)
        insight_data = parse_tool_response(result.__dict__)

        assert "id" in insight_data
        assert insight_data["name"] == params.data.name

        created_resources.insights.append(insight_data["id"])

    @pytest.mark.asyncio
    async def test_update_insight_name_and_description(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test updating an insight's name and description."""
        create_tool = create_insight_tool()
        update_tool = update_insight_tool()

        # Create insight
        create_params = create_tool.schema(
            data={
                "name": generate_unique_key("Original Insight Name"),
                "description": "Original description",
                "query": SAMPLE_HOGQL_QUERIES["pageviews"].model_dump(),
            }
        )

        create_result = await create_tool.execute(context, create_params)
        created_insight = parse_tool_response(create_result.__dict__)
        created_resources.insights.append(created_insight["id"])

        # Update insight
        update_params = update_tool.schema(
            insightId=created_insight["id"],
            data={"name": "Updated Insight Name", "description": "Updated description"},
        )

        update_result = await update_tool.execute(context, update_params)
        updated_insight = parse_tool_response(update_result.__dict__)

        assert updated_insight["id"] == created_insight["id"]
        assert updated_insight["name"] == update_params.data.name

    @pytest.mark.asyncio
    async def test_update_insight_query(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test updating an insight's query."""
        create_tool = create_insight_tool()
        update_tool = update_insight_tool()

        # Create insight
        create_params = create_tool.schema(
            data={
                "name": generate_unique_key("Query Update Test"),
                "description": "Testing query updates",
                "query": SAMPLE_HOGQL_QUERIES["pageviews"].model_dump(),
            }
        )

        create_result = await create_tool.execute(context, create_params)
        created_insight = parse_tool_response(create_result.__dict__)
        created_resources.insights.append(created_insight["id"])

        # Update insight query
        update_params = update_tool.schema(
            insightId=created_insight["id"],
            data={"query": SAMPLE_HOGQL_QUERIES["top_events"].model_dump()},
        )

        update_result = await update_tool.execute(context, update_params)
        updated_insight = parse_tool_response(update_result.__dict__)

        assert updated_insight["id"] == created_insight["id"]
        assert updated_insight["name"] == create_params.data.name

    @pytest.mark.asyncio
    async def test_get_all_insights_proper_structure(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test that get-all-insights returns proper structure."""
        tool = get_all_insights_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        insights = parse_tool_response(result.__dict__)

        assert isinstance(insights, list)
        if len(insights) > 0:
            insight = insights[0]
            assert "id" in insight
            assert "name" in insight
            assert "description" in insight
            assert "url" in insight

    @pytest.mark.asyncio
    async def test_get_specific_insight_by_id(
        self, context: Context, created_resources: CreatedResources
    ):
        """Test getting a specific insight by ID."""
        create_tool = create_insight_tool()
        get_tool = get_insight_tool()

        # Create insight
        create_params = create_tool.schema(
            data=Data5(
                **{
                    "name": generate_unique_key("Get Test Insight"),
                    "description": "Test insight for get operation",
                    "query": SAMPLE_HOGQL_QUERIES["pageviews"].model_dump(),
                }
            )
        )

        create_result = await create_tool.execute(context, create_params)
        created_insight = parse_tool_response(create_result.__dict__)
        created_resources.insights.append(created_insight["id"])

        # Get insight
        get_params = get_tool.schema(insightId=created_insight["id"])
        get_result = await get_tool.execute(context, get_params)
        retrieved_insight = parse_tool_response(get_result.__dict__)

        assert retrieved_insight["id"] == created_insight["id"]
        assert retrieved_insight["name"] == create_params.data.name
        assert retrieved_insight["description"] == create_params.data.description
        assert "/insights/" in retrieved_insight["url"]

    @pytest.mark.asyncio
    async def test_delete_insight(self, context: Context, created_resources: CreatedResources):
        """Test deleting an insight."""
        create_tool = create_insight_tool()
        delete_tool = delete_insight_tool()

        # Create insight
        create_params = create_tool.schema(
            data={
                "name": generate_unique_key("Delete Test Insight"),
                "description": "Test insight for deletion",
                "query": SAMPLE_HOGQL_QUERIES["pageviews"].model_dump(),
            }
        )

        create_result = await create_tool.execute(context, create_params)
        created_insight = parse_tool_response(create_result.__dict__)

        # Delete insight
        delete_params = delete_tool.schema(insightId=created_insight["id"])
        delete_result = await delete_tool.execute(context, delete_params)
        delete_response = parse_tool_response(delete_result.__dict__)

        assert delete_response["success"] == True
        assert "deleted successfully" in delete_response["message"]

    @pytest.mark.asyncio
    async def test_full_crud_workflow(self, context: Context, created_resources: CreatedResources):
        """Test full CRUD workflow for insights."""
        create_tool = create_insight_tool()
        update_tool = update_insight_tool()
        get_tool = get_insight_tool()
        delete_tool = delete_insight_tool()

        # Create
        create_params = create_tool.schema(
            data={
                "name": generate_unique_key("Workflow Test Insight"),
                "description": "Testing full workflow",
                "query": SAMPLE_HOGQL_QUERIES["pageviews"].model_dump(),
            }
        )

        create_result = await create_tool.execute(context, create_params)
        created_insight = parse_tool_response(create_result.__dict__)

        # Read
        get_params = get_tool.schema(insightId=created_insight["id"])
        get_result = await get_tool.execute(context, get_params)
        retrieved_insight = parse_tool_response(get_result.__dict__)
        assert retrieved_insight["id"] == created_insight["id"]

        # Update
        update_params = update_tool.schema(
            insightId=created_insight["id"],
            data={
                "name": "Updated Workflow Insight",
                "description": "Updated workflow description",
            },
        )

        update_result = await update_tool.execute(context, update_params)
        updated_insight = parse_tool_response(update_result.__dict__)
        assert updated_insight["name"] == update_params.data.name

        # Delete
        delete_params = delete_tool.schema(insightId=created_insight["id"])
        delete_result = await delete_tool.execute(context, delete_params)
        delete_response = parse_tool_response(delete_result.__dict__)
        assert delete_response["success"] == True

import pytest
import pytest_asyncio

from tests.shared.test_utils import (
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
from tools.dashboards.create import create_dashboard_tool
from tools.dashboards.delete import delete_dashboard_tool
from tools.dashboards.get import get_dashboard_tool
from tools.dashboards.get_all import get_all_dashboards_tool
from tools.dashboards.update import update_dashboard_tool
from tools.types import Context


class TestDashboards:
    """Integration tests for dashboard tools."""

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
    async def test_create_dashboard_with_minimal_fields(self, context: Context, created_resources: CreatedResources):
        """Test creating a dashboard with minimal fields."""
        tool = create_dashboard_tool()
        params = tool.schema(
            data={
                "name": generate_unique_key("Test Dashboard"),
                "description": "Integration test dashboard",
            }
        )

        result = await tool.execute(context, params)
        dashboard_data = parse_tool_response(result.__dict__)

        assert "id" in dashboard_data
        assert dashboard_data["name"] == params.data.name
        assert "/dashboard/" in dashboard_data["url"]

        created_resources.dashboards.append(dashboard_data["id"])

    @pytest.mark.asyncio
    async def test_create_dashboard_with_tags(self, context: Context, created_resources: CreatedResources):
        """Test creating a dashboard with tags."""
        tool = create_dashboard_tool()
        params = tool.schema(
            data={
                "name": generate_unique_key("Tagged Dashboard"),
                "description": "Dashboard with tags",
                "tags": ["test", "integration"],
            }
        )

        result = await tool.execute(context, params)
        dashboard_data = parse_tool_response(result.__dict__)

        assert "id" in dashboard_data
        assert dashboard_data["name"] == params.data.name

        created_resources.dashboards.append(dashboard_data["id"])

    @pytest.mark.asyncio
    async def test_update_dashboard_name_and_description(self, context: Context, created_resources: CreatedResources):
        """Test updating dashboard name and description."""
        create_tool = create_dashboard_tool()
        update_tool = update_dashboard_tool()

        # Create dashboard
        create_params = create_tool.schema(
            data={
                "name": generate_unique_key("Original Dashboard"),
                "description": "Original description",
            }
        )

        create_result = await create_tool.execute(context, create_params)
        created_dashboard = parse_tool_response(create_result.__dict__)
        created_resources.dashboards.append(created_dashboard["id"])

        # Update dashboard
        update_params = update_tool.schema(
            dashboardId=created_dashboard["id"],
            data={"name": "Updated Dashboard Name", "description": "Updated description"},
        )

        update_result = await update_tool.execute(context, update_params)
        updated_dashboard = parse_tool_response(update_result.__dict__)

        assert updated_dashboard["id"] == created_dashboard["id"]
        assert updated_dashboard["name"] == update_params.data.name

    @pytest.mark.asyncio
    async def test_get_all_dashboards_proper_structure(self, context: Context, created_resources: CreatedResources):
        """Test that get-all-dashboards returns proper structure."""
        tool = get_all_dashboards_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        dashboards = parse_tool_response(result.__dict__)

        assert isinstance(dashboards, list)
        if len(dashboards) > 0:
            dashboard = dashboards[0]
            assert "id" in dashboard
            assert "name" in dashboard

    @pytest.mark.asyncio
    async def test_get_specific_dashboard_by_id(self, context: Context, created_resources: CreatedResources):
        """Test getting a specific dashboard by ID."""
        create_tool = create_dashboard_tool()
        get_tool = get_dashboard_tool()

        # Create dashboard
        create_params = create_tool.schema(
            data={
                "name": generate_unique_key("Get Test Dashboard"),
                "description": "Test dashboard for get operation",
            }
        )

        create_result = await create_tool.execute(context, create_params)
        created_dashboard = parse_tool_response(create_result.__dict__)
        created_resources.dashboards.append(created_dashboard["id"])

        # Get dashboard
        get_params = get_tool.schema(dashboardId=created_dashboard["id"])
        get_result = await get_tool.execute(context, get_params)
        retrieved_dashboard = parse_tool_response(get_result.__dict__)

        assert retrieved_dashboard["id"] == created_dashboard["id"]
        assert retrieved_dashboard["name"] == create_params.data.name

    @pytest.mark.asyncio
    async def test_delete_dashboard(self, context: Context, created_resources: CreatedResources):
        """Test deleting a dashboard."""
        create_tool = create_dashboard_tool()
        delete_tool = delete_dashboard_tool()

        # Create dashboard
        create_params = create_tool.schema(
            data={
                "name": generate_unique_key("Delete Test Dashboard"),
                "description": "Test dashboard for deletion",
            }
        )

        create_result = await create_tool.execute(context, create_params)
        created_dashboard = parse_tool_response(create_result.__dict__)

        # Delete dashboard
        delete_params = delete_tool.schema(dashboardId=created_dashboard["id"])
        delete_result = await delete_tool.execute(context, delete_params)
        delete_response = parse_tool_response(delete_result.__dict__)

        assert delete_response["success"]
        assert "deleted successfully" in delete_response["message"]

    @pytest.mark.asyncio
    async def test_full_crud_workflow(self, context: Context, created_resources: CreatedResources):
        """Test full CRUD workflow for dashboards."""
        create_tool = create_dashboard_tool()
        update_tool = update_dashboard_tool()
        get_tool = get_dashboard_tool()
        delete_tool = delete_dashboard_tool()

        # Create
        create_params = create_tool.schema(
            data={
                "name": generate_unique_key("Workflow Test Dashboard"),
                "description": "Testing full workflow",
            }
        )

        create_result = await create_tool.execute(context, create_params)
        created_dashboard = parse_tool_response(create_result.__dict__)

        # Read
        get_params = get_tool.schema(dashboardId=created_dashboard["id"])
        get_result = await get_tool.execute(context, get_params)
        retrieved_dashboard = parse_tool_response(get_result.__dict__)
        assert retrieved_dashboard["id"] == created_dashboard["id"]

        # Update
        update_params = update_tool.schema(
            dashboardId=created_dashboard["id"],
            data={
                "name": "Updated Workflow Dashboard",
                "description": "Updated workflow description",
            },
        )

        update_result = await update_tool.execute(context, update_params)
        updated_dashboard = parse_tool_response(update_result.__dict__)
        assert updated_dashboard["name"] == update_params.data.name

        # Delete
        delete_params = delete_tool.schema(dashboardId=created_dashboard["id"])
        delete_result = await delete_tool.execute(context, delete_params)
        delete_response = parse_tool_response(delete_result.__dict__)
        assert delete_response["success"]

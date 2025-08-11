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
from tools.projects.get_projects import get_projects_tool
from tools.projects.property_definitions import property_definitions_tool
from tools.projects.set_active import set_active_project_tool
from tools.types import Context


class TestProjects:
    """Integration tests for project tools."""

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
    async def test_list_all_projects_for_active_organization(self, context: Context, created_resources: CreatedResources):
        """Test listing all projects for the active organization."""
        tool = get_projects_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        projects = parse_tool_response(result.__dict__)

        assert isinstance(projects, list)
        assert len(projects) > 0

        project = projects[0]
        assert "id" in project
        assert "name" in project

    @pytest.mark.asyncio
    async def test_projects_proper_structure(self, context: Context, created_resources: CreatedResources):
        """Test that projects have proper structure."""
        tool = get_projects_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        projects = parse_tool_response(result.__dict__)

        test_project = next((proj for proj in projects if proj["id"] == int(TEST_PROJECT_ID)), None)
        assert test_project is not None
        assert test_project["id"] == int(TEST_PROJECT_ID)

    @pytest.mark.asyncio
    async def test_set_active_project(self, context: Context, created_resources: CreatedResources):
        """Test setting active project."""
        get_tool = get_projects_tool()
        set_tool = set_active_project_tool()

        # Get projects
        projects_params = get_tool.schema()
        projects_result = await get_tool.execute(context, projects_params)
        projects = parse_tool_response(projects_result.__dict__)
        assert len(projects) > 0

        # Set active project
        target_project = projects[0]
        set_params = set_tool.schema(projectId=str(target_project["id"]))
        set_result = await set_tool.execute(context, set_params)

        assert set_result.content == f"Switched to project {target_project['id']}"

    @pytest.mark.asyncio
    async def test_set_project_id_as_expected(self, context: Context, created_resources: CreatedResources):
        """Test setting a specific project ID."""
        tool = set_active_project_tool()
        project_id = 123456
        params = tool.schema(projectId=str(project_id))

        result = await tool.execute(context, params)
        assert result.content == f"Switched to project {project_id}"

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Property definitions test skipped - matching TypeScript")
    async def test_get_property_definitions_for_active_project(self, context: Context, created_resources: CreatedResources):
        """Test getting property definitions for active project."""
        tool = property_definitions_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        property_defs = parse_tool_response(result.__dict__)

        assert "event_properties" in property_defs
        assert "person_properties" in property_defs
        assert "group_properties" in property_defs

        assert isinstance(property_defs["event_properties"], list)
        assert isinstance(property_defs["person_properties"], list)
        assert isinstance(property_defs["group_properties"], dict)

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Property definitions test skipped - matching TypeScript")
    async def test_property_definitions_proper_structure(self, context: Context, created_resources: CreatedResources):
        """Test that property definitions have proper structure."""
        tool = property_definitions_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        property_defs = parse_tool_response(result.__dict__)

        if len(property_defs["event_properties"]) > 0:
            event_prop = property_defs["event_properties"][0]
            assert "name" in event_prop
            assert "is_seen_on_filtered_events" in event_prop

        if len(property_defs["person_properties"]) > 0:
            person_prop = property_defs["person_properties"][0]
            assert "name" in person_prop
            assert "count" in person_prop

    @pytest.mark.asyncio
    async def test_projects_workflow(self, context: Context, created_resources: CreatedResources):
        """Test projects workflow: list and set active project."""
        get_tool = get_projects_tool()
        set_tool = set_active_project_tool()

        # List projects
        projects_params = get_tool.schema()
        projects_result = await get_tool.execute(context, projects_params)
        projects = parse_tool_response(projects_result.__dict__)
        assert len(projects) > 0

        # Find target project (prefer test project, fallback to first)
        target_project = next((p for p in projects if p["id"] == int(TEST_PROJECT_ID)), projects[0])

        # Set active project
        set_params = set_tool.schema(projectId=str(target_project["id"]))
        set_result = await set_tool.execute(context, set_params)
        assert set_result.content == f"Switched to project {target_project['id']}"

        # Set in cache for future tests
        await context.cache.set("project_id", str(target_project["id"]))

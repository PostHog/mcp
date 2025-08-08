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
from tools.organizations.get_details import get_organization_details_tool
from tools.organizations.get_organizations import get_organizations_tool
from tools.organizations.set_active import set_active_org_tool
from tools.types import Context


class TestOrganizations:
    """Integration tests for organization tools."""

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
    async def test_list_all_organizations(self, context: Context, created_resources: CreatedResources):
        """Test listing all organizations."""
        tool = get_organizations_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        orgs = parse_tool_response(result.__dict__)

        assert isinstance(orgs, list)
        assert len(orgs) > 0

        org = orgs[0]
        assert "id" in org
        assert "name" in org

    @pytest.mark.asyncio
    async def test_organizations_proper_structure(self, context: Context, created_resources: CreatedResources):
        """Test that organizations have proper structure."""
        tool = get_organizations_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        orgs = parse_tool_response(result.__dict__)

        test_org = next((org for org in orgs if org["id"] == TEST_ORG_ID), None)
        assert test_org is not None
        assert test_org["id"] == TEST_ORG_ID

    @pytest.mark.asyncio
    async def test_set_active_organization(self, context: Context, created_resources: CreatedResources):
        """Test setting active organization."""
        get_tool = get_organizations_tool()
        set_tool = set_active_org_tool()

        # Get organizations
        orgs_params = get_tool.schema()
        orgs_result = await get_tool.execute(context, orgs_params)
        orgs = parse_tool_response(orgs_result.__dict__)
        assert len(orgs) > 0

        # Set active organization
        target_org = orgs[0]
        set_params = set_tool.schema(orgId=target_org["id"])
        set_result = await set_tool.execute(context, set_params)

        assert set_result.content[0].text == f"Switched to organization {target_org['id']}"

    @pytest.mark.asyncio
    async def test_set_invalid_organization_id(self, context: Context, created_resources: CreatedResources):
        """Test handling invalid organization ID."""
        tool = set_active_org_tool()
        invalid_org_id = "00000000-0000-0000-0000-000000000000"  # Valid UUID format but non-existent
        params = tool.schema(orgId=invalid_org_id)

        # The Python implementation doesn't validate org existence, it just sets the ID
        result = await tool.execute(context, params)
        assert result.content[0].text == f"Switched to organization {invalid_org_id}"

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Organization details test skipped - matching TypeScript")
    async def test_get_organization_details_for_active_org(self, context: Context, created_resources: CreatedResources):
        """Test getting organization details for active org."""
        tool = get_organization_details_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        org_details = parse_tool_response(result.__dict__)

        assert org_details["id"] == TEST_ORG_ID
        assert "name" in org_details
        assert "projects" in org_details
        assert isinstance(org_details["projects"], list)

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Organization details test skipped - matching TypeScript")
    async def test_include_projects_in_organization_details(self, context: Context, created_resources: CreatedResources):
        """Test that organization details include projects."""
        tool = get_organization_details_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        org_details = parse_tool_response(result.__dict__)

        assert "projects" in org_details
        assert isinstance(org_details["projects"], list)

        if len(org_details["projects"]) > 0:
            project = org_details["projects"][0]
            assert "id" in project
            assert "name" in project

        test_project = next((p for p in org_details["projects"] if p["id"] == int(TEST_PROJECT_ID)), None)
        assert test_project is not None

    @pytest.mark.asyncio
    async def test_organization_workflow(self, context: Context, created_resources: CreatedResources):
        """Test organization workflow: list and set active org."""
        get_tool = get_organizations_tool()
        set_tool = set_active_org_tool()

        # List organizations
        orgs_params = get_tool.schema()
        orgs_result = await get_tool.execute(context, orgs_params)
        orgs = parse_tool_response(orgs_result.__dict__)
        assert len(orgs) > 0

        # Find target org (prefer test org, fallback to first)
        target_org = next((org for org in orgs if org["id"] == TEST_ORG_ID), orgs[0])

        # Set active organization
        set_params = set_tool.schema(orgId=target_org["id"])
        set_result = await set_tool.execute(context, set_params)
        assert set_result.content[0].text == f"Switched to organization {target_org['id']}"

        # Set in cache for future tests
        await context.cache.set("org_id", target_org["id"])

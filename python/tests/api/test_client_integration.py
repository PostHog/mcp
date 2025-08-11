import os
from datetime import datetime, timedelta

import pytest
import pytest_asyncio

from api.client import ApiClient, ApiConfig, is_success
from schema.dashboards import CreateDashboardInput, UpdateDashboardInput
from schema.flags import CreateFeatureFlagInput, FilterGroups, UpdateFeatureFlagInput
from schema.insights import CreateInsightInput, UpdateInsightInput
from schema.query import DateRange, HogQLFilters, HogQLQuery, InsightQuery
from tests.shared.test_utils import CreatedResources


class TestApiClientIntegration:
    """Integration tests for the API client."""

    @pytest.fixture(scope="class", autouse=True)
    def setup_class(self):
        """Validate environment variables before running tests."""
        personal_api_key = os.getenv("TEST_PERSONAL_API_KEY")
        test_org_id = os.getenv("TEST_ORG_ID")
        test_project_id = os.getenv("TEST_PROJECT_ID")

        if not personal_api_key:
            pytest.skip("TEST_PERSONAL_API_KEY environment variable is required")
        if not test_org_id:
            pytest.skip("TEST_ORG_ID environment variable is required")
        if not test_project_id:
            pytest.skip("TEST_PROJECT_ID environment variable is required")

    @pytest_asyncio.fixture
    async def client(self):
        """Create API client for tests."""
        personal_api_key = os.getenv("TEST_PERSONAL_API_KEY")
        api_base_url = os.getenv("TEST_API_BASE_URL", "http://localhost:8010")

        assert personal_api_key, "TEST_PERSONAL_API_KEY environment variable is required"
        assert api_base_url, "TEST_API_BASE_URL environment variable is required"

        config = ApiConfig(personal_api_key=personal_api_key, base_url=api_base_url)
        client = ApiClient(config)
        yield client
        await client.close()

    @pytest.fixture
    def test_org_id(self):
        """Get test organization ID."""
        return os.getenv("TEST_ORG_ID")

    @pytest.fixture
    def test_project_id(self):
        """Get test project ID."""
        return os.getenv("TEST_PROJECT_ID")

    @pytest.fixture
    def created_resources(self):
        """Track created resources for cleanup."""
        return CreatedResources()

    @pytest_asyncio.fixture(autouse=True)
    async def cleanup(self, client: ApiClient, test_project_id: str, created_resources: CreatedResources):
        """Clean up resources after each test."""
        yield

        # Clean up created feature flags
        for flag_id in created_resources.feature_flags:
            try:
                await client.feature_flags(test_project_id).delete(flag_id)
            except Exception as e:
                print(f"Failed to cleanup feature flag {flag_id}: {e}")

        # Clean up created insights
        for insight_id in created_resources.insights:
            try:
                await client.insights(test_project_id).delete(insight_id)
            except Exception as e:
                print(f"Failed to cleanup insight {insight_id}: {e}")

        # Clean up created dashboards
        for dashboard_id in created_resources.dashboards:
            try:
                await client.dashboards(test_project_id).delete(dashboard_id)
            except Exception as e:
                print(f"Failed to cleanup dashboard {dashboard_id}: {e}")

    class TestOrganizationsAPI:
        """Test organizations API endpoints."""

        @pytest.mark.asyncio
        async def test_list_organizations(self, client: ApiClient):
            """Test listing organizations."""
            result = await client.organizations().list()

            assert result.success is True
            assert isinstance(result.data, list)

            if len(result.data) > 0:
                org = result.data[0]
                assert hasattr(org, "id")
                assert hasattr(org, "name")
                assert org.id is not None
                assert isinstance(org.name, str)

        @pytest.mark.asyncio
        async def test_get_organization_details(self, client: ApiClient, test_org_id: str):
            """Test getting organization details."""
            result = await client.organizations().get(test_org_id)

            assert result.success is True
            assert hasattr(result.data, "id")
            assert hasattr(result.data, "name")
            assert str(result.data.id) == test_org_id

        @pytest.mark.asyncio
        async def test_list_projects_for_organization(self, client: ApiClient, test_org_id: str):
            """Test listing projects for an organization."""
            result = await client.organizations().projects(test_org_id).list()

            assert result.success is True
            assert isinstance(result.data, list)

            if len(result.data) > 0:
                project = result.data[0]
                assert hasattr(project, "id")
                assert hasattr(project, "name")
                assert isinstance(project.id, int)
                assert isinstance(project.name, str)

    class TestProjectsAPI:
        """Test projects API endpoints."""

        @pytest.mark.asyncio
        async def test_get_project_details(self, client: ApiClient, test_project_id: str):
            """Test getting project details."""
            result = await client.projects().get(test_project_id)

            assert result.success is True
            assert hasattr(result.data, "id")
            assert hasattr(result.data, "name")
            assert result.data.id == int(test_project_id)

        @pytest.mark.asyncio
        async def test_get_property_definitions(self, client: ApiClient, test_project_id: str):
            """Test getting property definitions."""
            result = await client.projects().property_definitions(test_project_id)

            assert result.success is True
            assert isinstance(result.data, list)

            if len(result.data) > 0:
                prop_def = result.data[0]
                assert hasattr(prop_def, "id")
                assert hasattr(prop_def, "name")

    class TestFeatureFlagsAPI:
        """Test feature flags API endpoints."""

        @pytest.mark.asyncio
        async def test_list_feature_flags(self, client: ApiClient, test_project_id: str):
            """Test listing feature flags."""
            result = await client.feature_flags(test_project_id).list()

            assert result.success is True
            assert isinstance(result.data, list)

            for flag in result.data:
                assert hasattr(flag, "id")
                assert hasattr(flag, "key")
                assert hasattr(flag, "name")
                assert hasattr(flag, "active")
                assert isinstance(flag.id, int)
                assert isinstance(flag.key, str)
                assert isinstance(flag.name, str)
                assert isinstance(flag.active, bool)

        @pytest.mark.asyncio
        async def test_create_get_update_delete_feature_flag(self, client: ApiClient, test_project_id: str, created_resources: CreatedResources):
            """Test full feature flag lifecycle."""
            import time

            test_key = f"test-flag-{int(time.time() * 1000)}"

            # Create
            create_input = CreateFeatureFlagInput(
                key=test_key,
                name="Test Flag",
                description="Test feature flag",
                active=True,
                filters=FilterGroups(groups=[]),
            )
            create_result = await client.feature_flags(test_project_id).create(create_input)

            assert create_result.success is True
            flag_id = create_result.data.id
            created_resources.feature_flags.append(flag_id)

            # Get by ID
            get_result = await client.feature_flags(test_project_id).get(flag_id)
            assert get_result.success is True
            assert get_result.data.key == test_key
            assert get_result.data.name == "Test Flag"

            # Find by key
            find_result = await client.feature_flags(test_project_id).find_by_key(test_key)
            assert find_result.success is True
            if find_result.data:
                assert find_result.data.id == flag_id
                assert find_result.data.key == test_key

            # Update
            update_input = UpdateFeatureFlagInput(
                name="Updated Test Flag",
                active=False,
            )
            update_result = await client.feature_flags(test_project_id).update(test_key, update_input)
            assert update_result.success is True

            # Verify update
            updated_get_result = await client.feature_flags(test_project_id).get(flag_id)
            assert updated_get_result.success is True
            assert updated_get_result.data.name == "Updated Test Flag"
            assert updated_get_result.data.active is False

    class TestInsightsAPI:
        """Test insights API endpoints."""

        @pytest.mark.asyncio
        async def test_list_insights(self, client: ApiClient, test_project_id: str):
            """Test listing insights."""
            result = await client.insights(test_project_id).list()

            assert result.success is True
            assert isinstance(result.data, list)

            for insight in result.data:
                assert hasattr(insight, "id")
                assert hasattr(insight, "name")
                assert isinstance(insight.id, int)
                assert isinstance(insight.name, str)

        @pytest.mark.asyncio
        @pytest.mark.skip(reason="SQL insights may not be available in all environments")
        async def test_execute_sql_insight_query(self, client: ApiClient, test_project_id: str):
            """Test executing SQL insight query."""
            result = await client.insights(test_project_id).sql_insight("SELECT 1 as test")

            assert is_success(result)

            assert hasattr(result.data, "columns")
            assert hasattr(result.data, "results")
            assert isinstance(result.data.columns, list)
            assert isinstance(result.data.results, list)

        @pytest.mark.asyncio
        async def test_create_get_update_delete_insight(self, client: ApiClient, test_project_id: str, created_resources: CreatedResources):
            """Test full insight lifecycle."""
            create_input = CreateInsightInput(
                name="Test Insight",
                query=InsightQuery(
                    kind="DataVisualizationNode",
                    source=HogQLQuery(
                        kind="HogQLQuery",
                        query="SELECT 1 as test",
                        filters=HogQLFilters(dateRange=DateRange(date_from="-7d", date_to="1d")),
                    ),
                ),
                saved=True,
                favorited=False,
            )
            create_result = await client.insights(test_project_id).create(create_input)

            assert create_result.success is True
            insight_id = create_result.data.id
            created_resources.insights.append(insight_id)

            # Get
            get_result = await client.insights(test_project_id).get(insight_id)
            assert get_result.success is True
            assert get_result.data.name == "Test Insight"

            # Update
            update_input = UpdateInsightInput(name="Updated Test Insight")
            update_result = await client.insights(test_project_id).update(insight_id, update_input)
            assert update_result.success is True

    class TestDashboardsAPI:
        """Test dashboards API endpoints."""

        @pytest.mark.asyncio
        async def test_list_dashboards(self, client: ApiClient, test_project_id: str):
            """Test listing dashboards."""
            result = await client.dashboards(test_project_id).list()

            assert result.success is True
            assert isinstance(result.data, list)

            for dashboard in result.data:
                assert hasattr(dashboard, "id")
                assert hasattr(dashboard, "name")
                assert isinstance(dashboard.id, int)
                assert isinstance(dashboard.name, str)

        @pytest.mark.asyncio
        async def test_create_get_update_delete_dashboard(self, client: ApiClient, test_project_id: str, created_resources: CreatedResources):
            """Test full dashboard lifecycle."""
            create_input = CreateDashboardInput(
                name="Test Dashboard",
                description="Test dashboard for API tests",
                pinned=False,
            )
            create_result = await client.dashboards(test_project_id).create(create_input)

            assert create_result.success is True
            dashboard_id = create_result.data.id
            created_resources.dashboards.append(dashboard_id)

            # Get
            get_result = await client.dashboards(test_project_id).get(dashboard_id)
            assert get_result.success is True
            assert get_result.data.name == "Test Dashboard"

            # Update
            update_input = UpdateDashboardInput(name="Updated Test Dashboard")
            update_result = await client.dashboards(test_project_id).update(dashboard_id, update_input)
            assert update_result.success is True

    class TestQueryAPI:
        """Test query API endpoints."""

        @pytest.mark.asyncio
        async def test_execute_error_tracking_query(self, client: ApiClient, test_project_id: str):
            """Test executing error tracking query."""
            date_from = (datetime.now() - timedelta(days=7)).isoformat()
            date_to = datetime.now().isoformat()

            error_query = {
                "kind": "ErrorTrackingQuery",
                "orderBy": "occurrences",
                "dateRange": {"date_from": date_from, "date_to": date_to},
                "volumeResolution": 1,
                "orderDirection": "DESC",
                "filterTestAccounts": True,
                "status": "active",
            }

            result = await client.query(test_project_id).execute({"query": error_query})

            assert result.success is True
            assert hasattr(result.data, "results")
            assert isinstance(result.data.results, list)

        @pytest.mark.asyncio
        async def test_execute_trends_query_for_llm_costs(self, client: ApiClient, test_project_id: str):
            """Test executing trends query for LLM costs."""
            trends_query = {
                "kind": "TrendsQuery",
                "dateRange": {"date_from": "-6d", "date_to": None},
                "filterTestAccounts": True,
                "series": [
                    {
                        "event": "$ai_generation",
                        "name": "$ai_generation",
                        "math": "sum",
                        "math_property": "$ai_total_cost_usd",
                        "kind": "EventsNode",
                    }
                ],
                "breakdownFilter": {"breakdown_type": "event", "breakdown": "$ai_model"},
            }

            result = await client.query(test_project_id).execute({"query": trends_query})

            assert result.success is True
            assert hasattr(result.data, "results")
            assert isinstance(result.data.results, list)

    class TestUsersAPI:
        """Test users API endpoints."""

        @pytest.mark.asyncio
        async def test_get_current_user(self, client: ApiClient):
            """Test getting current user."""
            result = await client.users().me()

            assert result.success is True
            assert "distinctId" in result.data
            assert isinstance(result.data["distinctId"], str)

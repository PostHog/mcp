from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from api.client import ApiClient, ErrorResult, SuccessResult
from lib.config import PostHogToolConfig
from lib.utils.cache.memory_cache import MemoryCache
from schema.orgs import Organization
from schema.projects import Project
from tools.registry import ToolRegistry


class TestToolRegistry:
    def test_context_manager_support(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)

        registry = ToolRegistry(config)

        # Test that the context manager methods exist
        assert hasattr(registry, "__aenter__")
        assert hasattr(registry, "__aexit__")
        assert callable(registry.__aenter__)
        assert callable(registry.__aexit__)

    @pytest.mark.asyncio
    async def test_context_manager_usage(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)

        async with ToolRegistry(config) as registry:
            assert registry is not None
            assert hasattr(registry, "tools")
            assert hasattr(registry, "api")
            assert hasattr(registry, "cache")

    @pytest.mark.asyncio
    async def test_get_org_id_cached(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)
        registry = ToolRegistry(config)

        # Mock the cache to return a cached org_id
        registry.cache = AsyncMock(spec=MemoryCache)
        registry.cache.get.return_value = "123"

        org_id = await registry.get_org_id()

        assert org_id == "123"
        registry.cache.get.assert_called_once_with("org_id")

    @pytest.mark.asyncio
    async def test_get_org_id_single_org_auto_select(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)
        registry = ToolRegistry(config)

        # Mock the cache to return None (no cached org)
        registry.cache = AsyncMock(spec=MemoryCache)
        registry.cache.get.return_value = None

        # Mock the API client
        org_uuid = uuid4()
        mock_org = Organization(id=org_uuid, name="Test Org")

        # Create mock organization resource
        mock_org_resource = AsyncMock()
        mock_org_resource.list.return_value = SuccessResult(data=[mock_org])

        registry.api = Mock(spec=ApiClient)
        registry.api.organizations.return_value = mock_org_resource

        org_id = await registry.get_org_id()

        assert org_id == str(org_uuid)
        registry.cache.set.assert_called_once_with("org_id", str(org_uuid))

    @pytest.mark.asyncio
    async def test_get_org_id_multiple_orgs_use_current(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)
        registry = ToolRegistry(config)

        # Mock the cache to return None (no cached org)
        registry.cache = AsyncMock(spec=MemoryCache)
        registry.cache.get.return_value = None

        # Mock the API client
        org_uuid = uuid4()
        mock_org1 = Organization(id=uuid4(), name="Org 1")
        mock_org2 = Organization(id=org_uuid, name="Org 2")
        current_org = Organization(id=org_uuid, name="Current Org")

        # Create mock organization resource
        mock_org_resource = AsyncMock()
        mock_org_resource.list.return_value = SuccessResult(data=[mock_org1, mock_org2])
        mock_org_resource.get.return_value = SuccessResult(data=current_org)

        registry.api = Mock(spec=ApiClient)
        registry.api.organizations.return_value = mock_org_resource

        org_id = await registry.get_org_id()

        assert org_id == str(org_uuid)
        mock_org_resource.get.assert_called_once_with(org_id="@current")
        registry.cache.set.assert_called_once_with("org_id", str(org_uuid))

    @pytest.mark.asyncio
    async def test_get_org_id_list_error(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)
        registry = ToolRegistry(config)

        # Mock the cache to return None (no cached org)
        registry.cache = AsyncMock(spec=MemoryCache)
        registry.cache.get.return_value = None

        # Mock the API client to return error
        # Create mock organization resource
        mock_org_resource = AsyncMock()
        mock_org_resource.list.return_value = ErrorResult(error=Exception("API Error"))

        registry.api = Mock(spec=ApiClient)
        registry.api.organizations.return_value = mock_org_resource

        with pytest.raises(Exception, match="Failed to get organizations: API Error"):
            await registry.get_org_id()

    @pytest.mark.asyncio
    async def test_get_project_id_cached(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)
        registry = ToolRegistry(config)

        # Mock the cache to return a cached project_id
        registry.cache = AsyncMock(spec=MemoryCache)
        registry.cache.get.return_value = "project123"

        project_id = await registry.get_project_id()

        assert project_id == "project123"
        registry.cache.get.assert_called_once_with("project_id")

    @pytest.mark.asyncio
    async def test_get_project_id_single_project_auto_select(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)
        registry = ToolRegistry(config)

        # Mock the cache to return None for project_id, "456" for org_id
        registry.cache = AsyncMock(spec=MemoryCache)
        registry.cache.get.side_effect = lambda key: "456" if key == "org_id" else None

        # Mock the API client
        mock_project = Project(id=789, name="Test Project")

        # Create mock organization resource with projects
        mock_org_resource = Mock()
        mock_org_project_resource = AsyncMock()
        mock_org_project_resource.list.return_value = SuccessResult(data=[mock_project])
        mock_org_resource.projects.return_value = mock_org_project_resource

        registry.api = Mock(spec=ApiClient)
        registry.api.organizations.return_value = mock_org_resource

        project_id = await registry.get_project_id()

        assert project_id == "789"
        mock_org_resource.projects.assert_called_once_with(org_id="456")
        registry.cache.set.assert_called_once_with("project_id", "789")

    @pytest.mark.asyncio
    async def test_get_project_id_multiple_projects_use_current(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)
        registry = ToolRegistry(config)

        # Mock the cache to return None for project_id, "456" for org_id
        registry.cache = AsyncMock(spec=MemoryCache)
        registry.cache.get.side_effect = lambda key: "456" if key == "org_id" else None

        # Mock the API client
        mock_project1 = Project(id=789, name="Project 1")
        mock_project2 = Project(id=101112, name="Project 2")
        current_project = Project(id=101112, name="Current Project")

        # Create mock organization resource with projects
        mock_org_resource = Mock()
        mock_org_project_resource = AsyncMock()
        mock_org_project_resource.list.return_value = SuccessResult(data=[mock_project1, mock_project2])
        mock_org_resource.projects.return_value = mock_org_project_resource

        # Create mock project resource
        mock_project_resource = AsyncMock()
        mock_project_resource.get.return_value = SuccessResult(data=current_project)

        registry.api = Mock(spec=ApiClient)
        registry.api.organizations.return_value = mock_org_resource
        registry.api.projects.return_value = mock_project_resource

        project_id = await registry.get_project_id()

        assert project_id == "101112"
        mock_project_resource.get.assert_called_once_with(project_id="@current")
        registry.cache.set.assert_called_once_with("project_id", "101112")

    @pytest.mark.asyncio
    async def test_get_project_id_projects_list_error(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://us.posthog.com", inkeep_api_key=None, dev=False)
        registry = ToolRegistry(config)

        # Mock the cache to return None for project_id, "456" for org_id
        registry.cache = AsyncMock(spec=MemoryCache)
        registry.cache.get.side_effect = lambda key: "456" if key == "org_id" else None

        # Mock the API client to return error
        # Create mock organization resource with projects that returns error
        mock_org_resource = Mock()
        mock_org_project_resource = AsyncMock()
        mock_org_project_resource.list.return_value = ErrorResult(error=Exception("API Error"))
        mock_org_resource.projects.return_value = mock_org_project_resource

        registry.api = Mock(spec=ApiClient)
        registry.api.organizations.return_value = mock_org_resource

        with pytest.raises(Exception, match="Failed to get projects: API Error"):
            await registry.get_project_id()

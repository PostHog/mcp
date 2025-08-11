import json

import pytest
import pytest_asyncio

from tests.shared.test_utils import (
    SAMPLE_FEATURE_FLAG_FILTERS,
    TEST_ORG_ID,
    TEST_PROJECT_ID,
    CreatedResources,
    cleanup_resources,
    create_test_client,
    create_test_context,
    generate_unique_key,
    parse_tool_result,
    set_active_project_and_org,
    validate_environment_variables,
)
from tools.feature_flags.create import create_feature_flag_tool
from tools.feature_flags.delete import delete_feature_flag_tool
from tools.feature_flags.get_all import get_all_feature_flags_tool
from tools.feature_flags.get_definition import get_feature_flag_definition_tool
from tools.feature_flags.update import update_feature_flag_tool
from tools.types import Context


class TestFeatureFlags:
    """Integration tests for feature flag tools."""

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
    async def test_create_feature_flag_with_minimal_fields(self, context: Context, created_resources: CreatedResources):
        """Test creating a feature flag with minimal required fields."""
        tool = create_feature_flag_tool()
        params = tool.schema(
            name="Test Feature Flag",
            key=generate_unique_key("test-flag"),
            description="Integration test flag",
            filters=SAMPLE_FEATURE_FLAG_FILTERS,
            active=True,
        )

        result = await tool.execute(context, params)
        flag_data = parse_tool_result(result)

        assert "id" in flag_data
        assert flag_data["key"] == params.key
        assert flag_data["name"] == params.name
        assert flag_data["active"] == params.active
        assert "/feature_flags/" in flag_data["url"]

        created_resources.feature_flags.append(flag_data["id"])

    @pytest.mark.asyncio
    async def test_create_feature_flag_with_complex_filters(self, context: Context, created_resources: CreatedResources):
        """Test creating a feature flag with complex filters."""
        tool = create_feature_flag_tool()
        complex_filters = {
            "groups": [
                {
                    "properties": [],
                    "rollout_percentage": 50.0,
                },
                {
                    "properties": [],
                    "rollout_percentage": 100.0,
                },
            ]
        }

        params = tool.schema(
            name="Complex Filter Flag",
            key=generate_unique_key("complex-flag"),
            description="Flag with complex filters",
            filters=complex_filters,
            active=True,
        )

        result = await tool.execute(context, params)
        flag_data = parse_tool_result(result)

        assert flag_data["id"] is not None
        assert flag_data["key"] == params.key
        assert flag_data["name"] == params.name
        assert flag_data["active"] == params.active
        assert "/feature_flags/" in flag_data["url"]

        created_resources.feature_flags.append(flag_data["id"])

    @pytest.mark.asyncio
    async def test_create_feature_flag_with_tags(self, context: Context, created_resources: CreatedResources):
        """Test creating a feature flag with tags."""
        tool = create_feature_flag_tool()
        params = tool.schema(
            name="Tagged Feature Flag",
            key=generate_unique_key("tagged-flag"),
            description="Flag with tags",
            filters=SAMPLE_FEATURE_FLAG_FILTERS,
            active=True,
            tags=["test", "integration"],
        )

        result = await tool.execute(context, params)
        flag_data = parse_tool_result(result)

        assert "id" in flag_data
        assert flag_data["key"] == params.key
        assert flag_data["name"] == params.name

        created_resources.feature_flags.append(flag_data["id"])

    @pytest.mark.asyncio
    async def test_update_feature_flag_by_key(self, context: Context, created_resources: CreatedResources):
        """Test updating a feature flag by key."""
        create_tool = create_feature_flag_tool()
        update_tool = update_feature_flag_tool()

        # First create a flag
        create_params = create_tool.schema(
            name="Original Name",
            key=generate_unique_key("update-test"),
            description="Original description",
            filters=SAMPLE_FEATURE_FLAG_FILTERS,
            active=True,
        )

        create_result = await create_tool.execute(context, create_params)
        created_flag = parse_tool_result(create_result)
        created_resources.feature_flags.append(created_flag["id"])

        # Update the flag
        update_params = update_tool.schema(
            flagKey=create_params.key,
            data={"name": "Updated Name", "description": "Updated description", "active": False},
        )

        update_result = await update_tool.execute(context, update_params)
        updated_flag = parse_tool_result(update_result)

        assert updated_flag["name"] == "Updated Name"
        assert not updated_flag["active"]
        assert updated_flag["key"] == create_params.key

    @pytest.mark.asyncio
    async def test_update_feature_flag_filters(self, context: Context, created_resources: CreatedResources):
        """Test updating feature flag filters."""
        create_tool = create_feature_flag_tool()
        update_tool = update_feature_flag_tool()

        # Create a flag
        create_params = create_tool.schema(
            name="Filter Update Test",
            key=generate_unique_key("filter-update"),
            description="Testing filter updates",
            filters=SAMPLE_FEATURE_FLAG_FILTERS,
            active=True,
        )

        create_result = await create_tool.execute(context, create_params)
        created_flag = parse_tool_result(create_result)
        created_resources.feature_flags.append(created_flag["id"])

        # Update with new filters
        new_filters = {"groups": [{"properties": [], "rollout_percentage": 50}]}

        update_params = update_tool.schema(flagKey=create_params.key, data={"filters": new_filters})

        update_result = await update_tool.execute(context, update_params)
        updated_flag = parse_tool_result(update_result)

        assert "id" in updated_flag
        assert updated_flag["key"] == create_params.key

    @pytest.mark.asyncio
    async def test_get_all_feature_flags(self, context: Context, created_resources: CreatedResources):
        """Test listing all feature flags."""
        create_tool = create_feature_flag_tool()
        get_all_tool = get_all_feature_flags_tool()

        # Create a few test flags
        test_flags = []
        for i in range(3):
            params = create_tool.schema(
                name=f"List Test Flag {i}",
                key=generate_unique_key(f"list-test-{i}"),
                description=f"Test flag {i}",
                filters=SAMPLE_FEATURE_FLAG_FILTERS,
                active=True,
            )

            result = await create_tool.execute(context, params)
            flag = parse_tool_result(result)
            test_flags.append(flag)
            created_resources.feature_flags.append(flag["id"])

        # Get all flags
        all_params = get_all_tool.schema()
        result = await get_all_tool.execute(context, all_params)
        all_flags = parse_tool_result(result)

        assert isinstance(all_flags, list)
        assert len(all_flags) >= 3

        # Verify our test flags are in the list
        for test_flag in test_flags:
            found = next((f for f in all_flags if f["id"] == test_flag["id"]), None)
            assert found is not None
            assert found["key"] == test_flag["key"]

    @pytest.mark.asyncio
    async def test_get_all_feature_flags_proper_structure(self, context: Context, created_resources: CreatedResources):
        """Test that get-all-feature-flags returns proper structure."""
        tool = get_all_feature_flags_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        flags = parse_tool_result(result)

        if len(flags) > 0:
            flag = flags[0]
            assert "id" in flag
            assert "key" in flag
            assert "name" in flag
            assert "active" in flag

    @pytest.mark.asyncio
    async def test_get_feature_flag_definition_by_key(self, context: Context, created_resources: CreatedResources):
        """Test getting feature flag definition by key."""
        create_tool = create_feature_flag_tool()
        get_definition_tool = get_feature_flag_definition_tool()

        # Create a flag
        create_params = create_tool.schema(
            name="Definition Test Flag",
            key=generate_unique_key("definition-test"),
            description="Test flag for definition",
            filters=SAMPLE_FEATURE_FLAG_FILTERS,
            active=True,
            tags=["test-tag"],
        )

        create_result = await create_tool.execute(context, create_params)
        created_flag = parse_tool_result(create_result)
        created_resources.feature_flags.append(created_flag["id"])

        # Get definition
        def_params = get_definition_tool.schema(flagKey=create_params.key)
        result = await get_definition_tool.execute(context, def_params)
        definition = parse_tool_result(result)

        assert definition["id"] == created_flag["id"]
        assert definition["key"] == create_params.key
        assert definition["name"] == create_params.name
        assert definition["active"] == create_params.active

    @pytest.mark.asyncio
    async def test_get_feature_flag_definition_non_existent(self, context: Context, created_resources: CreatedResources):
        """Test getting definition for non-existent flag key."""
        tool = get_feature_flag_definition_tool()
        non_existent_key = generate_unique_key("non-existent")

        params = tool.schema(flagKey=non_existent_key)
        result = await tool.execute(context, params)

        # The result should contain an error message
        assert result.content == f'Error: Flag with key "{non_existent_key}" not found.'

    @pytest.mark.asyncio
    async def test_delete_feature_flag_by_key(self, context: Context, created_resources: CreatedResources):
        """Test deleting a feature flag by key."""
        create_tool = create_feature_flag_tool()
        delete_tool = delete_feature_flag_tool()

        # Create a flag
        create_params = create_tool.schema(
            name="Delete Test Flag",
            key=generate_unique_key("delete-test"),
            description="Test flag for deletion",
            filters=SAMPLE_FEATURE_FLAG_FILTERS,
            active=True,
        )

        create_result = await create_tool.execute(context, create_params)
        created_flag = parse_tool_result(create_result)

        # Delete the flag
        delete_params = delete_tool.schema(flagKey=created_flag["key"])
        delete_result = await delete_tool.execute(context, delete_params)

        assert delete_result.content is not None

        # Handle both JSON response and plain text response
        response_text = delete_result.content
        if response_text == "Feature flag is already deleted.":
            # Already deleted case
            pass
        else:
            # JSON response case - successful delete
            delete_response = json.loads(response_text)
            assert "success" in delete_response
            assert delete_response["success"]
            assert "deleted successfully" in delete_response["message"]

        # Verify it's deleted by trying to get it
        get_definition_tool = get_feature_flag_definition_tool()
        get_params = get_definition_tool.schema(flagKey=create_params.key)
        get_result = await get_definition_tool.execute(context, get_params)
        assert get_result.content == f'Error: Flag with key "{create_params.key}" not found.'

    @pytest.mark.asyncio
    async def test_delete_non_existent_feature_flag(self, context: Context, created_resources: CreatedResources):
        """Test deleting a non-existent feature flag."""
        tool = delete_feature_flag_tool()

        params = tool.schema(flagKey="non-existent-key")  # Use a non-existent key
        result = await tool.execute(context, params)
        assert result.content == "Feature flag is already deleted."

    @pytest.mark.asyncio
    async def test_full_crud_workflow(self, context: Context, created_resources: CreatedResources):
        """Test full CRUD workflow for feature flags."""
        create_tool = create_feature_flag_tool()
        update_tool = update_feature_flag_tool()
        get_definition_tool = get_feature_flag_definition_tool()
        delete_tool = delete_feature_flag_tool()

        flag_key = generate_unique_key("workflow-test")

        # Create
        create_params = create_tool.schema(
            name="Workflow Test Flag",
            key=flag_key,
            description="Testing full workflow",
            filters=SAMPLE_FEATURE_FLAG_FILTERS,
            active=False,
        )

        create_result = await create_tool.execute(context, create_params)
        created_flag = parse_tool_result(create_result)

        # Read
        get_params = get_definition_tool.schema(flagKey=flag_key)
        get_result = await get_definition_tool.execute(context, get_params)
        retrieved_flag = parse_tool_result(get_result)
        assert retrieved_flag["id"] == created_flag["id"]

        # Update
        update_params = update_tool.schema(flagKey=flag_key, data={"active": True, "name": "Updated Workflow Flag"})

        update_result = await update_tool.execute(context, update_params)
        updated_flag = parse_tool_result(update_result)
        assert updated_flag["active"]
        assert updated_flag["name"] == "Updated Workflow Flag"

        # Delete
        delete_params = delete_tool.schema(flagKey=created_flag["key"])
        delete_result = await delete_tool.execute(context, delete_params)
        delete_response = parse_tool_result(delete_result)
        assert delete_response["success"]
        assert "deleted successfully" in delete_response["message"]

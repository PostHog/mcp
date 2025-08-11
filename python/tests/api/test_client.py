from api.client import ApiClient, ApiConfig

BASE_URL = "https://example.com"


class TestApiClientUnit:
    """Unit tests for the API client."""

    def test_create_api_client_with_required_config(self):
        """Test creating ApiClient with required config."""
        config = ApiConfig(personal_api_key="test-token", base_url=BASE_URL)
        client = ApiClient(config)
        assert isinstance(client, ApiClient)

    def test_use_custom_base_url_when_provided(self):
        """Test that custom baseUrl is used when provided."""
        custom_url = "https://custom.example.com"
        config = ApiConfig(personal_api_key="test-token", base_url=custom_url)
        client = ApiClient(config)
        assert client.base_url == custom_url

    def test_build_correct_headers(self):
        """Test that correct headers are built."""
        config = ApiConfig(personal_api_key="test-token-123", base_url=BASE_URL)
        client = ApiClient(config)
        headers = client._build_headers()

        assert headers == {
            "Authorization": "Bearer test-token-123",
            "Content-Type": "application/json",
        }

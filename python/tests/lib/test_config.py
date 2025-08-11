import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from lib.config import PostHogToolConfig, load_environment_from_env


class TestPostHogToolConfig:
    def test_valid_config(self):
        config = PostHogToolConfig(
            api_token="test_token",
            api_base_url="https://app.posthog.com",
        )

        assert config.api_token == "test_token"
        assert config.api_base_url == "https://app.posthog.com"

    def test_empty_api_token_fails(self):
        with pytest.raises(ValidationError, match="API_TOKEN cannot be empty"):
            PostHogToolConfig(api_token="", api_base_url="https://app.posthog.com")

    def test_invalid_url_scheme_fails(self):
        with pytest.raises(ValidationError, match="must start with http:// or https://"):
            PostHogToolConfig(api_token="test_token", api_base_url="ftp://invalid.com")

    def test_url_trailing_slash_removed(self):
        config = PostHogToolConfig(api_token="test_token", api_base_url="https://app.posthog.com/")
        assert config.api_base_url == "https://app.posthog.com"


class TestLoadEnvironmentFromEnv:
    @patch.dict(os.environ, {"API_TOKEN": "env_token", "API_BASE_URL": "https://env.posthog.com", "DEV": "true"})
    def test_load_from_env(self):
        config = load_environment_from_env()

        assert config.api_token == "env_token"
        assert config.api_base_url == "https://env.posthog.com"
        assert config.dev is True

    @patch.dict(os.environ, {}, clear=True)
    def test_empty_env_fails_validation(self):
        with pytest.raises(ValidationError):
            load_environment_from_env()

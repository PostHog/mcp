import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from lib.config import PostHogToolConfig, load_config_from_env


class TestPostHogToolConfig:
    def test_valid_config(self):
        config = PostHogToolConfig(
            personal_api_key="test_token",
            api_base_url="https://example.com",
        )

        assert config.personal_api_key == "test_token"
        assert config.api_base_url == "https://example.com"

    def test_empty_personal_api_key_fails(self):
        with pytest.raises(ValidationError, match="personal_api_key cannot be empty"):
            PostHogToolConfig(personal_api_key="", api_base_url="https://example.com")

    def test_invalid_url_scheme_fails(self):
        with pytest.raises(ValidationError, match="must start with http:// or https://"):
            PostHogToolConfig(personal_api_key="test_token", api_base_url="ftp://invalid.com")

    def test_url_trailing_slash_removed(self):
        config = PostHogToolConfig(personal_api_key="test_token", api_base_url="https://example.com/")
        assert config.api_base_url == "https://example.com"


class TestLoadEnvironmentFromEnv:
    @patch.dict(os.environ, {"POSTHOG_PERSONAL_API_KEY": "env_token", "POSTHOG_API_BASE_URL": "https://example.com", "DEV": "true"})
    def test_load_from_env(self):
        config = load_config_from_env()

        assert config.personal_api_key == "env_token"
        assert config.api_base_url == "https://example.com"
        assert config.dev is True

    @patch.dict(os.environ, {}, clear=True)
    def test_empty_env_fails_validation(self):
        with pytest.raises(ValidationError):
            load_config_from_env()

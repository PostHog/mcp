from pydantic import BaseModel, Field, field_validator


class PostHogToolConfig(BaseModel):
    personal_api_key: str = Field(..., description="PostHog personal API key - you can create one at https://app.posthog.com/settings/user-api-keys")
    api_base_url: str = Field(..., description="PostHog API base URL")
    inkeep_api_key: str | None = Field(None, description="Inkeep API key for documentation search")
    dev: bool = Field(False, description="Development mode flag")

    @field_validator("personal_api_key")
    @classmethod
    def validate_personal_api_key(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("PERSONAL_API_KEY cannot be empty")
        return v.strip()

    @field_validator("api_base_url")
    @classmethod
    def validate_api_base_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("API_BASE_URL cannot be empty")

        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("API_BASE_URL must start with http:// or https://")

        return v.rstrip("/")


def load_config_from_env() -> PostHogToolConfig:
    import os

    return PostHogToolConfig(
        personal_api_key=os.getenv("POSTHOG_PERSONAL_API_KEY", ""),
        api_base_url=os.getenv("POSTHOG_API_BASE_URL", ""),
        inkeep_api_key=os.getenv("INKEEP_API_KEY"),
        dev=os.getenv("DEV", "false").lower() in ("true", "1", "yes"),
    )

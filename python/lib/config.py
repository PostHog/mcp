from pydantic import BaseModel, Field, field_validator


class PostHogToolConfig(BaseModel):
    api_token: str = Field(..., description="PostHog API token")
    api_base_url: str = Field(..., description="PostHog API base URL")
    inkeep_api_key: str | None = Field(None, description="Inkeep API key for documentation search")
    dev: bool = Field(False, description="Development mode flag")

    @field_validator("api_token")
    @classmethod
    def validate_api_token(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("API_TOKEN cannot be empty")
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


def load_environment_from_env() -> PostHogToolConfig:
    import os

    return PostHogToolConfig(
        api_token=os.getenv("API_TOKEN", ""),
        api_base_url=os.getenv("API_BASE_URL", ""),
        inkeep_api_key=os.getenv("INKEEP_API_KEY"),
        dev=os.getenv("DEV", "false").lower() in ("true", "1", "yes"),
    )

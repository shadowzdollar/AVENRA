"""Typed, validated configuration from the environment (Guidelines §91).

Missing or invalid values stop the service at startup.
"""

from enum import StrEnum
from typing import Literal, Self

from pydantic import AliasChoices, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(StrEnum):
    LOCAL = "LOCAL"
    DEVELOPMENT = "DEVELOPMENT"
    STAGING = "STAGING"
    PRODUCTION = "PRODUCTION"


class ProviderName(StrEnum):
    CLAUDE = "claude"
    FAKE = "fake"


class Settings(BaseSettings):
    """Settings read from `AVENRA_AI_*` environment variables."""

    model_config = SettingsConfigDict(env_prefix="AVENRA_AI_", extra="forbid", frozen=True)

    environment: Environment
    service_name: str = "avenra-ai"
    log_json: bool = True

    # Shared secret the API presents on every task request (ADR-029).
    service_token: SecretStr = Field(min_length=32)

    # `None` chooses Claude when a key is configured and the fake provider otherwise.
    provider: ProviderName | None = None
    model: str = Field(default="claude-sonnet-5-5", min_length=1, max_length=100)
    effort: Literal["low", "medium", "high"] = "medium"
    anthropic_api_key: SecretStr | None = Field(
        default=None, validation_alias=AliasChoices("AVENRA_AI_ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY")
    )
    request_timeout_seconds: float = Field(default=120.0, gt=0, le=600)
    # Longest text sent in one reading; longer documents go through retrieval (ADR-031).
    max_document_chars: int = Field(default=120_000, ge=1_000, le=800_000)

    @field_validator("anthropic_api_key", mode="before")
    @classmethod
    def _blank_key_is_no_key(cls, value: object) -> object:
        # `ANTHROPIC_API_KEY=` in an env file means "not configured".
        return None if isinstance(value, str) and not value.strip() else value

    @model_validator(mode="after")
    def _provider_is_usable(self) -> Self:
        if self.provider is ProviderName.CLAUDE and self.anthropic_api_key is None:
            raise ValueError("the claude provider needs ANTHROPIC_API_KEY")
        if self.environment is Environment.PRODUCTION and self.selected_provider is ProviderName.FAKE:
            raise ValueError("the fake provider cannot run in production")
        return self

    @property
    def selected_provider(self) -> ProviderName:
        if self.provider is not None:
            return self.provider
        return ProviderName.CLAUDE if self.anthropic_api_key is not None else ProviderName.FAKE

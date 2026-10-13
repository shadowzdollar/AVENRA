"""Typed, validated configuration from the environment (Guidelines §91).

Missing or invalid values stop the service at startup.
"""

from enum import StrEnum

from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(StrEnum):
    LOCAL = "LOCAL"
    DEVELOPMENT = "DEVELOPMENT"
    STAGING = "STAGING"
    PRODUCTION = "PRODUCTION"


class Settings(BaseSettings):
    """Settings read from `AVENRA_AI_*` environment variables."""

    model_config = SettingsConfigDict(env_prefix="AVENRA_AI_", extra="forbid", frozen=True)

    environment: Environment
    service_name: str = "avenra-ai"
    log_json: bool = True

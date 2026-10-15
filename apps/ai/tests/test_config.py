import pytest
from pydantic import ValidationError

from avenra_ai.config import Environment, ProviderName, Settings
from tests.conftest import SERVICE_TOKEN, settings


@pytest.fixture(autouse=True)
def _clean_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in ("ANTHROPIC_API_KEY", "AVENRA_AI_ANTHROPIC_API_KEY", "AVENRA_AI_PROVIDER"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("AVENRA_AI_SERVICE_TOKEN", SERVICE_TOKEN)


def test_environment_is_required(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AVENRA_AI_ENVIRONMENT", raising=False)
    with pytest.raises(ValidationError, match="environment"):
        Settings()


def test_environment_must_be_known(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AVENRA_AI_ENVIRONMENT", "SANDBOX")
    with pytest.raises(ValidationError):
        Settings()


def test_reads_settings_from_the_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AVENRA_AI_ENVIRONMENT", "STAGING")
    assert Settings().environment is Environment.STAGING


def test_unknown_settings_are_rejected() -> None:
    with pytest.raises(ValidationError):
        settings(unexpected="x")


def test_the_service_token_is_required_and_long(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AVENRA_AI_ENVIRONMENT", "LOCAL")
    monkeypatch.delenv("AVENRA_AI_SERVICE_TOKEN")
    with pytest.raises(ValidationError, match="service_token"):
        Settings()
    with pytest.raises(ValidationError, match="service_token"):
        settings(service_token="too-short")


def test_the_default_model_is_claude_sonnet_5_5() -> None:
    assert settings().model == "claude-sonnet-5-5"


def test_claude_is_chosen_when_a_key_is_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AVENRA_AI_ENVIRONMENT", "LOCAL")
    assert Settings().selected_provider is ProviderName.FAKE
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    configured = Settings()
    assert configured.selected_provider is ProviderName.CLAUDE
    assert "sk-ant-test" not in repr(configured)


def test_claude_without_a_key_is_refused() -> None:
    with pytest.raises(ValidationError, match="ANTHROPIC_API_KEY"):
        settings(provider="claude")


def test_the_fake_provider_never_runs_in_production() -> None:
    with pytest.raises(ValidationError, match="production"):
        settings(environment=Environment.PRODUCTION)

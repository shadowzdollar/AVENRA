import pytest
from pydantic import ValidationError

from avenra_ai.config import Environment, Settings


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
        Settings(environment=Environment.LOCAL, unexpected="x")  # type: ignore[call-arg]

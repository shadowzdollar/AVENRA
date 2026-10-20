from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from avenra_ai.config import Environment, Settings
from avenra_ai.main import create_app

SERVICE_TOKEN = "test-service-token-0123456789abcdef"  # a test value


def settings(**overrides: object) -> Settings:
    values: dict[str, object] = {"environment": Environment.LOCAL, "service_token": SERVICE_TOKEN, "provider": "fake"}
    values.update(overrides)
    return Settings.model_validate(values)


@pytest.fixture
def app() -> FastAPI:
    application = create_app(settings())

    @application.get("/__test/boom")
    async def boom() -> None:
        raise RuntimeError("internal detail boom-secret-Q7")

    return application


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"

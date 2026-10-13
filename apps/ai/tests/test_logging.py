import json

import pytest
from fastapi.testclient import TestClient


def test_logs_are_structured_json_with_request_id(client: TestClient, capsys: pytest.CaptureFixture[str]) -> None:
    capsys.readouterr()  # discard startup output

    client.get("/health/liveness", headers={"X-Request-Id": "log-test-request-01"})

    lines = [line for line in capsys.readouterr().out.splitlines() if line.strip()]
    entries = [json.loads(line) for line in lines]
    assert entries, "expected at least one log line"
    for entry in entries:
        assert entry["@timestamp"].endswith("Z")
        assert entry["service"] == {"name": "avenra-ai", "environment": "LOCAL"}
        assert entry["log"]["level"]

    [completed] = [entry for entry in entries if entry["message"] == "Request completed"]
    assert completed["requestId"] == "log-test-request-01"
    assert completed["url"]["path"] == "/health/liveness"
    assert completed["http"]["response"]["status_code"] == 200


def test_unexpected_errors_are_logged_with_stack_trace_on_the_server(
    client: TestClient, capsys: pytest.CaptureFixture[str]
) -> None:
    capsys.readouterr()

    client.get("/__test/boom", headers={"X-Request-Id": "log-test-request-02"})

    entries = [json.loads(line) for line in capsys.readouterr().out.splitlines() if line.strip()]
    [error] = [entry for entry in entries if entry["message"] == "Unhandled exception"]
    assert error["requestId"] == "log-test-request-02"
    assert "RuntimeError" in error["error"]["stack_trace"]


def test_query_strings_are_not_logged(client: TestClient, capsys: pytest.CaptureFixture[str]) -> None:
    capsys.readouterr()

    client.get("/health/liveness?token=secret-value-123")

    assert "secret-value-123" not in capsys.readouterr().out
